import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { DataTable, TableSurface } from "@/components/common/data-table";
import { DetailRow } from "@/components/common/detail-row";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ListToolbar } from "@/components/common/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/toast/toast-provider";
import { JobPostingForm } from "./job-posting-form";
import { useListParams } from "@/hooks/use-list-params";
import { formatDate } from "@/lib/format";

import {
  createJobPosting,
  deleteJobPosting,
  getApiErrorMessage,
  getJobPostingById,
  listAdminJobPostings,
  listRecruiterJobPostings,
  type JobPosting,
  type JobPostingListParams,
  type JobPostingPayload,
  updateJobPosting,
} from "./job-postings.api";

type Actor = "admin" | "recruiter";

const listKeys = {
  detail: (id: string) => ["job-postings", "detail", id] as const,
  root: (actor: Actor) => ["job-postings", actor] as const,
};

type JobPostingSortBy = NonNullable<JobPostingListParams["sort_by"]>;
const sortOptions: { label: string; value: JobPostingSortBy }[] = [
  { label: "Created date", value: "created_at" },
  { label: "Title", value: "title" },
  { label: "Expiry date", value: "expires_at" },
];

function basePath(actor: Actor) {
  return `/${actor}/job-postings`;
}

function errorDescription(error: unknown) {
  const message = getApiErrorMessage(error);
  if (message === "Recruiter is not assigned to an enterprise") {
    return "Your recruiter account has not been assigned to an enterprise yet. Please contact the administrator.";
  }
  return message;
}

function useJobPostingEditor(actor: Actor, posting?: JobPosting) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: JobPostingPayload) =>
      posting ? updateJobPosting(posting.id, payload) : createJobPosting(payload),
    onError: (error) =>
      showToast({ title: "Could not save job posting", message: errorDescription(error), tone: "error" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: listKeys.root(actor) });
      if (posting) await client.invalidateQueries({ queryKey: listKeys.detail(posting.id) });
      showToast({
        title: posting ? "Job posting updated" : "Job posting created",
        message: "Your changes have been saved.",
        tone: "success",
      });
      navigate(basePath(actor));
    },
  });
}

function JobPostingEditor({ actor, posting }: { actor: Actor; posting?: JobPosting }) {
  const mutation = useJobPostingEditor(actor, posting);
  return <JobPostingForm isSaving={mutation.isPending} onSubmit={(payload) => mutation.mutate(payload)} posting={posting} />;
}

export function JobPostingCreatePage({ actor }: { actor: Actor }) {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader description="Create a new opportunity." title="Create job posting" />
      <JobPostingEditor actor={actor} />
    </div>
  );
}

export function JobPostingEditPage({ actor }: { actor: Actor }) {
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const query = useQuery({
    enabled: Boolean(jobPostingId),
    queryKey: listKeys.detail(jobPostingId ?? ""),
    queryFn: () => getJobPostingById(jobPostingId as string),
  });
  if (query.isPending) return <div className="py-10 text-muted-foreground">Loading job posting…</div>;
  if (query.isError) return <JobPostingError error={query.error} actionTo={basePath(actor)} />;
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader description="Edit the selected opportunity and save your changes." title="Edit job posting" />
      <JobPostingEditor actor={actor} posting={query.data} />
    </div>
  );
}

function JobPostingError({ actionTo, error }: { actionTo: string; error: unknown }) {
  const status = (error as { status?: number }).status;
  const message = getApiErrorMessage(error);
  return (
    <ErrorState
      description={
        status === 403 && message === "Job posting belongs to another enterprise"
          ? "This job posting belongs to another enterprise."
          : errorDescription(error)
      }
      secondaryAction={{ label: "Back to job postings", onClick: () => window.location.assign(actionTo) }}
      title={status === 404 ? "Job posting not found" : status === 403 ? "Access denied" : "Could not load job posting"}
    />
  );
}

export function JobPostingDetailPage({ actor }: { actor: Actor }) {
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<"delete" | null>(null);
  const query = useQuery({
    enabled: Boolean(jobPostingId),
    queryKey: listKeys.detail(jobPostingId ?? ""),
    queryFn: () => getJobPostingById(jobPostingId as string),
  });
  const mutation = useMutation({
    mutationFn: () => {
      if (!jobPostingId) throw new Error("Job posting not found");
      return deleteJobPosting(jobPostingId);
    },
    onError: (error) => showToast({ title: "Could not update job posting", message: errorDescription(error), tone: "error" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: listKeys.root(actor) });
      await client.invalidateQueries({ queryKey: listKeys.detail(jobPostingId ?? "") });
      showToast({ title: "Job posting deleted", message: "The posting was permanently deleted.", tone: "success" });
      navigate(basePath(actor));
    },
  });
  if (query.isPending) return <div className="py-10 text-muted-foreground">Loading job posting…</div>;
  if (query.isError || !query.data) return <JobPostingError actionTo={basePath(actor)} error={query.error} />;
  const posting = query.data;
  const actionLabel = "Delete";
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost"><Link to={basePath(actor)}><ArrowLeft />Back to job postings</Link></Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline"><Link to={`${basePath(actor)}/${posting.id}/edit`}><Pencil />Edit</Link></Button>
          <Button onClick={() => setPendingAction("delete")} size="sm" variant="destructive"><Trash2 />Delete</Button>
        </div>
      </div>
      <AdminPageHeader description="Review the job posting details." title={posting.title} />
      <Card><CardContent className="pt-6">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <DetailRow label="Location" value={posting.location ?? "—"} />
          <DetailRow label="Employment type" value={posting.employmentType ?? "—"} />
          <DetailRow label="Level" value={posting.level ?? "—"} />
          <DetailRow label="Expiry" value={formatDate(posting.expiresAt)} />
          <DetailRow label="Created" value={formatDate(posting.createdAt)} />
          <DetailRow label="Openings" value={posting.openings?.toString() ?? "—"} />
        </div>
        {(["description", "requirements", "benefits"] as const).map((field) => posting[field] ? <section className="mt-6" key={field}><h2 className="font-semibold capitalize">{field}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{posting[field]}</p></section> : null)}
      </CardContent></Card>
      {pendingAction ? <ActionConfirmDialog action={mutation.isPending ? "Deleting…" : actionLabel} description="This permanently removes the job posting. This action cannot be undone." disabled={mutation.isPending} icon={Trash2} onConfirm={() => mutation.mutate()} onOpenChange={(open) => !open && setPendingAction(null)} open title={`${actionLabel} “${posting.title}”?`} variant="destructive-solid" /> : null}
    </div>
  );
}

