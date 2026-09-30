import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Ban,
  Building2,
  Check,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  SortableHeaderButton,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { SearchEmptyState } from "@/components/common/search-empty-state";
import { EnterpriseAvatar, EnterpriseStatusBadge, formatEnterpriseId } from "./enterprise-badges";
import { formatEnterpriseDateTime } from "./enterprises.formatters";
import type { EnterpriseSummaryDto } from "./enterprises.queries";
import { getEnterpriseActions, type EnterpriseSortField, type EnterpriseSortOrder } from "./enterprises.constants";

type EnterprisesTableProps = {
  items: EnterpriseSummaryDto[];
  isLoading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  sortBy?: EnterpriseSortField;
  sortOrder?: EnterpriseSortOrder;
  onSort?: (field: EnterpriseSortField) => void;
  onSuspend: (enterprise: EnterpriseSummaryDto) => void;
  onActivate: (enterprise: EnterpriseSummaryDto) => void;
  onDelete: (enterprise: EnterpriseSummaryDto) => void;
};

function formatCreator(id?: string | null): string {
  if (!id) return "";
  if (id === "u1" || id.toLowerCase() === "admin") return "System Admin";
  if (/^[0-9a-f]{24}$/i.test(id)) return "System Admin";
  return id;
}

export function EnterprisesTable({
  items,
  isLoading,
  hasFilters,
  onClearFilters,
  sortBy,
  sortOrder,
  onSort,
  onSuspend,
  onActivate,
  onDelete,
}: EnterprisesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-b-0">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="size-9 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-32 rounded hidden sm:block" />
            <Skeleton className="h-4 w-24 rounded hidden md:block" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-24 rounded hidden lg:block" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    if (hasFilters) {
      return (
        <SearchEmptyState
          icon={Building2}
          onClear={onClearFilters}
          title={t("adminEnterprises.table.noMatchesTitle", "No matching enterprises")}
          description={t("adminEnterprises.table.noMatchesDescription", "No enterprise matches the current search or filters. Try adjusting your query.")}
        />
      );
    }

    return (
      <EmptyState
        icon={Building2}
        title={t("adminEnterprises.table.emptyTitle", "No enterprise profiles yet")}
        description={t("adminEnterprises.table.emptyDescription", "Create your first enterprise profile to manage company vetting and job postings.")}
        action={{
          label: t("adminEnterprises.create", "Create enterprise"),
          onClick: () => navigate("/admin/enterprises/new"),
        }}
      />
    );
  }

  return (
    <Table className="w-full">
      <TableHead className="bg-surface-readonly dark:bg-muted/40 border-b border-border">
        <TableHeaderRow className="hover:bg-transparent">
          {/* ID */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap w-[76px]">
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "id"}
                direction={sortBy === "id" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.id", "ID")}
                onClick={() => onSort("id")}
              />
            ) : (
              t("adminEnterprises.table.id", "ID")
            )}
          </TableHeaderCell>

          {/* Company / Enterprise */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap min-w-[180px]">
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "name"}
                ariaLabel="Company"
                direction={sortBy === "name" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.company", "Enterprise")}
                onClick={() => onSort("name")}
              />
            ) : (
              t("adminEnterprises.table.company", "Enterprise")
            )}
          </TableHeaderCell>

          {/* Corporate email */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap">
            {t("adminEnterprises.table.email", "Corporate email")}
          </TableHeaderCell>

          {/* Phone */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap">
            {t("adminEnterprises.table.phone", "Phone")}
          </TableHeaderCell>

          {/* Industry */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap">
            {t("adminEnterprises.table.industry", "Industry")}
          </TableHeaderCell>

          {/* Size */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap">
            {t("adminEnterprises.table.size", "Size")}
          </TableHeaderCell>

          {/* Status */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap">
            {t("adminEnterprises.table.status", "Status")}
          </TableHeaderCell>

          {/* Created */}
          <TableHeaderCell className="px-3.5 xl:px-4 py-3 text-[11.5px] font-bold tracking-[0.06em] text-slate-subtle dark:text-muted-foreground uppercase whitespace-nowrap">
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "createdAt"}
                direction={sortBy === "createdAt" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.created", "Created")}
                onClick={() => onSort("createdAt")}
              />
            ) : (
              t("adminEnterprises.table.created", "Created")
            )}
          </TableHeaderCell>

          {/* Actions */}
          <TableHeaderCell className="w-12 text-right pr-4 sticky right-0 bg-surface-readonly dark:bg-muted/40">
            <span className="sr-only">{t("adminEnterprises.table.actions", "Actions")}</span>
          </TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {items.map((ent) => {
          const detailPath = `/admin/enterprises/${ent.id}`;
          const actions = getEnterpriseActions(ent.status);

          return (
            <TableRow
              key={ent.id}
              className="border-t border-line-muted dark:border-border/50 hover:bg-surface-subtle dark:hover:bg-muted/20 transition-colors group/row"
            >
              {/* ID Column */}
              <TableCell className="px-3.5 xl:px-4 py-3 align-middle">
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {formatEnterpriseId(ent.id)}
                </span>
              </TableCell>

              {/* Company Column: Avatar + Name + City underneath */}
              <TableCell className="px-3.5 xl:px-4 py-3 align-middle min-w-[180px]">
                <Link to={detailPath} className="flex min-w-0 items-center gap-3 no-underline group/link">
                  <EnterpriseAvatar name={ent.name} logoUrl={ent.logoUrl} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[13.5px] text-foreground group-hover/link:text-primary transition truncate">
                      {ent.name}
                    </span>
                    <span className="text-[12px] text-muted-foreground truncate">
                      {ent.location || "—"}
                    </span>
                  </div>
                </Link>
              </TableCell>

              {/* Corporate email */}
              <TableCell className="px-3.5 xl:px-4 py-3 text-[13px] text-foreground align-middle max-w-[200px] truncate">
                {ent.email || "—"}
              </TableCell>

              {/* Phone */}
              <TableCell className="px-3.5 xl:px-4 py-3 text-[13px] text-foreground whitespace-nowrap align-middle">
                {ent.phone || "—"}
              </TableCell>

              {/* Industry */}
              <TableCell className="px-3.5 xl:px-4 py-3 text-[13px] text-foreground whitespace-nowrap align-middle">
                {ent.industry || "—"}
              </TableCell>

              {/* Size */}
              <TableCell className="px-3.5 xl:px-4 py-3 text-[13px] text-foreground whitespace-nowrap align-middle">
                {ent.companySize ? `${ent.companySize}` : "—"}
              </TableCell>

              {/* Status */}
              <TableCell className="px-3.5 xl:px-4 py-3 align-middle whitespace-nowrap">
                <EnterpriseStatusBadge status={ent.status} />
              </TableCell>

              {/* Created (date + "by ...") */}
              <TableCell className="px-3.5 xl:px-4 py-3 align-middle whitespace-nowrap">
                {ent.createdAt ? (
                  <div className="flex flex-col gap-0.5 text-[13px] text-foreground">
                    <span>{formatEnterpriseDateTime(ent.createdAt)}</span>
                    {formatCreator(ent.creatorAccountId) && (
                      <span className="text-xs text-slate-subtle dark:text-muted-foreground">
                        {t("adminEnterprises.table.by", { author: formatCreator(ent.creatorAccountId) })}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell className="px-2 py-3 text-right align-middle pr-3 sticky right-0 bg-card group-hover/row:bg-surface-subtle transition-colors">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions for ${ent.name}`}
                      className="size-8 rounded-lg inline-flex items-center justify-center text-foreground/70 dark:text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-sm rounded-xl">
                    <DropdownMenuItem
                      onClick={() => navigate(detailPath)}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                    >
                      <Eye className="size-4 text-muted-foreground" />
                      <span>{t("adminEnterprises.table.view", "View")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(`/admin/enterprises/${ent.id}/edit`)}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                    >
                      <Pencil className="size-4 text-muted-foreground" />
                      <span>{t("adminEnterprises.table.edit", "Edit")}</span>
                    </DropdownMenuItem>

                    {actions.canSuspend ? (
                      <DropdownMenuItem
                        onClick={() => onSuspend(ent)}
                        variant="warning"
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      >
                        <Ban className="size-4" />
                        <span>{t("adminEnterprises.table.suspend", "Suspend")}</span>
                      </DropdownMenuItem>
                    ) : null}

                    {actions.canActivate ? (
                      <DropdownMenuItem
                        onClick={() => onActivate(ent)}
                        variant="success"
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      >
                        <Check className="size-4" />
                        <span>{t("adminEnterprises.table.activate", "Activate")}</span>
                      </DropdownMenuItem>
                    ) : null}

                    {actions.canDelete ? (
                      <DropdownMenuItem
                        onClick={() => onDelete(ent)}
                        variant="destructive"
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                        <span>{t("adminEnterprises.table.delete", "Delete")}</span>
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
