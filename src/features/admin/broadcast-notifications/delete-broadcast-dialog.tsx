import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteBroadcastMutation } from './broadcast-notifications.queries';
import type { BroadcastNotificationDto } from './broadcast-notifications.types';

type DeleteBroadcastDialogProps = {
  broadcast: BroadcastNotificationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteBroadcastDialog({
  broadcast,
  open,
  onOpenChange,
}: DeleteBroadcastDialogProps) {
  const deleteMutation = useDeleteBroadcastMutation();

  if (!broadcast) return null;

  async function handleDelete() {
    if (!broadcast) return;
    try {
      await deleteMutation.mutateAsync(broadcast.id);
      onOpenChange(false);
    } catch {
      // handled by mutation error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0 border border-border/80 shadow-2xl">
        <DialogHeader className="bg-destructive/5 border-b border-destructive/15 px-6 py-5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-lg font-bold tracking-tight">Delete Broadcast Notification</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 text-sm text-muted-foreground leading-relaxed">
          Are you sure you want to delete the broadcast announcement{' '}
          <strong className="text-foreground">"{broadcast.title}"</strong>?
          <p className="mt-2 text-xs">
            {broadcast.status === 'Sent'
              ? 'This broadcast has already been sent to users and will be archived from administrative records.'
              : 'This action cannot be undone and will permanently remove this draft/scheduled announcement.'}
          </p>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-4 flex gap-2 sm:justify-end">
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="gap-1.5"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            type="button"
            variant="destructive"
          >
            <Trash2 className="size-4" />
            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
