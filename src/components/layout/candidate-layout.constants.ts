import type { MainNavItem } from "./main-nav";

// Jobs and Companies browsing live on the public landing page until their own routes ship.
export const CANDIDATE_NAV_ITEMS: readonly MainNavItem[] = [
  { labelKey: "nav.jobs", to: "/" },
];
