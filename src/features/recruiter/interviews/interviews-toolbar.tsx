import { useTranslation } from "react-i18next";

import { ListToolbar } from "@/components/common/list-toolbar";
import { prefixedFilterTrigger } from "@/components/common/prefixed-filter-trigger";
import { FilterSelect } from "@/components/ui/filter-select";

import {
  ALL_OPTION,
  INTERVIEW_DATE_FILTERS,
  INTERVIEW_SEARCH_MAX_LENGTH,
  INTERVIEW_STATUSES,
  type InterviewDateFilter,
  type InterviewStatus,
} from "./interviews.constants";

type InterviewsToolbarProps = {
  date: InterviewDateFilter | typeof ALL_OPTION;
  onDateChange: (date: InterviewDateFilter | typeof ALL_OPTION) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: InterviewStatus | typeof ALL_OPTION) => void;
  search: string;
  searchError?: string | undefined;
  status: InterviewStatus | typeof ALL_OPTION;
};

export function InterviewsToolbar({ date, onDateChange, onSearchChange, onStatusChange, search, searchError, status }: InterviewsToolbarProps) {
  const { t } = useTranslation();
  const all = t("interviews.toolbar.all");

  return (
    <ListToolbar
      onSearchChange={onSearchChange}
      search={search}
      searchError={searchError}
      searchMaxLength={INTERVIEW_SEARCH_MAX_LENGTH}
      searchPlaceholder={t("interviews.toolbar.search")}
    >
      <FilterSelect
        onChange={onStatusChange}
        options={[{ label: all, value: ALL_OPTION }, ...INTERVIEW_STATUSES.map((value) => ({ label: t(`interviews.status.${value}`), value }))]}
        renderTrigger={prefixedFilterTrigger(`${t("interviews.toolbar.status")}:`)}
        value={status}
      />
      <FilterSelect
        onChange={onDateChange}
        options={[{ label: all, value: ALL_OPTION }, ...INTERVIEW_DATE_FILTERS.map((value) => ({ label: t(`interviews.dateFilter.${value}`), value }))]}
        renderTrigger={prefixedFilterTrigger(`${t("interviews.toolbar.date")}:`)}
        value={date}
      />
    </ListToolbar>
  );
}
