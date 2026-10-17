import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast/toast-provider";
import { formatShortDateTime } from "@/features/recruiter/applications/applications.format";
import {
  useCreateRecruiterNote,
  useRecruiterApplicationNotes,
} from "@/features/recruiter/applications/applications.queries";

export interface NoteItem {
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ApplicationInternalNotesProps {
  applicationId: string;
  initialNotes?: NoteItem[];
}

export function ApplicationInternalNotes({
  applicationId,
  initialNotes = [],
}: ApplicationInternalNotesProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [content, setContent] = useState("");

  const notesQuery = useRecruiterApplicationNotes(applicationId);
  const createMutation = useCreateRecruiterNote(applicationId);

  const notes: NoteItem[] = notesQuery.data?.items ?? initialNotes;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      showToast({
        tone: "error",
        title: t("common.error"),
        message: t("recruiterApplications.detail.noteValidationEmpty"),
      });
      return;
    }

    try {
      await createMutation.mutateAsync({ content: trimmed });
      setContent("");
      showToast({
        tone: "success",
        title: t("recruiterApplications.detail.internalNotesTitle"),
        message: t("recruiterApplications.detail.noteAddedSuccess"),
      });
    } catch {
      showToast({
        tone: "error",
        title: t("common.error"),
        message: t("recruiterApplications.statusDialog.genericError"),
      });
    }
  }

  return (
    <section
      aria-labelledby="internal-notes-heading"
      className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          id="internal-notes-heading"
        >
          {t("recruiterApplications.detail.internalNotesTitle")}
        </h2>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("recruiterApplications.detail.noNotes")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note, index) => (
            <div
              className="flex gap-2.5"
              key={`${note.authorId}-${note.createdAt}-${index}`}
            >
              <PersonAvatar
                className="size-7 shrink-0 rounded-full text-[10px] font-bold"
                name={note.authorName}
              />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs text-muted-foreground">
                  <b className="font-semibold text-foreground">{note.authorName}</b> ·{" "}
                  {formatShortDateTime(note.createdAt, i18n.language)}
                </span>
                <span className="text-sm leading-relaxed text-foreground break-words">
                  {note.content}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          className="h-10 text-sm"
          disabled={createMutation.isPending}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("recruiterApplications.detail.addNotePlaceholder")}
          value={content}
        />
        <Button
          className="h-10 px-4 font-semibold shrink-0"
          disabled={createMutation.isPending || !content.trim()}
          shape="default"
          type="submit"
          variant="outline"
        >
          {createMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            t("recruiterApplications.detail.addNote")
          )}
        </Button>
      </form>
    </section>
  );
}
