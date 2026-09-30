/** Route paths shared by layout chrome and feature code, so neither hardcodes a URL. */
export const APPLICATIONS_PATH = "/my-applications";

/** Public job page and its apply flow (UC-BJOB-03); applications link here to view or apply again. */
export function jobPath(jobId: string): string {
  return `/jobs/${jobId}`;
}

/** Admin user accounts list and detail. */
export const ADMIN_USERS_PATH = "/admin/users";

export function adminUserPath(userId: string): string {
  return `${ADMIN_USERS_PATH}/${userId}`;
}
