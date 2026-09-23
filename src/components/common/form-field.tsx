import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormFieldLabel({ children, htmlFor, required }: { children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <Label className="mb-1.5 block text-[13px] font-semibold" htmlFor={htmlFor}>
      {children} {required ? <span className="text-destructive">*</span> : null}
    </Label>
  );
}

export function FormFieldMessage({ children, error }: { children?: ReactNode; error?: boolean }) {
  if (!children) return null;
  return <p className={cn("mt-1.5 text-xs", error ? "text-destructive" : "text-muted-foreground")}>{children}</p>;
}

export function FormSectionLabel({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.05em] text-muted-foreground">{children}</p>;
}
