import { Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterSelect } from '@/components/ui/filter-select';
import { ListToolbar } from '@/components/common/list-toolbar';

type BroadcastNotificationsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  audience: string;
  onAudienceChange: (audience: string) => void;
  priority: string;
  onPriorityChange: (priority: string) => void;
  onResetFilters: () => void;
  onCreateClick: () => void;
};

export function BroadcastNotificationsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  audience,
  onAudienceChange,
  priority,
  onPriorityChange,
  onResetFilters,
  onCreateClick,
}: BroadcastNotificationsToolbarProps) {
  const hasActiveFilters =
    search.trim() !== '' ||
    status !== 'all' ||
    audience !== 'all' ||
    priority !== 'all';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <ListToolbar
          onSearchChange={onSearchChange}
          search={search}
          searchPlaceholder="Search broadcasts by title or content..."
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              onChange={onStatusChange}
              options={[
                { label: 'Status: All', value: 'all' },
                { label: 'Draft', value: 'Draft' },
                { label: 'Scheduled', value: 'Scheduled' },
                { label: 'Sent', value: 'Sent' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
              value={status}
            />

            <FilterSelect
              onChange={onAudienceChange}
              options={[
                { label: 'Audience: All', value: 'all' },
                { label: 'All Users', value: 'All Users' },
                { label: 'Applicants only', value: 'Applicants only' },
                { label: 'Recruiters only', value: 'Recruiters only' },
                { label: 'Enterprise Admins', value: 'Enterprise Admins' },
              ]}
              value={audience}
            />

            <FilterSelect
              onChange={onPriorityChange}
              options={[
                { label: 'Priority: All', value: 'all' },
                { label: 'Low', value: 'Low' },
                { label: 'Normal', value: 'Normal' },
                { label: 'High', value: 'High' },
                { label: 'Urgent', value: 'Urgent' },
              ]}
              value={priority}
            />

            {hasActiveFilters && (
              <Button
                className="h-9 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={onResetFilters}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="size-3.5" />
                Reset filters
              </Button>
            )}
          </div>
        </ListToolbar>
      </div>

      <div className="shrink-0">
        <Button
          className="gap-1.5 font-medium shadow-sm"
          onClick={onCreateClick}
        >
          <Plus className="size-4" />
          Create Broadcast
        </Button>
      </div>
    </div>
  );
}
