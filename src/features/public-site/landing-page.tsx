import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { brands, faqItems, processSteps, serviceCards } from "./content";

const asList = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const svc = document.getElementById("svc-track");
      if (svc) {
        const total = svc.offsetHeight - window.innerHeight;
        const p = total <= 0 ? 0 : Math.max(0, Math.min(1, -svc.getBoundingClientRect().top / total));
        const cards = svc.querySelectorAll<HTMLElement>(".svc-card");
        const dots = svc.querySelectorAll<HTMLElement>(".svc-dot");
        const specs = [
          { o: [[0, 0.15, 0.28], [1, 1, 0]], y: [[0, 0.15, 0.25], [0, -10, -30]], s: [[0, 0.15, 0.28], [1, 1, 0.92]] },
          { o: [[0.08, 0.23, 0.45, 0.58], [0, 1, 1, 0]], y: [[0.05, 0.25, 0.4, 0.55], [420, 0, 0, -40]], s: [[0.05, 0.25, 0.4, 0.55], [0.95, 1, 1, 0.95]] },
          { o: [[0.35, 0.5, 0.7, 0.82], [0, 1, 1, 0]], y: [[0.3, 0.5, 0.7, 0.85], [420, 0, 0, -40]], s: [[0.3, 0.5, 0.7, 0.85], [0.95, 1, 1, 0.95]] },
          { o: [[0.65, 0.8, 1], [0, 1, 1]], y: [[0.6, 0.8], [420, 0]], s: [[0.6, 0.8], [0.95, 1]] },
        ];

        let active = 0;
        cards.forEach((card, index) => {
          const spec = specs[index];
          if (!spec) return;
          const interp = (stops: number[], vals: number[]) => {
            if (p <= stops[0]) return vals[0];
            if (p >= stops[stops.length - 1]) return vals[vals.length - 1];
            for (let i = 1; i < stops.length; i += 1) {
              if (p <= stops[i]) {
                const t = (p - stops[i - 1]) / (stops[i] - stops[i - 1]);
                return vals[i - 1] + (vals[i] - vals[i - 1]) * t;
              }
            }
            return vals[vals.length - 1];
          };
          const opacity = interp(spec.o[0], spec.o[1]);
          const y = interp(spec.y[0], spec.y[1]);
          const scale = interp(spec.s[0], spec.s[1]);
          card.style.opacity = String(opacity);
          card.style.transform = `translateY(${y}px) scale(${scale})`;
          card.style.zIndex = String(10 + index);
          card.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
          if (opacity > 0.5) active = index;
        });
        dots.forEach((dot, index) => {
          dot.style.background = index === active ? "var(--primary)" : "var(--border-strong)";
        });
      }

      const proc = document.getElementById("proc-track");
      if (proc) {
        const total = proc.offsetHeight - window.innerHeight;
        const p = total <= 0 ? 0 : Math.max(0, Math.min(1, -proc.getBoundingClientRect().top / total));
        const lerp = (stops: number[], vals: number[]) => {
          if (p <= stops[0]) return vals[0];
          if (p >= stops[stops.length - 1]) return vals[vals.length - 1];
          for (let i = 1; i < stops.length; i += 1) {
            if (p <= stops[i]) {
              const t = (p - stops[i - 1]) / (stops[i] - stops[i - 1]);
              return vals[i - 1] + (vals[i] - vals[i - 1]) * t;
            }
          }
          return vals[vals.length - 1];
        };

        const center = document.getElementById("proc-center") as HTMLElement | null;
        const left = document.getElementById("proc-left") as HTMLElement | null;
        const cards = document.getElementById("proc-cards") as HTMLElement | null;
        const inner = document.getElementById("proc-cards-inner") as HTMLElement | null;

        if (center) {
          center.style.opacity = String(lerp([0, 0.18], [1, 0]));
          center.style.transform = `translateY(${lerp([0, 0.22], [0, -15])}vh) scale(${lerp([0, 0.22], [1, 0.9])})`;
        }
        if (left) {
          left.style.opacity = String(lerp([0.12, 0.24], [0, 1]));
          left.style.transform = `translateY(${lerp([0.12, 0.24], [20, 0])}px)`;
        }
        if (cards) {
          cards.style.opacity = String(lerp([0.15, 0.25], [0, 1]));
          cards.style.transform = `scale(${lerp([0.15, 0.25], [0.96, 1])})`;
        }
        if (inner) {
          inner.style.transform = `translateX(${lerp([0.25, 1], [0, -75])}%)`;
        }
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <section id="page-hero" className="relative flex min-h-screen items-center overflow-hidden bg-[var(--hero-bg)] px-8 pb-16 pt-[120px] text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            aria-hidden="true"
            className="absolute inset-[-16%_-18%_-12%_22%] animate-[hero-bg-drift_8s_ease-in-out_infinite] bg-[url('/ittalent-hero.png')] bg-cover bg-center bg-no-repeat opacity-85"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--hero-bg)_0%,var(--hero-bg)_8%,transparent_55%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_45%,transparent_30%,var(--hero-bg)_92%)]" />
          <div className="absolute right-[6%] top-[-140px] h-[460px] w-[460px] rounded-full bg-[rgba(242,71,12,.14)] blur-[90px]" />
          <div className="absolute bottom-[-120px] left-[-60px] h-[340px] w-[340px] rounded-full bg-[rgba(242,71,12,.06)] blur-[80px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1320px]">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(242,71,12,.45)] bg-[rgba(242,71,12,.14)] px-[17px] py-[7px]">
            <span className="h-[9px] w-[9px] animate-[itt-pulse_2s_infinite] rounded-full bg-primary" />
            <span className="itt-mono text-[11.5px] font-bold uppercase tracking-[0.14em] text-[var(--primary-300)]">{t("landing.hero.badge")}</span>
          </div>
          <h1 className="itt-display max-w-[900px] text-[64px] font-bold uppercase leading-[1.02] tracking-[-0.035em] xl:text-[76px]">
            <Trans components={{ accent: <span className="italic text-[var(--primary)]" /> }} i18nKey="landing.hero.title" />
          </h1>
          <p className="mt-6 max-w-[620px] text-[19px] leading-[1.6] text-(--fg-faint)">
            {t("landing.hero.subtitle")}
          </p>
          <div className="mt-[42px] flex flex-wrap gap-4">
            <Button className="group h-[60px] gap-[10px] px-10 text-[17px] font-bold" onClick={() => navigate("/register")} shape="pill" type="button">
              <span>{t("landing.startProject")}</span>
              <ArrowRight className="size-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </Button>
            <Button className="h-[60px] border-2 border-(--border-muted) bg-transparent px-10 text-[17px] font-bold text-(--hero-fg)/85 hover:bg-white/5 hover:text-white" onClick={() => scrollToSection("home-services")} shape="pill" type="button" variant="outline">
              {t("landing.hero.explore")}
            </Button>
          </div>
        </div>
      </section>

      <section id="home-services" className="bg-[var(--bg)]">
        <div id="svc-track" className="relative h-[320vh]">
          <div className="sticky top-0 flex items-center h-screen overflow-hidden">
            <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-14 px-8 align-middle lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="itt-mono mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{t("landing.services.eyebrow")}</div>
                <h2 className="mb-5 text-[52px] font-bold uppercase leading-[1.02] tracking-[-0.03em]"><Trans components={{ br: <br /> }} i18nKey="landing.services.title" /></h2>
                <p className="mb-8 max-w-[360px] text-[16px] leading-[1.6] text-[var(--fg-muted)]">{t("landing.services.subtitle")}</p>
                <div className="flex gap-[9px]">
                  {serviceCards.map((card, index) => (
                    <span
                      className={cn("svc-dot block h-1 w-8 rounded-full", index === 0 ? "bg-primary" : "bg-(--border-strong)")}
                      key={card.no}
                    />
                  ))}
                </div>
              </div>

              <div className="relative h-[540px]">
                {serviceCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.no}
                      className="svc-card absolute inset-0 flex flex-col rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-10 shadow-[0_30px_60px_-20px_rgba(0,0,0,.14)] transition-[transform,opacity] duration-300"
                      /* dynamic: runtime value */
                      style={{ opacity: index === 0 ? 1 : 0, transform: index === 0 ? "translateY(0) scale(1)" : "translateY(420px) scale(0.95)", zIndex: 10 + index, pointerEvents: index === 0 ? "auto" : "none" }}
                    >
                      <div className="mb-[26px] flex items-start justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-50)]">
                          <Icon className="size-[27px] text-[var(--primary)]" />
                        </div>
                        <span className="itt-display text-[42px] font-bold tracking-[-0.02em] text-[var(--border-strong)]">{card.no}</span>
                      </div>
                      <h3 className="itt-display mb-[14px] text-[28px] font-bold uppercase tracking-[-0.01em]">{t(`landing.services.cards.${card.id}.title`)}</h3>
                      <p className="mb-6 max-w-[460px] text-[15px] leading-[1.6] text-[var(--fg-muted)]">{t(`landing.services.cards.${card.id}.desc`)}</p>
                      <ul className="mb-auto flex flex-col gap-[11px]">
                        {asList(t(`landing.services.cards.${card.id}.items`, { returnObjects: true })).map((item) => (
                          <li key={item} className="flex items-center gap-[11px] text-[14px] text-[var(--fg-muted)]">
                            <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[var(--primary)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-[22px] flex flex-wrap gap-2 border-t border-[var(--border)] pt-[22px]">
                        {card.tags.map((tag) => (
                          <span key={tag} className="itt-mono rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-[6px] text-[10.5px] font-bold uppercase text-[var(--fg-muted)]">{tag}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="home-process" className="bg-[var(--surface-2)]">
        <div id="proc-track" className="relative h-[340vh]">
          <div className="sticky top-0 flex flex-col justify-center h-screen overflow-hidden">
            <div id="proc-center" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center will-change-[transform,opacity]">
              <div className="itt-mono mb-4 animate-[itt-pulse_2.4s_infinite] text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t("landing.process.eyebrow")}</div>
              <h2 className="text-[82px] font-bold uppercase leading-[0.95] tracking-[-0.03em]">{t("landing.process.title")}</h2>
              <h3 className="mt-3 text-[56px] font-semibold uppercase leading-none tracking-[0.02em] text-[var(--fg-muted)]">{t("landing.process.centerSubtitle")}</h3>
              <p className="mt-5 text-[19px] text-[var(--fg-muted)]"><Trans components={{ em: <span className="italic" /> }} i18nKey="landing.process.tagline" /></p>
            </div>

            <div id="proc-left" className="mx-auto mb-16 flex w-full max-w-[1320px] items-end justify-between gap-6 px-8 opacity-0">
              <div className="flex items-center gap-[14px]">
                <h2 className="itt-display text-[40px] font-bold uppercase tracking-[-0.02em]">{t("landing.process.title")}</h2>
                <span className="h-[26px] w-px bg-(--border-strong)" />
                <h3 className="itt-display text-[19px] font-semibold uppercase tracking-[0.02em] text-[var(--fg-muted)]">{t("landing.process.subtitle")}</h3>
              </div>
              <span className="itt-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">{t("landing.process.cycle")}</span>
            </div>

            <div id="proc-cards" className="w-full overflow-hidden pb-[46px] pt-[22px] opacity-0 will-change-[transform,opacity]">
              <div id="proc-cards-inner" className="flex w-[400%] will-change-[transform]">
                {processSteps.map((step) => (
                  <div key={step.no} className="flex-shrink-0 w-1/4 px-8">
                    <div className="mx-auto flex min-h-[380px] max-w-[960px] overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_45px_-18px_rgba(0,0,0,.22)]">
                      <div className="relative flex w-[42%] flex-shrink-0 items-center justify-center border-r border-[var(--border)] bg-[var(--surface-2)]">
                        <svg className="absolute inset-0 h-full w-full text-[var(--border)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <line stroke="currentColor" strokeWidth="1.5" x1="0" x2="100" y1="0" y2="100" />
                          <line stroke="currentColor" strokeWidth="1.5" x1="100" x2="0" y1="0" y2="100" />
                        </svg>
                      </div>
                      <div className="flex flex-1 flex-col p-10">
                        <div className="mb-[14px] flex items-start justify-between gap-4">
                          <h3 className="itt-display text-[32px] font-bold uppercase tracking-[-0.01em]">{t(`landing.process.steps.${step.id}.title`)}</h3>
                          <span className="itt-display flex-shrink-0 text-[40px] font-bold text-[var(--border-strong)]">{step.no}</span>
                        </div>
                        <p className="mb-[26px] max-w-[420px] text-[15px] leading-[1.65] text-[var(--fg-muted)]">{t(`landing.process.steps.${step.id}.desc`)}</p>
                        <ul className="mt-auto grid grid-cols-2 gap-3">
                          {asList(t(`landing.process.steps.${step.id}.bullets`, { returnObjects: true })).map((bullet) => (
                            <li key={bullet} className="flex items-center gap-[9px] text-[13px] text-[var(--fg-muted)]">
                              <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[var(--primary)]" />
                              <span className="truncate">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="home-whyus" className="bg-[var(--bg)] px-8 py-24">
        <div className="mx-auto max-w-[1080px]">
          <div className="mx-auto mb-14 max-w-[600px] text-center">
            <h2 className="itt-display mb-4 text-[40px] font-bold uppercase leading-[1.05] tracking-[-0.025em]">{t("landing.whyUs.title")}</h2>
            <p className="text-[15px] leading-[1.6] text-[var(--fg-muted)]">{t("landing.whyUs.subtitle")}</p>
          </div>

          <div className="mb-[72px] grid grid-cols-1 gap-[18px] md:grid-cols-12 md:auto-rows-[104px]">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[30px] text-center md:col-span-4 md:row-span-2 md:flex md:flex-col md:items-center md:justify-center"><div className="itt-display mb-2 text-[60px] font-bold tracking-[-0.03em]">5+</div><div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{t("landing.whyUs.stats.experience")}</div></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[22px] text-center md:col-span-3 md:flex md:flex-col md:items-center md:justify-center"><div className="itt-display mb-[5px] text-[30px] font-bold">30+</div><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--fg-muted)]">{t("landing.whyUs.stats.clients")}</div></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[30px] text-center md:col-span-5 md:row-span-2 md:flex md:flex-col md:items-center md:justify-center"><div className="itt-display mb-2 text-[60px] font-bold tracking-[-0.03em]">100+</div><div className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{t("landing.whyUs.stats.engineers")}</div></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[22px] text-center md:col-span-3 md:flex md:flex-col md:items-center md:justify-center"><div className="itt-display mb-[5px] text-[30px] font-bold">98%</div><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--fg-muted)]">{t("landing.whyUs.stats.retention")}</div></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[26px] text-center md:col-span-3 md:row-span-2 md:flex md:flex-col md:items-center md:justify-center"><div className="itt-display mb-[6px] text-[52px] font-bold tracking-[-0.03em]">50+</div><div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--fg-muted)]">{t("landing.whyUs.stats.projects")}</div></div>
            <div className="relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[26px] text-center md:col-span-6 md:row-span-2 md:flex md:flex-col md:items-center md:justify-center"><div className="pointer-events-none absolute left-1/2 top-1/2 h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2 border border-[var(--fg-muted)]"><div className="absolute left-[-20%] top-1/2 h-px w-[140%] -translate-y-1/2 rotate-45 bg-[var(--fg-muted)]" /><div className="absolute left-[-20%] top-1/2 h-px w-[140%] -translate-y-1/2 -rotate-45 bg-[var(--fg-muted)]" /></div><h3 className="itt-display relative z-10 text-[18px] font-bold uppercase tracking-[0.04em]">{t("landing.whyUs.dedicated")}</h3></div>
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[26px] text-center md:col-span-3 md:row-span-2 md:flex md:flex-col md:items-center md:justify-center"><div className="itt-display mb-[6px] text-[52px] font-bold tracking-[-0.03em]">10+</div><div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--fg-muted)]">{t("landing.whyUs.stats.industries")}</div></div>
          </div>

          <div>
            <p className="itt-mono mb-[26px] text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-subtle)]">{t("landing.whyUs.trustedBy")}</p>
            <div className="overflow-hidden border-y border-[var(--border)] py-7">
              <div className="flex items-center itt-marquee w-max gap-14">
                {[...brands, ...brands].map((brand, index) => (
                  <div key={`${brand}-${index}`} className="flex flex-none items-center gap-[9px] opacity-50">
                    <div className="relative h-[22px] w-[22px] rounded-[5px] border border-[var(--border-strong)]">
                      <div className="absolute left-[-20%] top-1/2 h-[1.5px] w-[140%] -translate-y-1/2 rotate-45 bg-[var(--fg-subtle)]" />
                      <div className="absolute left-[-20%] top-1/2 h-[1.5px] w-[140%] -translate-y-1/2 -rotate-45 bg-[var(--fg-subtle)]" />
                    </div>
                    <span className="itt-display whitespace-nowrap text-[18px] font-bold tracking-[-0.01em] text-[var(--fg-muted)]">{brand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="home-faq" className="bg-[var(--surface-2)] px-8 py-24">
        <div className="mx-auto max-w-[840px]">
          <div className="mx-auto mb-14 max-w-[620px] text-center">
            <div className="itt-mono mb-3 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{t("landing.faq.eyebrow")}</div>
            <h2 className="mb-4 text-[46px] font-bold uppercase leading-[1.03] tracking-[-0.03em]">{t("landing.faq.title")}</h2>
            <p className="text-[15px] leading-7 text-[var(--fg-muted)]">{t("landing.faq.subtitle")}</p>
          </div>
          <div className="flex flex-col gap-4">
            {faqItems.map((item, index) => {
              const open = faqOpen === index;
              return (
                <div key={item.id} className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)]">
                  <Button className="h-auto w-full justify-between gap-4 px-6 py-5 text-left" onClick={() => setFaqOpen(open ? null : index)} type="button" variant="ghost">
                    <span className="text-[18px] font-semibold tracking-[-0.01em]">{t(`landing.faq.items.${item.id}.q`)}</span>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--fg-muted)]">{open ? "−" : "+"}</span>
                  </Button>
                  {open ? <div className="border-t border-[var(--border)] px-6 py-5 text-[14.5px] leading-7 text-[var(--fg-muted)]">{t(`landing.faq.items.${item.id}.a`)}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] px-8 py-[120px]">
        <div className="mx-auto max-w-[820px] text-center">
          <h2 className="mb-10 text-[60px] font-bold uppercase leading-[1.02] tracking-[-0.02em]">{t("landing.cta.title")}</h2>
          <Button className="group h-[60px] px-11 text-[17px] font-bold" onClick={() => navigate("/register")} shape="pill" type="button">
            {t("landing.startProject")}
          </Button>
        </div>
      </section>
    </main>
  );
}
