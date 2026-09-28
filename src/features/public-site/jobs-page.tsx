import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  listPublicJobPostings,
  getApiErrorMessage,
} from "@/features/job-postings/job-postings.api";
import { useListParams } from "@/hooks/use-list-params";

export function JobsPage() {
  const { page, limit, search, set } = useListParams();
  const query = useQuery({
    queryKey: ["job-postings", "public", { page, limit, search }],
    queryFn: () =>
      listPublicJobPostings({
        page,
        limit,
        search: search || undefined,
        sort_by: "created_at",
        sort_order: "desc",
      }),
  });
  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-bold">Open positions</h1>
      <p className="mt-2 text-muted-foreground">
        Explore currently published opportunities.
      </p>
      <input
        aria-label="Search open positions"
        className="mt-6 h-10 w-full max-w-md rounded-md border border-input bg-transparent px-3 text-sm"
        onChange={(event) => set("search", event.target.value)}
        placeholder="Search roles or locations"
        value={search}
      />
      {query.isError ? (
        <div className="mt-6">
          <ErrorState
            description={getApiErrorMessage(query.error)}
            title="Could not load jobs"
          />
        </div>
      ) : query.isPending ? (
        <p className="mt-8 text-muted-foreground">Loading positions…</p>
      ) : query.data?.items.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {query.data.items.map((job) => (
            <article className="rounded-lg border bg-card p-5" key={job.id}>
              <p className="text-lg font-semibold">{job.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {[job.location, job.employmentType, job.level]
                  .filter(Boolean)
                  .join(" · ") || "Details available on request"}
              </p>
              <p className="mt-3 text-sm">
                {job.description?.slice(0, 180) ||
                  "See the full role details when applying."}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            description={
              search ? "Try another search." : "Please check back later."
            }
            title="No open positions"
          />
        </div>
      )}
      {query.data && query.data.total > 0 ? (
        <div className="mt-6">
          <Pagination
            limit={limit}
            onLimitChange={(value) => set("limit", String(value))}
            onPageChange={(value) => set("page", String(value))}
            page={page}
            total={query.data.total}
            totalPages={query.data.totalPages}
          />
        </div>
      ) : null}
      <p className="mt-8 text-sm text-muted-foreground">
        Administrator?{" "}
        <Link className="text-primary" to="/admin/job-postings">
          Manage job postings
        </Link>
        .
      </p>
    </main>
  );
}
