import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { ActionConfirmDialog } from '@/components/common/action-confirm-dialog';
import { useDeleteReportMutation } from '@/features/reports/reports.queries';
import type { ReportDto } from '@/features/reports/reports.types';

export interface DeleteReportDialogProps {
  report: ReportDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteReportDialog({ report, open, onOpenChange }: DeleteReportDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteReportMutation();

  if (!report) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(report.id);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa báo cáo.';
      setErrorMessage(message);
    }
  };

  return (
    <ActionConfirmDialog
      action={deleteMutation.isPending ? 'Đang xóa...' : 'Xóa khỏi danh sách'}
      cancelLabel="Giữ lại"
      description={
        <span>
          Hành động này sẽ ẩn vé <strong className="font-semibold text-foreground">#{report.ticket_id}</strong> (
          {report.target_title}) khỏi danh sách báo cáo của bạn. Dữ liệu đối soát an toàn vẫn được lưu trữ theo quy
          định của hệ thống.
        </span>
      }
      disabled={deleteMutation.isPending}
      error={errorMessage}
      icon={Trash2}
      keepOpenOnConfirm
      onConfirm={() => void handleConfirm()}
      onOpenChange={onOpenChange}
      open={open}
      title={`Xóa vé #${report.ticket_id}?`}
      variant="destructive-solid"
    />
  );
}
