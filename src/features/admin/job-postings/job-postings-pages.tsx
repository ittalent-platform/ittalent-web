import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useState } from "react";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { DataTable, TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/toast/toast-provider";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate } from "@/lib/format";
import { JobPostingForm } from "@/features/job-postings/job-posting-form";
import {
  createJobPosting,
  deleteJobPosting,
  getApiErrorMessage,
  getJobPostingById,
  listAdminJobPostings,
  type JobPosting,
  type JobPostingPayload,
  updateJobPosting,
} from "@/features/job-postings/job-postings.api";

const jobPostingKeys = {
  adminLists: () => ["job-postings", "admin"] as const,
  detail: (id: string) => ["job-postings", "detail", id] as const,
};
const key = jobPostingKeys.adminLists();
const pageSize = 10;

function JobPostingEditor({ posting }: { posting?: JobPosting }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: (payload: JobPostingPayload) =>
      posting
        ? updateJobPosting(posting.id, payload)
        : createJobPosting(payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
      if (posting) {
        await client.invalidateQueries({
          queryKey: jobPostingKeys.detail(posting.id),
        });
      }
      showToast({
        title: posting ? "Job posting updated" : "Job posting created",
        message: "Your changes have been saved.",
        tone: "success",
      });
      navigate("/admin/job-postings");
    },
    onError: (error) =>
      showToast({
        title: "Could not save job posting",
        message: getApiErrorMessage(error),
        tone: "error",
      }),
  });
  return (
    <JobPostingForm
      isSaving={mutation.isPending}
      onSubmit={(payload) => mutation.mutate(payload)}
      posting={posting}
    />
  );
}

export function CreateJobPostingPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        description="Create a draft or publish a new opportunity."
        title="Create job posting"
      />
      <JobPostingEditor />
    </div>
  );
}

export function EditJobPostingPage() {
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const query = useQuery({
    queryKey: jobPostingKeys.detail(jobPostingId ?? ""),
    enabled: Boolean(jobPostingId),
    queryFn: () => getJobPostingById(jobPostingId as string),
  });
  if (query.isPending)
    return (
      <div className="py-10 text-muted-foreground">Loading job posting…</div>
    );
  if (query.isError) {
    const status = (query.error as { status?: number }).status;
    return (
      <ErrorState
        description={
          status === 403
            ? "You do not have permission to edit this job posting."
            : getApiErrorMessage(query.error)
        }
        title={
          status === 404
            ? "Job posting not found"
            : status === 403
              ? "Access denied"
              : "Could not load job posting"
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        description="Edit the selected opportunity and save your changes."
        title="Edit job posting"
      />
      <JobPostingEditor posting={query.data} />
    </div>
  );
}

export function JobPostingsPage() {
  const { page, limit, search, set } = useListParams({
    defaultLimit: pageSize,
  });
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<JobPosting | null>(null);
  const query = useQuery({
    queryKey: [...key, { page, limit, search }],
    queryFn: () =>
      listAdminJobPostings({
        page,
        limit,
        search: search || undefined,
        sort_by: "created_at",
        sort_order: "desc",
      }),
  });
  const deletion = useMutation({
    mutationFn: deleteJobPosting,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      setPendingDelete(null);
      showToast({
        title: "Job posting deleted",
        message: "The posting was permanently deleted.",
        tone: "success",
      });
    },
    onError: (error) =>
      showToast({
        title: "Could not delete job posting",
        message: getApiErrorMessage(error),
        tone: "error",
      }),
  });
  const jobs = query.data?.items ?? [];
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        actions={
          <Button asChild>
            <Link to="/admin/job-postings/create">
              <Plus />
              Create job posting
            </Link>
          </Button>
        }
        description="Manage all job postings."
        title="Job postings"
      />
      <input
        aria-label="Search job postings"
        className="h-10 max-w-md rounded-md border border-input bg-transparent px-3 text-sm"
        onChange={(event) => set("search", event.target.value)}
        placeholder="Search title or location"
        value={search}
      />
      {query.isError ? (
        <ErrorState
          description={getApiErrorMessage(query.error)}
          title="Could not load job postings"
        />
      ) : (
        <TableSurface>
          <DataTable
            columns={
              [
                {
                  key: "title",
                  header: "Title",
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.location ?? "No location"}
                      </p>
                    </div>
                  ),
                },
                { key: "status", header: "Status", cell: (row) => row.status },
                {
                  key: "expires",
                  header: "Expires",
                  cell: (row) => formatDate(row.expiresAt),
                },
                {
                  key: "actions",
                  header: "",
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button
                        aria-label={`Edit ${row.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/admin/job-postings/${row.id}/edit`);
                        }}
                        size="icon"
                        variant="ghost"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label={`Delete ${row.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDelete(row);
                        }}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  ),
                },
              ] as const
            }
            emptyState={
              <EmptyState
                description={
                  search
                    ? "No postings match your search."
                    : "Create your first job posting to get started."
                }
                title="No job postings"
              />
            }
            isLoading={query.isPending}
            rowKey={(row) => row.id}
            rows={jobs}
          />
        </TableSurface>
      )}
      {query.data && query.data.total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(value) => set("limit", String(value))}
          onPageChange={(value) => set("page", String(value))}
          page={page}
          total={query.data.total}
          totalPages={query.data.totalPages}
        />
      ) : null}
      {pendingDelete ? (
        <ActionConfirmDialog
          action={deletion.isPending ? "Deleting…" : "Delete"}
          description="This permanently removes the job posting. This action cannot be undone."
          disabled={deletion.isPending}
          icon={Trash2}
          onConfirm={() => deletion.mutate(pendingDelete.id)}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          open
          title={`Delete “${pendingDelete.title}”?`}
          variant="destructive-solid"
        />
      ) : null}
    </div>
  );
}
