import type {
  ReportActionTaken,
  ReportReasonCategory,
  ReportStatus,
  ReportTargetType,
} from './reports.types';

export const REPORT_REASON_CATEGORIES: Array<{
  value: ReportReasonCategory;
  labelKey: string;
  defaultLabel: string;
  description: string;
}> = [
  {
    value: 'scam_fraud',
    labelKey: 'reports.categories.scam_fraud',
    defaultLabel: 'Lừa đảo hoặc gian lận',
    description: 'Yêu cầu chuyển tiền, thu phí tuyển dụng, hoặc giả mạo công ty lớn',
  },
  {
    value: 'fee_extortion',
    labelKey: 'reports.categories.fee_extortion',
    defaultLabel: 'Thu phí / Tống tiền ứng viên',
    description: 'Yêu cầu đóng cọc, phí giữ chỗ, phí đào tạo bất hợp pháp',
  },
  {
    value: 'misleading_info',
    labelKey: 'reports.categories.misleading_info',
    defaultLabel: 'Thông tin sai lệch / Gian dối',
    description: 'Mức lương ảo, địa điểm không chính xác, hoặc mô tả công việc sai lệch',
  },
  {
    value: 'offensive_content',
    labelKey: 'reports.categories.offensive_content',
    defaultLabel: 'Nội dung xúc phạm / Phân biệt đối xử',
    description: 'Yêu cầu phân biệt giới tính, vùng miền, hoặc ngôn từ không phù hợp',
  },
  {
    value: 'impersonation',
    labelKey: 'reports.categories.impersonation',
    defaultLabel: 'Mạo danh cá nhân hoặc doanh nghiệp',
    description: 'Mạo danh tổ chức hoặc nhà tuyển dụng khác mà không có ủy quyền',
  },
  {
    value: 'harassment',
    labelKey: 'reports.categories.harassment',
    defaultLabel: 'Quấy rối hoặc đe dọa',
    description: 'Tin nhắn khiếm nhã, quấy rối qua số điện thoại/mạng xã hội',
  },
  {
    value: 'other',
    labelKey: 'reports.categories.other',
    defaultLabel: 'Lý do khác',
    description: 'Các vi phạm điều khoản dịch vụ khác không thuộc nhóm trên',
  },
];

export const REPORT_STATUS_CONFIG: Record<
  ReportStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  pending: {
    label: 'Chờ duyệt',
    variant: 'outline',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
  },
  reviewing: {
    label: 'Đang xử lý',
    variant: 'outline',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
  },
  resolved: {
    label: 'Đã giải quyết',
    variant: 'outline',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  rejected: {
    label: 'Đã từ chối',
    variant: 'outline',
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30 dark:bg-zinc-500/20 dark:text-zinc-400',
  },
  withdrawn: {
    label: 'Đã rút lại',
    variant: 'outline',
    className: 'bg-slate-500/10 text-slate-500 border-slate-400/30 dark:bg-slate-500/20 dark:text-slate-400',
  },
};

export const REPORT_ACTIONS_TAKEN_CONFIG: Record<
  ReportActionTaken,
  {
    label: string;
    description: string;
  }
> = {
  warning_issued: {
    label: 'Cảnh cáo đối tượng vi phạm',
    description: 'Gửi thông báo cảnh cáo chính thức đến bên bị báo cáo',
  },
  content_takedown: {
    label: 'Gỡ bỏ nội dung vi phạm',
    description: 'Khóa / đóng tin tuyển dụng hoặc tạm ẩn hồ sơ doanh nghiệp',
  },
  account_suspended: {
    label: 'Đình chỉ tài khoản',
    description: 'Tạm ngưng hoạt động tài khoản người dùng hoặc doanh nghiệp',
  },
  none: {
    label: 'Không thực hiện biện pháp trừng phạt',
    description: 'Đóng báo cáo mà không áp dụng chế tài trực tiếp',
  },
};

export const REPORT_TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  job: 'Tin tuyển dụng',
  enterprise: 'Doanh nghiệp',
  company: 'Doanh nghiệp',
  user: 'Tài khoản người dùng',
};
