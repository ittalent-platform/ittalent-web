/** Route paths shared by layout chrome and feature code, so neither hardcodes a URL. */
export const APPLICATIONS_PATH = "/my-applications";
export const SAVED_JOBS_PATH = "/saved-jobs";
export const EMAIL_VERIFICATION_PATH = "/verify-email";
export const PROFILE_PATH = "/profile";
export function profilePathForRole(role?: string): string {
  if (role === "admin") return "/admin/profile";
  if (role === "recruiter" || role === "enterprise_admin") return "/recruiter/my-profile";
  return PROFILE_PATH;
}

export function profilePasswordPathForRole(role?: string): string {
  return `${profilePathForRole(role)}/password`;
}
export const CERTIFICATES_PATH = "/certificates";
export const NOTIFICATIONS_PATH = "/notifications";
export const ACCOUNT_NOTIFICATIONS_PATH = "/account/notifications";
export const RECRUITER_JOB_POSTINGS_PATH = "/recruiter/job-postings";
export const RECRUITER_APPLICATIONS_PATH = "/recruiter/applications";
export const RECRUITER_INTERVIEWS_PATH = "/recruiter/interviews";
/** Statistics of the HR / enterprise admin's own company, and the platform overview of a system admin. */
export const RECRUITER_DASHBOARD_PATH = "/recruiter/dashboard";
export const ADMIN_DASHBOARD_PATH = "/admin/dashboard";
export const ADMIN_REGISTRATIONS_PATH = "/admin/registrations";

export function recruiterJobPostingPath(jobPostingId: string): string {
  return `${RECRUITER_JOB_POSTINGS_PATH}/${jobPostingId}`;
}

export function adminRegistrationPath(registrationId: string): string {
  return `${ADMIN_REGISTRATIONS_PATH}/${registrationId}`;
}

export function recruiterApplicationPath(applicationId: string): string {
  return `${RECRUITER_APPLICATIONS_PATH}/${applicationId}`;
}

export function interviewPath(interviewId: string): string {
  return `${RECRUITER_INTERVIEWS_PATH}/${interviewId}`;
}

/** Public job page and its apply flow (UC-BJOB-03); applications link here to view or apply again. */
export function jobPath(jobId: string): string {
  return `/career/${jobId}`;
}

/** Admin user accounts list and detail. */
export const ADMIN_USERS_PATH = "/admin/users";

export function adminUserPath(userId: string): string {
  return `${ADMIN_USERS_PATH}/${userId}`;
}

export function adminEnterprisePath(enterpriseId: string): string {
  return `/admin/enterprises/${enterpriseId}`;
}

/** Admin broadcast notifications management (UC 01 - UC 07). */
export const ADMIN_BROADCASTS_PATH = "/admin/broadcast-notifications";

/** Recruiter employee accounts management (UC 10 - UC 16). */
export const RECRUITER_EMPLOYEES_PATH = "/recruiter/employees";

export function recruiterEmployeeDetailPath(employeeId: string): string {
  return `${RECRUITER_EMPLOYEES_PATH}/${employeeId}`;
}

/** Recruiter company profile management (UC 17 - UC 19). */
export const RECRUITER_COMPANY_PROFILE_PATH = "/recruiter/company-profile";

export function recruiterCompanyProfileEditPath(): string {
  return `${RECRUITER_COMPANY_PROFILE_PATH}/edit`;
}

/** Reports management (UC 30 - UC 36). */
export const MY_REPORTS_PATH = "/my-reports";
export const ADMIN_REPORTS_PATH = "/admin/reports";

export function myReportDetailPath(reportId: string): string {
  return `${MY_REPORTS_PATH}/${reportId}`;
}

export function adminReportDetailPath(reportId: string): string {
  return `${ADMIN_REPORTS_PATH}/${reportId}`;
}
