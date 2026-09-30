import type { ReactNode } from "react";
import { AuthBrand } from "./auth-brand";

export function AuthPageShell({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[480px_1fr] xl:grid-cols-[540px_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-white lg:flex">
          {/* Authentic Breathing Concentric Circles Background */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 block select-none"
            fill="none"
            height="520"
            viewBox="0 0 560 520"
            width="560"
          >
            <g className="itt-breathe">
              <path d="M-196 520 A476 476 0 0 1 756 520" stroke="#d4400b" strokeLinecap="butt" strokeWidth="57" />
              <path d="M-140 520 A420 420 0 0 1 700 520" stroke="#dd4a13" strokeLinecap="butt" strokeWidth="57" />
              <path d="M-84 520 A364 364 0 0 1 644 520" stroke="#e85a22" strokeLinecap="butt" strokeWidth="57" />
              <path d="M-28 520 A308 308 0 0 1 588 520" stroke="#f37139" strokeLinecap="butt" strokeWidth="57" />
              <path d="M28 520 A252 252 0 0 1 532 520" stroke="#fb8f5f" strokeLinecap="butt" strokeWidth="57" />
              <path d="M84 520 A196 196 0 0 1 476 520" stroke="#ffb08c" strokeLinecap="butt" strokeWidth="57" />
              <path d="M140 520 A140 140 0 0 1 420 520" stroke="#ffcdb5" strokeLinecap="butt" strokeWidth="57" />
              <path d="M196 520 A84 84 0 0 1 364 520" stroke="#ffe4d7" strokeLinecap="butt" strokeWidth="57" />
              <path d="M252 520 A28 28 0 0 1 308 520" stroke="#fff7f2" strokeLinecap="butt" strokeWidth="57" />
            </g>
          </svg>

          <div className="relative z-10 flex h-full flex-col justify-between">
            {aside}
          </div>
        </aside>

        <main className="flex min-h-screen flex-col bg-white overflow-y-auto">
          <div className="flex items-center bg-primary px-6 py-5 text-white lg:hidden">
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
