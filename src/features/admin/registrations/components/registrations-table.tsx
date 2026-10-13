import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Eye, MoreVertical, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { SearchEmptyState } from "@/components/common/search-empty-state";
import { cn } from "@/lib/utils";
import type { EnterpriseRegistrationSummary } from "@/features/enterprise-registration/enterprise-registration.types";
import {
  calculateWaitingDays,
  formatSubmittedDate,
  getInitials,
} from "@/features/admin/registrations/registrations.formatters";

interface RegistrationsTableProps {
  items: EnterpriseRegistrationSummary[];
  isLoading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function RegistrationsTable({
  items,
  isLoading,
  hasFilters,
  onClearFilters,
}: RegistrationsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell className="w-[30%]">{t("admin.registrations.table.company", "COMPANY")}</TableHeaderCell>
              <TableHeaderCell className="w-[28%]">{t("admin.registrations.table.requester", "REQUESTER")}</TableHeaderCell>
              <TableHeaderCell className="w-[18%]">{t("admin.registrations.table.submitted", "SUBMITTED")}</TableHeaderCell>
              <TableHeaderCell className="w-[10%]">{t("admin.registrations.table.version", "VERSION")}</TableHeaderCell>
              <TableHeaderCell className="w-[10%]">{t("admin.registrations.table.waiting", "WAITING")}</TableHeaderCell>
              <TableHeaderCell className="w-[4%] text-right" />
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 4 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Skeleton className="h-4 w-36 mb-1.5" />
                  <Skeleton className="h-3 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="size-6 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12">
        {hasFilters ? (
          <SearchEmptyState
            icon={Search}
            description={t("admin.registrations.noResultsSearch", "Try adjusting your search terms or filters.")}
            onClear={onClearFilters}
            title={t("admin.registrations.noResults", "No registrations match your search")}
          />
        ) : (
          <EmptyState
            description={t("admin.registrations.emptyDesc", "There are currently no registrations in this queue.")}
            title={t("admin.registrations.emptyTitle", "No registrations found")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHead>
          <TableHeaderRow>
            <TableHeaderCell className="w-[30%]">{t("admin.registrations.table.company", "COMPANY")}</TableHeaderCell>
            <TableHeaderCell className="w-[28%]">{t("admin.registrations.table.requester", "REQUESTER")}</TableHeaderCell>
            <TableHeaderCell className="w-[18%]">{t("admin.registrations.table.submitted", "SUBMITTED")}</TableHeaderCell>
            <TableHeaderCell className="w-[10%]">{t("admin.registrations.table.version", "VERSION")}</TableHeaderCell>
            <TableHeaderCell className="w-[10%]">{t("admin.registrations.table.waiting", "WAITING")}</TableHeaderCell>
            <TableHeaderCell className="w-[4%] text-right" />
          </TableHeaderRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const submitted = formatSubmittedDate(item.submitted_at || item.created_at);
            const waiting = calculateWaitingDays(item.submitted_at || item.created_at);
            const initials = getInitials(item.representative_name);

            return (
              <TableRow
                key={item.id}
                onClick={() => navigate(`/admin/registrations/${item.id}`)}
                className="group cursor-pointer hover:bg-muted/40 transition-colors"
              >
                {/* COMPANY */}
                <TableCell>
                  <div className="font-semibold text-[14px] text-foreground group-hover:text-primary transition-colors">
                    {item.company_name || item.corporate_email}
                  </div>
                  <div className="font-mono text-[12px] text-muted-foreground mt-0.5">
                    {item.tax_code ? `Tax ${item.tax_code}` : item.registration_code}
                  </div>
                </TableCell>

                {/* REQUESTER */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-[13.5px] text-foreground truncate">
                        {item.representative_name}
                      </div>
                      <div className="text-[12px] text-muted-foreground truncate">
                        {item.corporate_email}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* SUBMITTED */}
                <TableCell>
                  <div className="text-[13px] font-medium text-foreground">
                    {submitted.date}
                  </div>
                  {submitted.time ? (
                    <div className="text-[12px] text-muted-foreground">
                      {submitted.time}
                    </div>
                  ) : null}
                </TableCell>

                {/* VERSION */}
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11.5px] font-semibold text-muted-foreground">
                    v{item.version}
                  </span>
                </TableCell>

                {/* WAITING */}
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
                      waiting.isUrgent
                        ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {waiting.text}
                  </span>
                </TableCell>

                {/* ACTIONS */}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Actions"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => navigate(`/admin/registrations/${item.id}`)}
                        className="cursor-pointer gap-2"
                      >
                        <Eye className="size-4 text-muted-foreground" />
                        <span>{t("admin.registrations.viewDetails", "View details")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
