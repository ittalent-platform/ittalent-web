import { useState } from 'react';
import { Bell, Calendar, CheckCircle, FileText } from 'lucide-react';
import { AdminPageHeader } from '@/components/common/admin-page-header';
import { Pagination } from '@/components/ui/pagination';
import { useListParams } from '@/hooks/use-list-params';
import {
  useBroadcastsListQuery,
  useCancelScheduleMutation,
  useDispatchBroadcastMutation,
  DEFAULT_PAGE_SIZE,
} from './broadcast-notifications.queries';
import { BroadcastNotificationsToolbar } from './broadcast-notifications-toolbar';
import { BroadcastNotificationsTable } from './broadcast-notifications-table';
import { CreateBroadcastDialog } from './create-broadcast-dialog';
import { EditBroadcastDialog } from './edit-broadcast-dialog';
import { ScheduleBroadcastDialog } from './schedule-broadcast-dialog';
import { BroadcastDetailDrawer } from './broadcast-detail-drawer';
import { DeleteBroadcastDialog } from './delete-broadcast-dialog';
import type { BroadcastNotificationDto } from './broadcast-notifications.types';

export function BroadcastNotificationsPage() {
  const { page, limit, search, set } = useListParams({
    defaultLimit: DEFAULT_PAGE_SIZE,
  });

  const [status, setStatus] = useState<string>('all');
  const [audience, setAudience] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastNotificationDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const listQuery = useBroadcastsListQuery({
    page,
    limit,
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(audience !== 'all' ? { audience } : {}),
    ...(priority !== 'all' ? { priority } : {}),
  });

  const dispatchMutation = useDispatchBroadcastMutation();
  const cancelScheduleMutation = useCancelScheduleMutation();

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));
  const summary = listQuery.data?.summary ?? { total: 0, drafts: 0, scheduled: 0, sent: 0 };

  const hasFilters =
    search.trim() !== '' ||
    status !== 'all' ||
    audience !== 'all' ||
    priority !== 'all';

  function handleSearchChange(val: string) {
    set('search', val || null);
    set('page', '1');
  }

  function handleResetFilters() {
    set('search', null);
    setStatus('all');
    setAudience('all');
    setPriority('all');
    set('page', '1');
  }

  function handleViewDetails(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsDetailOpen(true);
  }

  function handleEdit(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsEditOpen(true);
  }

  function handleSchedule(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsScheduleOpen(true);
  }

  async function handleDispatchNow(item: BroadcastNotificationDto) {
    if (confirm(`Are you sure you want to dispatch "${item.title}" to ${item.targetAudience} immediately?`)) {
      await dispatchMutation.mutateAsync(item.id);
    }
  }

  async function handleCancelSchedule(item: BroadcastNotificationDto) {
    if (confirm(`Cancel scheduled dispatch for "${item.title}" and revert to draft?`)) {
      await cancelScheduleMutation.mutateAsync(item.id);
    }
  }

  function handleDelete(item: BroadcastNotificationDto) {
    setSelectedBroadcast(item);
    setIsDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Compose, schedule, and dispatch announcements across candidate job seekers, recruiters, and enterprise administrators."
        title="Broadcast Notifications"
      />

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Campaigns</p>
              <p className="text-xl font-bold text-foreground">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Drafts</p>
              <p className="text-xl font-bold text-foreground">{summary.drafts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
              <p className="text-xl font-bold text-foreground">{summary.scheduled}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Sent / Published</p>
              <p className="text-xl font-bold text-foreground">{summary.sent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <BroadcastNotificationsToolbar
        audience={audience}
        onAudienceChange={(val) => {
          setAudience(val);
          set('page', '1');
        }}
        onCreateClick={() => setIsCreateOpen(true)}
        onPriorityChange={(val) => {
          setPriority(val);
          set('page', '1');
        }}
        onResetFilters={handleResetFilters}
        onSearchChange={handleSearchChange}
        onStatusChange={(val) => {
          setStatus(val);
          set('page', '1');
        }}
        priority={priority}
        search={search}
        status={status}
      />

      {/* Data Table */}
      <BroadcastNotificationsTable
        hasFilters={hasFilters}
        isLoading={listQuery.isLoading}
        items={items}
        onCancelSchedule={handleCancelSchedule}
        onClearFilters={handleResetFilters}
        onDelete={handleDelete}
        onDispatchNow={handleDispatchNow}
        onEdit={handleEdit}
        onSchedule={handleSchedule}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            limit={limit}
            onLimitChange={(l) => {
              set('limit', String(l));
              set('page', '1');
            }}
            onPageChange={(p) => set('page', String(p))}
            page={page}
            total={total}
            totalPages={totalPages}
          />
        </div>
      )}

      {/* Dialogs & Drawers */}
      <CreateBroadcastDialog
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      <EditBroadcastDialog
        broadcast={selectedBroadcast}
        onOpenChange={setIsEditOpen}
        open={isEditOpen}
      />

      <ScheduleBroadcastDialog
        broadcast={selectedBroadcast}
        onOpenChange={setIsScheduleOpen}
        open={isScheduleOpen}
      />

      <BroadcastDetailDrawer
        broadcast={selectedBroadcast}
        onCancelSchedule={handleCancelSchedule}
        onDelete={handleDelete}
        onDispatchNow={handleDispatchNow}
        onEdit={handleEdit}
        onOpenChange={setIsDetailOpen}
        onSchedule={handleSchedule}
        open={isDetailOpen}
      />

      <DeleteBroadcastDialog
        broadcast={selectedBroadcast}
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
      />
    </div>
  );
}
