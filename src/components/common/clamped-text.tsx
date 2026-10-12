import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/** Long free text (a reason): wraps anywhere, clamps to 3 lines; Show more / Show less appears only when the clamp really hides text. */
export function ClampedText({ className, label, text }: { className?: string; label?: ReactNode; text: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || expanded) return;
    const measure = () => setTruncated(element.scrollHeight > element.clientHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <span className={cn("block min-w-0 wrap-anywhere", className)}>
      <span className={expanded ? "block" : "line-clamp-3"} data-clamped={!expanded && truncated ? "true" : undefined} ref={ref} title={!expanded && truncated ? text : undefined}>{label ? <>{label} </> : null}{text}</span>
      {truncated || expanded ? (
        <button aria-expanded={expanded} className="mt-1 rounded-md text-[12.5px] font-semibold underline underline-offset-2" onClick={() => setExpanded((value) => !value)} type="button">
          {expanded ? t("actions.showLess") : t("actions.showMore")}
        </button>
      ) : null}
    </span>
  );
}
