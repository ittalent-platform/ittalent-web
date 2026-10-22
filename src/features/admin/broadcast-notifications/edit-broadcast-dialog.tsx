import { useState } from 'react';
import { Edit3, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  BroadcastAudience,
  BroadcastCategory,
  BroadcastChannel,
  BroadcastNotificationDto,
  BroadcastPriority,
} from './broadcast-notifications.types';
import { useUpdateBroadcastMutation } from './broadcast-notifications.queries';

type EditBroadcastDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditBroadcastDialogContent({
  broadcast,
  onOpenChange,
}: {
  broadcast: BroadcastNotificationDto;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState(() => broadcast.title || '');
  const [content, setContent] = useState(() => broadcast.content || '');
  const [category, setCategory] = useState<BroadcastCategory>(() => broadcast.category || 'System Maintenance');
  const [targetAudience, setTargetAudience] = useState<BroadcastAudience>(() => broadcast.targetAudience || 'All Users');
  const [priority, setPriority] = useState<BroadcastPriority>(() => broadcast.priority || 'Normal');
  const [actionUrl, setActionUrl] = useState(() => broadcast.actionUrl || '');
  const [actionLabel, setActionLabel] = useState(() => broadcast.actionLabel || '');
  const [channels, setChannels] = useState<BroadcastChannel[]>(() => broadcast.channels?.length ? broadcast.channels : ['In-App Inbox']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateBroadcastMutation();

  function validate(): boolean {
    if (!title.trim() || title.trim().length < 5 || title.trim().length > 150) {
      setErrorMsg('Title must be between 5 and 150 characters.');
      return false;
    }

    if (!content.trim() || content.trim().length < 10 || content.trim().length > 2000) {
      setErrorMsg('Message content must be between 10 and 2000 characters.');
      return false;
    }

    if (actionUrl.trim()) {
      try {
        new URL(actionUrl.trim());
      } catch {
        setErrorMsg('Call-to-Action Link must be a valid HTTP or HTTPS URL.');
        return false;
      }
    }

    if (channels.length === 0) {
      setErrorMsg('At least one distribution channel must be selected.');
      return false;
    }

    return true;
  }

  async function handleSave() {
    setErrorMsg(null);
    if (!validate()) return;

    try {
      await updateMutation.mutateAsync({
        id: broadcast.id,
        payload: {
          title: title.trim(),
          content: content.trim(),
          category,
          target_audience: targetAudience,
          priority,
          action_url: actionUrl.trim() || null,
          action_label: actionLabel.trim() || null,
          channels,
        },
      });

      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update broadcast notification.';
      setErrorMsg(message);
    }
  }

  function toggleChannel(channel: BroadcastChannel) {
    if (channels.includes(channel)) {
      if (channels.length === 1) return; // Keep at least one
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
          <Edit3 className="size-5 text-primary" />
          Edit Broadcast Notification
        </DialogTitle>
        <DialogDescription>
          Update notification content and delivery parameters. Modifications will take effect at scheduled execution time.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {broadcast.status === 'Scheduled' && (
          <div className="rounded-lg bg-blue-50/70 p-3 text-xs text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300">
            ℹ️ Editing a scheduled announcement updates the message delivered when the scheduled trigger fires.
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="edit-title">
            Broadcast Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled Infrastructure Maintenance"
            value={title}
          />
          <p className="text-[11px] text-muted-foreground">Between 5 and 150 characters ({title.length}/150)</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select onValueChange={(val) => setCategory(val as BroadcastCategory)} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="System Maintenance">System Maintenance</SelectItem>
                <SelectItem value="Feature Update">Feature Update</SelectItem>
                <SelectItem value="Policy Update">Policy Update</SelectItem>
                <SelectItem value="Event Announcement">Event Announcement</SelectItem>
                <SelectItem value="Security Alert">Security Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Target Audience</Label>
            <Select onValueChange={(val) => setTargetAudience(val as BroadcastAudience)} value={targetAudience}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Users">All Users</SelectItem>
                <SelectItem value="Applicants Only">Applicants Only</SelectItem>
                <SelectItem value="Recruiters Only">Recruiters Only</SelectItem>
                <SelectItem value="Enterprise Admins">Enterprise Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select onValueChange={(val) => setPriority(val as BroadcastPriority)} value={priority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Distribution Channels</Label>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                checked={channels.includes('In-App Inbox')}
                onChange={() => toggleChannel('In-App Inbox')}
                type="checkbox"
              />
              <span>In-App Inbox</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                checked={channels.includes('Email Digest')}
                onChange={() => toggleChannel('Email Digest')}
                type="checkbox"
              />
              <span>Email Digest</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-content">
            Message Content <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="edit-content"
            onChange={(e) => setContent(e.target.value)}
            placeholder="Detail the announcement notice, instructions, or downtime window..."
            rows={5}
            value={content}
          />
          <p className="text-[11px] text-muted-foreground">Between 10 and 2000 characters ({content.length}/2000)</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-action-url">Action Link (Optional)</Label>
            <Input
              id="edit-action-url"
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="https://status.italent.com"
              value={actionUrl}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-action-label">Button Label (Optional)</Label>
            <Input
              id="edit-action-label"
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="e.g. Check Status"
              value={actionLabel}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="flex gap-2 sm:justify-end">
        <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
          Cancel
        </Button>
        <Button
          disabled={updateMutation.isPending}
          onClick={handleSave}
          type="button"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function EditBroadcastDialog({
  broadcast,
  open,
  onOpenChange,
}: EditBroadcastDialogProps) {
  if (!broadcast) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditBroadcastDialogContent
        key={broadcast.id}
        broadcast={broadcast}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  );
}