export function JobPostingListPage({ actor }: { actor: Actor }) {
  const { page, limit, search, debouncedSearch, set } = useListParams({ defaultLimit: 10 });
  const [sortBy, setSortBy] = useState<JobPostingSortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<JobPosting | null>(null);
  const params: JobPostingListParams = { page, limit, sort_by: sortBy, sort_order: sortOrder, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
  const query = useQuery({ queryKey: [...listKeys.root(actor), params], queryFn: () => actor === "admin" ? listAdminJobPostings(params) : listRecruiterJobPostings(params) });
  const deletion = useMutation({
    mutationFn: deleteJobPosting,
    onError: (error) => showToast({ title: "Could not delete job posting", message: errorDescription(error), tone: "error" }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: listKeys.root(actor) }); setPendingDelete(null); showToast({ title: "Job posting deleted", message: "The posting was permanently deleted.", tone: "success" }); },
  });
  const jobs = query.data?.items ?? [];
  return <div className="flex flex-col gap-6">
    <AdminPageHeader actions={<Button asChild><Link to={`${basePath(actor)}/create`}><Plus />Create job posting</Link></Button>} description={actor === "admin" ? "Manage all job postings." : "Manage job postings for your enterprise."} title="Job postings" />
    <ListToolbar onSearchChange={(value) => set("search", value)} search={search} searchPlaceholder="Search title or location…">
      <div className="flex flex-1 flex-wrap gap-2">
        <FilterSelect onChange={(value) => setSortBy(value as JobPostingSortBy)} options={sortOptions} value={sortBy} />
        <FilterSelect onChange={(value) => setSortOrder(value as "asc" | "desc")} options={[{ label: "Descending", value: "desc" }, { label: "Ascending", value: "asc" }]} value={sortOrder} />
      </div>
    </ListToolbar>
    {query.isError ? <ErrorState description={errorDescription(query.error)} onRetry={() => void query.refetch()} title="Could not load job postings" /> : <TableSurface><DataTable columns={[
      { key: "title", header: "Title", cell: (row: JobPosting) => <div><p className="font-medium">{row.title}</p><p className="text-xs text-muted-foreground">{row.location ?? "No location"}</p></div> },
      { key: "employmentType", header: "Employment type", cell: (row: JobPosting) => row.employmentType ?? "—" },
      { key: "level", header: "Level", cell: (row: JobPosting) => row.level ?? "—" },
      { key: "created", header: "Created", cell: (row: JobPosting) => formatDate(row.createdAt) },
      { key: "expires", header: "Expiry", cell: (row: JobPosting) => formatDate(row.expiresAt) },
      { key: "actions", header: "", cell: (row: JobPosting) => <div className="flex justify-end gap-1"><Button aria-label={`View ${row.title}`} onClick={(event) => { event.stopPropagation(); navigate(`${basePath(actor)}/${row.id}`); }} size="icon" variant="ghost"><Eye /></Button><Button aria-label={`Edit ${row.title}`} onClick={(event) => { event.stopPropagation(); navigate(`${basePath(actor)}/${row.id}/edit`); }} size="icon" variant="ghost"><Pencil /></Button><Button aria-label={`Delete ${row.title}`} onClick={(event) => { event.stopPropagation(); setPendingDelete(row); }} size="icon" variant="ghost"><Trash2 className="text-destructive" /></Button></div> },
    ]} emptyState={<EmptyState action={!search && actor === "recruiter" ? { label: "Create job posting", onClick: () => navigate(`${basePath(actor)}/create`) } : undefined} description={search ? "No postings match your search." : "Create your first job posting to get started."} title="No job postings" />} isLoading={query.isPending} onRowClick={(row) => navigate(`${basePath(actor)}/${row.id}`)} rowKey={(row) => row.id} rows={jobs} /></TableSurface>}
    {query.data && query.data.total > 0 ? <Pagination limit={limit} onLimitChange={(value) => set("limit", String(value))} onPageChange={(value) => set("page", String(value))} page={page} total={query.data.total} totalPages={query.data.totalPages} /> : null}
    {pendingDelete ? <ActionConfirmDialog action={deletion.isPending ? "Deleting…" : "Delete"} description="This permanently removes the job posting. This action cannot be undone." disabled={deletion.isPending} icon={Trash2} onConfirm={() => deletion.mutate(pendingDelete.id)} onOpenChange={(open) => !open && setPendingDelete(null)} open title={`Delete “${pendingDelete.title}”?`} variant="destructive-solid" /> : null}
  </div>;
}
