import { useNavigate } from "react-router";
import { BrandLogo } from "./brand-logo";
import { useTranslation } from "react-i18next";

const COPYRIGHT_YEAR = 2026;

export function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToSection = (id: string) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-[var(--surface)] px-8 py-16 text-[var(--fg)]">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-10 border-b border-[var(--border)] pb-12 lg:grid-cols-[1.4fr_0.6fr_1fr_1fr]">
          <div>
            <div className="mb-4">
              <BrandLogo />
            </div>
            <p className="mb-5 max-w-[280px] text-[12.5px] leading-6 text-[var(--fg-muted)]">
              {t("footer.tagline")}
            </p>
          </div>
          <div />
          <div className="text-right">
            <h4 className="itt-mono mb-[18px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">{t("footer.contact")}</h4>
            <div className="flex flex-col gap-[14px] text-[12.5px] text-[var(--fg-muted)]">
              <a className="hover:text-[var(--fg)]" href="mailto:support@ittalent.io">support@ittalent.io</a>
              <a className="itt-mono hover:text-[var(--fg)]" href="tel:+84912345678">+84 912 345 678</a>
              <span>{t("footer.address")}</span>
            </div>
          </div>
          <div className="text-right">
            <h4 className="itt-mono mb-[18px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">{t("footer.navigation")}</h4>
            <div className="flex flex-col gap-[13px] text-[12.5px] font-semibold">
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-services")} type="button">{t("footer.services")}</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-process")} type="button">{t("footer.process")}</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-whyus")} type="button">{t("footer.whyUs")}</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-faq")} type="button">{t("footer.faq")}</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => navigate("/login")} type="button">{t("footer.signIn")}</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => navigate("/register")} type="button">{t("footer.createAccount")}</button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-7">
          <span className="itt-mono text-[11px] text-[var(--fg-subtle)]">{t("footer.copyright", { year: COPYRIGHT_YEAR })}</span>
          <button className="cursor-pointer itt-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--fg-subtle)]" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button">{t("footer.backToTop")}</button>
        </div>
      </div>
    </footer>
  );
}
