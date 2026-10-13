import type { UserDto } from "@/api/generated/types.gen";

import { NAME_TITLE_MAX_LENGTH, PHONE_COUNTRY_PREFIX, PHONE_MAX_DIGITS, VERIFICATION_WINDOW_MS } from "./users.constants";

/** The name people see: the full name, or the username for an account that has none (as the API sorts it). */
export function userDisplayName(user: Pick<UserDto, "fullName" | "username">): string {
  return user.fullName?.trim() || user.username;
}

/** History only stores who acted by id: the account itself, or an administrator. */
export function historyActorKey(actorId: string, userId: string): "actorSelf" | "actorAdmin" {
  return actorId === userId ? "actorSelf" : "actorAdmin";
}

export type EmailBadgeKind = "verified" | "unverified" | "overdue" | "inviteFailed";

/** What the Email column says: a failed invitation first, then verification (overdue = inactive and past the verification window). */
export function emailBadgeKind(user: Pick<UserDto, "createdAt" | "emailVerified" | "invitation" | "status">, now = Date.now()): EmailBadgeKind {
  if (user.invitation?.deliveryStatus === "failed") return "inviteFailed";
  if (user.emailVerified) return "verified";
  const created = user.createdAt ? Date.parse(user.createdAt) : Number.NaN;
  return user.status === "inactive" && now - created > VERIFICATION_WINDOW_MS ? "overdue" : "unverified";
}

/** The display name cut for a toast or dialog title, so a very long name never fills it. */
export function userShortName(user: Pick<UserDto, "fullName" | "username">): string {
  const name = userDisplayName(user);
  return name.length > NAME_TITLE_MAX_LENGTH ? `${name.slice(0, NAME_TITLE_MAX_LENGTH).trimEnd()}…` : name;
}

/** "0912 345 678" for a stored 10-digit mobile; anything else is shown as stored. */
export function formatMobile(value: string): string {
  return value.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

/** Keeps only what can be a Vietnamese mobile number: digits, a pasted +84 / 84 turned into 0, at most 10 digits. */
export function normalizeMobile(value: string): string {
  return value.trim().replace(PHONE_COUNTRY_PREFIX, "0").replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);
}
