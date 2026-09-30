import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { LogoTile } from "@/components/common/logo-tile";
import { SortableHeaderButton, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableHeaderRow, TableRow } from "@/components/ui/table";
import { ApplicationDocuments } from "./application-documents";
import { applicationDisplayId, formatDate, formatTime, jobFacts } from "./application-formatters";
import { ApplicationRowActions } from "./application-row-actions";
import { ApplicationStatusBadge } from "./application-status-badge";
import { APPLICATIONS_PATH, type ApplicationItem, type SortField, type SortOrder } from "./applications.constants";
import { ReapplyTag } from "./reapply-tag";

// Columns backed by a server-side sort key; the others are not sortable.
const SORT_KEY_BY_COLUMN: Partial<Record<string, SortField>> = { reference: "id", submitted: "submittedAt", updated: "latestStatusAt" };
const COLUMN_KEYS = ["reference", "job", "submitted", "updated", "documents", "status"] as const;

export function ApplicationsTable({ items, locale, onWithdraw, onSort, sortBy, sortOrder }: { items: ApplicationItem[]; locale: string; onWithdraw: (item: ApplicationItem) => void; onSort: (field: SortField) => void; sortBy: SortField; sortOrder: SortOrder }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Table className="min-w-[860px]">
      <TableHead>
        <TableHeaderRow>
          {COLUMN_KEYS.map((key) => {
            const field = SORT_KEY_BY_COLUMN[key];
            return <TableHeaderCell key={key}>{field ? <SortableHeaderButton active={sortBy === field} direction={sortBy === field ? sortOrder : null} label={t(`applications.columns.${key}`)} onClick={() => onSort(field)} /> : t(`applications.columns.${key}`)}</TableHeaderCell>;
          })}
          <TableHeaderCell><span className="sr-only">{t("applications.columns.actions")}</span></TableHeaderCell>
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {items.map((item) => {
          const displayId = applicationDisplayId(item.id);
          const detailPath = `${APPLICATIONS_PATH}/${item.id}`;
          return (
            <TableRow className="hover:bg-surface-subtle" key={item.id}>
              <TableCell><span className="itt-mono text-xs text-muted-foreground">{displayId}</span></TableCell>
              <TableCell>
                <Link className="flex min-w-0 items-center gap-3 text-foreground" to={detailPath}>
                  <LogoTile name={item.job.companyName} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13.5px] font-bold">{item.job.title}</span>
                    <span className="truncate text-[12.5px] text-muted-foreground">{jobFacts(item.job, true)}</span>
                  </span>
                </Link>
                {item.reappliedFrom || item.reappliedAs ? <span className="mt-1.5 flex pl-12"><ReapplyTag application={item} /></span> : null}
              </TableCell>
              <TableCell>
                <span className="flex flex-col text-[13px] text-foreground/80">{formatDate(item.submittedAt, locale)}<span className="text-xs text-slate-subtle">{formatTime(item.submittedAt, locale)}</span></span>
              </TableCell>
              <TableCell className="text-[13px]">{formatDate(item.latestStatusAt, locale)}</TableCell>
              <TableCell><ApplicationDocuments types={item.submittedDocuments} /></TableCell>
              <TableCell><ApplicationStatusBadge status={item.status} /></TableCell>
              <TableCell className="w-12 pl-0"><ApplicationRowActions canWithdraw={item.canWithdraw} displayId={displayId} onView={() => navigate(detailPath)} onWithdraw={() => onWithdraw(item)} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
