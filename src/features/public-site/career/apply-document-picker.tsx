import { FileText, Upload } from "lucide-react";
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiV1Documents, postApiV1Documents } from "@/api/generated";
import { requestError, requestErrorMessage } from "@/api/request-error";
import type { Document } from "@/api/generated/types.gen";
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_MB,
  documentFileErrorKey,
} from "@/lib/document-files";

type DocumentKind = Document["type"];

const UPLOAD_FALLBACK = "We couldn't upload that file. Please try again.";
const fileErrors = (name: string) => ({
  format: `Only PDF, DOC and DOCX files are supported (.pdf, .doc, .docx). "${name}" can't be uploaded.`,
  empty: `"${name}" is empty. Choose a file that has content.`,
  size: `"${name}" is larger than ${MAX_DOCUMENT_MB} MB. Choose a smaller file.`,
});
const PICKER_LIST_LIMIT = 100;

type Props = {
  kind: DocumentKind;
  legend: string;
  /** Hint under the legend (e.g. "Required"). */
  hint?: string;
  emptyText: string;
  uploadLabel: string;
  value: string;
  onChange: (id: string) => void;
  onError: (message: string | null) => void;
  /** Adds a "No cover letter" style choice that clears the selection. */
  noneLabel?: string;
};

/** Radio list of the candidate's own documents of one kind, with an inline upload that selects the new file. */
export function ApplyDocumentPicker({
  emptyText,
  hint,
  kind,
  legend,
  noneLabel,
  onChange,
  onError,
  uploadLabel,
  value,
}: Props) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const docs = useQuery({
    queryKey: ["my-documents", kind],
    queryFn: async () => {
      const result = await getApiV1Documents({
        query: { type: kind, limit: PICKER_LIST_LIMIT, page: 1 },
      });
      if (result.error || !result.data) throw new Error("load-documents-failed");
      return result.data.items;
    },
  });
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const result = await postApiV1Documents({ body: { file, type: kind } });
      if (result.error || !result.data) throw requestError(result, UPLOAD_FALLBACK);
      return result.data;
    },
    onSuccess: async (doc) => {
      await queryClient.invalidateQueries({ queryKey: ["my-documents", kind] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onChange(doc.id);
    },
    onError: (error) => onError(requestErrorMessage(error, UPLOAD_FALLBACK)),
  });

  const pick = (file?: File) => {
    if (!file) return;
    const key = documentFileErrorKey(file);
    if (key) {
      onError(fileErrors(file.name)[key]);
      return;
    }
    onError(null);
    upload.mutate(file);
  };
  const list = docs.data ?? [];
  const row =
    "flex cursor-pointer items-center gap-2.5 rounded-xl border border-mkt-line px-3 py-2.5 text-[13.5px] has-[:checked]:border-mkt-accent has-[:checked]:bg-mkt-accent-tint";

  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="flex w-full items-baseline justify-between pb-1.5">
        <span className="text-[11.5px] font-bold tracking-[0.05em] text-mkt-label">{legend}</span>
        {hint ? <span className="text-xs text-mkt-muted">{hint}</span> : null}
      </legend>
      {docs.isLoading ? (
        <div className="h-10 animate-pulse rounded-xl bg-mkt-chip" />
      ) : docs.isError ? (
        <p className="m-0 text-[13px] text-mkt-danger">
          Couldn't load your documents.{" "}
          <button className="font-semibold underline" onClick={() => docs.refetch()} type="button">
            Retry
          </button>
        </p>
      ) : (
        <>
          {noneLabel ? (
            <label className={row}>
              <input checked={value === ""} name={kind} onChange={() => onChange("")} type="radio" />
              <span className="text-mkt-ink-2">{noneLabel}</span>
            </label>
          ) : null}
          {list.length === 0 && !noneLabel ? (
            <p className="m-0 text-[13px] text-mkt-muted">{emptyText}</p>
          ) : null}
          {list.map((doc) => (
            <label className={row} key={doc.id}>
              <input checked={value === doc.id} name={kind} onChange={() => onChange(doc.id)} type="radio" />
              <FileText aria-hidden="true" className="size-4 shrink-0 text-mkt-muted" />
              <span className="min-w-0 truncate">{doc.fileName}</span>
            </label>
          ))}
        </>
      )}
      <button
        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-mkt-accent-border bg-mkt-accent-tint text-[13.5px] font-semibold text-mkt-accent hover:bg-mkt-accent-soft disabled:opacity-60"
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
        type="button"
      >
        <Upload aria-hidden="true" className="size-4" />
        {upload.isPending ? "Uploading…" : uploadLabel}
      </button>
      <input
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={input}
        type="file"
      />
    </fieldset>
  );
}
