import type { ReactNode } from "react";
import { AuthBrand } from "./auth-brand";

export function AuthPageShell({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[480px_1fr] xl:grid-cols-[540px_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-[#ea4315] to-[#d4400b] px-12 py-14 text-white lg:flex">
          {/* Breathing Concentric Arcs */}
          <svg
            className="pointer-events-none absolute -bottom-24 -left-24 text-white/20 select-none animate-[pulse_6s_ease-in-out_infinite]"
            width="560"
            height="560"
            viewBox="0 0 560 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="120" cy="440" r="100" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="120" cy="440" r="170" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="120" cy="440" r="250" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="120" cy="440" r="340" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="120" cy="440" r="440" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="120" cy="440" r="550" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10 flex h-full flex-col justify-between">
            {aside}
          </div>
        </aside>

        <main className="flex min-h-screen flex-col bg-white overflow-y-auto">
          <div className="flex items-center bg-[#ea4315] px-6 py-5 text-white lg:hidden">
            <AuthBrand />
          </div>
          <div className="flex flex-1 items-center justify-center w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
