import { useState, useMemo } from "react";
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
  const navigate = useNavigate();

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
    search: search.trim() || undefined,
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
      { label: "Department: All", value: "all" },
      { label: "Talent acquisition", value: "Talent acquisition" },
      { label: "Engineering", value: "Engineering" },
      { label: "People operations", value: "People operations" },
    ];
  }, []);

  const sortOptions = [
    { label: "Sort: Newest first", value: "createdAt-desc" },
    { label: "Sort: Oldest first", value: "createdAt-asc" },
    { label: "Sort: Name A-Z", value: "fullName-asc" },
    { label: "Sort: Name Z-A", value: "fullName-desc" },
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
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Invitation pending" },
    { key: "suspended", label: "Suspended" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 text-xs font-medium text-muted-foreground">
            <span>Workspace</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Employees</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your company’s HR team. Only people in your corporate workspace are
            shown.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="gap-2 shrink-0"
        >
          <UserPlus className="size-4" />
          <span>Invite HR employee</span>
        </Button>
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
              placeholder="Search employee or email…"
              className="pl-9 pr-8 text-sm"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
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
              <TableHeaderCell className="w-[300px]">Employee</TableHeaderCell>
              <TableHeaderCell>Department</TableHeaderCell>
              <TableHeaderCell>Work Phone</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Member Since</TableHeaderCell>
              <TableHeaderCell className="w-[60px] text-right">
                Actions
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
                  Failed to load employees list. Please check your connection
                  and try again.
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <UsersIcon className="size-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                      No employees found
                    </p>
                    <p className="text-xs">
                      {search ||
                      statusFilter !== "all" ||
                      departmentFilter !== "all"
                        ? "Try adjusting your search query or filters."
                        : "Start building your HR team by inviting your first employee."}
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
                        Reset filters
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => setIsInviteOpen(true)}
                      >
                        Invite HR employee
                      </Button>
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
                  (emp.role === "admin" ? "Enterprise admin" : "Recruiter");
                const department =
                  (emp as unknown as { department?: string }).department ||
                  "Talent acquisition";
                const phone = emp.phone || "—";
                const memberDate = emp.createdAt
                  ? new Date(emp.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

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
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(recruiterEmployeeDetailPath(emp.id))
                            }
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingEmployee(emp)}
                          >
                            Edit information
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setStatusEmployee(emp)}
                            className={
                              emp.status === "active"
                                ? "text-rose-600 focus:text-rose-600"
                                : "text-emerald-600 focus:text-emerald-600"
                            }
                          >
                            {emp.status === "active"
                              ? "Suspend membership"
                              : "Activate membership"}
                          </DropdownMenuItem>
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
      <InviteEmployeeDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
      <EditEmployeeDialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
        employee={editingEmployee}
      />
      <ChangeEmployeeStatusDialog
        key={statusEmployee?.id}
        open={Boolean(statusEmployee)}
        onOpenChange={(open) => !open && setStatusEmployee(null)}
        employee={statusEmployee}
      />
    </div>
  );
}

export { RecruiterEmployeesPage as EmployeesPage };
