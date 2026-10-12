import type { ReactNode } from "react";
import { Link } from "react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HERO_RINGS } from "@/features/auth/auth-hero.constants";

export function IntakeSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[540px_1fr] xl:grid-cols-[600px_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-(--hero-bg) px-12 py-10 text-white lg:flex">
          {/* Concentric rings background */}
          <div
            aria-hidden="true"
            className="itt-hero-rings pointer-events-none absolute inset-x-0 bottom-0 select-none opacity-40"
          >
            {HERO_RINGS.map((ring) => (
              <span
                key={ring.id}
                className={`itt-ring absolute rounded-full ${ring.fillClass}`}
                style={{
                  animationDelay: `${ring.pulseDelaySeconds}s`,
                  bottom: ring.bottom,
                  height: ring.size,
                  left: ring.left,
                  width: ring.size,
                }}
              />
            ))}
          </div>

          {/* Top brand & headline */}
          <div className="relative z-10 flex flex-col items-start gap-12">
            <BrandLogo tone="inverse" />

            <div className="flex flex-col gap-4">
              <div>
                <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-(--primary) uppercase">
                  FOR EMPLOYERS
                </span>
              </div>
              <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Hire IT talent
                <br />
                with less busywork.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/70">
                Post jobs, review applications and schedule interviews for your company in one workspace.
              </p>
            </div>
          </div>

          {/* Bottom link */}
          <div className="relative z-10 pt-8">
            <Link
              to="/login"
              className="text-sm font-medium text-white/80 underline underline-offset-4 decoration-white/40 transition-colors hover:text-white"
            >
              Looking for a job? Candidate sign in →
            </Link>
          </div>
        </aside>

        {/* Form view column */}
        <main className="flex min-h-screen flex-col overflow-y-auto bg-background">
          <div className="flex items-center justify-between border-b border-border bg-(--hero-bg) px-6 py-4 text-white lg:hidden">
            <BrandLogo tone="inverse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-(--primary)">
              FOR EMPLOYERS
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center p-6 sm:p-12 lg:p-16">
            <div className="w-full max-w-[480px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
