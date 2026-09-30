import type { DragEvent } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LogoTile } from "@/components/common/logo-tile";
import { cn } from "@/lib/utils";
import { ApplicationDocuments } from "./application-documents";
import { applicationDisplayId, formatDate, jobFacts } from "./application-formatters";
import { APPLICATIONS_PATH, STATUS_TONES, type ApplicationItem } from "./applications.constants";
import { ReapplyTag } from "./reapply-tag";

export interface ApplicationCardProps {
  application: ApplicationItem;
  locale: string;
  selected: boolean;
  dragging: boolean;
  onToggle: (id: string) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
}

/** Board card. Only withdrawable cards (Submitted / Under Review) are selectable and draggable. */
export function ApplicationCard({ application, locale, selected, dragging, onToggle, onDragStart, onDragEnd }: ApplicationCardProps) {
  const { t } = useTranslation();
  const displayId = applicationDisplayId(application.id);
  const tone = STATUS_TONES[application.status];
  const withdrawable = application.canWithdraw;

  return (
    <div
      className={cn("relative rounded-xl", withdrawable ? "cursor-grab" : "cursor-pointer", dragging && "opacity-40", selected && cn("ring-2", tone.ring))}
      draggable={withdrawable}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, application.id)}
      title={withdrawable ? t("applications.board.dragHint") : undefined}
    >
      <Link
        className={cn("flex flex-col gap-2.5 rounded-xl border border-border border-t-2 bg-card p-3.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40", tone.border)}
        to={`${APPLICATIONS_PATH}/${application.id}`}
      >
        <span className="itt-mono text-[11.5px] text-muted-foreground">{displayId}</span>
        <span className="flex items-center gap-2"><LogoTile name={application.job.companyName} size="sm" /><span className="text-[12.5px] font-semibold text-foreground/80">{application.job.companyName}</span></span>
        {application.reappliedFrom || application.reappliedAs ? <span className="flex"><ReapplyTag application={application} interactive={false} /></span> : null}
        <span className="text-sm font-semibold leading-snug">{application.job.title}</span>
        <span className="-mt-1.5 text-[12.5px] text-muted-foreground">{jobFacts(application.job)}</span>
        <span className="flex items-center justify-between gap-2">
          <ApplicationDocuments types={application.submittedDocuments} />
          <span className="shrink-0 text-xs text-slate-subtle">{formatDate(application.submittedAt, locale)}</span>
        </span>
      </Link>
      {withdrawable ? (
        <button
          aria-checked={selected}
          aria-label={t("applications.board.select", { id: displayId })}
          className={cn("absolute right-3 top-3 grid size-5 cursor-pointer place-items-center rounded-md border-[1.5px] p-0 text-white outline-none focus-visible:ring-2 focus-visible:ring-primary/40", selected ? cn("border-transparent", tone.dot) : "border-(--line-dashed) bg-card")}
          onClick={() => onToggle(application.id)}
          role="checkbox"
          type="button"
        >
          {selected ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : null}
        </button>
      ) : null}
    </div>
  );
}
