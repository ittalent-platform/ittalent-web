import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";

interface AuthCenteredShellProps {
  children: ReactNode;
  className?: string;
}

export function AuthCenteredShell({
  children,
  className = "",
}: AuthCenteredShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-(--app-canvas) px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-center">
        <BrandLogo />
      </div>

      <div
        className={`w-full max-w-[520px] rounded-[16px] border border-(--border-muted) bg-white p-[26px_28px] sm:p-[32px_30px] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
