import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Menu, Moon, Sun, X } from "lucide-react";

import { useSession } from "@/auth/use-session";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

export type HeaderProps = {
  dark?: boolean;
  onHome?: () => void;
  onSectionNavigate?: (id: string) => void;
  onToggleTheme?: () => void;
  theme?: "light" | "dark";
};

export function Header({
  dark = false,
  onHome,
  onSectionNavigate,
  onToggleTheme,
  theme = "light",
}: HeaderProps) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onSectionNavigate) {
      onSectionNavigate(sectionId);
    } else {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        dark
          ? "bg-[rgba(18,18,20,0.85)] text-white backdrop-blur-md border-b border-white/10"
          : "bg-[var(--bg)]/90 text-[var(--fg)] backdrop-blur-md border-b border-[var(--border)]",
      )}
    >
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link
          className="flex items-center gap-3 no-underline text-inherit"
          onClick={onHome}
          to="/"
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-[8px] border-2 border-[var(--primary)]">
            <div className="absolute inset-[5px] border border-[var(--primary)] opacity-50" />
            <div className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] -translate-y-1/2 rotate-45 bg-[var(--primary)]" />
            <div className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] -translate-y-1/2 -rotate-45 bg-[var(--primary)]" />
          </div>
          <span className="font-['Space_Grotesk',sans-serif] text-[19px] font-bold tracking-[-0.02em]">
            ITTALENT
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-services")}
            type="button"
          >
            Services
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-process")}
            type="button"
          >
            Process
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-whyus")}
            type="button"
          >
            Why Us
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-faq")}
            type="button"
          >
            FAQ
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/career");
            }}
            type="button"
          >
            Career
          </button>
        </nav>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {onToggleTheme ? (
            <button
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-full border border-inherit/15 text-inherit transition-colors hover:bg-inherit/10"
              onClick={onToggleTheme}
              type="button"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          ) : null}

          {session ? (
            <UserMenu />
          ) : (
            <>
              <Button
                className="text-[14px] font-semibold"
                onClick={() => navigate("/login")}
                size="sm"
                variant="ghost"
              >
                Sign in
              </Button>
              <Button
                className="text-[14px] font-semibold"
                onClick={() => navigate("/register")}
                shape="pill"
                size="sm"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {onToggleTheme ? (
            <button
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-full border border-inherit/15 text-inherit"
              onClick={onToggleTheme}
              type="button"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          ) : null}
          <button
            aria-label="Toggle navigation menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-inherit/15 text-inherit"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen ? (
        <div className="border-b border-inherit/15 bg-background px-6 py-6 md:hidden text-foreground">
          <nav className="flex flex-col gap-4">
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-services")}
              type="button"
            >
              Services
            </button>
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-process")}
              type="button"
            >
              Process
            </button>
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-whyus")}
              type="button"
            >
              Why Us
            </button>
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-faq")}
              type="button"
            >
              FAQ
            </button>
          </nav>

          <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-border">
            {session ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  className="w-full text-sm font-semibold"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  variant="outline"
                >
                  Sign in
                </Button>
                <Button
                  className="w-full text-sm font-semibold"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/register");
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
