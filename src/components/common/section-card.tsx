import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  /** Right side of the title row, e.g. a count or an "Edit" link. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** One line under the title, e.g. what a form section asks for. */
  description?: ReactNode;
  id?: string;
  title?: ReactNode;
};

/** A titled white card: the building block of detail and form pages. */
export function SectionCard({ actions, children, className, description, id, title }: SectionCardProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={title ? headingId : undefined} className={cn("surface-card flex min-w-0 flex-col gap-[18px] p-[22px]", className)} id={id}>
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-[15px] font-bold text-foreground" id={headingId}>{title}</h2>
            {description ? <p className="m-0 text-[13px] text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
