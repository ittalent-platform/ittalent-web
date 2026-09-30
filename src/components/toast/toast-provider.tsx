import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export type ToastTone = "success" | "warning" | "error";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastInput = {
  /** Secondary action rendered before Dismiss, e.g. "Undo" for a reversible change. */
  action?: ToastAction;
  dismissLabel?: string;
  durationMs?: number;
  message: string;
  note?: string;
  title: string;
  tone: ToastTone;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  dismissToast: (id: string) => void;
  showToast: (toast: ToastInput) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_TONE_DURATION_MS: Record<ToastTone, number> = {
  success: 5000,
  warning: 6000,
  error: 6500,
};
const MAX_VISIBLE_TOASTS = 3;

function getToastStyles(tone: ToastTone) {
  switch (tone) {
    case "success":
      return {
        body: "border-transparent bg-foreground shadow-[0_8px_20px_rgba(25,25,28,0.25)]",
        dismiss: "text-white/55 hover:text-white",
        icon: "text-(--status-toast-accent)",
        message: "text-white",
        note: "text-white/45",
        title: "text-(--status-toast-accent)",
      };
    case "warning":
      return {
        body: "border-(--status-warning-border) bg-(--status-warning-bg)",
        dismiss: "text-(--status-warning-fg)/75 hover:text-(--status-warning-fg)",
        icon: "text-(--status-warning-fg)",
        message: "text-(--status-warning-fg)",
        note: "text-(--fg-faint)",
        title: "text-(--status-warning-fg)",
      };
    case "error":
    default:
      return {
        body: "border-(--border-muted) bg-(--surface-4)",
        dismiss: "text-muted-foreground hover:text-foreground",
        icon: "text-muted-foreground",
        message: "text-(--status-neutral-fg)",
        note: "text-(--fg-faint)",
        title: "text-muted-foreground",
      };
  }
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  switch (tone) {
    case "success":
      return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
          <path
            d="M3.5 8.2 6.6 11 12.5 4.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "warning":
      return (
        <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.5V8l2.3 1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case "error":
    default:
      return <span aria-hidden="true" className="text-[15px] font-bold leading-none">!</span>;
  }
}

function ToastCard({ toast, onDismiss }: { onDismiss: (id: string) => void; toast: ToastItem }) {
  const styles = getToastStyles(toast.tone);
  const { t } = useTranslation();
  const dismissLabel = toast.dismissLabel ?? t("toast.dismiss");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <article
      aria-live="polite"
      className={`pointer-events-auto w-full transform transition-all duration-200 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
      role="status"
    >
      <div className={`flex gap-2.5 rounded-[0.75rem] border px-3.5 py-3 ${styles.body}`}>
        <span className={`${styles.icon} mt-0.5 flex-shrink-0`}>
          <ToastIcon tone={toast.tone} />
        </span>

        <div className="min-w-0 flex-1">
          <p className={`m-0 line-clamp-2 break-all text-[13px] leading-[1.5] ${styles.message}`} title={toast.message}>{toast.message}</p>
          {toast.note ? <p className={`mt-1.5 wrap-anywhere text-[11.5px] leading-[1.45] ${styles.note}`}>{toast.note}</p> : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {toast.action ? (
            <button
              className={`rounded-md text-[12px] font-semibold underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${styles.title}`}
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              type="button"
            >
              {toast.action.label}
            </button>
          ) : null}
          <button
            className={`rounded-md text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${styles.dismiss}`}
            type="button"
            onClick={() => onDismiss(toast.id)}
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function ToastViewport({ onDismiss, toasts }: { onDismiss: (id: string) => void; toasts: ToastItem[] }) {
  const { t } = useTranslation();
  return (
    <div
      aria-label={t("toast.region")}
      className="pointer-events-none fixed bottom-4 right-4 z-[1200] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutIds = useRef(new Map<string, number>());
  const nextId = useRef(0);

  const dismissToast = useCallback((id: string) => {
    const timeoutId = timeoutIds.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIds.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${++nextId.current}`;
    const timeoutMs = toast.durationMs ?? DEFAULT_TONE_DURATION_MS[toast.tone];

    setToasts((current) => {
      const next = [...current, { ...toast, id }];
      return next.length > MAX_VISIBLE_TOASTS ? next.slice(next.length - MAX_VISIBLE_TOASTS) : next;
    });

    if (timeoutMs > 0) {
      const timeoutId = window.setTimeout(() => {
        timeoutIds.current.delete(id);
        setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
      }, timeoutMs);

      timeoutIds.current.set(id, timeoutId);
    }

    return id;
  }, []);

  useEffect(() => {
    const activeTimeoutIds = timeoutIds.current;

    return () => {
      for (const timeoutId of activeTimeoutIds.values()) {
        window.clearTimeout(timeoutId);
      }
      activeTimeoutIds.clear();
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      dismissToast,
      showToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
