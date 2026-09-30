import { useMemo, useState, type DragEvent } from "react";
import { Lock, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "./application-card";
import { APPLICATION_STATUSES, STATUS_TONES, WITHDRAW_TARGET_STATUS, type ApplicationItem, type ApplicationStatus } from "./applications.constants";

const DRAG_MIME = "text/plain";

export interface ApplicationsBoardProps {
  items: ApplicationItem[];
  counts: Record<ApplicationStatus, number>;
  locale: string;
  /** Opens the shared withdraw confirmation for these applications. */
  onWithdraw: (items: ApplicationItem[]) => void;
}

/** Read-only board (UC-MYAPP-01.AC.3): the one thing a candidate can do is withdraw, by drag or by ticking cards. */
export function ApplicationsBoard({ items, counts, locale, onWithdraw }: ApplicationsBoardProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  // Selection survives refetches only for cards that are still withdrawable.
  const selected = selectedIds.filter((id) => byId.get(id)?.canWithdraw);
  const dragging = draggingId !== null;

  function toggle(id: string) {
    setSelectedIds(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  }

  function requestWithdraw(ids: string[]) {
    const targets = ids.flatMap((id) => (byId.get(id)?.canWithdraw ? [byId.get(id)!] : []));
    if (targets.length) onWithdraw(targets);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, id: string) {
    event.dataTransfer.setData(DRAG_MIME, id);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }

  function endDrag() {
    setDraggingId(null);
    setOverColumn(null);
  }

  // Shared by the Withdrawn column and the floating drop target: only Withdrawn ever accepts a card.
  function allowWithdrawDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setOverColumn(WITHDRAW_TARGET_STATUS);
  }

  function dropToWithdraw(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData(DRAG_MIME) || draggingId;
    endDrag();
    if (id) requestWithdraw([id]);
  }

  return (
    <div className="flex flex-col gap-5">
      {selected.length ? (
        <div aria-label={t("applications.board.selectionBar")} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card py-2.5 pl-[18px] pr-3" role="region">
          <span className="text-[13.5px] font-semibold">{t("applications.board.selected", { count: selected.length })}</span>
          <div className="flex items-center gap-2">
            <Button className="h-9 px-3 text-[13px] font-semibold text-muted-foreground" onClick={() => setSelectedIds([])} variant="ghost">{t("applications.board.clear")}</Button>
            <Button className="h-9 gap-1.5 px-3.5 text-[13px] font-semibold" onClick={() => requestWithdraw(selected)} variant="destructive-outline"><Undo2 aria-hidden />{t("applications.board.withdraw")}</Button>
          </div>
        </div>
      ) : null}

      <div aria-label={t("applications.board.columns")} className="flex gap-2 overflow-x-auto pb-2">
        {APPLICATION_STATUSES.map((status) => {
          const tone = STATUS_TONES[status];
          const cards = items.filter((item) => item.status === status);
          const isDropTarget = dragging && status === WITHDRAW_TARGET_STATUS;
          const isOver = overColumn === status && isDropTarget;

          return (
            <section
              aria-label={t(`applications.status.${status}`)}
              className={cn("flex w-72 shrink-0 flex-col gap-3 rounded-2xl border-[1.5px] border-transparent p-2 transition-[opacity,background-color] duration-100", dragging && !isDropTarget && "opacity-45", isDropTarget && "bg-destructive/5", isOver && "border-destructive")}
              key={status}
              onDragLeave={(event) => { if (overColumn === status && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOverColumn(null); }}
              onDragOver={(event) => { if (isDropTarget) allowWithdrawDrop(event); }}
              onDrop={(event) => { if (isDropTarget) dropToWithdraw(event); }}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className={cn("size-2 rounded-full", tone.dot)} />
                <h2 className={cn("m-0 text-xs font-bold uppercase tracking-[0.07em]", tone.text)}>{t(`applications.status.${status}`)}</h2>
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground">{counts[status]}</span>
                {dragging && !isDropTarget ? <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-subtle"><Lock aria-hidden className="size-3" />{t("applications.board.companyOnly")}</span> : null}
              </div>
              {isDropTarget ? <div className={cn("flex h-14 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-destructive text-[12.5px] font-semibold text-destructive", isOver ? "bg-destructive/10" : "bg-destructive/5")}><Undo2 aria-hidden className="size-4" />{t("applications.board.dropToWithdraw")}</div> : null}
              {cards.map((application) => (
                <ApplicationCard application={application} dragging={draggingId === application.id} key={application.id} locale={locale} onDragEnd={endDrag} onDragStart={handleDragStart} onToggle={toggle} selected={selected.includes(application.id)} />
              ))}
              {cards.length === 0 && !isDropTarget ? <div className="rounded-[14px] border-[1.5px] border-dashed border-(--border-strong) p-[18px] text-center text-[12.5px] text-slate-subtle">{t("applications.board.emptyColumn")}</div> : null}
            </section>
          );
        })}
      </div>
      {dragging ? (
        // The Withdrawn column can be several screens away from the dragged card, so the same target floats in view.
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-(--z-overlay) flex justify-center">
          <div
            aria-label={t("applications.board.withdrawTarget")}
            className={cn("pointer-events-auto flex h-14 items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-destructive px-8 text-[13.5px] font-semibold text-destructive shadow-lg", overColumn === WITHDRAW_TARGET_STATUS ? "bg-(--status-error-bg)" : "bg-card")}
            onDragLeave={() => setOverColumn(null)}
            onDragOver={allowWithdrawDrop}
            onDrop={dropToWithdraw}
            role="region"
          >
            <Undo2 aria-hidden className="size-4" />{t("applications.board.dropToWithdraw")}
          </div>
        </div>
      ) : null}
      <p className="m-0 text-[12.5px] text-muted-foreground">{t("applications.board.hint")}</p>
    </div>
  );
}
