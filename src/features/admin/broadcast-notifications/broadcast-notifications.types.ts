export type BroadcastCategory =
  | 'System Maintenance'
  | 'Feature Update'
  | 'Policy Update'
  | 'Event Announcement'
  | 'Security Alert';

export type BroadcastAudience =
  | 'All Users'
  | 'Applicants only'
  | 'Recruiters only'
  | 'Enterprise Admins';

export type BroadcastPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type BroadcastStatus = 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';

export type BroadcastChannel = 'In-App Inbox' | 'Email Digest';

export interface BroadcastDeliveryMetrics {
  targetedCount: number;
  deliveredCount: number;
  readCount: number;
  readPercentage: number;
}

export interface BroadcastSenderDto {
  id: string;
  email: string;
  fullName?: string | null;
  role?: string;
}

export interface BroadcastNotificationDto {
  id: string;
  title: string;
  content: string;
  category: BroadcastCategory;
  targetAudience: BroadcastAudience;
  priority: BroadcastPriority;
  actionUrl?: string | null;
  actionLabel?: string | null;
  channels: BroadcastChannel[];
  status: BroadcastStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  sender?: BroadcastSenderDto;
  deliveryMetrics: BroadcastDeliveryMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastListSummary {
  total: number;
  drafts: number;
  scheduled: number;
  sent: number;
}

export interface BroadcastListResponse {
  items: BroadcastNotificationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: BroadcastListSummary;
}

export interface BroadcastListParams {
  page: number;
  limit?: number;
  search?: string;
  status?: string;
  audience?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'createdAt' | 'scheduled_at' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

export interface CreateBroadcastInput {
  title: string;
  content: string;
  category: BroadcastCategory;
  target_audience: BroadcastAudience;
  priority: BroadcastPriority;
  action_url?: string | null;
  action_label?: string | null;
  channels: BroadcastChannel[];
  is_draft?: boolean;
}

export interface UpdateBroadcastInput {
  title?: string;
  content?: string;
  category?: BroadcastCategory;
  target_audience?: BroadcastAudience;
  priority?: BroadcastPriority;
  action_url?: string | null;
  action_label?: string | null;
  channels?: BroadcastChannel[];
}

export interface ScheduleBroadcastInput {
  scheduled_at: string;
}

