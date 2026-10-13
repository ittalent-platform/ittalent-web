import { Download, Eye, FileText, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { requestErrorMessage } from "@/api/request-error";
import type { Document } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { DataTable, TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { useToast } from "@/components/toast/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/common/search-input";
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
  DOCUMENT_DEFAULT_SORT,
  DOCUMENT_LIST_DEFAULT_LIMIT,
  DOCUMENT_LIST_PARAMS,
  DOCUMENT_TYPES,
  OBJECT_URL_REVOKE_DELAY_MS,
} from "./documents.constants";
import {
  downloadDocument,
  previewDocument,
  type DocumentType,
  useDeleteDocument,
  useDocuments,
  useSetDefaultDocument,
  useUploadDocument,
} from "./documents.queries";

type BusyAction = "download" | "preview";

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
  const [pendingDelete, setPendingDelete] = useState<Document | null>(null);
  const [busyAction, setBusyAction] = useState<{
    action: BusyAction;
    id: string;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const listType =
    selectedValue(
      DOCUMENT_TYPES,
      searchParams.get(DOCUMENT_LIST_PARAMS.type),
    ) ?? ALL_DOCUMENTS;
  const normalizedSearch = debouncedSearch.trim();

  const query = useDocuments({
    page,
    limit,
    sort_by: DOCUMENT_DEFAULT_SORT.by,
    sort_order: DOCUMENT_DEFAULT_SORT.order,
    ...(normalizedSearch ? { search: normalizedSearch } : {}),
    ...(listType === ALL_DOCUMENTS ? {} : { type: listType }),
  });
  const upload = useUploadDocument();
  const deletion = useDeleteDocument();
  const setDefault = useSetDefaultDocument();

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

  async function handleDownload(document: Document): Promise<void> {
    setBusyAction({ action: "download", id: document.id });
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.download = document.fileName;
      anchor.href = url;
      anchor.click();
      window.setTimeout(
        () => URL.revokeObjectURL(url),
        OBJECT_URL_REVOKE_DELAY_MS,
      );
    } catch (error) {
      toast.showToast({
        title: t("documents.downloadFailedTitle"),
        message: requestErrorMessage(
          error,
          t("documents.downloadFailedMessage"),
        ),
        tone: "error",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePreview(document: Document): Promise<void> {
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      toast.showToast({
        title: t("documents.previewFailedTitle"),
        message: t("documents.previewPopupBlocked"),
        tone: "error",
      });
      return;
    }
    previewWindow.opener = null;
    setBusyAction({ action: "preview", id: document.id });
    try {
      const preview = await previewDocument(document.id);
      if (preview instanceof Blob) {
        const url = URL.createObjectURL(preview);
        previewWindow.addEventListener("beforeunload", () =>
          URL.revokeObjectURL(url),
        );
        previewWindow.location.replace(url);
      } else {
        const url = new URL(preview.previewUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:")
          throw new Error(t("documents.previewInvalidUrl"));
        previewWindow.location.replace(url.toString());
      }
    } catch (error) {
      previewWindow.close();
      toast.showToast({
        title: t("documents.previewFailedTitle"),
        message: requestErrorMessage(
          error,
          t("documents.previewFailedMessage"),
        ),
        tone: "error",
      });
    } finally {
      setBusyAction(null);
    }
  }

  const items = query.data?.items ?? [];
  const hasFilters = search !== "" || listType !== ALL_DOCUMENTS;
  return (
    <main className="flex w-full flex-col gap-5">
      <PageHeader
        actions={
          <SearchInput
            className="w-full sm:w-[20rem]"
            onChange={(value) => set("search", value)}
            placeholder={t("documents.searchPlaceholder")}
            value={search}
          />
        }
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
            className="h-11 px-[22px] text-sm font-semibold"
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
                    {row.isDefault ? (
                      <Badge variant="success">{t("documents.default")}</Badge>
                    ) : null}
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
                      disabled={Boolean(busyAction)}
                      onClick={() => void handlePreview(row)}
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
                      disabled={Boolean(busyAction)}
                      onClick={() => void handleDownload(row)}
                      size="icon"
                      title={t("documents.download", { name: row.fileName })}
                      variant="ghost"
                    >
                      <Download />
                    </Button>
                    {!row.isDefault ? (
                      <Button
                        aria-label={t("documents.setDefault", {
                          name: row.fileName,
                        })}
                        disabled={setDefault.isPending}
                        onClick={() =>
                          setDefault.mutate(row.id, {
                            onError: (error) =>
                              toast.showToast({
                                title: t("documents.defaultFailedTitle"),
                                message: requestErrorMessage(error),
                                tone: "error",
                              }),
                            onSuccess: () =>
                              toast.showToast({
                                title: t("documents.defaultDoneTitle"),
                                message: t("documents.defaultDoneMessage", {
                                  name: row.fileName,
                                }),
                                tone: "success",
                              }),
                          })
                        }
                        size="icon"
                        title={t("documents.setDefault", {
                          name: row.fileName,
                        })}
                        variant="ghost"
                      >
                        <Star />
                      </Button>
                    ) : null}
                    <Button
                      aria-label={t("documents.delete", { name: row.fileName })}
                      disabled={deletion.isPending}
                      onClick={() => setPendingDelete(row)}
                      size="icon"
                      title={t("documents.delete", { name: row.fileName })}
                      variant="ghost"
                    >
                      <Trash2 className="text-destructive" />
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
            rows={items}
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

      {pendingDelete ? (
        <ActionConfirmDialog
          action={
            deletion.isPending
              ? t("documents.deleting")
              : t("documents.confirmDelete")
          }
          description={t("documents.deleteDescription")}
          disabled={deletion.isPending}
          icon={Trash2}
          keepOpenOnConfirm
          onConfirm={() =>
            deletion.mutate(pendingDelete.id, {
              onError: (error) =>
                toast.showToast({
                  title: t("documents.deleteFailedTitle"),
                  message: requestErrorMessage(error),
                  tone: "error",
                }),
              onSuccess: () => {
                toast.showToast({
                  title: t("documents.deletedTitle"),
                  message: t("documents.deletedMessage", {
                    name: pendingDelete.fileName,
                  }),
                  tone: "success",
                });
                setPendingDelete(null);
              },
            })
          }
          onOpenChange={(open) => !open && setPendingDelete(null)}
          open
          title={t("documents.deleteTitle", {
            name: pendingDelete.fileName,
          })}
          variant="destructive-solid"
        />
      ) : null}
    </main>
  );
}
