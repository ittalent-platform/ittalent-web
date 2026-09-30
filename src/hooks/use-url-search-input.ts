import { useEffect, useRef, useState } from "react";

const COMMIT_DELAY_MS = 300;

/**
 * A search box whose text lives in the URL. The input keeps its own value so typing is never overwritten by
 * a router update that lands late (which dropped characters, and breaks IME input), and the URL follows
 * once the user pauses. Changes that come from the URL itself (back button, link) replace the text.
 */
export function useUrlSearchInput(urlValue: string, commit: (value: string) => void): [string, (value: string) => void] {
  const [text, setText] = useState(urlValue);
  const lastCommitted = useRef(urlValue);

  useEffect(() => {
    if (urlValue !== lastCommitted.current) {
      lastCommitted.current = urlValue;
      setText(urlValue);
    }
  }, [urlValue]);

  useEffect(() => {
    if (text === lastCommitted.current) return;
    const timer = setTimeout(() => {
      lastCommitted.current = text;
      commit(text);
    }, COMMIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, commit]);

  return [text, setText];
}
