import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { DataTable, TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/toast/toast-provider";
import { formatDate } from "@/lib/format";
import {
  getApiErrorMessage,
  listDocuments,
  type CandidateDocument,
  type DocumentType,
  uploadDocument,
} from "@/features/job-postings/job-postings.api";
import { useListParams } from "@/hooks/use-list-params";

const documentKey = ["documents"] as const;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const maxBytes = 5 * 1024 * 1024;

function fileError(file: File) {
  if (!/\.(pdf|doc|docx)$/i.test(file.name) || !allowedMimeTypes.has(file.type))
    return "Choose a PDF, DOC, or DOCX file.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > maxBytes) return "The file cannot exceed 5 MB.";
  return null;
}

export function DocumentsPage() {
  const { page, limit, set } = useListParams();
  const [uploadType, setUploadType] = useState<DocumentType>("cv");
  const [listType, setListType] = useState<DocumentType | "all">("all");
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...documentKey, { page, limit, listType }],
    queryFn: () =>
      listDocuments({
        page,
        limit,
        sort_order: "desc",
        ...(listType === "all" ? {} : { type: listType }),
      }),
  });
  const upload = useMutation({
    mutationFn: ({
      file,
      type: documentType,
    }: {
      file: File;
      type: DocumentType;
    }) => uploadDocument(documentType, file),
    onSuccess: async (_, variables) => {
      await client.invalidateQueries({ queryKey: documentKey });
      toast.showToast({
        title: "Document uploaded",
        message: `${variables.file.name} is now available in your documents.`,
        tone: "success",
      });
    },
    onError: (error) =>
      toast.showToast({
        title: "Could not upload document",
        message: getApiErrorMessage(
          error,
          "The document could not be uploaded.",
        ),
        tone: "error",
      }),
  });
  const selectFile = (file?: File) => {
    if (!file || upload.isPending) return;
    const error = fileError(file);
    if (error) {
      toast.showToast({ title: "Invalid file", message: error, tone: "error" });
      return;
    }
    upload.mutate({ file, type: uploadType });
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  };
  const items = query.data?.items ?? [];
  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold">My documents</h1>
      <p className="mt-2 text-muted-foreground">
        Upload CVs and cover letters. Files are stored securely by the platform.
      </p>
      <div
        className="mt-6 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Upload className="text-primary" />
          <div className="min-w-52 flex-1">
            <p className="font-medium">Drag and drop a document here</p>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX · maximum 5 MB
            </p>
          </div>
          <select
            aria-label="Document type"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            disabled={upload.isPending}
            onChange={(event) =>
              setUploadType(event.target.value as DocumentType)
            }
            value={uploadType}
          >
            <option value="cv">CV</option>
            <option value="cover_letter">Cover letter</option>
          </select>
          <Button
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
            type="button"
          >
            {upload.isPending ? "Uploading…" : "Browse files"}
          </Button>
        </div>
      </div>
      <input
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onChange}
        ref={input}
        type="file"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "All documents"],
            ["cv", "CVs"],
            ["cover_letter", "Cover letters"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            onClick={() => {
              setListType(value);
              set("page", "1");
            }}
            type="button"
            variant={listType === value ? "default" : "outline"}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="mt-6">
        {query.isError ? (
          <ErrorState
            description={getApiErrorMessage(query.error)}
            title="Could not load documents"
          />
        ) : (
          <TableSurface>
            <DataTable<CandidateDocument>
              columns={[
                {
                  key: "name",
                  header: "Document",
                  cell: (row) => row.fileName,
                },
                {
                  key: "type",
                  header: "Type",
                  cell: (row) => (row.type === "cv" ? "CV" : "Cover letter"),
                },
                {
                  key: "created",
                  header: "Uploaded",
                  cell: (row) => formatDate(row.createdAt),
                },
                {
                  key: "view",
                  header: "",
                  cell: (row) => (
                    <a
                      aria-label={`Open ${row.fileName}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      href={row.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View <ExternalLink className="size-3" />
                    </a>
                  ),
                },
              ]}
              emptyState={
                <EmptyState
                  description="Upload a CV or cover letter to see it here."
                  title="No documents yet"
                />
              }
              isLoading={query.isPending}
              rowKey={(row) => row.id}
              rows={items}
            />
          </TableSurface>
        )}
      </div>
      {query.data && query.data.total > 0 ? (
        <div className="mt-6">
          <Pagination
            limit={limit}
            onLimitChange={(value) => set("limit", String(value))}
            onPageChange={(value) => set("page", String(value))}
            page={page}
            total={query.data.total}
            totalPages={query.data.totalPages}
          />
        </div>
      ) : null}
    </main>
  );
}
