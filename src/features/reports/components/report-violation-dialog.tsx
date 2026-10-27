import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Plus,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';

import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  REPORT_REASON_CATEGORIES,
  REPORT_TARGET_TYPE_LABELS,
} from '@/features/reports/reports.constants';
import { useSubmitReportMutation } from '@/features/reports/reports.queries';
import type {
  ReportReasonCategory,
  ReportTargetType,
} from '@/features/reports/reports.types';

export interface ReportViolationDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetLink?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportViolationDialog({
  targetType,
  targetId,
  targetTitle,
  targetLink,
  open,
  onOpenChange,
}: ReportViolationDialogProps) {
  const [reasonCategory, setReasonCategory] = useState<ReportReasonCategory>('scam_fraud');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [evidenceUrlInput, setEvidenceUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  const submitMutation = useSubmitReportMutation();

  const handleAddEvidence = () => {
    const trimmed = evidenceUrlInput.trim();
    if (!trimmed) return;
    if (evidenceFiles.length >= 5) {
      setErrorMessage('Chỉ được đính kèm tối đa 5 liên kết bằng chứng.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMessage('Đường dẫn bằng chứng phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    setEvidenceFiles([...evidenceFiles, trimmed]);
    setEvidenceUrlInput('');
    setErrorMessage(null);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle || trimmedTitle.length < 5) {
      setErrorMessage('Tiêu đề báo cáo phải từ 5 đến 100 ký tự.');
      return;
    }
    if (!trimmedDesc || trimmedDesc.length < 20) {
      setErrorMessage('Mô tả chi tiết sự việc phải có ít nhất 20 ký tự để ban quản trị có căn cứ xác minh.');
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        target_type: targetType,
        target_id: targetId,
        target_link: targetLink,
        reason_category: reasonCategory,
        title: trimmedTitle,
        description: trimmedDesc,
        evidence_files: evidenceFiles,
      });

      setSuccessTicketId(result.ticket_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi báo cáo vi phạm. Vui lòng thử lại sau.';
      setErrorMessage(message);
    }
  };

  const handleClose = () => {
    if (submitMutation.isPending) return;
    onOpenChange(false);
    setTimeout(() => {
      setTitle('');
      setDescription('');
      setEvidenceFiles([]);
      setEvidenceUrlInput('');
      setErrorMessage(null);
      setSuccessTicketId(null);
    }, 200);
  };

  const selectedCategoryObj = REPORT_REASON_CATEGORIES.find((c) => c.value === reasonCategory);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[88vh] max-w-[620px] w-[94vw] gap-0 overflow-hidden flex flex-col rounded-2xl p-0 border border-border bg-card shadow-2xl"
      >
        {successTicketId ? (
          <div className="flex flex-col items-center text-center p-8 sm:p-10 gap-5">
            <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-8" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="itt-display text-2xl font-semibold text-foreground">Gửi báo cáo thành công</h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground max-w-md">
                Báo cáo của bạn đã được ghi nhận với mã vé{' '}
                <span className="font-mono font-bold text-foreground">#{successTicketId}</span>. Ban kiểm soát an
                toàn ITTalent sẽ tiến hành đối soát và phản hồi trong thời gian sớm nhất.
              </p>
            </div>

            <div className="w-full rounded-xl border border-line bg-card p-4 text-left flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between items-center text-muted-foreground border-b border-line-muted pb-2">
                <span>Đối tượng bị báo cáo:</span>
                <span className="font-semibold text-foreground truncate max-w-[260px]">{targetTitle}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Trạng thái tiếp nhận:</span>
                <span className="font-semibold text-amber-600">Đang chờ thụ lý (Pending)</span>
              </div>
            </div>

            <Button onClick={handleClose} className="h-10 px-8 text-[13.5px] font-semibold mt-2" shape="default">
              Đã hiểu & Đóng cửa sổ
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Structured Dialog Header */}
            <div className="border-b border-border bg-card px-6 py-4 flex items-start justify-between gap-4 shrink-0">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 text-destructive font-semibold text-[11px] tracking-wider uppercase">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span>Bảo vệ an toàn sàn việc làm</span>
                </div>
                <DialogTitle className="itt-display text-[19px] font-semibold text-foreground leading-snug">
                  Báo cáo vi phạm: {targetTitle}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] text-muted-foreground">
                  Cung cấp chứng cứ và thông tin cụ thể về các hành vi thu phí trái phép, gian lận hoặc sai lệch thông tin.
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Target Entity Card */}
              <div className="p-3.5 rounded-xl border border-border bg-sand-subtle/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
                    {targetType === 'enterprise' ? <Building2 className="size-4" /> : <FileText className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {REPORT_TARGET_TYPE_LABELS[targetType]}
                    </p>
                    <p className="font-semibold text-foreground text-[13.5px] truncate">{targetTitle}</p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px] flex items-start gap-2.5">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* FormField: Reason Category */}
              <FormField
                htmlFor="report-category"
                label="Lý do vi phạm"
                hint={selectedCategoryObj?.description}
                required
              >
                <Select
                  value={reasonCategory}
                  onValueChange={(val) => setReasonCategory(val as ReportReasonCategory)}
                >
                  <SelectTrigger id="report-category" className="h-10 text-[13.5px]">
                    <SelectValue placeholder="Chọn danh mục vi phạm" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="font-medium text-[13px]">{cat.defaultLabel}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* FormField: Summary Title */}
              <FormField
                htmlFor="report-title"
                label="Tóm tắt vi phạm"
                hint={`${title.length}/100 ký tự`}
                required
              >
                <Input
                  id="report-title"
                  placeholder="Ví dụ: Công ty thu tiền cọc hồ sơ trước khi phỏng vấn"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="h-10 text-[13.5px]"
                  required
                />
              </FormField>

              {/* FormField: Detailed Narrative */}
              <FormField
                htmlFor="report-desc"
                label="Mô tả chi tiết sự việc"
                hint={`${description.length}/1500 ký tự (tối thiểu 20)`}
                required
              >
                <Textarea
                  id="report-desc"
                  placeholder="Mô tả rõ diễn biến: Thời gian xảy ra, nội dung trao đổi, tin nhắn, số tài khoản nhận tiền hoặc các yêu cầu bất thường..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1500}
                  className="text-[13.5px] leading-relaxed resize-none"
                  required
                />
              </FormField>

              {/* Evidence Section */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-foreground">
                    Tài liệu & Bằng chứng ({evidenceFiles.length}/5)
                  </span>
                  <span className="text-[12px] text-muted-foreground">Không bắt buộc</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Dán liên kết ảnh chụp màn hình hoặc tài liệu (https://...)"
                      value={evidenceUrlInput}
                      onChange={(e) => setEvidenceUrlInput(e.target.value)}
                      disabled={evidenceFiles.length >= 5}
                      className="h-10 text-[13px] pl-9"
                    />
                    <LinkIcon className="size-4 text-muted-foreground absolute left-3 top-3" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddEvidence}
                    disabled={!evidenceUrlInput.trim() || evidenceFiles.length >= 5}
                    className="h-10 px-4 text-[13px] font-semibold shrink-0 gap-1.5"
                  >
                    <Plus className="size-4" /> Thêm link
                  </Button>
                </div>

                {/* Evidence List as Clean Chips/Cards */}
                {evidenceFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {evidenceFiles.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs text-foreground group"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <ExternalLink className="size-3.5 text-primary shrink-0" />
                          <span className="font-mono truncate">{url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(index)}
                          className="size-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition"
                          title="Gỡ bỏ liên kết này"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security & Confidentiality Banner */}
              <div className="p-3.5 rounded-xl border border-line bg-secondary/30 flex items-start gap-3 text-xs text-muted-foreground">
                <Shield className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  Báo cáo của bạn được xử lý theo quy trình bảo mật nghiêm ngặt. Thông tin người gửi sẽ được giữ kín
                  đối với bên bị phản ánh để đảm bảo an toàn cho ứng viên.
                </p>
              </div>
            </div>

            {/* Fixed Sticky Dialog Footer */}
            <div className="flex items-center justify-between border-t border-border bg-sand-subtle/50 px-6 py-4 shrink-0">
              <span className="text-[12px] text-muted-foreground hidden sm:inline">
                * Mọi hành vi báo cáo sai sự thật có thể bị hạn chế tài khoản.
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitMutation.isPending}
                  className="h-10 px-4 text-[13.5px] font-semibold"
                  shape="default"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="h-10 px-5 text-[13.5px] font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xs"
                  shape="default"
                >
                  {submitMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo vi phạm'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
