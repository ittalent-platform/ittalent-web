import { ExternalLink, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";

import { requestErrorMessage } from "@/api/request-error";
import type { Document } from "@/api/generated/types.gen";
import { PageHeader } from "@/components/common/admin-page-header";
import { DataTable, TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/toast/toast-provider";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useListParams } from "@/hooks/use-list-params";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TABS,
  MAX_DOCUMENT_MB,
  documentFileErrorKey,
} from "@/lib/document-files";
import {
  type DocumentType,
  useDocuments,
  useUploadDocument,
} from "./documents.queries";

export function DocumentsPage() {
  const { t } = useTranslation();
  const { page, limit, set } = useListParams();
  const [uploadType, setUploadType] = useState<DocumentType>("cv");
  const [listType, setListType] = useState<DocumentType | "all">("all");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const query = useDocuments({
    page,
    limit,
    sort_order: "desc",
    ...(listType === "all" ? {} : { type: listType }),
  });
  const upload = useUploadDocument();
  const selectFile = (file?: File) => {
    if (!file || upload.isPending) return;
    const errorKey = documentFileErrorKey(file);
    if (errorKey) {
      toast.showToast({
        title: t("documents.invalidFile"),
        message: t(`documents.errors.${errorKey}`, { name: file.name, size: MAX_DOCUMENT_MB }),
        tone: "error",
      });
      return;
    }
    upload.mutate(
      { file, type: uploadType },
      {
        onSuccess: () => {
          toast.showToast({
            title: t("documents.uploadedTitle"),
            message: t("documents.uploadedMessage", { name: file.name }),
            tone: "success",
          });
        },
        onError: (uploadError) =>
          toast.showToast({
            title: t("documents.uploadFailedTitle"),
            message: requestErrorMessage(uploadError, t("documents.uploadFailedMessage")),
            tone: "error",
          }),
      },
    );
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };
  const items = query.data?.items ?? [];
  return (
    <main className="mx-auto flex w-full max-w-[1264px] flex-col gap-5 px-4 pb-12 pt-8 sm:px-6">
      <PageHeader description={t("documents.subtitle")} title={t("documents.title")} />
      <div
        className={cn(
          "rounded-2xl border border-dashed p-5 transition-colors",
          dragging ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5",
        )}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={onDrop}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-card text-primary">
            <Upload className="size-5" />
          </span>
          <div className="min-w-52 flex-1">
            <p className="text-[15px] font-semibold text-foreground">{t("documents.dropTitle")}</p>
            <p className="text-[13.5px] text-muted-foreground">
              {t("documents.dropHint", { size: MAX_DOCUMENT_MB })}
            </p>
          </div>
          <Select
            disabled={upload.isPending}
            onValueChange={(value) => setUploadType(value as DocumentType)}
            value={uploadType}
          >
            <SelectTrigger aria-label={t("documents.typeLabel")} className="h-11 w-auto min-w-40 bg-card text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cv">{t("documents.typeCv")}</SelectItem>
              <SelectItem value="cover_letter">{t("documents.typeCoverLetter")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="h-11 px-[22px] text-sm font-semibold"
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
            shape="pill"
            type="button"
          >
            {upload.isPending ? t("documents.uploading") : t("documents.browse")}
          </Button>
        </div>
      </div>
      <input
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={onChange}
        ref={input}
        type="file"
      />
      <div aria-label={t("documents.typeLabel")} className="flex flex-wrap gap-2" role="group">
        {DOCUMENT_TABS.map((value) => (
          <Button
            aria-pressed={listType === value}
            className="h-9 px-4 text-[13.5px] font-semibold"
            key={value}
            onClick={() => {
              setListType(value);
              set("page", "1");
            }}
            shape="pill"
            type="button"
            variant={listType === value ? "default" : "outline"}
          >
            {t(`documents.tabs.${value}`)}
          </Button>
        ))}
      </div>
      {query.isError ? (
        <ErrorState
          description={requestErrorMessage(query.error)}
          title={t("documents.loadError")}
        />
      ) : (
        <TableSurface className="rounded-2xl">
          <DataTable<Document>
            columns={[
              {
                key: "name",
                header: t("documents.columns.name"),
                cell: (row) => <span className="font-medium text-foreground">{row.fileName}</span>,
              },
              {
                key: "type",
                header: t("documents.columns.type"),
                cell: (row) => (row.type === "cv" ? t("documents.typeCv") : t("documents.typeCoverLetter")),
              },
              {
                key: "created",
                header: t("documents.columns.uploaded"),
                cell: (row) => formatDate(row.createdAt),
              },
              {
                key: "view",
                header: "",
                className: "text-right",
                cell: (row) => (
                  <a
                    aria-label={t("documents.open", { name: row.fileName })}
                    className="inline-flex items-center gap-1 text-sm font-medium text-fg-link hover:underline"
                    href={row.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("documents.view")} <ExternalLink className="size-3" />
                  </a>
                ),
              },
            ]}
            emptyState={
              <EmptyState
                description={t("documents.emptyHint")}
                title={t("documents.emptyTitle")}
              />
            }
            isLoading={query.isPending}
            rowKey={(row) => row.id}
            rows={items}
          />
        </TableSurface>
      )}
      {query.data && query.data.total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(value) => set("limit", String(value))}
          onPageChange={(value) => set("page", String(value))}
          page={page}
          total={query.data.total}
          totalPages={query.data.totalPages}
        />
      ) : null}
    </main>
  );
}
