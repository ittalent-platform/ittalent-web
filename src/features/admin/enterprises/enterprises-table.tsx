import { Link, useNavigate } from "react-router";
import { Building2, Eye, MoreVertical, Pencil, Search, Trash2, Ban, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SortableHeaderButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TableSkeletonRows,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { SearchEmptyState } from "@/components/common/search-empty-state";
import { LogoTile } from "@/components/common/logo-tile";
import { EnterpriseStatusBadge } from "./enterprise-badges";
import { formatEnterpriseDateTime } from "./enterprises.formatters";
import type { EnterpriseSummaryDto } from "./enterprises.queries";
import type { EnterpriseSortField, EnterpriseSortOrder } from "./enterprises.constants";

type EnterprisesTableProps = {
  items: EnterpriseSummaryDto[];
  isLoading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSuspend: (item: EnterpriseSummaryDto) => void;
  onActivate: (item: EnterpriseSummaryDto) => void;
  onDelete: (item: EnterpriseSummaryDto) => void;
  sortBy?: EnterpriseSortField;
  sortOrder?: EnterpriseSortOrder;
  onSort?: (field: EnterpriseSortField) => void;
};

export function EnterprisesTable({
  items,
  isLoading,
  hasFilters,
  onClearFilters,
  onSuspend,
  onActivate,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: EnterprisesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Table className="min-w-[900px]">
        <TableHead>
          <TableHeaderRow>
            <TableHeaderCell>{t("adminEnterprises.table.company")}</TableHeaderCell>
            <TableHeaderCell>{t("adminEnterprises.table.email")}</TableHeaderCell>
            <TableHeaderCell>{t("adminEnterprises.table.phone")}</TableHeaderCell>
            <TableHeaderCell>{t("adminEnterprises.table.status")}</TableHeaderCell>
            <TableHeaderCell>{t("adminEnterprises.table.created")}</TableHeaderCell>
            <TableHeaderCell className="w-12 text-right">
              <span className="sr-only">{t("adminEnterprises.table.actions")}</span>
            </TableHeaderCell>
          </TableHeaderRow>
        </TableHead>
        <TableBody>
          <TableSkeletonRows columns={6} rows={5} />
        </TableBody>
      </Table>
    );
  }

  if (items.length === 0) {
    if (hasFilters) {
      return (
        <SearchEmptyState
          icon={Search}
          title={t("state.noResults", "No matching results found")}
          description={t("adminEnterprises.table.emptyDescription", "No enterprises match your active filters or keyword search.")}
          onClear={onClearFilters}
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
    <Table className="min-w-[900px]">
      <TableHead>
        <TableHeaderRow>
          {/* Company */}
          <TableHeaderCell>
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "name"}
                direction={sortBy === "name" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.company")}
                onClick={() => onSort("name")}
              />
            ) : (
              t("adminEnterprises.table.company")
            )}
          </TableHeaderCell>

          {/* Corporate email */}
          <TableHeaderCell>
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "email"}
                direction={sortBy === "email" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.email")}
                onClick={() => onSort("email")}
              />
            ) : (
              t("adminEnterprises.table.email")
            )}
          </TableHeaderCell>

          {/* Phone */}
          <TableHeaderCell>{t("adminEnterprises.table.phone")}</TableHeaderCell>

          {/* Status */}
          <TableHeaderCell>
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "status"}
                direction={sortBy === "status" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.status")}
                onClick={() => onSort("status")}
              />
            ) : (
              t("adminEnterprises.table.status")
            )}
          </TableHeaderCell>

          {/* Created */}
          <TableHeaderCell>
            {onSort ? (
              <SortableHeaderButton
                active={sortBy === "createdAt"}
                direction={sortBy === "createdAt" ? sortOrder ?? null : null}
                label={t("adminEnterprises.table.created")}
                onClick={() => onSort("createdAt")}
              />
            ) : (
              t("adminEnterprises.table.created")
            )}
          </TableHeaderCell>

          {/* Actions */}
          <TableHeaderCell className="w-12 text-right">
            <span className="sr-only">{t("adminEnterprises.table.actions")}</span>
          </TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {items.map((ent) => {
          const detailPath = `/admin/enterprises/${ent.id}`;
          const isActive = ent.status?.toLowerCase() === "active";

          return (
            <TableRow key={ent.id} className="hover:bg-muted/50 transition-colors">
              {/* Company Column: LogoTile + Name + City underneath */}
              <TableCell>
                <Link to={detailPath} className="flex min-w-0 items-center gap-3 no-underline group/link">
                  <LogoTile name={ent.name} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[13.5px] text-foreground group-hover/link:text-primary transition truncate">
                      {ent.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {ent.location || "—"}
                    </span>
                  </div>
                </Link>
              </TableCell>

              {/* Corporate email */}
              <TableCell className="text-xs text-foreground/80 font-mono">
                {ent.email || "—"}
              </TableCell>

              {/* Phone */}
              <TableCell className="text-xs text-foreground/80">
                {ent.phone || "—"}
              </TableCell>

              {/* Status */}
              <TableCell>
                <EnterpriseStatusBadge status={ent.status} />
              </TableCell>

              {/* Created (date + "by ...") */}
              <TableCell>
                <div className="flex flex-col text-xs text-foreground/80">
                  <span>{formatEnterpriseDateTime(ent.createdAt)}</span>
                  <span className="text-muted-foreground">
                    {t("adminEnterprises.table.by", { author: ent.creatorAccountId || "admin" })}
                  </span>
                </div>
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions for ${ent.name}`}
                      className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-sm">
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

                    {isActive ? (
                      <DropdownMenuItem
                        onClick={() => onSuspend(ent)}
                        variant="destructive"
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      >
                        <Ban className="size-4" />
                        <span>{t("adminEnterprises.table.suspend", "Suspend")}</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onActivate(ent)}
                        variant="default"
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      >
                        <Check className="size-4 text-(--status-success-fg)" />
                        <span>{t("adminEnterprises.table.activate", "Activate")}</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => onDelete(ent)}
                      variant="destructive"
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                      <span>{t("adminEnterprises.table.delete", "Delete")}</span>
                    </DropdownMenuItem>
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
