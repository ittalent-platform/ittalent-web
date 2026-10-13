import { X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { PersonAvatar } from "@/components/common/person-avatar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

import { EMAIL_PATTERN, SCHEDULE_LIMITS, type InterviewerOption } from "./interviews.constants";
import { initialsName } from "./interviews.format";
import { useFindInterviewerByEmail, useInterviewerSearch } from "./interviews.queries";

const SEARCH_DELAY_MS = 250;
const BLUR_CLOSE_DELAY_MS = 120;
const SEPARATOR_KEYS = new Set(["Enter", ",", ";"]);

type InterviewerEmailInputProps = {
  /** An error from outside (for example the API refusing the interviewers); the input's own checks take precedence. */
  error?: string | undefined;
  id: string;
  onChange: (interviewers: InterviewerOption[]) => void;
  value: InterviewerOption[];
};

/**
 * Interviewers are chosen by email. An address is checked as it is added: it must look like an email, belong to an
 * active recruiter of the company, and not be there already. Matching recruiters are suggested while typing.
 */
export function InterviewerEmailInput({ error, id, onChange, value }: InterviewerEmailInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<number | null>(null);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);
  const keyword = useDebouncedValue(draft, SEARCH_DELAY_MS);
  const suggestions = useInterviewerSearch(keyword, { enabled: focused });
  const findByEmail = useFindInterviewerByEmail();

  const taken = new Set(value.map((person) => person.id));
  const options = (suggestions.data?.items ?? []).filter((person) => !taken.has(person.id));
  const shownError = problem ?? error;

  function add(person: InterviewerOption) {
    onChange([...value, person]);
    setDraft("");
    setProblem(null);
  }

  async function commit(text: string) {
    const email = text.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_PATTERN.test(email)) return setProblem(t("interviews.schedule.errors.emailInvalid"));
    if (value.some((person) => person.email.toLowerCase() === email)) return setProblem(t("interviews.schedule.errors.emailDuplicate"));
    if (value.length >= SCHEDULE_LIMITS.interviewers) return setProblem(t("interviews.schedule.errors.interviewersMax", { count: SCHEDULE_LIMITS.interviewers }));
    try {
      const person = await findByEmail(email);
      if (person) add(person);
      else setProblem(t("interviews.schedule.errors.emailUnknown"));
    } catch {
      setProblem(t("interviews.schedule.errors.emailLookup"));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (SEPARATOR_KEYS.has(event.key) && draft.trim()) {
      event.preventDefault();
      void commit(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-[46px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          shownError ? "border-(--field-error) focus-within:ring-(--field-error)/20" : "border-(--border-muted)",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((person) => (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-(--status-peach-bg) py-1 pl-2.5 pr-1.5 text-[12.5px] font-semibold text-(--status-peach-fg)" key={person.id}>
            <span className="truncate">{person.email}</span>
            <button
              aria-label={t("interviews.schedule.removeInterviewer", { email: person.email })}
              className="grid size-4 shrink-0 cursor-pointer place-items-center rounded-full outline-none hover:bg-(--status-peach-fg)/15 focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={(event) => {
                event.stopPropagation();
                onChange(value.filter((item) => item.id !== person.id));
              }}
              type="button"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-describedby={shownError ? `${id}-error` : undefined}
          aria-invalid={Boolean(shownError)}
          autoComplete="off"
          className="min-w-[160px] flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          id={id}
          onBlur={() => {
            if (typeof window !== "undefined") {
              if (blurTimerRef.current !== null) {
                window.clearTimeout(blurTimerRef.current);
              }
              blurTimerRef.current = window.setTimeout(() => {
                if (typeof window !== "undefined") {
                  setFocused(false);
                }
              }, BLUR_CLOSE_DELAY_MS);
            } else {
              setFocused(false);
            }
            if (draft.trim()) void commit(draft);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            setProblem(null);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? t("interviews.schedule.interviewersPlaceholder") : undefined}
          ref={inputRef}
          type="email"
          value={draft}
        />
      </div>

      {focused && options.length > 0 ? (
        <ul
          aria-label={t("interviews.schedule.interviewerSuggestions")}
          className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full list-none overflow-y-auto rounded-lg border border-border bg-card p-0 shadow-lg"
          role="listbox"
        >
          {options.map((person) => (
            <li
              className="flex cursor-pointer items-center gap-3 border-t border-border px-3.5 py-2.5 first:border-t-0 hover:bg-muted"
              key={person.id}
              onMouseDown={(event) => {
                event.preventDefault();
                add(person);
              }}
              role="option"
            >
              <PersonAvatar className="size-7 text-[10px]" name={initialsName(person.fullName ?? person.email)} tone="peach" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] text-foreground">{person.email}</span>
                {person.fullName ? <span className="truncate text-[12px] text-muted-foreground">{person.fullName}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {shownError ? (
        <p className="mt-2 text-[12.5px] leading-normal text-(--danger-fg)" id={`${id}-error`} role="alert">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
