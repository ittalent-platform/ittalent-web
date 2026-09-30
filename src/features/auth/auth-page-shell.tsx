import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  AUTH_ASIDE_COMPACT_WIDTH_CLASS,
  AUTH_ASIDE_WIDTH_CLASS,
  HERO_RINGS,
} from "./auth-hero.constants";

export function AuthPageShell({ aside, children, compact = false }: { aside: ReactNode; children: ReactNode; compact?: boolean }) {
  return (
    <div className="flex min-h-screen w-full bg-(--app-canvas)">
      <div className={`grid min-h-screen w-full grid-cols-1 ${compact ? AUTH_ASIDE_COMPACT_WIDTH_CLASS : AUTH_ASIDE_WIDTH_CLASS}`}>
        <aside className="relative hidden flex-col overflow-hidden bg-[var(--hero-candidate-bg)] px-14 py-11 text-white lg:flex">
          <div aria-hidden="true" className="itt-hero-rings pointer-events-none absolute inset-x-0 bottom-0 select-none">
            {HERO_RINGS.map((ring) => (
              <span
                className={`itt-ring absolute rounded-full ${ring.fillClass}`}
                key={ring.id}
                style={
                  {
                    animationDelay: `${ring.pulseDelaySeconds}s`,
                    bottom: ring.bottom,
                    height: ring.size,
                    left: ring.left,
                    width: ring.size,
                  } /* dynamic: runtime value */
                }
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col">
            {aside}
          </div>
        </aside>

        <main className="flex min-h-screen flex-col overflow-y-auto bg-(--app-canvas)">
          <div className="flex items-center bg-[var(--hero-candidate-bg)] px-6 py-5 text-white lg:hidden">
            <BrandLogo tone="inverse" />
          </div>
          <div className="flex flex-1 items-center justify-center w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
