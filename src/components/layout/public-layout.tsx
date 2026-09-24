import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { useHero } from "@/features/public-site/use-hero";
import { Footer } from "./footer";
import { Header } from "./header";

export function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const onHero = useHero(true);

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={cn(
        "itt-root flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300",
        theme === "dark" ? "dark" : "",
      )}
    >
      <Header
        dark={onHero}
        onHome={() => navigate("/")}
        onSectionNavigate={scrollToSection}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        theme={theme}
      />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
