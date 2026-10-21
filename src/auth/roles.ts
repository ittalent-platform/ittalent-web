export const JOB_POSTING_MANAGER_ROLES = [
  "recruiter",
  "enterprise_admin",
] as const;

/** Roles that may create/edit job postings in the web app; enterprise admins are read-only here (backend permissions are unchanged by decision). */
export const JOB_POSTING_WRITER_ROLES = ["recruiter"] as const;

export type JobPostingManagerRole =
  (typeof JOB_POSTING_MANAGER_ROLES)[number];
export type ProtectedRole = "admin" | "user" | JobPostingManagerRole;

export function canManageJobPostings(
  role: string | undefined,
): role is JobPostingManagerRole {
  return JOB_POSTING_MANAGER_ROLES.some((allowedRole) => allowedRole === role);
}

export function dashboardPathForRole(role: string): string {
  if (role === "admin") return "/admin/users";
  if (canManageJobPostings(role)) return "/recruiter/job-postings";
  return "/";
}
