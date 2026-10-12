import { Link, NavLink, useLocation } from "react-router";

import { useSession } from "@/auth/use-session";
import { slideKey, useSlidingIndicator } from "@/hooks/use-sliding-indicator";
import { cn } from "@/lib/utils";

import { MarketplaceLogo } from "./marketplace-logo";
import { UserMenu } from "./user-menu";

const navItem =
  "flex h-9 items-center rounded-full px-3.5 text-[13.5px] font-semibold transition-colors md:px-[18px]";

export function MarketplaceHeader({ dark = false }: { dark?: boolean }) {
  const { data: session } = useSession();
  const { pathname } = useLocation();
  const activeKey = pathname.startsWith("/career") ? "jobs" : pathname.startsWith("/enterprises") ? "companies" : null;
  const { containerRef, indicatorRef } = useSlidingIndicator<HTMLElement>(activeKey);

  return (
    <header
      className={cn(
        "box-border flex h-[74px] items-center gap-4 border-b px-4 md:gap-8 md:px-12",
        dark
          ? "border-white/[0.12] bg-mkt-ink text-white"
          : "border-mkt-line bg-white text-mkt-ink",
      )}
    >
      <Link
        aria-label="ITTalent home"
        className="flex items-center gap-2.5 text-inherit"
        to="/"
      >
        <MarketplaceLogo />
        <span className="hidden font-['Space_Grotesk',sans-serif] text-[19px] font-bold tracking-[0.04em] sm:inline">
          ITTALENT
        </span>
      </Link>

      <nav
        aria-label="Main"
        className={cn(
          "relative flex gap-1 rounded-full p-1",
          dark ? "bg-white/[0.07]" : "bg-mkt-chip",
        )}
        ref={containerRef}
      >
        <span
          aria-hidden
          className="absolute bottom-1 left-0 top-1 rounded-full bg-mkt-accent opacity-0 data-[ready=true]:transition-[transform,width,opacity] data-[ready=true]:duration-300 data-[ready=true]:ease-out motion-reduce:transition-none"
          ref={indicatorRef}
        />
        {[
          { key: "jobs", label: "Jobs", to: "/career" },
          { key: "companies", label: "Companies", to: "/enterprises" },
        ].map((item) => (
          <NavLink
            {...slideKey(item.key)}
            className={cn(
              navItem,
              "relative z-10 transition-colors duration-200",
              activeKey === item.key
                ? "text-white"
                : dark
                  ? "text-mkt-on-dark-nav hover:text-white"
                  : "text-mkt-ink-2 hover:text-mkt-ink",
            )}
            key={item.key}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <Link
        className={cn(
          "hidden text-[13.5px] font-semibold md:block",
          dark
            ? "text-mkt-on-dark-nav hover:text-white"
            : "text-mkt-ink-2 hover:text-mkt-ink",
        )}
        to="/#employers"
      >
        For employers
      </Link>
      <div
        className={cn(
          "hidden h-[22px] w-px md:block",
          dark ? "bg-white/[0.12]" : "bg-mkt-line",
        )}
      />

      {session ? (
        <div className="w-auto shrink-0">
          <UserMenu variant="pill" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            className={cn(
              "hidden h-10 items-center rounded-full border px-[18px] text-[13.5px] font-semibold sm:flex",
              dark
                ? "border-white/[0.28] text-white hover:bg-white/10"
                : "border-mkt-line-strong text-mkt-ink hover:bg-mkt-chip",
            )}
            to="/login"
          >
            Sign in
          </Link>
          <Link
            className="flex h-10 items-center rounded-full bg-mkt-accent px-[18px] text-[13.5px] font-semibold text-white hover:bg-mkt-accent-hover"
            to="/register"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}