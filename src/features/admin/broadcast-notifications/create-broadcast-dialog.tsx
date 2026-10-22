import { useState } from 'react';
import { Send, Save, AlertCircle } from 'lucide-react';
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
import { useCreateBroadcastMutation } from './broadcast-notifications.queries';
import type {
  BroadcastAudience,
  BroadcastCategory,
  BroadcastChannel,
  BroadcastPriority,
} from './broadcast-notifications.types';

type CreateBroadcastDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateBroadcastDialog({
  open,
  onOpenChange,
}: CreateBroadcastDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<BroadcastCategory>('System Maintenance');
  const [targetAudience, setTargetAudience] = useState<BroadcastAudience>('All Users');
  const [priority, setPriority] = useState<BroadcastPriority>('Normal');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [channels, setChannels] = useState<BroadcastChannel[]>(['In-App Inbox']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useCreateBroadcastMutation();

  function validate(): boolean {
    if (!title.trim() || title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters long.');
      return false;
    }
    if (title.trim().length > 150) {
      setErrorMsg('Title cannot exceed 150 characters.');
      return false;
    }
    if (!content.trim() || content.trim().length < 10) {
      setErrorMsg('Message content must be at least 10 characters long.');
      return false;
    }
    if (content.trim().length > 2000) {
      setErrorMsg('Message content cannot exceed 2000 characters.');
      return false;
    }
    if (actionUrl.trim()) {
      try {
        new URL(actionUrl.trim());
      } catch {
        setErrorMsg('Action URL must be a valid HTTP or HTTPS web address.');
        return false;
      }
    }
    if (channels.length === 0) {
      setErrorMsg('Please select at least one delivery channel.');
      return false;
    }
    setErrorMsg(null);
    return true;
  }

  async function handleSubmit(isDraft: boolean) {
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        category,
        target_audience: targetAudience,
        priority,
        action_url: actionUrl.trim() || null,
        action_label: actionLabel.trim() || null,
        channels,
        is_draft: isDraft,
      });

      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit broadcast notification.';
      setErrorMsg(message);
    }
  }

  function handleClose() {
    setTitle('');
    setContent('');
    setCategory('System Maintenance');
    setTargetAudience('All Users');
    setPriority('Normal');
    setActionUrl('');
    setActionLabel('');
    setChannels(['In-App Inbox']);
    setErrorMsg(null);
    onOpenChange(false);
  }

  function toggleChannel(ch: BroadcastChannel) {
    if (ch === 'In-App Inbox') return; // In-app is mandatory
    if (channels.includes(ch)) {
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Broadcast Notification</DialogTitle>
          <DialogDescription>
            Compose an announcement message to broadcast across user accounts. You can dispatch immediately or save as draft.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="broadcast-title">
                Broadcast Title <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">{title.length}/150</span>
            </div>
            <Input
              id="broadcast-title"
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Maintenance Window on Sunday"
              value={title}
            />
          </div>

          {/* Row: Category & Target Audience */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                onValueChange={(val) => setCategory(val as BroadcastCategory)}
                value={category}
              >
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
              <Select
                onValueChange={(val) => setTargetAudience(val as BroadcastAudience)}
                value={targetAudience}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Users">All Users</SelectItem>
                  <SelectItem value="Applicants only">Applicants only</SelectItem>
                  <SelectItem value="Recruiters only">Recruiters only</SelectItem>
                  <SelectItem value="Enterprise Admins">Enterprise Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>Delivery Priority</Label>
            <div className="flex flex-wrap gap-2">
              {(['Low', 'Normal', 'High', 'Urgent'] as BroadcastPriority[]).map((p) => (
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    priority === p
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                  key={p}
                  onClick={() => setPriority(p)}
                  type="button"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="broadcast-content">
                Announcement Message <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">{content.length}/2000</span>
            </div>
            <Textarea
              className="min-h-[120px] resize-y"
              id="broadcast-content"
              maxLength={2000}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement text clearly outlining the update, instructions, or advisory notice..."
              value={content}
            />
          </div>

          {/* Optional Action CTA */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="action-url">Action Link (Optional)</Label>
              <Input
                id="action-url"
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://example.com/changelog"
                value={actionUrl}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="action-label">Button Label (Optional)</Label>
              <Input
                id="action-label"
                maxLength={50}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="e.g. Read Changelog"
                value={actionLabel}
              />
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label>Distribution Channels</Label>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-not-allowed text-muted-foreground">
                <input checked disabled type="checkbox" />
                <span>In-App Inbox (Mandatory)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-foreground">
                <input
                  checked={channels.includes('Email Digest')}
                  onChange={() => toggleChannel('Email Digest')}
                  type="checkbox"
                />
                <span>Email Digest (Scheduled)</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={handleClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            className="gap-1.5"
            disabled={createMutation.isPending}
            onClick={() => handleSubmit(true)}
            type="button"
            variant="secondary"
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button
            className="gap-1.5"
            disabled={createMutation.isPending}
            onClick={() => handleSubmit(false)}
            type="button"
          >
            <Send className="size-4" />
            {createMutation.isPending ? 'Publishing...' : 'Publish Broadcast'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
