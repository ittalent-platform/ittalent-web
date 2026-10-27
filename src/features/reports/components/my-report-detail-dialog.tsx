import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Trash2,
  Undo2,
  X,
  XCircle,
} from 'lucide-react';

import { Stepper } from '@/components/common/stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  REPORT_ACTIONS_TAKEN_CONFIG,
  REPORT_REASON_CATEGORIES,
  REPORT_STATUS_CONFIG,
  REPORT_TARGET_TYPE_LABELS,
} from '@/features/reports/reports.constants';
import type { ReportDto } from '@/features/reports/reports.types';

export interface MyReportDetailDialogProps {
  report: ReportDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdrawClick?: (report: ReportDto) => void;
  onDeleteClick?: (report: ReportDto) => void;
}

const STEPPER_STEPS = ['Đã tiếp nhận', 'Đang xác minh', 'Hoàn tất xử lý'] as const;

export function MyReportDetailDialog({
  report,
  open,
  onOpenChange,
  onWithdrawClick,
  onDeleteClick,
}: MyReportDetailDialogProps) {
  if (!report) return null;

  const statusConfig = REPORT_STATUS_CONFIG[report.status] ?? {
    label: report.status,
    className: 'bg-muted text-muted-foreground',
  };

  const reasonConfig = REPORT_REASON_CATEGORIES.find((c) => c.value === report.reason_category);

  // Stepper index: 0 = submitted, 1 = reviewing, 2 = resolved / terminal
  let stepperIndex = 0;
  if (report.status === 'reviewing') stepperIndex = 1;
  else if (report.status === 'resolved' || report.status === 'rejected' || report.status === 'withdrawn') {
    stepperIndex = 2;
  }

  const canWithdraw = report.status === 'pending' || report.status === 'reviewing';
  const canDelete = report.status === 'resolved' || report.status === 'rejected' || report.status === 'withdrawn';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[88vh] max-w-[680px] w-[94vw] gap-0 overflow-hidden flex flex-col rounded-2xl p-0 border border-border bg-card shadow-2xl"
      >
        {/* Fixed Header */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-start justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-md">
                {`#${report.ticket_id}`}
              </span>
              <Badge variant="neutral" className={`font-semibold text-xs ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
              <span className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Gửi ngày {new Date(report.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <DialogTitle className="itt-display text-[19px] font-semibold text-foreground leading-snug">
              {report.title}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-muted-foreground">
              Hồ sơ báo cáo an toàn cộng đồng được mã hóa và thụ lý độc lập bởi ban quản trị.
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Official Stepper Progress */}
          <div className="p-4 rounded-xl border border-border bg-sand-subtle/70">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Tiến trình thụ lý hồ sơ
            </p>
            <Stepper ariaLabel="Tiến trình báo cáo" currentIndex={stepperIndex} steps={STEPPER_STEPS} />
          </div>

          {/* Target Entity Card */}
          <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-sand border border-line flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
                {report.target_type === 'enterprise' || report.target_type === 'company' ? (
                  <Building2 className="size-5" />
                ) : (
                  <FileText className="size-5" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  Đối tượng bị phản ánh: {REPORT_TARGET_TYPE_LABELS[report.target_type]}
                </span>
                <p className="font-semibold text-foreground text-[14px] truncate">{report.target_title}</p>
              </div>
            </div>

            {report.target_link && (
              <Button asChild variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold gap-1.5 shrink-0">
                <a href={report.target_link} target="_blank" rel="noreferrer">
                  Xem đối tượng <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
          </div>

          {/* Statement & Description */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">
                Nội dung tường trình vi phạm
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-foreground font-semibold">
                {reasonConfig?.defaultLabel ?? report.reason_category}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap shadow-2xs">
              {report.description}
            </div>
          </div>

          {/* Evidence Attachments */}
          {report.evidence_files && report.evidence_files.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider">
                Tài liệu & Bằng chứng cung cấp ({report.evidence_files.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.evidence_files.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-lg border border-border bg-card hover:bg-sand-subtle transition flex items-center justify-between gap-2 text-xs font-mono text-foreground shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="truncate">{url}</span>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Outcome Resolution Box */}
          {report.status === 'resolved' && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-5 shrink-0" />
                <span className="font-bold text-[14px]">Báo cáo đã được xử lý & xác nhận vi phạm</span>
              </div>

              {report.action_taken && report.action_taken !== 'none' && (
                <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Biện pháp đã thi hành:</span>
                  <span className="font-semibold text-primary">
                    {REPORT_ACTIONS_TAKEN_CONFIG[report.action_taken]?.label ?? report.action_taken}
                  </span>
                </div>
              )}

              {report.message_to_reporter && (
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10.5px]">
                    Phản hồi từ Ban Quản Trị:
                  </span>
                  <p className="p-3 rounded-lg bg-card border border-border text-foreground leading-relaxed">
                    {report.message_to_reporter}
                  </p>
                </div>
              )}
            </div>
          )}

          {report.status === 'rejected' && (
            <div className="p-4 rounded-xl border border-border bg-secondary/50 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="size-4 shrink-0" />
                <span className="font-bold text-[13.5px] text-foreground">Hồ sơ không đủ căn cứ xử lý</span>
              </div>
              {report.message_to_reporter && (
                <p className="p-3 rounded-lg bg-card border border-border text-muted-foreground leading-relaxed">
                  {report.message_to_reporter}
                </p>
              )}
            </div>
          )}

          {report.status === 'withdrawn' && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-[13px]">
                <Undo2 className="size-4 shrink-0" />
                Báo cáo đã được người gửi chủ động rút lại
              </div>
              {report.withdrawal_reason && (
                <p className="text-muted-foreground">Lý do: {report.withdrawal_reason}</p>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer with contextual actions */}
        <div className="flex items-center justify-between border-t border-border bg-sand-subtle/50 px-6 py-4 shrink-0">
          <div>
            {canWithdraw && onWithdrawClick && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onWithdrawClick(report)}
                className="h-10 px-4 text-[13px] font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 gap-1.5"
                shape="default"
              >
                <Undo2 className="size-4" /> Rút lại báo cáo
              </Button>
            )}

            {canDelete && onDeleteClick && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onDeleteClick(report)}
                className="h-10 px-4 text-[13px] font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                shape="default"
              >
                <Trash2 className="size-4" /> Xóa lịch sử
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 text-[13.5px] font-semibold"
            shape="default"
          >
            Đóng cửa sổ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
