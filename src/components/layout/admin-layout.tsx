import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { AdminLayoutProvider } from "./admin-layout-context";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function AppLayout({ actor = "admin" }: { actor?: "admin" | "recruiter" }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div
      className={cn(
        "itt-root grid min-h-screen bg-[var(--surface-2)] lg:overflow-hidden",
        isSidebarCollapsed
          ? "lg:grid-cols-[4.75rem_0.35rem_minmax(0,1fr)]"
          : "lg:grid-cols-[15.5rem_0.35rem_minmax(0,1fr)]",
      )}
    >
      <Sidebar
        actor={actor}
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />
      {isMobileNavOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}
      <button
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="group hidden cursor-col-resize bg-transparent outline-none transition hover:bg-primary/20 focus-visible:bg-primary/25 lg:block"
        onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        <span className="mx-auto block h-full w-px bg-transparent transition group-hover:bg-primary" />
      </button>
      <div className="flex min-w-0 flex-col bg-(--app-canvas) px-5 py-6 sm:px-8 lg:h-screen lg:overflow-y-auto lg:px-8">
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <button
            aria-label="Open menu"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={() => setIsMobileNavOpen(true)}
            type="button"
          >
            <Menu className="size-4.5" />
          </button>
          <span className="itt-display text-[13px] font-bold tracking-wider text-foreground">ITTALENT</span>
        </div>
        <AdminLayoutProvider
          value={{
            collapsed: isSidebarCollapsed,
            toggleSidebar: () => setIsSidebarCollapsed((collapsed) => !collapsed),
          }}
        >
          <main className="relative flex-1">
            <Outlet />
          </main>
        </AdminLayoutProvider>
      </div>
    </div>
  );
}
