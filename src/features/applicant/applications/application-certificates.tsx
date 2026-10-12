import { Award, ExternalLink, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ApplicationDetailDto } from "@/api/generated/types.gen";

import { formatDate } from "./application-formatters";

type SentCertificate = ApplicationDetailDto["certificates"][number];

/** A stored "YYYY-MM-DD" read as a local calendar day, so no time zone moves it to the day before. */
const calendarDay = (value: string, locale: string) => formatDate(`${value}T00:00:00`, locale);

/** BR-S4-LINK-004/006: the copies sent with the application, as they were when it was sent. */
export function ApplicationCertificates({ certificates }: { certificates: SentCertificate[] }) {
  const { t, i18n } = useTranslation();
  if (!certificates.length) return null;
  const locale = i18n.language;

  return (
    <section aria-labelledby="application-certificates" className="surface-card p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="m-0 eyebrow" id="application-certificates">{t("applications.certificates.title")}</h2>
        <span className="itt-mono text-[11px] text-muted-foreground">{certificates.length}</span>
      </div>
      <ul className="m-0 list-none p-0">
        {certificates.map((item) => {
          const meta = [
            item.issuer,
            item.issuedDate ? t("applications.certificates.issued", { date: calendarDay(item.issuedDate, locale) }) : null,
            item.expiryDate ? t("applications.certificates.expires", { date: calendarDay(item.expiryDate, locale) }) : null,
          ].filter(Boolean).join(" · ");
          return (
            <li className="flex items-center gap-3 border-b border-border py-3 last:border-b-0" key={item.id}>
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><Award className="size-4" /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="wrap-anywhere text-sm font-semibold text-foreground">{item.name}</span>
                {meta ? <span className="text-[13px] text-muted-foreground">{meta}</span> : null}
              </span>
              <a
                aria-label={t("applications.certificates.openLabel", { name: item.name })}
                className="inline-flex shrink-0 items-center gap-1 text-[13.5px] font-semibold text-fg-link hover:underline"
                href={item.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t("applications.certificates.open")}
                <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </li>
          );
        })}
      </ul>
      <p className="m-0 mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Info aria-hidden className="size-3.5 shrink-0" />
        {t("applications.certificates.note")}
      </p>
    </section>
  );
}
