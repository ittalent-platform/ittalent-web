import { requestErrorMessage } from "@/api/request-error";

const NO_ENTERPRISE_MESSAGE = "Recruiter is not assigned to an enterprise";

/** Turns a server error into the sentence shown to the user; the server's own wording is kept otherwise. */
export function jobPostingErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  const message = requestErrorMessage(error);
  return message === NO_ENTERPRISE_MESSAGE
    ? t("jobPostings.save.noEnterprise")
    : message;
}
