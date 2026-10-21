import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  History,
  Info,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RECRUITER_EMPLOYEES_PATH } from "@/config/routes";
import { useSession } from "@/auth/use-session";
import {
  useEmployeeDetailQuery,
  useEmployeeHistoryQuery,
} from "./employees.queries";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { ChangeEmployeeStatusDialog } from "./change-employee-status-dialog";
import { EmployeeHistoryDialog } from "./employee-history-dialog";

function getInitials(name: string): string {
  if (!name) return "HR";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RecruiterEmployeeDetailPage() {
  const { employeeId = "" } = useParams();
  const { data: session } = useSession();
  const canManageEmployees = session?.user.role === "enterprise_admin";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    data: employee,
    isLoading,
    isError,
  } = useEmployeeDetailQuery(employeeId);
  const historyQuery = useEmployeeHistoryQuery(employeeId);
  const historyList = historyQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Employee not found
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The requested employee record does not exist or you do not have
          permission to access it.
        </p>
        <Button asChild variant="outline" className="mt-4 gap-2">
          <Link to={RECRUITER_EMPLOYEES_PATH}>
            <ArrowLeft className="size-4" />
            Back to employees
          </Link>
        </Button>
      </div>
    );
  }

  const name = employee.fullName || employee.username;
  const initials = getInitials(name);
  const jobTitle =
    (employee as unknown as { job_title?: string }).job_title ||
    (employee.role === "admin" ? "Enterprise Administrator" : "Recruiter");
  const department =
    (employee as unknown as { department?: string }).department ||
    "Talent acquisition";
  const empCode = `EMP-${employee.id.slice(-4).toUpperCase()}`;
  const memberDate = employee.createdAt
    ? new Date(employee.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const recentHistory = historyList.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Link to={RECRUITER_EMPLOYEES_PATH} className="hover:text-foreground">
          Employees
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{empCode}</span>
      </nav>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {name}
              </h1>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {jobTitle} · {department}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {canManageEmployees ? <div className="flex items-center gap-2.5 sm:self-center">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="gap-2"
          >
            <Edit3 className="size-4" />
            <span>Edit information</span>
          </Button>
          <Button
            variant={employee.status === "active" ? "destructive" : "default"}
            onClick={() => setIsStatusOpen(true)}
          >
            {employee.status === "active"
              ? "Change status"
              : "Activate membership"}
          </Button>
        </div> : null}
      </div>

      {/* Grid of Detail Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Employee Information */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Employee information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Display name</span>
              <span className="col-span-2 font-medium text-foreground">
                {name}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Job title</span>
              <span className="col-span-2 font-medium text-foreground">
                {jobTitle}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Department</span>
              <span className="col-span-2 font-medium text-foreground">
                {department}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Work phone</span>
              <span className="col-span-2 font-mono text-foreground">
                {employee.phone || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Account Details */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Work email</span>
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {employee.email}
                </span>
                {employee.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Role</span>
              <span className="col-span-2 font-medium text-foreground capitalize">
                {employee.role === "admin"
                  ? "Enterprise Admin"
                  : "HR / Recruiter"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-border/60 pb-3">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="col-span-2 font-mono font-medium text-foreground">
                {empCode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Member since</span>
              <span className="col-span-2 text-foreground">{memberDate}</span>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span>
                Email, password and role belong to the person’s own ITTalent
                account, so they can’t be changed here.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Membership Status */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <UserCheck className="size-4 text-emerald-600" />
              <span>
                {employee.status === "active"
                  ? `Active since ${memberDate}`
                  : "Access currently suspended"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {employee.status === "active"
                ? "Can access and manage your corporate workspace: publish job postings, review applicants, and coordinate interview schedules."
                : "Workspace access is revoked. This employee cannot view candidates or post jobs until reactivated."}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Recent Activity Audit */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Recent activity
            </CardTitle>
            {historyList.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setIsHistoryOpen(true)}
              >
                <History className="size-3.5" />
                <span>View all ({historyList.length})</span>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {recentHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No recent activity recorded for this employee account.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentHistory.map((item, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-foreground capitalize">
                      {item.action.replace(/_/g, " ")}
                      </span>
                      {item.reason ? (
                        <span className="text-muted-foreground ml-1">
                          · {item.reason}
                        </span>
                      ) : null}
                      <time className="block text-[11px] text-muted-foreground">
                        {item.occurredAt
                          ? new Date(item.occurredAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )
                          : ""}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Modals */}
      {canManageEmployees ? <EditEmployeeDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        employee={employee}
      /> : null}
      {canManageEmployees ? <ChangeEmployeeStatusDialog
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        employee={employee}
      /> : null}
      <EmployeeHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        employee={employee}
      />
    </div>
  );
}

export { RecruiterEmployeeDetailPage as EmployeeDetailPage };
