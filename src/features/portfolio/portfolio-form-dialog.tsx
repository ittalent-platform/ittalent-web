import { Info, RefreshCw, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "@/api/http-status";
import type { RequestError } from "@/api/request-error";
import type { CreatePortfolioLinkRequest, PortfolioLink, UpdatePortfolioLinkRequest } from "@/api/generated/types.gen";
import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { Callout } from "@/components/common/callout";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { hasLinkCredentials, isWebLink, linkSummary } from "@/lib/web-link";

import { PORTFOLIO_LIMITS } from "./portfolio.constants";
import { useCreatePortfolioItem, useUpdatePortfolioItem } from "./portfolio.queries";

type Values = { description: string; title: string; url: string };
type FieldErrors = Partial<Record<keyof Values, string>>;

const OPTIONAL_CLASS = "text-[12.5px] font-normal text-muted-foreground";

export function validatePortfolioItem(values: Values): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title.trim()) errors.title = "portfolio.form.errors.title";
  if (!values.url.trim()) errors.url = "portfolio.form.errors.urlRequired";
  else if (!isWebLink(values.url)) errors.url = hasLinkCredentials(values.url) ? "portfolio.form.errors.urlCredentials" : "portfolio.form.errors.url";
  return errors;
}

/** Only what the candidate changed, so a link-only edit keeps the title and description exactly as they were (UC-S4-PORT-02 A1). */
function changedFields(item: PortfolioLink, values: Values): Omit<UpdatePortfolioLinkRequest, "expectedVersion"> {
  const title = values.title.trim();
  const url = values.url.trim();
  const description = values.description.trim();
  return {
    ...(title !== item.title ? { title } : {}),
    ...(url !== item.url ? { url } : {}),
    ...(description !== (item.description ?? "") ? { description: description || null } : {}),
  };
}

/** No HTTP answer at all: the request may or may not have reached the server. */
const isConnectionLost = (error: unknown) => (error as RequestError).status === undefined;

const withIcon = (message?: string) => (message ? <span className="inline-flex items-start gap-1.5"><TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />{message}</span> : undefined);

type PortfolioFormDialogProps = {
  item?: PortfolioLink;
  onConflict: () => void;
  onMissing: () => void;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: PortfolioLink) => void;
};

export function PortfolioFormDialog({ item, onConflict, onMissing, onOpenChange, onSaved }: PortfolioFormDialogProps) {
  const { t } = useTranslation();
  const editing = Boolean(item);
  const [values, setValues] = useState<Values>({ description: item?.description ?? "", title: item?.title ?? "", url: item?.url ?? "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const create = useCreatePortfolioItem();
  const update = useUpdatePortfolioItem();
  // The same entries keep the same key, so a retry replays instead of adding a second item; changed entries get a new key, or the server refuses the reuse.
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const keyFor = (body: CreatePortfolioLinkRequest) => {
    const serialized = JSON.stringify(body);
    if (attempt.current?.body !== serialized) attempt.current = { body: serialized, key: crypto.randomUUID() };
    return attempt.current.key;
  };
  const pending = create.isPending || update.isPending;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function add() {
    const description = values.description.trim();
    const body = { title: values.title.trim(), url: values.url.trim(), ...(description ? { description } : {}) };
    const send = () => create.mutateAsync({ body, key: keyFor(body) });
    try {
      return await send();
    } catch (error) {
      if (!isConnectionLost(error)) throw error;
      // Connection lost: ask again with the same key. The server answers with the item if the first request got through.
      setChecking(true);
      return await send();
    } finally {
      setChecking(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validatePortfolioItem(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setFailure(null);
    try {
      if (item) {
        const changes = changedFields(item, values);
        if (!Object.keys(changes).length) return onOpenChange(false);
        onSaved(await update.mutateAsync({ body: { expectedVersion: item.version, ...changes }, id: item.id }));
      } else {
        onSaved(await add());
      }
    } catch (error) {
      const { code, status } = error as RequestError;
      if (code === "DUPLICATE_PORTFOLIO_URL") setErrors({ url: "portfolio.form.errors.duplicate" });
      else if (code === "VERSION_CONFLICT") onConflict();
      else if (status === HTTP_NOT_FOUND) onMissing();
      else if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) setFailure(t("portfolio.form.errors.accessChanged"));
      else setFailure(t(editing ? "portfolio.form.errors.updateFailed" : "portfolio.form.errors.saveFailed"));
    }
  }

  const fieldError = (key: keyof FieldErrors) => withIcon(errors[key] ? t(errors[key]) : undefined);
  const linkChanged = item && isWebLink(values.url) && linkSummary(values.url) !== linkSummary(item.url);

  return (
    <Dialog onOpenChange={(open) => !pending && onOpenChange(open)} open>
      <DialogContent className="max-w-[560px] gap-0">
        <form noValidate onSubmit={(event) => void submit(event)}>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>{t(editing ? "portfolio.form.editTitle" : "portfolio.form.addTitle")}</DialogTitle>
            <DialogDescription className="text-[13.5px]">
              {item ? t("portfolio.form.editDescription", { date: formatDate(item.updatedAt), version: item.version }) : t("portfolio.form.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[calc(92vh-180px)] flex-col gap-4 overflow-y-auto px-[26px] pb-5 pt-2">
            {checking ? <Callout icon={RefreshCw} role="status" title={t("portfolio.form.checking.title")} tone="info">{t("portfolio.form.checking.description")}</Callout> : null}
            {failure ? <InlineBanner tone="error">{failure}</InlineBanner> : null}
            <FormField error={fieldError("title")} htmlFor="portfolio-title" label={t("portfolio.form.title")} required>
              <Input aria-invalid={Boolean(errors.title)} autoFocus id="portfolio-title" maxLength={PORTFOLIO_LIMITS.title} onChange={(event) => set("title", event.target.value)} placeholder={t("portfolio.form.titlePlaceholder")} value={values.title} />
            </FormField>
            <FormField error={fieldError("url")} hint={linkChanged ? t("portfolio.form.urlChanged", { previous: linkSummary(item.url) }) : t("portfolio.form.urlHint")} htmlFor="portfolio-url" label={t("portfolio.form.url")} required>
              <Input aria-invalid={Boolean(errors.url)} id="portfolio-url" inputMode="url" maxLength={PORTFOLIO_LIMITS.url} onChange={(event) => set("url", event.target.value)} placeholder="https://" value={values.url} />
            </FormField>
            <FormField hint={t("portfolio.form.descriptionHint")} htmlFor="portfolio-description" label={t("portfolio.form.description")} labelAddon={<span className={OPTIONAL_CLASS}>{t("portfolio.form.optional")}</span>}>
              <Textarea id="portfolio-description" maxLength={PORTFOLIO_LIMITS.description} onChange={(event) => set("description", event.target.value)} placeholder={t("portfolio.form.descriptionPlaceholder")} value={values.description} />
            </FormField>
          </div>
          <DialogFooter className="justify-between border-t-0 pt-0">
            {editing ? <span /> : (
              <p className="flex max-w-[16rem] gap-1.5 text-[12.5px] text-muted-foreground">
                <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {t("portfolio.form.privateNote")}
              </p>
            )}
            <div className="flex gap-3">
              <Button className={DIALOG_BUTTON_CLASS} disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">{t("actions.cancel")}</Button>
              <Button className={DIALOG_BUTTON_CLASS} disabled={pending} type="submit">
                {pending ? t(editing ? "portfolio.form.saving" : "portfolio.form.adding") : t(editing ? "portfolio.form.save" : "portfolio.form.add")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
