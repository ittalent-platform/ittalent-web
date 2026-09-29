import type { ReactNode } from "react";

export function AuthStatusCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-[560px] rounded-[1.1rem] border border-black/15 bg-(--app-canvas) p-10 shadow-[0_28px_90px_rgba(25,25,28,0.14),0_10px_28px_rgba(25,25,28,0.08)] sm:p-12 ${className}`}
    >
      {children}
    </div>
  );
}
