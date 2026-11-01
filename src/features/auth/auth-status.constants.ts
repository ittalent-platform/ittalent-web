// Shared class for the 48px action buttons of the auth result screens (Authentication design).
export const AUTH_ACTION_CLASS = "h-12 px-5 text-[14.5px] font-semibold";
export const AUTH_FULL_ACTION_CLASS = `${AUTH_ACTION_CLASS} w-full`;
// A resend button that cannot be used yet keeps the row shape but reads as unavailable.
export const AUTH_ACTION_DISABLED_CLASS =
  "disabled:border disabled:border-border disabled:bg-(--status-neutral-bg) disabled:text-fg-faint disabled:opacity-100";

export const VERIFY_NEW_LINK_PATH = "/verify-email?stage=expired";
