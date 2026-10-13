import { CalendarDays, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AdminPageHeader } from "@/components/common/admin-page-header";
import { ViewToggle } from "@/components/ui/view-toggle";

import type { InterviewView } from "./interviews.constants";

type InterviewsHeaderProps = {
  description?: ReactNode;
  onViewChange: (view: InterviewView) => void;
  view: InterviewView;
};

/** Title, how many interviews there are, and the switch between the table and the calendar. */
export function InterviewsHeader({ description, onViewChange, view }: InterviewsHeaderProps) {
  const { t } = useTranslation();

  return (
    <AdminPageHeader
      actions={
        <ViewToggle<InterviewView>
          onChange={onViewChange}
          options={[
            { icon: Table2, label: t("interviews.view.table"), value: "table" },
            { icon: CalendarDays, label: t("interviews.view.calendar"), value: "calendar" },
          ]}
          showLabels
          value={view}
        />
      }
      description={description}
      title={t("interviews.page.title")}
    />
  );
}
