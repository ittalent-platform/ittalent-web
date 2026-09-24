import type { ReactNode } from "react";
import { AuthBrand } from "./auth-brand";

export function AuthPageShell({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-screen items-center justify-center bg-(--app-canvas) sm:px-6 sm:py-6 sm:[background:radial-gradient(circle_at_50%_0%,rgb(253,232,224)_0%,transparent_55%)_rgb(244,242,238)] lg:px-8">
      <div className="flex min-h-screen w-full overflow-hidden bg-white shadow-none sm:min-h-0 sm:max-w-md sm:rounded-[0.8rem] sm:border sm:border-black/15 sm:shadow-[0_24px_80px_rgba(25,25,28,0.14),0_8px_24px_rgba(25,25,28,0.08)] lg:max-w-275">
        <div className="grid min-h-screen w-full grid-cols-1 sm:min-h-0 lg:min-h-165 lg:grid-cols-[460px_1fr]">
          <aside className="hidden flex-col justify-between bg-foreground px-11 py-12 text-white lg:flex">{aside}</aside>
          <main className="flex min-h-screen flex-col bg-(--app-canvas) sm:min-h-0 lg:block">
            <div className="flex items-center bg-foreground px-5 py-6 text-white sm:px-8 lg:hidden"><AuthBrand /></div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
