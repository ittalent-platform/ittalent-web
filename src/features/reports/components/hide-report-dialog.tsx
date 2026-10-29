import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ActionConfirmDialog } from '@/components/common/action-confirm-dialog';
import { useHideReportMutation } from '@/features/reports/reports.queries';
import type { ReportItemResponse } from '@/features/reports/reports.types';

export interface HideReportDialogProps {
  report: ReportItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function HideReportDialog({ report, open, onOpenChange, onSuccess }: HideReportDialogProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hideMutation = useHideReportMutation();

  if (!report) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await hideMutation.mutateAsync(report.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('reports.errors.statementRequired');
      setErrorMessage(message);
    }
  };

  return (
    <ActionConfirmDialog
      action={hideMutation.isPending ? t('reports.sending') : t('reports.hideDialog.confirm')}
      cancelLabel={t('reports.cancel')}
      description={t('reports.hideDialog.body')}
      disabled={hideMutation.isPending}
      error={errorMessage}
      icon={EyeOff}
      keepOpenOnConfirm
      onConfirm={() => void handleConfirm()}
      onOpenChange={onOpenChange}
      open={open}
      title={t('reports.hideDialog.title')}
      variant="warning-solid"
    />
  );
}
