import { useMemo, useState, type DragEvent } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { ApplicationKanbanCard } from "./application-kanban-card";
import {
  KANBAN_COLUMNS,
  STATUS_TONES,
  isTransitionPermitted,
  type ApplicationItem,
  type ApplicationStatus,
} from "./applications.constants";

const DRAG_MIME = "text/plain";

export interface ApplicationsBoardProps {
  items: ApplicationItem[];
  statusCounts?: Record<ApplicationStatus, number>;
  locale: string;
  onStatusChange?: (item: ApplicationItem, nextStatus: ApplicationStatus) => void;
  onOpenCv?: (item: ApplicationItem) => void;
  onOpenCoverLetter?: (item: ApplicationItem) => void;
}

export function ApplicationsBoard({
  items,
  statusCounts,
  locale,
  onStatusChange,
  onOpenCv,
  onOpenCoverLetter,
}: ApplicationsBoardProps) {
  const { t } = useTranslation();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const draggingItem = draggingId ? byId.get(draggingId) ?? null : null;
  const isDragging = draggingItem !== null;

  const cardsByStatus = useMemo(() => {
    const grouped: Record<ApplicationStatus, ApplicationItem[]> = {
      submitted: [],
      under_review: [],
      interviewing: [],
      offered: [],
      hired: [],
      rejected: [],
      withdrawn: [],
      position_filled: [],
    };
    for (const item of items) {
      if (grouped[item.status]) {
        grouped[item.status].push(item);
      }
    }
    return grouped;
  }, [items]);

  function handleDragStart(event: DragEvent<HTMLDivElement>, item: ApplicationItem) {
    event.dataTransfer.setData(DRAG_MIME, item.id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(item.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverColumn(null);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, targetStatus: ApplicationStatus) {
    if (!draggingItem) return;
    const isAllowed = isTransitionPermitted(draggingItem.status, targetStatus);
    if (!isAllowed) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overColumn !== targetStatus) {
      setOverColumn(targetStatus);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLElement>, targetStatus: ApplicationStatus) {
    if (
      overColumn === targetStatus &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    ) {
      setOverColumn(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetStatus: ApplicationStatus) {
    event.preventDefault();
    const id = event.dataTransfer.getData(DRAG_MIME) || draggingId;
    const item = id ? byId.get(id) ?? draggingItem : draggingItem;
    handleDragEnd();

    if (item && isTransitionPermitted(item.status, targetStatus)) {
      onStatusChange?.(item, targetStatus);
    }
  }

  return (
    <div
      aria-label={t("recruiterApplications.view.board")}
      className="flex gap-3 overflow-x-auto pb-4 items-start select-none"
    >
      {KANBAN_COLUMNS.map((status) => {
        const tone = STATUS_TONES[status];
        const cards = cardsByStatus[status] || [];
        const count = statusCounts ? statusCounts[status] ?? cards.length : cards.length;

        const isCurrentColumn = draggingItem?.status === status;
        const isDropTarget = isDragging && !isCurrentColumn && isTransitionPermitted(draggingItem.status, status);
        const isIneligible = isDragging && !isCurrentColumn && !isDropTarget;
        const isHoveredTarget = overColumn === status && isDropTarget;

        return (
          <section
            aria-label={t(`applications.status.${status}`)}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-2.5 rounded-2xl border-[1.5px] border-transparent bg-muted/40 p-2.5 transition-[opacity,background-color,border-color] duration-150 dark:bg-muted/20 min-h-[480px]",
              isIneligible && "opacity-40",
              isDropTarget && "border-dashed border-primary/40 bg-primary/5",
              isHoveredTarget && "border-primary bg-primary/10 shadow-sm",
            )}
            key={status}
            onDragLeave={(e) => handleDragLeave(e, status)}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center gap-2 px-1 py-0.5">
              <span aria-hidden className={cn("size-2 rounded-full", tone.dot)} />
              <h2 className={cn("m-0 text-xs font-bold uppercase tracking-wider", tone.text)}>
                {t(`applications.status.${status}`)}
              </h2>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground">
                {count}
              </span>
              {isIneligible ? (
                <span
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
                  title={t("recruiterApplications.board.stageLocked")}
                >
                  <Lock aria-hidden className="size-3" />
                </span>
              ) : null}
            </div>

            {isDropTarget ? (
              <div
                className={cn(
                  "flex h-14 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed text-[12.5px] font-semibold transition-colors duration-150",
                  isHoveredTarget
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/50 bg-primary/5 text-primary",
                )}
              >
                <ArrowRight aria-hidden className="size-4" />
                <span>
                  {t("recruiterApplications.board.dropToMove", {
                    stage: t(`applications.status.${status}`),
                  })}
                </span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5">
              {cards.map((application) => (
                <ApplicationKanbanCard
                  application={application}
                  isDragging={draggingId === application.id}
                  key={application.id}
                  locale={locale}
                  onDragEnd={handleDragEnd}
                  onDragStart={handleDragStart}
                  onOpenCoverLetter={onOpenCoverLetter}
                  onOpenCv={onOpenCv}
                />
              ))}

              {cards.length === 0 && !isDropTarget ? (
                <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  {t("recruiterApplications.board.noStageCards")}
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
