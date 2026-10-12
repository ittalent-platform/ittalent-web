import type { ReactNode } from "react";

export function StateCard({
  icon,
  iconBg,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="box-border flex min-h-[340px] flex-col items-center justify-center gap-3.5 rounded-2xl border border-mkt-line bg-white px-8 py-10 text-center">
      <span
        className="flex size-[60px] items-center justify-center rounded-full"
        style={{ background: iconBg }}
      >
        {icon}
      </span>
      <span className="font-['Space_Grotesk',sans-serif] text-[19px] font-semibold">
        {title}
      </span>
      <span className="max-w-[320px] text-[13.5px] leading-[1.55] text-mkt-ink-2">
        {description}
      </span>
      {children}
    </div>
  );
}