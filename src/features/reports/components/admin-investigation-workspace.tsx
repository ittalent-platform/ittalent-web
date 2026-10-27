import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

import { FormField } from '@/components/common/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  REPORT_ACTIONS_TAKEN_CONFIG,
  REPORT_REASON_CATEGORIES,
  REPORT_STATUS_CONFIG,
  REPORT_TARGET_TYPE_LABELS,
} from '@/features/reports/reports.constants';
import {
  useAdminClaimTicketMutation,
  useAdminResolveTicketMutation,
} from '@/features/reports/reports.queries';
import type {
  AdminReportDto,
  ReportActionTaken,
  ReportResolutionDecision,
} from '@/features/reports/reports.types';

export interface AdminInvestigationWorkspaceProps {
  report: AdminReportDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminInvestigationWorkspace({
  report,
  open,
  onOpenChange,
  onSuccess,
}: AdminInvestigationWorkspaceProps) {
  const [decision, setDecision] = useState<ReportResolutionDecision>('resolved');
  const [actionTaken, setActionTaken] = useState<ReportActionTaken>('content_takedown');
  const [internalNotes, setInternalNotes] = useState('');
  const [messageToReporter, setMessageToReporter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const claimMutation = useAdminClaimTicketMutation();
  const resolveMutation = useAdminResolveTicketMutation();

  if (!report) return null;

  const statusConfig = REPORT_STATUS_CONFIG[report.status] ?? {
    label: report.status,
    className: 'bg-muted text-muted-foreground',
  };

  const reasonConfig = REPORT_REASON_CATEGORIES.find((c) => c.value === report.reason_category);

  const isTerminal = report.status === 'resolved' || report.status === 'rejected' || report.status === 'withdrawn';
  const isPending = report.status === 'pending';

  const handleClaim = async () => {
    setErrorMessage(null);
    try {
      await claimMutation.mutateAsync(report.id);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tiếp nhận báo cáo.';
      setErrorMessage(message);
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedNotes = internalNotes.trim();
    const trimmedMessage = messageToReporter.trim();

    if (!trimmedNotes) {
      setErrorMessage('Vui lòng nhập ghi chú kết luận điều tra nội bộ.');
      return;
    }
    if (!trimmedMessage) {
      setErrorMessage('Vui lòng nhập phản hồi gửi cho người báo cáo.');
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        id: report.id,
        input: {
          decision,
          action_taken: decision === 'resolved' ? actionTaken : 'none',
          internal_notes: trimmedNotes,
          message_to_reporter: trimmedMessage,
        },
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể hoàn tất xử lý báo cáo.';
      setErrorMessage(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-6xl w-[94vw] max-h-[88vh] overflow-hidden flex flex-col p-0 rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-md">
                  #{report.ticket_id}
                </span>
                <Badge variant="neutral" className={`font-semibold text-xs ${statusConfig.className}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <h2 className="itt-display text-lg font-semibold text-foreground line-clamp-1 mt-1">
                {report.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isPending && (
              <Button
                type="button"
                onClick={handleClaim}
                disabled={claimMutation.isPending}
                className="h-9 px-4 text-xs font-semibold gap-1.5"
                shape="default"
              >
                <UserCheck className="size-4" />
                {claimMutation.isPending ? 'Đang nhận...' : 'Nhận xử lý hồ sơ'}
              </Button>
            )}
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
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px] flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3-Column Synchronized Investigation Workbench */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Column 1: Ticket Info & Reporter Profile (Col span 3) */}
          <div className="lg:col-span-3 p-5 flex flex-col gap-4 bg-sand-subtle/40 text-xs">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Hồ sơ Người Báo Cáo
              </span>
              <div className="mt-2.5 p-3.5 rounded-xl border border-border bg-card flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate text-[13px]">
                      {report.reporter.full_name || report.reporter.username || 'Người dùng'}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{report.reporter.email}</p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-border flex flex-col gap-1.5 text-muted-foreground text-[11.5px]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Tham gia:{' '}
                    {report.reporter.created_at
                      ? new Date(report.reporter.created_at).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="size-3.5 text-emerald-600" />
                    Chế độ:{' '}
                    <span className="text-foreground font-medium">
                      {report.is_anonymous ? 'Ẩn danh với bên bị phản ánh' : 'Công khai danh tính'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Điều phối & Tiếp nhận
              </span>
              <div className="mt-2.5 p-3.5 rounded-xl border border-border bg-card flex flex-col gap-2 shadow-2xs text-[12px]">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tiếp nhận:</span>
                  <span className="font-medium text-foreground">
                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cán bộ thụ lý:</span>
                  <span className="font-semibold text-foreground truncate max-w-[140px]">
                    {report.assigned_admin?.full_name || report.assigned_admin?.email || 'Chưa phân công'}
                  </span>
                </div>
                {report.resolved_at && (
                  <div className="flex justify-between items-center border-t border-line-muted pt-2">
                    <span className="text-muted-foreground">Hoàn tất lúc:</span>
                    <span className="font-medium text-foreground">
                      {new Date(report.resolved_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Statement, Target Entity & Evidence Gallery (Col span 5) */}
          <div className="lg:col-span-5 p-5 flex flex-col gap-5 overflow-y-auto">
            {/* Target Live Card */}
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Đối tượng bị tố cáo
              </span>
              <div className="mt-2.5 p-3.5 rounded-xl border border-border bg-sand-subtle/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
                    {report.target_type === 'enterprise' || report.target_type === 'company' ? (
                      <Building2 className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {REPORT_TARGET_TYPE_LABELS[report.target_type]}
                    </span>
                    <p className="font-semibold text-foreground text-[13.5px] truncate">{report.target_title}</p>
                  </div>
                </div>
                {report.target_link && (
                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold gap-1 shrink-0">
                    <a href={report.target_link} target="_blank" rel="noreferrer">
                      Xem trực tiếp <ExternalLink className="size-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Violation Category & Statement */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Nội dung tường trình vi phạm
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary font-semibold text-foreground">
                  {reasonConfig?.defaultLabel ?? report.reason_category}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card text-[13px] leading-relaxed whitespace-pre-wrap text-foreground shadow-2xs">
                {report.description}
              </div>
            </div>

            {/* Evidence Gallery */}
            {report.evidence_files && report.evidence_files.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Bằng chứng cung cấp ({report.evidence_files.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {report.evidence_files.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-sand-subtle transition text-xs font-mono shadow-2xs group"
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
          </div>

          {/* Column 3: Action Console & Final Resolution (Col span 4) */}
          <div className="lg:col-span-4 p-5 pb-8 flex flex-col gap-4 bg-sand-subtle/30 overflow-y-auto">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {isTerminal ? 'Kết quả giải quyết hồ sơ' : 'Bảng điều khiển quyết định'}
            </span>

            {isTerminal ? (
              <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  {report.status === 'resolved' ? (
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-zinc-500 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-[14px] text-foreground">
                      {report.status === 'resolved' ? 'Đã xác nhận & Thi hành chế tài' : 'Đã từ chối báo cáo'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Thời điểm:{' '}
                      {report.resolved_at
                        ? new Date(report.resolved_at).toLocaleString('vi-VN')
                        : 'Không rõ'}
                    </p>
                  </div>
                </div>

                {report.action_taken && report.action_taken !== 'none' && (
                  <div className="p-3 rounded-lg bg-sand-subtle border border-border flex flex-col gap-1">
                    <span className="font-semibold text-foreground text-[12px]">Biện pháp chế tài:</span>
                    <span className="text-primary font-bold text-[13px]">
                      {REPORT_ACTIONS_TAKEN_CONFIG[report.action_taken]?.label ?? report.action_taken}
                    </span>
                  </div>
                )}

                {report.internal_notes && (
                  <div className="flex flex-col gap-1 border-t border-border pt-2.5">
                    <span className="font-bold text-muted-foreground uppercase text-[10.5px]">
                      Ghi chú kiểm duyệt nội bộ:
                    </span>
                    <p className="p-2.5 rounded-lg bg-sand-subtle border border-border text-foreground leading-relaxed whitespace-pre-wrap text-[12px]">
                      {report.internal_notes}
                    </p>
                  </div>
                )}

                {report.message_to_reporter && (
                  <div className="flex flex-col gap-1 border-t border-border pt-2.5">
                    <span className="font-bold text-muted-foreground uppercase text-[10.5px]">
                      Phản hồi đã gửi cho người báo cáo:
                    </span>
                    <p className="p-2.5 rounded-lg bg-sand-subtle border border-border text-muted-foreground leading-relaxed whitespace-pre-wrap text-[12px]">
                      {report.message_to_reporter}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleFinalize} className="flex flex-col gap-4">
                {/* FormField: Decision */}
                <FormField htmlFor="admin-decision-select" label="Quyết định kiểm duyệt" required>
                  <Select
                    value={decision}
                    onValueChange={(val) => setDecision(val as ReportResolutionDecision)}
                  >
                    <SelectTrigger id="admin-decision-select" className="h-10 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Chấp thuận vi phạm (Resolve & Enforce)</SelectItem>
                      <SelectItem value="rejected">Bác bỏ báo cáo (Reject / Insufficient Proof)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {/* FormField: Action Taken if resolved */}
                {decision === 'resolved' && (
                  <FormField
                    htmlFor="admin-action-select"
                    label="Biện pháp chế tài"
                    hint={REPORT_ACTIONS_TAKEN_CONFIG[actionTaken]?.description}
                    required
                  >
                    <Select
                      value={actionTaken}
                      onValueChange={(val) => setActionTaken(val as ReportActionTaken)}
                    >
                      <SelectTrigger id="admin-action-select" className="h-10 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REPORT_ACTIONS_TAKEN_CONFIG).map(([act, cfg]) => (
                          <SelectItem key={act} value={act}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {/* FormField: Internal Notes */}
                <FormField
                  htmlFor="admin-notes"
                  label="Ghi chú điều tra nội bộ"
                  hint={`${internalNotes.length}/1000 ký tự`}
                  required
                >
                  <Textarea
                    id="admin-notes"
                    placeholder="Ghi chú bằng chứng xác minh, cơ sở điều khoản vi phạm (chỉ hiển thị cho admin)..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="text-[13px] leading-relaxed resize-none"
                    required
                  />
                </FormField>

                {/* FormField: Message to Reporter */}
                <FormField
                  htmlFor="admin-msg"
                  label="Thông điệp gửi người báo cáo"
                  hint={`${messageToReporter.length}/500 ký tự`}
                  required
                >
                  <Textarea
                    id="admin-msg"
                    placeholder="Thông báo kết quả xử lý và lời cảm ơn gửi vào hòm thư người dùng..."
                    value={messageToReporter}
                    onChange={(e) => setMessageToReporter(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="text-[13px] leading-relaxed resize-none"
                    required
                  />
                </FormField>

                <Button
                  type="submit"
                  disabled={resolveMutation.isPending}
                  className="h-10 text-[13.5px] font-semibold w-full mt-2"
                  shape="default"
                >
                  {resolveMutation.isPending ? 'Đang cập nhật...' : 'Hoàn tất & Thi hành quyết định'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
