import { Outlet } from "react-router";

import { BrandLogo } from "./brand-logo";
import { MainNav } from "./main-nav";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { CANDIDATE_NAV_ITEMS } from "./candidate-layout.constants";

/** Applicant-facing shell (DESIGN.md "Applicant and public marketplace"): 74px white header over a canvas page. */
export function CandidateLayout() {
  return (
    <div className="itt-root candidate-root flex min-h-screen flex-col bg-canvas text-foreground">
      <header className="sticky top-0 z-(--z-header) border-b border-border bg-card">
        <div className="mx-auto flex h-(--header-height) max-w-[1440px] items-center gap-8 px-4 sm:px-8 lg:px-12">
          <BrandLogo />
          <MainNav items={CANDIDATE_NAV_ITEMS} />
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <UserMenu variant="pill" />
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
