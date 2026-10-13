import { CalendarPlus, CalendarDays, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AdminPageHeader } from "@/components/common/admin-page-header";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ui/view-toggle";

import type { InterviewView } from "./interviews.constants";

type InterviewsHeaderProps = {
  description?: ReactNode;
  onSchedule: () => void;
  onViewChange: (view: InterviewView) => void;
  view: InterviewView;
};

/** Title, how many interviews there are, the switch between the table and the calendar, and Schedule interview. */
export function InterviewsHeader({ description, onSchedule, onViewChange, view }: InterviewsHeaderProps) {
  const { t } = useTranslation();

  return (
    <AdminPageHeader
      actions={
        <>
          <ViewToggle<InterviewView>
            onChange={onViewChange}
            options={[
              { icon: Table2, label: t("interviews.view.table"), value: "table" },
              { icon: CalendarDays, label: t("interviews.view.calendar"), value: "calendar" },
            ]}
            showLabels
            value={view}
          />
          <Button className="h-11 px-5 text-sm font-semibold" onClick={onSchedule} shape="pill" type="button">
            <CalendarPlus className="size-4" />
            {t("interviews.schedule.open")}
          </Button>
        </>
      }
      description={description}
      title={t("interviews.page.title")}
    />
  );
}
