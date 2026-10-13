import type { ReactNode } from "react";

type DirectoryHeroProps = {
  /** Decorative tiles or chips on the right (desktop only). */
  art: ReactNode;
  /** Ember second line of the title. */
  accent: string;
  badge: string;
  description: string;
  title: string;
};

/** Dark dotted hero of the Jobs and Companies directories, with the ember circle on the right. */
export function DirectoryHero({
  accent,
  art,
  badge,
  description,
  title,
}: DirectoryHeroProps) {
  return (
    <section
      className="relative overflow-hidden bg-mkt-ink hero-dots px-4 pb-24 pt-[52px] text-white md:px-12"
      id="page-hero"
    >
      <div className="absolute -right-40 -top-[300px] size-[640px] rounded-full bg-mkt-brand" />
      <div className="absolute -right-[60px] -top-[220px] size-[460px] rounded-full border-2 border-white/35" />
      <div className="relative mx-auto flex max-w-[1344px] items-center gap-12">
        <div className="flex flex-1 flex-col gap-3.5">
          <span className="flex h-7 items-center gap-2 self-start rounded-full border border-white/[0.14] bg-white/[0.08] px-3.5 text-[12.5px] font-semibold text-mkt-on-dark-soft">
            <span className="size-[7px] rounded-full bg-mkt-brand" />
            {badge}
          </span>
          <h1 className="itt-display text-[36px] font-semibold leading-[1.08] md:text-[48px]">
            {title}
            <br />
            <span className="text-mkt-brand">{accent}</span>
          </h1>
          <p className="max-w-[520px] text-base leading-[1.6] text-mkt-on-dark">
            {description}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="relative hidden h-[210px] w-[420px] shrink-0 lg:block"
        >
          {art}
        </div>
      </div>
    </section>
  );
}

/** White search card that overlaps the bottom of a DirectoryHero. */
export function FloatingSearchCard({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      className="relative z-[2] mx-auto -mt-[50px] flex w-[calc(100%-2rem)] max-w-[1344px] flex-col gap-4 rounded-[20px] border border-mkt-line bg-white p-5 shadow-[0_10px_24px_rgba(25,25,28,0.1)] md:w-[calc(100%-6rem)]"
    >
      {children}
    </section>
  );
}
