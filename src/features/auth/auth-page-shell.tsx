import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  AUTH_ASIDE_WIDTH_CLASS,
  HERO_RING_STROKE_WIDTH,
  HERO_RINGS,
  HERO_VIEWBOX,
} from "./auth-hero.constants";

export function AuthPageShell({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className={`grid min-h-screen w-full grid-cols-1 ${AUTH_ASIDE_WIDTH_CLASS}`}>
        <aside className="relative hidden flex-col overflow-hidden bg-[var(--hero-candidate-bg)] px-14 py-11 text-white lg:flex">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 block h-auto max-h-full w-full select-none"
            fill="none"
            preserveAspectRatio="xMidYMax slice"
            viewBox={`0 0 ${HERO_VIEWBOX.width} ${HERO_VIEWBOX.height}`}
          >
            {HERO_RINGS.map((ring) => (
              <path
                className={`itt-ring ${ring.strokeClass}`}
                d={ring.path}
                key={ring.id}
                strokeLinecap="butt"
                strokeWidth={HERO_RING_STROKE_WIDTH}
                style={{ animationDelay: `${ring.pulseDelaySeconds}s` /* dynamic: runtime value */ }}
              />
            ))}
          </svg>

          <div className="relative z-10 flex flex-col">
            {aside}
          </div>
        </aside>

        <main className="flex min-h-screen flex-col bg-white overflow-y-auto">
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
