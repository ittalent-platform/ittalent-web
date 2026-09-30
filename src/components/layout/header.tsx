import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import { useNavigate } from "react-router";
import { Menu, Moon, Sun, X } from "lucide-react";

import { useSession } from "@/auth/use-session";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onSectionNavigate) {
      onSectionNavigate(sectionId);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
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
        <BrandLogo onClick={onHome} />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-services")}
            type="button"
          >
            {t("footer.services")}
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-process")}
            type="button"
          >
            {t("footer.process")}
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-whyus")}
            type="button"
          >
            {t("footer.whyUs")}
          </button>
          <button
            className="cursor-pointer text-[14.5px] font-medium text-inherit/80 hover:text-inherit transition-colors"
            onClick={() => handleNavClick("home-faq")}
            type="button"
          >
            {t("footer.faq")}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {onToggleTheme ? (
            <button
              aria-label={t("header.toggleTheme")}
              className="grid h-9 w-9 place-items-center rounded-full border border-inherit/15 text-inherit transition-colors hover:bg-inherit/10"
              onClick={onToggleTheme}
              type="button"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
                {t("header.signIn")}
              </Button>
              <Button
                className="text-[14px] font-semibold"
                onClick={() => navigate("/register")}
                shape="pill"
                size="sm"
              >
                {t("header.getStarted")}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {onToggleTheme ? (
            <button
              aria-label={t("header.toggleTheme")}
              className="grid h-9 w-9 place-items-center rounded-full border border-inherit/15 text-inherit"
              onClick={onToggleTheme}
              type="button"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          ) : null}
          <button
            aria-label={t("header.toggleMenu")}
            className="grid h-9 w-9 place-items-center rounded-lg border border-inherit/15 text-inherit"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
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
              {t("footer.services")}
            </button>
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-process")}
              type="button"
            >
              {t("footer.process")}
            </button>
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-whyus")}
              type="button"
            >
              {t("footer.whyUs")}
            </button>
            <button
              className="text-left text-[16px] font-semibold"
              onClick={() => handleNavClick("home-faq")}
              type="button"
            >
              {t("footer.faq")}
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
                  {t("header.signIn")}
                </Button>
                <Button
                  className="w-full text-sm font-semibold"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/register");
                  }}
                >
                  {t("header.getStarted")}
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
