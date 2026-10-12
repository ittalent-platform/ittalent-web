import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { CertificateLink } from "@/api/generated/types.gen";
import { CERTIFICATES_PATH } from "@/config/routes";

type Props = {
  certificates: CertificateLink[];
  onChange: (ids: string[]) => void;
  value: string[];
};

/** BR-S4-LINK-003: the candidate's certificates, suggested ones pre-ticked; any can be unticked, or none sent. */
export function ApplyCertificatePicker({ certificates, onChange, value }: Props) {
  const { t } = useTranslation();
  const suggested = certificates.filter((item) => item.suggested);
  const tickedSuggested = suggested.filter((item) => value.includes(item.id)).length;
  const summary = value.length === 0
    ? t("applications.applyCertificates.noneTicked")
    : suggested.length
      ? t("applications.applyCertificates.tickedFromSuggestions", { count: tickedSuggested })
      : t("applications.applyCertificates.ticked", { count: value.length });

  return (
    <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
      <legend className="mb-1.5 p-0 text-[13.5px] font-semibold text-mkt-ink">
        {t("applications.applyCertificates.title")} <span className="font-normal text-mkt-muted">{t("applications.applyCertificates.optional")}</span>
      </legend>
      <ul className="m-0 max-h-[252px] list-none overflow-y-auto rounded-xl border border-mkt-line p-0">
        {certificates.map((item) => {
          const checked = value.includes(item.id);
          return (
            <li className="flex items-center gap-3 border-b border-mkt-line px-3.5 py-2.5 last:border-b-0" key={item.id}>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  checked={checked}
                  className="size-[18px] shrink-0 accent-mkt-accent"
                  onChange={() => onChange(checked ? value.filter((id) => id !== item.id) : [...value, item.id])}
                  type="checkbox"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[13.5px] font-semibold text-mkt-ink" title={item.name}>{item.name}</span>
                  {item.issuer ? <span className="truncate text-[12.5px] text-mkt-muted">{item.issuer}</span> : null}
                </span>
              </label>
              <a
                aria-label={t("applications.applyCertificates.open", { name: item.name })}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-mkt-muted hover:bg-mkt-chip hover:text-mkt-ink"
                href={item.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden className="size-4" />
              </a>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-mkt-muted">
        <span>{summary}</span>
        <Link className="font-semibold text-mkt-accent hover:underline" to={CERTIFICATES_PATH}>{t("applications.applyCertificates.manage")}</Link>
      </div>
    </fieldset>
  );
}
