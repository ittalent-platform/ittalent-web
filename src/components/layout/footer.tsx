import { Link, useNavigate } from "react-router";

export function Footer() {
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
            <Link className="mb-4 flex items-center gap-3 no-underline text-inherit" to="/">
              <div className="relative h-8 w-8 overflow-hidden rounded-[8px] border-2 border-[var(--primary)]">
                <div className="absolute inset-[5px] border border-[var(--primary)] opacity-50" />
                <div className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] -translate-y-1/2 rotate-45 bg-[var(--primary)]" />
                <div className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] -translate-y-1/2 -rotate-45 bg-[var(--primary)]" />
              </div>
              <span className="text-[18px] font-bold tracking-[-0.02em]">ITTALENT</span>
            </Link>
            <p className="mb-5 max-w-[280px] text-[12.5px] leading-6 text-[var(--fg-muted)]">
              Expertly engineered web applications, mobile platforms, automated QA environments, and scalable cloud solutions for international industry leaders.
            </p>
          </div>
          <div />
          <div className="text-right">
            <h4 className="itt-mono mb-[18px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">Contact</h4>
            <div className="flex flex-col gap-[14px] text-[12.5px] text-[var(--fg-muted)]">
              <a className="hover:text-[var(--fg)]" href="mailto:support@ittalent.io">support@ittalent.io</a>
              <a className="itt-mono hover:text-[var(--fg)]" href="tel:+84912345678">+84 912 345 678</a>
              <span>600 Nguyen Van Cu, Can Tho, Vietnam</span>
            </div>
          </div>
          <div className="text-right">
            <h4 className="itt-mono mb-[18px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">Navigation</h4>
            <div className="flex flex-col gap-[13px] text-[12.5px] font-semibold">
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-services")} type="button">Services</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-process")} type="button">Process</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-whyus")} type="button">Why Us</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => goToSection("home-faq")} type="button">FAQ</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => navigate("/login")} type="button">Sign In</button>
              <button className="cursor-pointer text-right text-[var(--fg-muted)] hover:text-[var(--fg)]" onClick={() => navigate("/register")} type="button">Create Account</button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-7">
          <span className="itt-mono text-[11px] text-[var(--fg-subtle)]">Copyright © 2026 ITTalent Platform. All rights reserved.</span>
          <button className="cursor-pointer itt-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--fg-subtle)]" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button">Back to Top ↑</button>
        </div>
      </div>
    </footer>
  );
}
