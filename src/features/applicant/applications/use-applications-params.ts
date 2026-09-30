import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useListParams } from "@/hooks/use-list-params";
import type { ListParams } from "./applications.queries";
import {
  APPLICATION_STATUSES, DEFAULT_PAGE_SIZE, DEFAULT_SORT, DEFAULT_VIEW, JOB_ID_PATTERN, MAX_SEARCH_LENGTH, MS_PER_DAY, PAGE_SIZE_OPTIONS, PARAM, REVIEW_STAGES,
  SORT_FIELDS, STATUS_LIST_SEPARATOR, SUBMITTED_RANGES, SUBMITTED_RANGE_DAYS, VIEW_MODES,
  type ApplicationStatus, type ReviewStage, type SortField, type SortOrder, type SubmittedRange, type ViewMode,
} from "./applications.constants";

/** Keys of the validation messages the page can show (UC-MYAPP-05.EX.2 / EX.3). */
export type FilterErrors = Partial<Record<"keyword" | "range" | "filter", string>>;

export interface ApplicationsListState {
  page: number;
  limit: number;
  search: string;
  statuses: ApplicationStatus[];
  stage: ReviewStage | undefined;
  jobId: string | undefined;
  range: SubmittedRange;
  from: string;
  to: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  view: ViewMode;
  hasFilters: boolean;
  /** i18n keys (under applications.errors) for invalid criteria; while any is set nothing is fetched. */
  errors: FilterErrors;
  /** Query for the list endpoint (search is debounced so typing does not fire a request per key). */
  query: ListParams;
  set: (key: keyof typeof PARAM, value: string | null) => void;
  setMany: (patch: Partial<Record<keyof typeof PARAM, string | null>>) => void;
  clearFilters: () => void;
}

const DAY_START_SUFFIX = "T00:00:00.000Z";

/** URL-backed list state so links, reloads and the back button keep the filters, sort, page and view. */
export function useApplicationsParams(): ApplicationsListState {
  const list = useListParams({ defaultLimit: DEFAULT_PAGE_SIZE });
  const [params, setParams] = useSearchParams();

  const limit = PAGE_SIZE_OPTIONS.some((size) => size === list.limit) ? list.limit : DEFAULT_PAGE_SIZE;
  const rawStatus = params.get(PARAM.status) ?? "";
  const rawStatuses = rawStatus ? rawStatus.split(STATUS_LIST_SEPARATOR) : [];
  const statuses = rawStatuses.filter((value): value is ApplicationStatus => APPLICATION_STATUSES.some((status) => status === value));
  const stage = REVIEW_STAGES.find((value) => value === params.get(PARAM.stage));
  const rawJobId = params.get(PARAM.jobId) ?? "";
  const jobId = JOB_ID_PATTERN.test(rawJobId) ? rawJobId : undefined;
  const range = SUBMITTED_RANGES.find((value) => value === params.get(PARAM.range)) ?? "any";
  const from = params.get(PARAM.from) ?? "";
  const to = params.get(PARAM.to) ?? "";
  const sortBy = SORT_FIELDS.find((value) => value === params.get(PARAM.sortBy)) ?? DEFAULT_SORT.sortBy;
  const sortOrder: SortOrder = params.get(PARAM.sortOrder) === "asc" ? "asc" : DEFAULT_SORT.sortOrder;
  const view = VIEW_MODES.find((value) => value === params.get(PARAM.view)) ?? DEFAULT_VIEW;
  const statusFilter = statuses.join(STATUS_LIST_SEPARATOR);
  const searchTerm = list.debouncedSearch.trim();

  const errors: FilterErrors = {};
  if (list.search && !list.search.trim()) errors.keyword = "keywordBlank";
  else if (list.search.trim().length > MAX_SEARCH_LENGTH) errors.keyword = "keywordTooLong";
  if (range === "custom" && from && to && from > to) errors.range = "rangeContradictory";
  const unknownFilter = rawStatuses.some((value) => !APPLICATION_STATUSES.some((status) => status === value))
    || Boolean(params.get(PARAM.stage) && !stage) || Boolean(rawJobId && !jobId);
  if (unknownFilter) errors.filter = "filterUnsupported";

  const query = useMemo<ListParams>(() => {
    // Day granularity keeps the query key (and cache entry) stable while the page stays open.
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const presetFrom = range === "any" || range === "custom" ? undefined : new Date(startOfToday - SUBMITTED_RANGE_DAYS[range] * MS_PER_DAY).toISOString();
    const submittedFrom = range === "custom" && from ? `${from}${DAY_START_SUFFIX}` : presetFrom;
    const submittedTo = range === "custom" && to ? `${to}${DAY_START_SUFFIX}` : undefined;
    return {
      page: list.page, limit, sortBy, sortOrder,
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(stage ? { reviewStage: stage } : {}),
      ...(jobId ? { jobId } : {}),
      ...(submittedFrom ? { submittedFrom } : {}),
      ...(submittedTo ? { submittedTo } : {}),
    };
  }, [list.page, limit, sortBy, sortOrder, searchTerm, statusFilter, stage, jobId, range, from, to]);

  function setMany(patch: Partial<Record<keyof typeof PARAM, string | null>>) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value); else next.delete(key);
      }
      const keepsPage = Object.keys(patch).every((key) => key === PARAM.page || key === PARAM.view);
      if (!keepsPage && !(PARAM.page in patch)) next.delete(PARAM.page);
      return next;
    });
  }

  function clearFilters() {
    setParams((current) => {
      const next = new URLSearchParams();
      const currentView = current.get(PARAM.view);
      if (currentView) next.set(PARAM.view, currentView);
      return next;
    });
  }

  const hasFilters = Boolean(list.search.trim() || statuses.length || stage || jobId || range !== "any");
  return { page: list.page, limit, search: list.search, statuses, stage, jobId, range, from, to, sortBy, sortOrder, view, hasFilters, errors, query, set: list.set, setMany, clearFilters };
}
