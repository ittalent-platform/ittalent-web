import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-[46px] w-full rounded-md border border-(--border-muted) bg-card aria-invalid:border-(--field-error) px-3.5 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:border-(--field-error) aria-invalid:focus-visible:ring-(--field-error)/20 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
