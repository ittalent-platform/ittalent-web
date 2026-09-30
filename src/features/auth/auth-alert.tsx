import type { ReactNode } from "react";

export type AuthAlertVariant = "error" | "warning" | "info";

interface AuthAlertProps {
  variant?: AuthAlertVariant;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function AuthAlert({
  variant = "error",
  children,
  action,
  className = "",
  id,
}: AuthAlertProps) {
  const role = variant === "error" ? "alert" : "status";

  const variantStyles = {
    error: "bg-(--danger-bg) border-(--danger-border) text-(--danger-fg)",
    warning: "bg-(--warning-bg) border-(--warning-border) text-(--warning-fg)",
    info: "bg-(--info-bg) border-(--info-border) text-(--info-fg)",
  }[variant];

  return (
    <div
      id={id}
      role={role}
      className={`flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[13px] leading-[1.5] ${variantStyles} ${className}`}
    >
      <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
        {variant === "error" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        )}
        {variant === "warning" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        )}
        {variant === "info" && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4 M12 8h.01" />
          </svg>
        )}
      </span>

      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">{children}</div>
        {action ? <div className="flex-shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
