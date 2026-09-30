import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormFieldLabel({ children, className, htmlFor, required }: { children: ReactNode; className?: string; htmlFor?: string; required?: boolean }) {
  return (
    <Label className={cn("mb-1.5 block text-[13.5px] font-semibold", className)} htmlFor={htmlFor}>
      {children} {required ? <span className="text-(--field-error)">*</span> : null}
    </Label>
  );
}

export function FormFieldMessage({ children, error }: { children?: ReactNode; error?: boolean }) {
  if (!children) return null;
  return <p className={cn("mt-1.5 text-xs", error ? "text-destructive" : "text-muted-foreground")}>{children}</p>;
}

/**
 * Label, control and one line below it: the error when there is one, otherwise the hint (Authentication design).
 * `labelExtra` sits at the right end of the label row, e.g. "Forgot password?".
 */
export function FormField({ children, className, error, hint, htmlFor, label, labelExtra, required }: { children: ReactNode; className?: string; error?: ReactNode; hint?: ReactNode; htmlFor: string; label: ReactNode; labelExtra?: ReactNode; required?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <FormFieldLabel className="mb-0" htmlFor={htmlFor} required={required}>
          {label}
        </FormFieldLabel>
        {labelExtra}
      </div>
      {children}
      {error ? (
        <p className="text-[12.5px] leading-normal text-(--danger-fg)" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] leading-normal text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormSectionLabel({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.05em] text-muted-foreground">{children}</p>;
}
