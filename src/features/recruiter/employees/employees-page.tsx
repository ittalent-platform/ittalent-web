import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { FilterSelect } from "@/components/ui/filter-select";
import { recruiterEmployeeDetailPath } from "@/config/routes";
import { useSession } from "@/auth/use-session";
import { formatDate } from "@/lib/format";
import { useEmployeesListQuery } from "./employees.queries";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { InviteEmployeeDialog } from "./invite-employee-dialog";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { ChangeEmployeeStatusDialog } from "./change-employee-status-dialog";
import type {
  Employee,
  EmployeeSortField,
  EmployeeSortOrder,
  EmployeeStatus,
} from "./employees.types";

function getInitials(name: string): string {
  if (!name) return "HR";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function RecruiterEmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const canManageEmployees = session?.user.role === "enterprise_admin";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "all">(
    "all",
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<EmployeeSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<EmployeeSortOrder>("desc");

  // Dialog states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statusEmployee, setStatusEmployee] = useState<Employee | null>(null);

  const { data, isLoading, isError } = useEmployeesListQuery({
    page,
    limit: pageSize,
    search: search.trim().length >= 2 ? search.trim() : undefined,
    status: statusFilter,
    department: departmentFilter !== "all" ? departmentFilter : undefined,
    sortBy,
    sortOrder,
  });

  const items = data?.items;
  const employees = useMemo(() => {
    const list = items ?? [];
    if (departmentFilter === "all") return list;
    return list.filter(
      (emp) =>
        (emp as unknown as { department?: string }).department ===
        departmentFilter,
    );
  }, [items, departmentFilter]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.ceil(total / pageSize);

  // Collect available departments for filtering
  const departmentOptions = useMemo(() => {
    return [
      { label: t("recruiterEmployees.toolbar.departmentAll"), value: "all" },
      { label: t("recruiterEmployees.departments.talentAcquisition"), value: "Talent acquisition" },
      { label: t("recruiterEmployees.departments.engineering"), value: "Engineering" },
      { label: t("recruiterEmployees.departments.peopleOperations"), value: "People operations" },
    ];
  }, [t]);

  const sortOptions = [
    { label: t("admin.registrations.sort.newestFirst"), value: "createdAt-desc" },
    { label: t("admin.registrations.sort.oldestFirst"), value: "createdAt-asc" },
    { label: t("recruiterEmployees.toolbar.sortNameAsc"), value: "fullName-asc" },
    { label: t("recruiterEmployees.toolbar.sortNameDesc"), value: "fullName-desc" },
  ];

  const handleSortChange = (val: string) => {
    const [field, order] = val.split("-") as [
      EmployeeSortField,
      EmployeeSortOrder,
    ];
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  // Status counters calculation
  const statusTabs = [
    { key: "all", label: t("filterSelect.all") },
    { key: "active", label: t("adminUsers.status.active") },
    { key: "inactive", label: t("adminUsers.invitation.pending") },
    { key: "suspended", label: t("adminUsers.status.suspended") },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 text-xs font-medium text-muted-foreground">
            <span>{t("recruiterEmployees.page.workspace")}</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{t("sidebar.employees")}</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("sidebar.employees")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("recruiterEmployees.page.subtitle")}
          </p>
        </div>

        {canManageEmployees ? <Button onClick={() => setIsInviteOpen(true)} className="gap-2 shrink-0"><UserPlus className="size-4" /><span>{t("recruiterEmployees.invite.title")}</span></Button> : null}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("recruiterEmployees.toolbar.searchPlaceholder")}
              className="pl-9 pr-8 text-sm"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("search.clearSearch")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Department Filter */}
          <FilterSelect
            value={departmentFilter}
            onChange={(val: string) => {
              setDepartmentFilter(val);
              setPage(1);
            }}
            options={departmentOptions}
            className="w-full sm:w-52"
          />
        </div>

        {/* Sort Select */}
        <FilterSelect
          value={`${sortBy}-${sortOrder}`}
          onChange={handleSortChange}
          options={sortOptions}
          className="w-full sm:w-48"
        />
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHead>
            <TableHeaderRow className="hover:bg-transparent">
              <TableHeaderCell className="w-[300px]">{t("recruiterEmployees.table.employee")}</TableHeaderCell>
              <TableHeaderCell>{t("recruiterEmployees.table.department")}</TableHeaderCell>
              <TableHeaderCell>{t("recruiterEmployees.table.workPhone")}</TableHeaderCell>
              <TableHeaderCell>{t("applications.columns.status")}</TableHeaderCell>
              <TableHeaderCell>{t("recruiterEmployees.table.memberSince")}</TableHeaderCell>
              <TableHeaderCell className="w-[60px] text-right">
                {t("adminUsers.table.actions")}
              </TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-sm text-destructive"
                >
                  {t("recruiterEmployees.list.loadError")}
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <UsersIcon className="size-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                      {t("recruiterEmployees.list.emptyTitle")}
                    </p>
                    <p className="text-xs">
                      {search ||
                      statusFilter !== "all" ||
                      departmentFilter !== "all"
                        ? t("recruiterEmployees.list.emptyFiltered")
                        : t("recruiterEmployees.list.emptyFirst")}
                    </p>
                    {search ||
                    statusFilter !== "all" ||
                    departmentFilter !== "all" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                          setDepartmentFilter("all");
                        }}
                      >
                        {t("adminUsers.history.reset")}
                      </Button>
                      ) : (
                      canManageEmployees ? <Button
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => setIsInviteOpen(true)}
                      >
                        {t("recruiterEmployees.invite.title")}
                      </Button> : null
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const name = emp.fullName || emp.username;
                const initials = getInitials(name);
                const colorClass = getAvatarColor(emp.id);
                const jobTitle =
                  (emp as unknown as { job_title?: string }).job_title ||
                  (emp.role === "admin" ? t("roles.enterpriseAdmin") : t("roles.recruiter"));
                const department =
                  (emp as unknown as { department?: string }).department ||
                  t("recruiterEmployees.departments.talentAcquisition");
                const phone = emp.phone || "—";
                const memberDate = formatDate(emp.createdAt);

                return (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer transition hover:bg-muted/40"
                    onClick={() =>
                      navigate(recruiterEmployeeDetailPath(emp.id))
                    }
                  >
                    {/* Employee avatar & name */}
                    <TableCell className="max-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-xs ${colorClass}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={recruiterEmployeeDetailPath(emp.id)}
                            className="block truncate text-sm font-semibold text-foreground hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {name}
                          </Link>
                          <span className="block truncate text-xs text-muted-foreground">
                            {jobTitle}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell
                      className="text-xs text-foreground truncate max-w-[160px]"
                      title={department}
                    >
                      {department}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {phone}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <EmployeeStatusBadge status={emp.status} />
                    </TableCell>

                    {/* Member since */}
                    <TableCell className="text-xs text-muted-foreground">
                      {memberDate}
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">{t("adminLayout.openMenu")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(recruiterEmployeeDetailPath(emp.id))
                            }
                          >
                            {t("adminUsers.table.view")}
                          </DropdownMenuItem>
                          {canManageEmployees ? <DropdownMenuItem
                            onClick={() => setEditingEmployee(emp)}
                          >
                            {t("adminUsers.detail.editInformation")}
                          </DropdownMenuItem> : null}
                          {canManageEmployees ? <DropdownMenuItem
                            onClick={() => setStatusEmployee(emp)}
                            className={
                              emp.status === "active"
                                ? "text-rose-600 focus:text-rose-600"
                                : "text-emerald-600 focus:text-emerald-600"
                            }
                          >
                            {emp.status === "active"
                              ? t("recruiterEmployees.menu.suspend")
                              : t("recruiterEmployees.menu.activate")}
                          </DropdownMenuItem> : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {total > 0 ? (
          <div className="border-t border-border px-4 py-3">
            <Pagination
              page={page}
              limit={pageSize}
              total={total}
              totalPages={Math.max(1, totalPages)}
              onPageChange={setPage}
              onLimitChange={(newSize: number) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Dialogs */}
      {canManageEmployees ? <InviteEmployeeDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      /> : null}
      {canManageEmployees ? <EditEmployeeDialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
        employee={editingEmployee}
      /> : null}
      {canManageEmployees ? <ChangeEmployeeStatusDialog
        open={Boolean(statusEmployee)}
        onOpenChange={(open) => !open && setStatusEmployee(null)}
        employee={statusEmployee}
      /> : null}
    </div>
  );
}

export { RecruiterEmployeesPage as EmployeesPage };
