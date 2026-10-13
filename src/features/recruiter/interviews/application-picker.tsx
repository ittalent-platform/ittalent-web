import { Search } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { PersonAvatar } from "@/components/common/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { hasUnsafeSearchText } from "@/lib/search-validation";
import { cn } from "@/lib/utils";

import { type SchedulableApplication, INTERVIEW_SEARCH_MAX_LENGTH } from "./interviews.constants";
import { applicantName, initialsName } from "./interviews.format";
import { useSchedulableApplications } from "./interviews.queries";

const SEARCH_DELAY_MS = 250;
const BLUR_CLOSE_DELAY_MS = 120;

const applicationLabel = (application: SchedulableApplication) => `${applicantName(application.applicant)} — ${application.job.title ?? "—"}`;

type ApplicationPickerProps = {
  id: string;
  invalid?: boolean;
  onChange: (application: SchedulableApplication) => void;
  value: SchedulableApplication | null;
};

/** Searches the applications an interview can still be scheduled for (by applicant or job) and picks one. */
export function ApplicationPicker({ id, invalid, onChange, value }: ApplicationPickerProps) {
  const { t } = useTranslation();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [highlight, setHighlight] = useState(0);
  const keyword = useDebouncedValue(text, SEARCH_DELAY_MS);
  const unsafe = hasUnsafeSearchText(keyword);
  const results = useSchedulableApplications(unsafe ? "" : keyword, { enabled: open && !unsafe });
  const items = unsafe ? [] : (results.data?.items ?? []);

  function pick(application: SchedulableApplication) {
    onChange(application);
    setText("");
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => (items.length === 0 ? 0 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const chosen = items[highlight];
      if (chosen) pick(chosen);
    }
  }

  return (
    <div className="relative">
      <Input
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        aria-invalid={invalid}
        autoComplete="off"
        className="pr-10"
        id={id}
        maxLength={INTERVIEW_SEARCH_MAX_LENGTH}
        onBlur={() => window.setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)}
        onChange={(event) => {
          setText(event.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => {
          setText("");
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={value ? undefined : t("interviews.schedule.applicationPlaceholder")}
        role="combobox"
        value={open ? text : value ? applicationLabel(value) : ""}
      />
      <Search aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

      {open ? (
        <ul
          aria-label={t("interviews.schedule.applications")}
          className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full list-none overflow-y-auto rounded-lg border border-border bg-card p-0 shadow-lg"
          id={listId}
          role="listbox"
        >
          {items.map((application, index) => (
            <li
              aria-selected={application.id === value?.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 border-t border-border px-3.5 py-2.5 first:border-t-0",
                index === highlight && "bg-muted",
                application.id === value?.id && "font-semibold text-primary",
              )}
              key={application.id}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(application);
              }}
              onMouseEnter={() => setHighlight(index)}
              role="option"
            >
              <PersonAvatar className="size-8 text-[11px]" name={initialsName(applicantName(application.applicant))} tone="peach" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] text-foreground">{applicantName(application.applicant)}</span>
                <span className="truncate text-[12.5px] text-muted-foreground">{application.job.title ?? "—"}</span>
              </span>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="px-3.5 py-3 text-[13.5px] text-muted-foreground" role="presentation">
              {results.isFetching && !unsafe ? t("interviews.schedule.searching") : t("interviews.schedule.noApplications")}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

/** The applicant, the job and the stage of the application chosen, so the recruiter sees what they are scheduling. */
export function ApplicationSummary({ application }: { application: SchedulableApplication }) {
  const { t } = useTranslation();
  const name = applicantName(application.applicant);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar className="size-10 text-[13px]" name={initialsName(name)} tone="peach" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-foreground">{name}</p>
          <p className="truncate text-[13px] text-muted-foreground">{application.applicant.email ?? "—"}</p>
        </div>
      </div>
      <dl className="m-0 flex flex-col gap-2 border-t border-border pt-3 text-[13.5px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{t("interviews.schedule.job")}</dt>
          <dd className="m-0 min-w-0 truncate font-semibold text-foreground">{application.job.title ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{t("interviews.schedule.applicationStatus")}</dt>
          <dd className="m-0">
            <Badge variant="info">{t(`applications.status.${application.status}`)}</Badge>
          </dd>
        </div>
      </dl>
      <p className="text-[12.5px] text-muted-foreground">{t("interviews.schedule.statusUnchanged")}</p>
    </div>
  );
}
