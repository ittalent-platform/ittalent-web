import { Link } from "react-router";

export type BreadcrumbItem = { label: string; to?: string; mono?: boolean };

/** "Parent / current" above a page title; the current item is 600 and mono for record ids. */
export function Breadcrumb({ ariaLabel, items }: { ariaLabel: string; items: BreadcrumbItem[] }) {
  return (
    <nav aria-label={ariaLabel} className="flex min-w-0 flex-1 gap-2 text-[13.5px] text-muted-foreground">
      {items.map((item, index) => (
        <span className="flex min-w-0 gap-2" key={item.label}>
          {index > 0 ? <span aria-hidden>/</span> : null}
          {item.to ? (
            <Link className="font-semibold text-fg-link hover:underline" to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page" className={item.mono ? "itt-mono" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
