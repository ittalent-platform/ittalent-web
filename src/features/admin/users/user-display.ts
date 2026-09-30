import type { UserDto } from "@/api/generated/types.gen";

/** The name people see: the full name, or the username for an account that has none (as the API sorts it). */
export function userDisplayName(user: Pick<UserDto, "fullName" | "username">): string {
  return user.fullName?.trim() || user.username;
}
