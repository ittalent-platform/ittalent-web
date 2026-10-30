import { Award, ExternalLink, MoreVertical, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CertificateLink } from "@/api/generated/types.gen";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { isExpired } from "./certificate-display";
import { formatCalendarDate } from "@/lib/format";
import { isInsecureLink, linkHost } from "@/lib/web-link";

type CertificateRowProps = {
  certificate: CertificateLink;
  highlighted?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSuggestedChange: (suggested: boolean) => void;
  saving?: boolean;
};

const META_CLASS = "text-[13.5px] text-muted-foreground";

export function CertificateRow({ certificate, highlighted, onDelete, onEdit, onSuggestedChange, saving }: CertificateRowProps) {
  const { t } = useTranslation();
  const expired = isExpired(certificate);
  const switchId = `suggest-${certificate.id}`;
  return (
    <li className={cn("flex gap-4 surface-card px-5 py-[18px] transition-colors", highlighted && "border-primary/30 bg-primary/5")}>
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
        <Award className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="wrap-anywhere text-[15px] font-semibold text-foreground">{certificate.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <a
            className="inline-flex min-w-0 items-center gap-1 text-[13.5px] font-semibold text-foreground hover:underline"
            href={certificate.url}
            rel="noopener noreferrer"
            target="_blank"
            title={certificate.url}
          >
            <span className="truncate">{linkHost(certificate.url)}</span>
            <ExternalLink aria-hidden className="size-3.5 shrink-0 text-primary" />
            <span className="sr-only">{t("certificates.opensInNewTab")}</span>
          </a>
          {isInsecureLink(certificate.url) ? (
            <Badge className="gap-1" variant="warning"><TriangleAlert aria-hidden className="size-3" />{t("certificates.notHttps")}</Badge>
          ) : null}
          <span className={cn(META_CLASS, !certificate.issuer && "opacity-70")}>{certificate.issuer ?? t("certificates.noIssuer")}</span>
          {certificate.issuedDate ? <span className={META_CLASS}>{t("certificates.issuedOn", { date: formatCalendarDate(certificate.issuedDate) })}</span> : null}
          <span className={META_CLASS}>
            {certificate.expiryDate
              ? t(expired ? "certificates.expiredOn" : "certificates.expiresOn", { date: formatCalendarDate(certificate.expiryDate) })
              : t("certificates.noExpiry")}
          </span>
          {expired ? <Badge variant="neutral">{t("certificates.expired")}</Badge> : null}
          <span className={cn(META_CLASS, "opacity-70")}>{t("certificates.version", { version: certificate.version })}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-3">
        <label className="flex items-center gap-2.5 text-[13.5px] text-muted-foreground" htmlFor={switchId}>
          <span className="hidden sm:inline">{t("certificates.suggestOnApply")}</span>
          <Switch
            aria-label={t("certificates.suggestFor", { name: certificate.name })}
            checked={certificate.suggested}
            disabled={saving}
            id={switchId}
            onCheckedChange={onSuggestedChange}
          />
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={t("certificates.actionsFor", { name: certificate.name })} className="grid size-7 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted" type="button">
              <MoreVertical aria-hidden className="size-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl py-1">
            <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px]" onSelect={onEdit}><Pencil className="size-4" />{t("certificates.edit")}</DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px]" onSelect={() => window.open(certificate.url, "_blank", "noopener,noreferrer")}>
              <ExternalLink className="size-4" />{t("certificates.openLink")}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px] text-destructive focus:text-destructive" onSelect={onDelete}><Trash2 className="size-4" />{t("certificates.deleteMenu")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
