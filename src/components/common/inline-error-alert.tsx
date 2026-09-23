import type { ReactNode } from "react";

export function InlineErrorAlert({ children }: { children: ReactNode }) {
  // No background, no border, no title — a plain red message line (matches the login error style).
  return <p className="m-0 text-[13px] leading-[1.5] text-destructive">{children}</p>;
}
