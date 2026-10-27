import { useState } from 'react';
import { Undo2 } from 'lucide-react';

import { ActionConfirmDialog } from '@/components/common/action-confirm-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWithdrawReportMutation } from '@/features/reports/reports.queries';
import type { ReportDto } from '@/features/reports/reports.types';

export interface WithdrawReportDialogProps {
  report: ReportDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WITHDRAWAL_REASONS = [
  'Đã giải quyết riêng với nhà tuyển dụng',
  'Gửi nhầm báo cáo',
  'Thông tin vi phạm không còn phù hợp',
  'Hai bên đã tự thỏa thuận thành công',
  'Lý do khác',
];

export function WithdrawReportDialog({ report, open, onOpenChange }: WithdrawReportDialogProps) {
  const [reason, setReason] = useState(WITHDRAWAL_REASONS[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const withdrawMutation = useWithdrawReportMutation();

  if (!report) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await withdrawMutation.mutateAsync({
        id: report.id,
        input: { withdrawal_reason: reason },
      });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể rút lại báo cáo.';
      setErrorMessage(message);
    }
  };

  return (
    <ActionConfirmDialog
      action={withdrawMutation.isPending ? 'Đang rút...' : 'Xác nhận rút báo cáo'}
      cancelLabel="Giữ lại báo cáo"
      description={
        <span>
          Hành động này sẽ hủy yêu cầu xác minh đối với{' '}
          <strong className="font-semibold text-foreground">"{report.target_title}"</strong> (Vé #{report.ticket_id}
          ). Ban quản trị sẽ đóng hồ sơ kiểm duyệt này mà không xử lý thêm.
        </span>
      }
      disabled={withdrawMutation.isPending}
      error={errorMessage}
      icon={Undo2}
      keepOpenOnConfirm
      onConfirm={() => void handleConfirm()}
      onOpenChange={onOpenChange}
      open={open}
      title={`Xác nhận rút vé #${report.ticket_id}?`}
      variant="warning-solid"
    >
      <div className="flex flex-col gap-2 pt-2">
        <Label htmlFor="withdrawal-reason-select" className="text-[13px] font-semibold text-foreground">
          Lý do rút báo cáo <span className="text-destructive">*</span>
        </Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id="withdrawal-reason-select" className="h-10 text-[13.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WITHDRAWAL_REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground">
          Vé báo cáo sau khi rút sẽ chuyển sang trạng thái đã hủy và không thể tái kích hoạt.
        </p>
      </div>
    </ActionConfirmDialog>
  );
}
