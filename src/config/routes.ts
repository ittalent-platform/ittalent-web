/** Route paths shared by layout chrome and feature code, so neither hardcodes a URL. */
export const APPLICATIONS_PATH = "/my-applications";
export const CERTIFICATES_PATH = "/certificates";
export const RECRUITER_JOB_POSTINGS_PATH = "/recruiter/job-postings";
export const RECRUITER_INTERVIEWS_PATH = "/recruiter/interviews";

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

/** Recruiter employee accounts management (UC 10 - UC 16). */
export const RECRUITER_EMPLOYEES_PATH = "/recruiter/employees";

export function recruiterEmployeeDetailPath(employeeId: string): string {
  return `${RECRUITER_EMPLOYEES_PATH}/${employeeId}`;
}

/** Recruiter company profile management (UC 17 - UC 19). */
export const RECRUITER_COMPANY_PROFILE_PATH = "/recruiter/profile";

export function recruiterCompanyProfileEditPath(): string {
  return `${RECRUITER_COMPANY_PROFILE_PATH}/edit`;
}

export function adminEnterprisePath(enterpriseId: string): string {
  return `/admin/enterprises/${enterpriseId}`;
}
