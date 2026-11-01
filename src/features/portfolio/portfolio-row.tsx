import { ExternalLink, Link2, MoreVertical, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PortfolioLink } from "@/api/generated/types.gen";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isInsecureLink, linkHost } from "@/lib/web-link";

type PortfolioRowProps = {
  highlighted?: boolean;
  item: PortfolioLink;
  onDelete: () => void;
  onEdit: () => void;
};

const ITEM_CLASS = "gap-2.5 px-3.5 py-2.5 text-[13.5px]";

export function PortfolioRow({ highlighted, item, onDelete, onEdit }: PortfolioRowProps) {
  const { t } = useTranslation();
  return (
    <li className={cn("flex gap-4 surface-card px-5 py-[18px] transition-colors", highlighted && "border-primary/30 bg-primary/5")}>
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
        <Link2 className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="wrap-anywhere text-[15px] font-bold text-foreground">{item.title}</h3>
        <p className={cn("wrap-anywhere whitespace-pre-line text-[13.5px] leading-[1.55]", item.description ? "text-mkt-ink-2" : "text-muted-foreground")}>
          {item.description ?? t("portfolio.noDescription")}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a className="inline-flex min-w-0 items-center gap-1 text-[13.5px] font-semibold text-foreground hover:underline" href={item.url} rel="noopener noreferrer" target="_blank" title={item.url}>
            <span className="truncate">{linkHost(item.url)}</span>
            <ExternalLink aria-hidden className="size-3.5 shrink-0 text-primary" />
            <span className="sr-only">{t("portfolio.opensInNewTab")}</span>
          </a>
          {isInsecureLink(item.url) ? <Badge className="gap-1" variant="warning"><TriangleAlert aria-hidden className="size-3" />{t("portfolio.notHttps")}</Badge> : null}
          <span className="text-[13px] text-muted-foreground">{t("portfolio.version", { version: item.version })}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label={t("portfolio.actionsFor", { name: item.title })} className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted" type="button">
            <MoreVertical aria-hidden className="size-4 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl py-1">
          <DropdownMenuItem className={ITEM_CLASS} onSelect={onEdit}><Pencil className="size-4" />{t("portfolio.edit")}</DropdownMenuItem>
          <DropdownMenuItem className={ITEM_CLASS} onSelect={() => window.open(item.url, "_blank", "noopener,noreferrer")}><ExternalLink className="size-4" />{t("portfolio.openLink")}</DropdownMenuItem>
          <DropdownMenuItem className={cn(ITEM_CLASS, "text-destructive focus:text-destructive")} onSelect={onDelete}><Trash2 className="size-4" />{t("portfolio.deleteMenu")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
