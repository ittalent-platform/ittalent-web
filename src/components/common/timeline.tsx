import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type TimelineTone = "error" | "info" | "neutral" | "orange" | "success" | "violet" | "warning";

export type TimelineEntry = {
  atIso: string;
  by?: string;
  label: string;
  message?: string;
  tone: TimelineTone;
};

const toneDotClass: Record<TimelineTone, string> = {
  error: "bg-(--status-error-fg)",
  info: "bg-(--status-info-fg)",
  neutral: "bg-(--status-neutral-fg)",
  success: "bg-(--status-success-fg)",
  warning: "bg-(--status-warning-fg)",
  orange: "bg-(--application-offered)",
  violet: "bg-(--application-interview)",
};

const DEFAULT_MAX_VISIBLE = 5;

function TimelineList({ entries, formatDate }: { entries: TimelineEntry[]; formatDate: (iso: string) => string }) {
  const { t } = useTranslation();
  const [messageEntry, setMessageEntry] = useState<TimelineEntry | null>(null);
  return (
    <><ul className="flex flex-col">
      {entries.map((entry, index) => (
        <li className="flex min-w-0 gap-3 pb-5 last:pb-0" key={`${entry.label}-${entry.atIso}-${index}`}>
          <div className="relative flex w-3 shrink-0 flex-col items-center">
            <span className={cn("z-10 mt-1 size-3 shrink-0 rounded-full", toneDotClass[entry.tone])} />
            {index < entries.length - 1 ? (
              <span className="absolute top-4 -bottom-5 left-1/2 w-px -translate-x-1/2 bg-border" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-2"><p className="line-clamp-2 min-w-0 flex-1 wrap-anywhere text-[13.5px] font-semibold text-foreground" title={entry.label}>{entry.label}</p>{entry.message ? <button aria-label={t("timeline.viewMessageFor", { label: entry.label })} className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setMessageEntry(entry)} title={t("timeline.viewMessage")} type="button"><MessageSquareText className="size-4" /></button> : null}</div>
            <p className="wrap-anywhere text-[13px] text-muted-foreground">
              {formatDate(entry.atIso)}
              {entry.by ? ` · ${t("timeline.by", { name: entry.by })}` : null}
            </p>
          </div>
        </li>
      ))}
    </ul>{messageEntry ? <Dialog onOpenChange={(open) => !open && setMessageEntry(null)} open><DialogContent className="max-w-[480px] gap-0"><DialogHeader><DialogTitle>{messageEntry.label}</DialogTitle></DialogHeader><p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap wrap-anywhere px-[26px] py-5 text-sm text-foreground">{messageEntry.message}</p></DialogContent></Dialog> : null}</>
  );
}

type TimelineProps = {
  entries: TimelineEntry[];
  formatDate: (iso: string) => string;
  /** Entries beyond this count collapse behind a "View all" link that opens the full history in a dialog. */
  maxVisible?: number;
  title: string;
};

export function Timeline({ entries, formatDate, maxVisible = DEFAULT_MAX_VISIBLE, title }: TimelineProps) {
  const { t } = useTranslation();
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);
  const hasMore = entries.length > maxVisible;
  const visibleEntries = hasMore ? entries.slice(0, maxVisible) : entries;

  return (
    <>
      <Card className="min-w-0 rounded-2xl border-border bg-card shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-2 p-5 pb-4">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <span className="itt-mono text-[11px] text-muted-foreground">{entries.length}</span>
        </CardHeader>
        <CardContent className="min-w-0 p-5 pt-0">
          <TimelineList entries={visibleEntries} formatDate={formatDate} />
          {hasMore ? (
            <button
              className="mt-4 text-[13px] font-semibold text-primary hover:underline"
              onClick={() => setIsFullHistoryOpen(true)}
              type="button"
            >
              {t("timeline.viewAll", { count: entries.length })}
            </button>
          ) : null}
        </CardContent>
      </Card>

      {hasMore ? (
        <Dialog onOpenChange={setIsFullHistoryOpen} open={isFullHistoryOpen}>
          <DialogContent className="max-w-[480px] gap-0">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto px-[26px] py-5">
              <TimelineList entries={entries} formatDate={formatDate} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
