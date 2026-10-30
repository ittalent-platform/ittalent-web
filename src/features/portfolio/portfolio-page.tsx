import { FileX, LayoutGrid, Lock, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "@/api/http-status";
import type { RequestError } from "@/api/request-error";
import type { PortfolioLink } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { PageHeader } from "@/components/common/admin-page-header";
import { Callout } from "@/components/common/callout";
import { EmptyState } from "@/components/common/empty-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { SearchInput } from "@/components/common/search-input";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useListParams } from "@/hooks/use-list-params";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";

import { PortfolioFormDialog } from "./portfolio-form-dialog";
import { PortfolioRow } from "./portfolio-row";
import { NEW_PORTFOLIO_HIGHLIGHT_MS, PORTFOLIO_LIMITS, PORTFOLIO_PAGE_SIZE } from "./portfolio.constants";
import { useDeletePortfolioItem, usePortfolioQuery } from "./portfolio.queries";

/** What the user was doing when the item turned out to be stale: the 409 copy differs per action. */
type StaleAction = "delete" | "edit";
type Dialog =
  | { kind: "add" }
  | { kind: "edit"; item: PortfolioLink }
  | { kind: "delete"; item: PortfolioLink }
  | { kind: "conflict"; action: StaleAction }
  | { kind: "missing" }
  | null;

export function PortfolioPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { debouncedSearch, limit, page, search, set } = useListParams({ defaultLimit: PORTFOLIO_PAGE_SIZE });
  const commitSearch = useCallback((value: string) => set("search", value), [set]);
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);
  // A keyword over the limit is never sent: the list stays as it was until the text is valid again (UC-S4-PORT-06 E2).
  const searchTooLong = searchText.trim().length > PORTFOLIO_LIMITS.search;
  const keyword = debouncedSearch.trim();
  const keywordValid = keyword.length <= PORTFOLIO_LIMITS.search;
  const appliedKeyword = keywordValid ? keyword : "";
  const query = usePortfolioQuery({ limit, page, ...(appliedKeyword ? { keyword: appliedKeyword } : {}) }, keywordValid);
  const remove = useDeletePortfolioItem();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), NEW_PORTFOLIO_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // A page number past the end (an old link) falls back to the first page, and says so until the user pages or searches.
  const data = query.data;
  const pageGone = Boolean(data && page > 1 && data.items.length === 0 && data.total > 0);
  const [goneFrom, setGoneFrom] = useState<number | null>(null);
  if (pageGone && goneFrom !== page) setGoneFrom(page);
  else if (goneFrom !== null && !pageGone && (page > 1 || keyword)) setGoneFrom(null);
  useEffect(() => {
    if (pageGone) set("page", null);
  }, [pageGone, set]);

  const toast = (message: string) => showToast({ message, title: message, tone: "success" });
  const close = () => setDialog(null);
  // The 409 dialog derives its copy from `dialog`, which close() clears: keep the last one so the exit animation doesn't blink empty.
  const conflictNow = dialog?.kind === "conflict" ? dialog : null;
  const [lastConflict, setLastConflict] = useState(conflictNow);
  if (conflictNow && conflictNow !== lastConflict) setLastConflict(conflictNow);
  const conflict = conflictNow ?? lastConflict;

  // The item is gone (deleted elsewhere): say so, and show the list as it is now.
  function showMissing() {
    setDialog({ kind: "missing" });
    void query.refetch();
  }

  async function confirmDelete(item: PortfolioLink) {
    setActionError(null);
    try {
      await remove.mutateAsync({ expectedVersion: item.version, id: item.id });
      close();
      // Deleting the last item of a later page leaves that page empty: step back instead of showing "page doesn't exist".
      if (items.length === 1 && page > 1) set("page", String(page - 1));
      toast(t("portfolio.toast.deleted"));
    } catch (error) {
      const { code, status } = error as RequestError;
      close();
      if (code === "VERSION_CONFLICT") setDialog({ action: "delete", kind: "conflict" });
      else if (status === HTTP_NOT_FOUND) showMissing();
      else setActionError(t("portfolio.errors.deleteFailed"));
    }
  }

  const status = (query.error as RequestError | null)?.status;
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) {
    return (
      <Shell>
        <EmptyState action={{ label: t("portfolio.access.signIn"), onClick: () => navigate("/login") }} description={t("portfolio.access.description")} icon={Lock} title={t("portfolio.access.title")} />
      </Shell>
    );
  }

  const items = data?.items ?? [];
  const searching = Boolean(appliedKeyword);
  // Only a list that has never had anything in it hides the search box.
  const showSearch = Boolean(data) && !(data?.total === 0 && !searchText && !keyword && !query.isPlaceholderData);

  return (
    <Shell>
      <PageHeader
        actions={<Button size="xl" onClick={() => setDialog({ kind: "add" })} shape="pill" type="button"><Plus aria-hidden className="size-4" />{t("portfolio.add")}</Button>}
        title={t("portfolio.title")}
      />

      {showSearch ? (
        <div className="w-full max-w-[360px]">
          <SearchInput error={searchTooLong ? t("portfolio.search.tooLong", { max: PORTFOLIO_LIMITS.search }) : undefined} onChange={setSearchText} placeholder={t("portfolio.search.placeholder")} value={searchText} />
        </div>
      ) : null}

      {searching && data && data.total > 0 ? (
        <p className="text-[13px] text-muted-foreground">
          {t("portfolio.search.results", { count: data.total, term: appliedKeyword })} ·{" "}
          <button className="font-semibold text-fg-link hover:underline" onClick={() => setSearchText("")} type="button">{t("portfolio.search.clear")}</button>
        </p>
      ) : null}

      {actionError ? <InlineBanner tone="error">{actionError}</InlineBanner> : null}
      {goneFrom !== null ? <Callout role="status" title={t("portfolio.pageGone.title")} tone="info">{t("portfolio.pageGone.description")}</Callout> : null}

      {query.isLoading ? (
        <ul aria-busy className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li className="flex gap-4 surface-card px-5 py-[18px]" key={index}>
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex flex-col gap-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-40" /></div>
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <Panel>
          <EmptyState action={{ label: t("portfolio.errors.retry"), onClick: () => void query.refetch() }} description={t("portfolio.errors.loadDescription")} icon={RefreshCw} title={t("portfolio.errors.loadTitle")} />
        </Panel>
      ) : items.length === 0 && searching ? (
        <Panel>
          <EmptyState action={{ label: t("portfolio.search.clear"), onClick: () => setSearchText(""), variant: "outline" }} description={t("portfolio.search.noMatchDescription")} title={t("portfolio.search.noMatch", { term: appliedKeyword })} />
        </Panel>
      ) : items.length === 0 && !pageGone ? (
        <Panel>
          <EmptyState action={{ label: t("portfolio.add"), onClick: () => setDialog({ kind: "add" }) }} description={t("portfolio.empty.description")} icon={LayoutGrid} title={t("portfolio.empty.title")} />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <PortfolioRow highlighted={item.id === highlightId} item={item} key={item.id} onDelete={() => setDialog({ item, kind: "delete" })} onEdit={() => setDialog({ item, kind: "edit" })} />
          ))}
        </ul>
      )}

      {data && data.total > 0 ? (
        <Pagination limit={limit} onPageChange={(next) => set("page", String(next))} page={page} total={data.total} totalPages={Math.max(1, data.totalPages)} />
      ) : null}

      {dialog?.kind === "add" || dialog?.kind === "edit" ? (
        <PortfolioFormDialog
          item={dialog.kind === "edit" ? dialog.item : undefined}
          onConflict={() => setDialog({ action: "edit", kind: "conflict" })}
          onMissing={showMissing}
          onOpenChange={(open) => !open && close()}
          onSaved={(saved) => {
            const added = dialog.kind === "add";
            close();
            if (added) {
              setHighlightId(saved.id);
              setSearchText("");
              set("page", null);
            }
            toast(t(added ? "portfolio.toast.added" : "portfolio.toast.saved"));
          }}
        />
      ) : null}

      <ActionConfirmDialog
        action={t("portfolio.delete.confirm")}
        cancelLabel={t("portfolio.delete.keep")}
        description={dialog?.kind === "delete" ? (
          <span className="flex flex-col gap-3">
            <span><Trans components={{ b: <b className="font-semibold text-foreground" /> }} i18nKey="portfolio.delete.description" values={{ name: dialog.item.title }} /></span>
            <span className="flex gap-2 rounded-xl bg-muted px-3.5 py-3 text-[13px] text-foreground">
              <Send aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              {t("portfolio.delete.sentNote")}
            </span>
          </span>
        ) : undefined}
        disabled={remove.isPending}
        icon={Trash2}
        keepOpenOnConfirm
        onConfirm={() => dialog?.kind === "delete" && void confirmDelete(dialog.item)}
        onOpenChange={(open) => !open && close()}
        open={dialog?.kind === "delete"}
        title={t("portfolio.delete.title")}
        variant="destructive-solid"
      />

      <ActionConfirmDialog
        action={t("portfolio.conflict.loadLatest")}
        cancelLabel={t("actions.cancel")}
        description={conflict ? t(`portfolio.conflict.description.${conflict.action}`) : undefined}
        icon={RefreshCw}
        onConfirm={() => { close(); void query.refetch(); }}
        onOpenChange={(open) => { if (!open) { close(); void query.refetch(); } }}
        open={dialog?.kind === "conflict"}
        title={t("portfolio.conflict.title")}
        variant="warning-solid"
      />

      <ActionConfirmDialog
        action={t("portfolio.missing.ok")}
        description={t("portfolio.missing.description")}
        icon={FileX}
        noCancel
        onConfirm={close}
        onOpenChange={(open) => !open && close()}
        open={dialog?.kind === "missing"}
        title={t("portfolio.missing.title")}
        variant="warning-solid"
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-5">{children}</div>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="surface-card">{children}</div>;
}
