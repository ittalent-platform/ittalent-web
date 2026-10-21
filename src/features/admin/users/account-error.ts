import { CONFLICT_CODES, CONFLICT_MESSAGE_MARKERS } from "./user-history.constants";
import { HTTP_CONFLICT, HTTP_SERVER_ERROR } from "@/api/http-status";

export type AccountErrorKind = "accountConflict" | "companyUnavailable" | "lastAdmin" | "lastEnterpriseAdmin" | "onboardingPending" | "other" | "server" | "stale" | "transition";

/** Tells the API's failure modes apart: 409 is a stale version or an illegal change, 5xx a persistence failure. */
export function classifyAccountError(error: unknown): AccountErrorKind {
  const { code, message = "", status } = (error ?? {}) as { code?: string; message?: string; status?: number };
  const byCode = code ? CONFLICT_CODES[code] : undefined;
  if (byCode) return byCode;
  if (code === "COMPANY_UNAVAILABLE" && status === 404) return "companyUnavailable";
  if (status === HTTP_CONFLICT) {
    // Fallback for older API responses that carry no code.
    const found = (Object.keys(CONFLICT_MESSAGE_MARKERS) as (keyof typeof CONFLICT_MESSAGE_MARKERS)[]).find((key) => message.includes(CONFLICT_MESSAGE_MARKERS[key]));
    return found ?? "stale";
  }
  return status !== undefined && status >= HTTP_SERVER_ERROR ? "server" : "other";
}

/** These conflicts cannot be fixed by retrying, so the confirm action stays disabled. */
export const BLOCKING_ACCOUNT_ERRORS: readonly AccountErrorKind[] = ["lastAdmin", "lastEnterpriseAdmin", "transition", "stale", "companyUnavailable"];
