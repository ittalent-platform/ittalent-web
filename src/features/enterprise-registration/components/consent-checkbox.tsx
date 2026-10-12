import type { ComponentProps, ReactNode } from "react";

/** A checkbox with a bold label and a hint line, as in the certificate form's "suggest" option. */
export function ConsentCheckbox({ error, hint, id, label, ...input }: { error?: ReactNode; hint?: ReactNode; id: string; label: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4">
      <input className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-(--primary)" id={id} type="checkbox" {...input} />
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-[13.5px] font-semibold text-foreground" htmlFor={id}>{label}</label>
        {hint ? <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">{hint}</p> : null}
        {error ? <p className="m-0 text-[12.5px] leading-normal text-(--danger-fg)" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
