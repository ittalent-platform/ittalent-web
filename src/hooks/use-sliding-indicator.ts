import { useLayoutEffect, useRef } from "react";

const KEY_ATTRIBUTE = "data-slide-key";

/**
 * Moves one indicator (an underline or a pill) under whichever item of a nav is active, so switching
 * items slides instead of jumping. Put `containerRef` on a `position: relative` element, mark each item
 * with `{...slideKey("name")}` and pass the active name; render an absolutely positioned
 * `<span ref={indicatorRef} aria-hidden />` inside. The first placement is instant (no slide on load).
 * `activeKey` null hides the indicator.
 */
export function useSlidingIndicator<Container extends HTMLElement>(activeKey: string | null) {
  const containerRef = useRef<Container | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const place = () => {
      const active = activeKey ? container.querySelector<HTMLElement>(`[${KEY_ATTRIBUTE}="${activeKey}"]`) : null;
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
      indicator.style.opacity = "1";
    };

    place();
    // Enable the slide only after the first placement so the indicator does not fly in from the left.
    const frame = requestAnimationFrame(() => {
      indicator.dataset.ready = "true";
    });
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
    };
  }, [activeKey]);

  return { containerRef, indicatorRef };
}

export const slideKey = (key: string) => ({ [KEY_ATTRIBUTE]: key });
