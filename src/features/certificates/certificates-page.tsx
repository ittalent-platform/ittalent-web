import { Award, Lock, Plus, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { CertificateLink } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { EmptyState } from "@/components/common/empty-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { SearchInput } from "@/components/common/search-input";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useListParams } from "@/hooks/use-list-params";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";

import { CertificateFormDialog } from "./certificate-form-dialog";
import { CertificateRow } from "./certificate-row";
import { CERTIFICATE_LIMITS, CERTIFICATES_PAGE_SIZE, NEW_CERTIFICATE_HIGHLIGHT_MS } from "./certificates.constants";
import { useCertificatesQuery, useDeleteCertificate, useUpdateCertificate } from "./certificates.queries";
import { HTTP_UNAUTHORIZED, HTTP_FORBIDDEN, HTTP_NOT_FOUND } from "@/api/http-status";
import type { RequestError } from "@/api/request-error";

type Dialog = { kind: "add" } | { kind: "edit"; certificate: CertificateLink } | { kind: "delete"; certificate: CertificateLink } | { kind: "conflict" } | null;


export function CertificatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { debouncedSearch, limit, page, search, set } = useListParams({ defaultLimit: CERTIFICATES_PAGE_SIZE });
  const commitSearch = useCallback((value: string) => set("search", value), [set]);
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);
  const searchTooLong = searchText.length > CERTIFICATE_LIMITS.search;
  const appliedSearch = debouncedSearch.trim().slice(0, CERTIFICATE_LIMITS.search);
  const query = useCertificatesQuery({ limit, page, ...(appliedSearch ? { search: appliedSearch } : {}) });
  const update = useUpdateCertificate();
  const remove = useDeleteCertificate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), NEW_CERTIFICATE_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // A page number past the end (an old link) falls back to the first page.
  const data = query.data;
  const pageGone = Boolean(data && page > 1 && data.items.length === 0 && data.total > 0);
  useEffect(() => {
    if (pageGone) set("page", null);
  }, [pageGone, set]);

  const toast = (message: string) => showToast({ message, title: message, tone: "success" });
  const close = () => setDialog(null);

  function handleMutationError(error: unknown, fallbackKey: string) {
    const { code, status } = error as RequestError;
    if (code === "VERSION_CONFLICT" || status === HTTP_NOT_FOUND) setDialog({ kind: "conflict" });
    else setActionError(t(fallbackKey));
  }

  async function toggleSuggested(certificate: CertificateLink, suggested: boolean) {
    setActionError(null);
    setSavingId(certificate.id);
    try {
      await update.mutateAsync({ body: { expectedVersion: certificate.version, suggested }, id: certificate.id });
      toast(t(suggested ? "certificates.toast.suggested" : "certificates.toast.unsuggested"));
    } catch (error) {
      handleMutationError(error, "certificates.errors.switchFailed");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDelete(certificate: CertificateLink) {
    setActionError(null);
    try {
      await remove.mutateAsync({ expectedVersion: certificate.version, id: certificate.id });
      close();
      toast(t("certificates.toast.deleted", { name: certificate.name }));
    } catch (error) {
      close();
      handleMutationError(error, "certificates.errors.deleteFailed");
    }
  }

  const status = (query.error as RequestError | null)?.status;
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) {
    return (
      <Shell>
        <EmptyState action={{ label: t("certificates.access.signIn"), onClick: () => navigate("/login") }} description={t("certificates.access.description")} icon={Lock} title={t("certificates.access.title")} />
      </Shell>
    );
  }

  const items = data?.items ?? [];
  const searching = Boolean(appliedSearch);
  const suggestedTotal = data?.suggestedTotal ?? 0;

  return (
    <Shell>
      <PageHeader
        actions={<Button className="h-11 px-5" onClick={() => setDialog({ kind: "add" })} shape="pill" type="button"><Plus aria-hidden className="size-4" />{t("certificates.add")}</Button>}
        title={t("certificates.title")}
      />

      {data && (data.total > 0 || searching) ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-[360px]">
            <SearchInput error={searchTooLong ? t("certificates.search.tooLong", { max: CERTIFICATE_LIMITS.search }) : undefined} onChange={setSearchText} placeholder={t("certificates.search.placeholder")} value={searchText} />
          </div>
          {suggestedTotal > 0 ? (
            <p className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
              <Send aria-hidden className="size-4" />
              <span><Trans components={{ b: <b className="font-semibold text-foreground" /> }} count={suggestedTotal} i18nKey="certificates.suggestedSummary" /></span>
            </p>
          ) : null}
        </div>
      ) : null}

      {searching && data && data.total > 0 ? (
        <p className="text-[13px] text-muted-foreground">
          {t("certificates.search.results", { count: data.total, term: appliedSearch })} ·{" "}
          <button className="font-semibold text-fg-link hover:underline" onClick={() => setSearchText("")} type="button">{t("certificates.search.clear")}</button>
        </p>
      ) : null}

      {actionError ? <InlineBanner tone="error">{actionError}</InlineBanner> : null}
      {pageGone ? <InlineBanner tone="info">{t("certificates.pageGone")}</InlineBanner> : null}

      {query.isLoading ? (
        <ul aria-busy className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-5" key={index}>
              <div className="flex flex-col gap-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-40" /></div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <Panel>
          <EmptyState action={{ label: t("certificates.errors.retry"), onClick: () => void query.refetch() }} description={t("certificates.errors.loadDescription")} icon={RefreshCw} title={t("certificates.errors.loadTitle")} />
        </Panel>
      ) : items.length === 0 && searching ? (
        <Panel>
          <EmptyState action={{ label: t("certificates.search.clear"), onClick: () => setSearchText(""), variant: "outline" }} description={t("certificates.search.noMatchDescription")} icon={Search} title={t("certificates.search.noMatch", { term: appliedSearch })} />
        </Panel>
      ) : items.length === 0 && !pageGone ? (
        <Panel>
          <EmptyState action={{ label: t("certificates.add"), onClick: () => setDialog({ kind: "add" }) }} description={t("certificates.empty.description")} icon={Award} title={t("certificates.empty.title")} />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((certificate) => (
            <CertificateRow
              certificate={certificate}
              highlighted={certificate.id === highlightId}
              key={certificate.id}
              onDelete={() => setDialog({ certificate, kind: "delete" })}
              onEdit={() => setDialog({ certificate, kind: "edit" })}
              onSuggestedChange={(next) => void toggleSuggested(certificate, next)}
              saving={savingId === certificate.id}
            />
          ))}
        </ul>
      )}

      {data && data.total > 0 ? (
        <Pagination limit={limit} onLimitChange={(next) => set("limit", String(next))} onPageChange={(next) => set("page", String(next))} page={page} total={data.total} totalPages={Math.max(1, data.totalPages)} />
      ) : null}

      {dialog?.kind === "add" || dialog?.kind === "edit" ? (
        <CertificateFormDialog
          certificate={dialog.kind === "edit" ? dialog.certificate : undefined}
          onConflict={() => setDialog({ kind: "conflict" })}
          onOpenChange={(open) => !open && close()}
          onSaved={(saved) => {
            const added = dialog.kind === "add";
            close();
            if (added) {
              setHighlightId(saved.id);
              set("page", null);
            }
            toast(t(added ? "certificates.toast.added" : "certificates.toast.saved", { name: saved.name }));
          }}
        />
      ) : null}

      <ActionConfirmDialog
        action={t("certificates.delete.confirm")}
        cancelLabel={t("certificates.delete.keep")}
        description={dialog?.kind === "delete" ? (
          <span className="flex flex-col gap-3">
            <span><Trans components={{ b: <b className="font-semibold text-foreground" /> }} i18nKey="certificates.delete.description" values={{ name: dialog.certificate.name }} /></span>
            {dialog.certificate.sentCount > 0 ? (
              <span className="flex gap-2 rounded-xl bg-muted px-3.5 py-3 text-[13px] text-foreground">
                <Send aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {t("certificates.delete.sentNote", { count: dialog.certificate.sentCount })}
              </span>
            ) : null}
          </span>
        ) : undefined}
        disabled={remove.isPending}
        icon={Trash2}
        keepOpenOnConfirm
        onConfirm={() => dialog?.kind === "delete" && void confirmDelete(dialog.certificate)}
        onOpenChange={(open) => !open && close()}
        open={dialog?.kind === "delete"}
        title={t("certificates.delete.title")}
        variant="destructive-solid"
      />

      <ActionConfirmDialog
        action={t("certificates.conflict.loadLatest")}
        cancelLabel={t("actions.cancel")}
        description={t("certificates.conflict.description")}
        icon={RefreshCw}
        onConfirm={() => { close(); void query.refetch(); }}
        onOpenChange={(open) => { if (!open) { close(); void query.refetch(); } }}
        open={dialog?.kind === "conflict"}
        title={t("certificates.conflict.title")}
        variant="warning-solid"
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-5">{children}</div>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card">{children}</div>;
}
