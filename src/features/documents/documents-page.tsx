import { Download, Eye, FileText, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { requestErrorMessage } from "@/api/request-error";
import type { Document } from "@/api/generated/types.gen";
import { PageHeader } from "@/components/common/admin-page-header";
import { DataTable, TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ListToolbar } from "@/components/common/list-toolbar";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListParams } from "@/hooks/use-list-params";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TABS,
  MAX_DOCUMENT_MB,
  documentFileErrorKey,
} from "@/lib/document-files";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  ALL_DOCUMENTS,
  DOCUMENT_LIST_DEFAULT_LIMIT,
  DOCUMENT_LIST_PARAMS,
  DOCUMENT_SORT_ORDERS,
  DOCUMENT_TYPES,
} from "./documents.constants";
import {
  type DocumentType,
  useDocuments,
  useUploadDocument,
} from "./documents.queries";

function selectedValue<const T extends readonly string[]>(
  values: T,
  value: string | null,
): T[number] | undefined {
  return values.find((item) => item === value);
}

export function DocumentsPage() {
  const { t } = useTranslation();
  const { page, limit, search, debouncedSearch, set, setMany } = useListParams({
    defaultLimit: DOCUMENT_LIST_DEFAULT_LIMIT,
  });
  const [searchParams] = useSearchParams();
  const [uploadType, setUploadType] = useState<DocumentType>("cv");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const listType =
    selectedValue(
      DOCUMENT_TYPES,
      searchParams.get(DOCUMENT_LIST_PARAMS.type),
    ) ?? ALL_DOCUMENTS;
  const sortOrder =
    selectedValue(
      DOCUMENT_SORT_ORDERS,
      searchParams.get(DOCUMENT_LIST_PARAMS.sortOrder),
    ) ?? "desc";
  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const query = useDocuments({
    page,
    limit,
    sort_order: sortOrder,
    ...(listType === ALL_DOCUMENTS ? {} : { type: listType }),
  });
  const upload = useUploadDocument();
  const items = query.data?.items ?? [];
  const visibleItems = normalizedSearch
    ? items.filter((row) => {
        const haystack = `${row.fileName} ${row.type}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : items;

  const selectFile = (file?: File) => {
    if (!file || upload.isPending) return;
    const errorKey = documentFileErrorKey(file);
    if (errorKey) {
      toast.showToast({
        title: t("documents.invalidFile"),
        message: t(`documents.errors.${errorKey}`, {
          name: file.name,
          size: MAX_DOCUMENT_MB,
        }),
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
            message: requestErrorMessage(
              uploadError,
              t("documents.uploadFailedMessage"),
            ),
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

  function handleDownload(document: Document): void {
    const anchor = window.document.createElement("a");
    anchor.download = document.fileName;
    anchor.href = document.fileUrl;
    anchor.rel = "noreferrer";
    anchor.click();
  }

  function handlePreview(document: Document): void {
    const previewWindow = window.open(
      document.fileUrl,
      "_blank",
      "noopener,noreferrer",
    );
    if (!previewWindow) {
      toast.showToast({
        title: t("documents.previewFailedTitle"),
        message: t("documents.previewPopupBlocked"),
        tone: "error",
      });
      return;
    }
  }

  const hasFilters =
    search !== "" ||
    listType !== ALL_DOCUMENTS ||
    sortOrder !== "desc";
  const clearFilters = () =>
    setMany({
      search: null,
      [DOCUMENT_LIST_PARAMS.sortOrder]: null,
      [DOCUMENT_LIST_PARAMS.type]: null,
    });

  return (
    <main className="mx-auto flex w-full max-w-[1264px] flex-col gap-5 px-4 pb-12 pt-8 sm:px-6">
      <PageHeader
        description={t("documents.subtitle")}
        title={t("documents.title")}
      />
      <div
        className={cn(
          "rounded-2xl border border-dashed p-5 transition-colors",
          dragging
            ? "border-primary bg-primary/10"
            : "border-primary/40 bg-primary/5",
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
            <p className="text-[15px] font-semibold text-foreground">
              {t("documents.dropTitle")}
            </p>
            <p className="text-[13.5px] text-muted-foreground">
              {t("documents.dropHint", { size: MAX_DOCUMENT_MB })}
            </p>
          </div>
          <Select
            disabled={upload.isPending}
            onValueChange={(value) => setUploadType(value as DocumentType)}
            value={uploadType}
          >
            <SelectTrigger
              aria-label={t("documents.typeLabel")}
              className="h-11 w-auto min-w-40 bg-card text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cv">{t("documents.typeCv")}</SelectItem>
              <SelectItem value="cover_letter">
                {t("documents.typeCoverLetter")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="font-semibold" size="xl"
            disabled={upload.isPending}
            onClick={() => input.current?.click()}
            shape="pill"
            type="button"
          >
            {upload.isPending
              ? t("documents.uploading")
              : t("documents.browse")}
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

      <div
        aria-label={t("documents.typeLabel")}
        className="flex flex-wrap gap-2"
        role="group"
      >
        {DOCUMENT_TABS.map((value) => (
          <Button
            aria-pressed={listType === value}
            className="h-9 px-4 text-[13.5px] font-semibold"
            key={value}
            onClick={() =>
              setMany({
                page: "1",
                [DOCUMENT_LIST_PARAMS.type]:
                  value === ALL_DOCUMENTS ? null : value,
              })
            }
            shape="pill"
            type="button"
            variant={listType === value ? "default" : "outline"}
          >
            {t(`documents.tabs.${value}`)}
          </Button>
        ))}
      </div>

      <ListToolbar
        onSearchChange={(value) => set("search", value)}
        search={search}
        searchPlaceholder={t("documents.searchPlaceholder")}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            onChange={(value) => set(DOCUMENT_LIST_PARAMS.sortOrder, value)}
            options={DOCUMENT_SORT_ORDERS.map((value) => ({
              label: t(`documents.sort.${value}`),
              value,
            }))}
            placeholder={t("documents.sort.order")}
            value={sortOrder}
          />
          {hasFilters ? (
            <Button
              className="h-10 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
              type="button"
              variant="ghost"
            >
              {t("documents.clearFilters")}
            </Button>
          ) : null}
        </div>
      </ListToolbar>

      {query.isError ? (
        <ErrorState
          description={requestErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          title={t("documents.loadError")}
        />
      ) : (
        <TableSurface className="rounded-2xl">
          <DataTable<Document>
            columns={[
              {
                key: "name",
                header: t("documents.columns.name"),
                cell: (row) => (
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">
                      {row.fileName}
                    </span>
                  </span>
                ),
              },
              {
                key: "type",
                header: t("documents.columns.type"),
                cell: (row) =>
                  row.type === "cv"
                    ? t("documents.typeCv")
                    : t("documents.typeCoverLetter"),
              },
              {
                key: "created",
                header: t("documents.columns.uploaded"),
                cell: (row) => formatDate(row.createdAt),
              },
              {
                key: "actions",
                header: t("documents.columns.actions"),
                className: "text-right",
                cell: (row) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    <Button
                      aria-label={t("documents.preview", {
                        name: row.fileName,
                      })}
                      disabled={upload.isPending}
                      onClick={() => handlePreview(row)}
                      size="icon"
                      title={t("documents.preview", { name: row.fileName })}
                      variant="ghost"
                    >
                      <Eye />
                    </Button>
                    <Button
                      aria-label={t("documents.download", {
                        name: row.fileName,
                      })}
                      disabled={upload.isPending}
                      onClick={() => handleDownload(row)}
                      size="icon"
                      title={t("documents.download", { name: row.fileName })}
                      variant="ghost"
                    >
                      <Download />
                    </Button>
                  </div>
                ),
              },
            ]}
            emptyState={
              <EmptyState
                description={
                  hasFilters
                    ? t("documents.noMatchesHint")
                    : t("documents.emptyHint")
                }
                title={
                  hasFilters
                    ? t("documents.noMatchesTitle")
                    : t("documents.emptyTitle")
                }
              />
            }
            isLoading={query.isPending}
            rowKey={(row) => row.id}
            rows={visibleItems}
          />
        </TableSurface>
      )}
      {query.data && query.data.total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(value) =>
            setMany({ limit: String(value), page: "1" })
          }
          onPageChange={(value) => set("page", String(value))}
          page={page}
          total={query.data.total}
          totalPages={query.data.totalPages}
        />
      ) : null}
    </main>
  );
}
