import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-lg font-bold">Delete Broadcast Notification</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete the broadcast announcement{' '}
            <strong className="text-foreground">"{broadcast.title}"</strong>?
            {broadcast.status === 'Sent'
              ? ' This broadcast has already been sent to users and will be archived from administrative records.'
              : ' This action cannot be undone and will permanently remove this draft/scheduled announcement.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
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
