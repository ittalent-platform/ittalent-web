import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ActionConfirmDialog } from '@/components/common/action-confirm-dialog';

export interface FinalizeDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: 'resolved' | 'rejected';
  onConfirm: () => Promise<void>;
  isPending: boolean;
  error?: string | null;
}

export function FinalizeDecisionDialog({
  open,
  onOpenChange,
  decision,
  onConfirm,
  isPending,
  error,
}: FinalizeDecisionDialogProps) {
  const { t } = useTranslation();

  const isResolved = decision === 'resolved';
  const title = isResolved
    ? t('reports.detail.finalizeModalTitleResolve')
    : t('reports.detail.finalizeModalTitleReject');

  return (
    <ActionConfirmDialog
      action={isPending ? t('reports.sending') : t('reports.detail.confirmFinalize')}
      cancelLabel={t('reports.cancel')}
      description={t('reports.detail.finalizeModalBody')}
      disabled={isPending}
      error={error}
      icon={isResolved ? CheckCircle2 : XCircle}
      keepOpenOnConfirm
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      variant={isResolved ? 'success-solid' : 'destructive-solid'}
    />
  );
}
