import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useListParams } from "@/hooks/use-list-params";
import type { RecruiterApplicationsListParams } from "./applications.queries";
import {
  APPLICATION_STATUSES,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  DOCUMENT_TYPES,
  JOB_ID_PATTERN,
  MAX_SEARCH_LENGTH,
  MS_PER_DAY,
  PAGE_SIZE_OPTIONS,
  PARAM,
  SORT_FIELDS,
  STATUS_LIST_SEPARATOR,
  SUBMITTED_RANGES,
  SUBMITTED_RANGE_DAYS,
  VIEW_MODES,
  type ApplicationStatus,
  type RecruiterDocumentType,
  type SortField,
  type SortOrder,
  type SubmittedRange,
  type ViewMode,
} from "./applications.constants";

export type FilterErrors = Partial<Record<"keyword" | "range" | "filter", string>>;

export interface RecruiterApplicationsListState {
  page: number;
  limit: number;
  search: string;
  statuses: ApplicationStatus[];
  jobId: string | undefined;
  documentType: RecruiterDocumentType | undefined;
  range: SubmittedRange;
  from: string;
  to: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  view: ViewMode;
  hasFilters: boolean;
  errors: FilterErrors;
  query: RecruiterApplicationsListParams;
  set: (key: keyof typeof PARAM, value: string | null) => void;
  setMany: (patch: Partial<Record<keyof typeof PARAM, string | null>>) => void;
  clearFilters: () => void;
}

const DAY_START_SUFFIX = "T00:00:00.000Z";

/**
 * URL-backed state for recruiter applications list/board.
 * Ensures filters, sorting, search, pagination, and view mode remain synchronized with the URL.
 */
export function useApplicationsParams(): RecruiterApplicationsListState {
  const list = useListParams({ defaultLimit: DEFAULT_PAGE_SIZE });
  const [params, setParams] = useSearchParams();

  const limit = PAGE_SIZE_OPTIONS.some((size) => size === list.limit) ? list.limit : DEFAULT_PAGE_SIZE;
  const rawStatus = params.get(PARAM.status) ?? "";
  const rawStatuses = rawStatus ? rawStatus.split(STATUS_LIST_SEPARATOR) : [];
  const statuses = rawStatuses.filter((value): value is ApplicationStatus =>
    APPLICATION_STATUSES.some((status) => status === value),
  );

  const rawJobId = params.get(PARAM.jobId) ?? "";
  const jobId = JOB_ID_PATTERN.test(rawJobId) ? rawJobId : undefined;

  const rawDocType = params.get(PARAM.documentType) ?? "";
  const documentType = DOCUMENT_TYPES.find((dt) => dt === rawDocType);

  const range = SUBMITTED_RANGES.find((value) => value === params.get(PARAM.range)) ?? "any";
  const from = params.get(PARAM.from) ?? "";
  const to = params.get(PARAM.to) ?? "";

  const sortBy = SORT_FIELDS.find((value) => value === params.get(PARAM.sortBy)) ?? DEFAULT_SORT.sortBy;
  const sortOrder: SortOrder = params.get(PARAM.sortOrder) === "asc" ? "asc" : DEFAULT_SORT.sortOrder;
  const view = VIEW_MODES.find((value) => value === params.get(PARAM.view)) ?? DEFAULT_VIEW;

  const statusFilter = statuses.join(STATUS_LIST_SEPARATOR);
  const searchTerm = list.debouncedSearch.trim();

  const errors: FilterErrors = {};
  if (list.search && !list.search.trim()) {
    errors.keyword = "keywordBlank";
  } else if (list.search.trim().length > MAX_SEARCH_LENGTH) {
    errors.keyword = "keywordTooLong";
  }

  if (range === "custom" && from && to && from > to) {
    errors.range = "rangeContradictory";
  }

  const unknownFilter =
    rawStatuses.some((value) => !APPLICATION_STATUSES.some((status) => status === value)) ||
    Boolean(rawJobId && !jobId) ||
    Boolean(rawDocType && !documentType);

  if (unknownFilter) {
    errors.filter = "filterUnsupported";
  }

  const query = useMemo<RecruiterApplicationsListParams>(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const presetFrom =
      range === "any" || range === "custom"
        ? undefined
        : new Date(startOfToday - SUBMITTED_RANGE_DAYS[range] * MS_PER_DAY).toISOString();
    const submittedFrom = range === "custom" && from ? `${from}${DAY_START_SUFFIX}` : presetFrom;
    const submittedTo = range === "custom" && to ? `${to}${DAY_START_SUFFIX}` : undefined;

    const effectiveLimit = view === "board" ? 100 : limit;

    return {
      page: view === "board" ? 1 : list.page,
      limit: effectiveLimit,
      sortBy,
      sortOrder,
      ...(searchTerm ? { search: searchTerm } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(jobId ? { jobId } : {}),
      ...(documentType ? { documentType } : {}),
      ...(submittedFrom ? { submittedFrom } : {}),
      ...(submittedTo ? { submittedTo } : {}),
    };
  }, [view, list.page, limit, sortBy, sortOrder, searchTerm, statusFilter, jobId, documentType, range, from, to]);

  function setMany(patch: Partial<Record<keyof typeof PARAM, string | null>>) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const keepsPage = Object.keys(patch).every((key) => key === PARAM.page || key === PARAM.view);
      if (!keepsPage && !(PARAM.page in patch)) {
        next.delete(PARAM.page);
      }
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

  const hasFilters = Boolean(
    list.search.trim() || statuses.length || jobId || documentType || range !== "any",
  );

  return {
    page: list.page,
    limit,
    search: list.search,
    statuses,
    jobId,
    documentType,
    range,
    from,
    to,
    sortBy,
    sortOrder,
    view,
    hasFilters,
    errors,
    query,
    set: list.set,
    setMany,
    clearFilters,
  };
}
