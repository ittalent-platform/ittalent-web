import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CertificateLink } from "@/api/generated/types.gen";
import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

import { CERTIFICATE_LIMITS } from "./certificates.constants";
import { useCreateCertificate, useUpdateCertificate } from "./certificates.queries";
import type { RequestError } from "@/api/request-error";
import { HTTP_NOT_FOUND } from "@/api/http-status";

type Values = { expiryDate: string; issuedDate: string; issuer: string; name: string; suggested: boolean; url: string };
type FieldErrors = Partial<Record<"expiryDate" | "name" | "url", string>>;

const OPTIONAL_CLASS = "text-[12.5px] font-normal text-muted-foreground";

function initialValues(certificate?: CertificateLink): Values {
  return {
    expiryDate: certificate?.expiryDate ?? "",
    issuedDate: certificate?.issuedDate ?? "",
    issuer: certificate?.issuer ?? "",
    name: certificate?.name ?? "",
    suggested: certificate?.suggested ?? false,
    url: certificate?.url ?? "",
  };
}

/** A web address the server will accept: http(s), a host with a dot, no credentials. */
export function isWebLink(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateCertificate(values: Values): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "certificates.form.errors.name";
  if (!isWebLink(values.url)) errors.url = "certificates.form.errors.url";
  if (values.issuedDate && values.expiryDate && values.expiryDate < values.issuedDate) errors.expiryDate = "certificates.form.errors.dates";
  return errors;
}

type CertificateFormDialogProps = {
  certificate?: CertificateLink;
  onConflict: () => void;
  onOpenChange: (open: boolean) => void;
  onSaved: (certificate: CertificateLink) => void;
};

export function CertificateFormDialog({ certificate, onConflict, onOpenChange, onSaved }: CertificateFormDialogProps) {
  const { t } = useTranslation();
  const editing = Boolean(certificate);
  const [values, setValues] = useState<Values>(() => initialValues(certificate));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const create = useCreateCertificate();
  const update = useUpdateCertificate();
  // Kept for the life of the dialog: a retry of the same form replays instead of adding a second certificate.
  const idempotencyKey = useRef(crypto.randomUUID());
  const pending = create.isPending || update.isPending;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateCertificate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setFailure(null);
    const fields = { name: values.name.trim(), url: values.url.trim() };
    try {
      const saved = certificate
        ? await update.mutateAsync({
            body: {
              expectedVersion: certificate.version,
              ...fields,
              expiryDate: values.expiryDate || null,
              issuedDate: values.issuedDate || null,
              issuer: values.issuer.trim() || null,
              suggested: values.suggested,
            },
            id: certificate.id,
          })
        : await create.mutateAsync({
            body: {
              ...fields,
              ...(values.issuer.trim() ? { issuer: values.issuer.trim() } : {}),
              ...(values.issuedDate ? { issuedDate: values.issuedDate } : {}),
              ...(values.expiryDate ? { expiryDate: values.expiryDate } : {}),
            },
            key: idempotencyKey.current,
          });
      // A new certificate is created first, then marked suggested: create takes metadata only.
      const result = !certificate && values.suggested
        ? await update.mutateAsync({ body: { expectedVersion: saved.version, suggested: true }, id: saved.id })
        : saved;
      onSaved(result);
    } catch (error) {
      const { code, status } = error as RequestError;
      if (code === "DUPLICATE_CERTIFICATE_URL") setErrors({ url: "certificates.form.errors.duplicate" });
      else if (code === "VERSION_CONFLICT" || status === HTTP_NOT_FOUND) onConflict();
      else setFailure(t(editing ? "certificates.form.errors.updateFailed" : "certificates.form.errors.saveFailed"));
    }
  }

  const fieldError = (key: keyof FieldErrors) => (errors[key] ? t(errors[key]) : undefined);

  return (
    <Dialog onOpenChange={(open) => !pending && onOpenChange(open)} open>
      <DialogContent className="max-w-[560px] gap-0">
        <form noValidate onSubmit={(event) => void submit(event)}>
          <DialogHeader className="border-b-0 pb-2">
            <DialogTitle>{t(editing ? "certificates.form.editTitle" : "certificates.form.addTitle")}</DialogTitle>
            <DialogDescription className="text-[13.5px]">
              {certificate
                ? t("certificates.form.editDescription", { date: formatDate(certificate.updatedAt), version: certificate.version })
                : t("certificates.form.addDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[calc(92vh-180px)] flex-col gap-4 overflow-y-auto px-[26px] pb-5 pt-2">
            {certificate && certificate.sentCount > 0 ? (
              <p className="flex gap-2 rounded-xl bg-muted px-3.5 py-3 text-[13px] text-foreground">
                <Send aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {t("certificates.form.sentNote", { count: certificate.sentCount })}
              </p>
            ) : null}
            {failure ? <InlineBanner tone="error">{failure}</InlineBanner> : null}
            <FormField error={fieldError("name")} htmlFor="certificate-name" label={t("certificates.form.name")} required>
              <Input aria-invalid={Boolean(errors.name)} autoFocus id="certificate-name" maxLength={CERTIFICATE_LIMITS.name} onChange={(event) => set("name", event.target.value)} placeholder={t("certificates.form.namePlaceholder")} value={values.name} />
            </FormField>
            <FormField error={fieldError("url")} hint={t("certificates.form.urlHint")} htmlFor="certificate-url" label={t("certificates.form.url")} required>
              <Input aria-invalid={Boolean(errors.url)} id="certificate-url" inputMode="url" maxLength={CERTIFICATE_LIMITS.url} onChange={(event) => set("url", event.target.value)} placeholder="https://" value={values.url} />
            </FormField>
            <FormField htmlFor="certificate-issuer" label={t("certificates.form.issuer")} labelAddon={<span className={OPTIONAL_CLASS}>{t("certificates.form.optional")}</span>}>
              <Input id="certificate-issuer" maxLength={CERTIFICATE_LIMITS.issuer} onChange={(event) => set("issuer", event.target.value)} value={values.issuer} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="certificate-issued" label={t("certificates.form.issued")} labelAddon={<span className={OPTIONAL_CLASS}>{t("certificates.form.optional")}</span>}>
                <DatePicker clearable id="certificate-issued" onChange={(value) => set("issuedDate", value)} value={values.issuedDate} />
              </FormField>
              <FormField error={fieldError("expiryDate")} hint={errors.expiryDate ? undefined : t("certificates.form.expiresHint")} htmlFor="certificate-expires" label={t("certificates.form.expires")} labelAddon={<span className={OPTIONAL_CLASS}>{t("certificates.form.optional")}</span>}>
                <DatePicker aria-invalid={Boolean(errors.expiryDate)} clearable id="certificate-expires" onChange={(value) => { set("expiryDate", value); setErrors((current) => ({ ...current, expiryDate: undefined })); }} value={values.expiryDate} />
              </FormField>
            </div>
            <label className="flex cursor-pointer gap-3 border-t border-border pt-4">
              <input checked={values.suggested} className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-(--primary)" onChange={(event) => set("suggested", event.target.checked)} type="checkbox" />
              <span className="flex flex-col">
                <span className="text-[13.5px] font-semibold text-foreground">{t("certificates.form.suggest")}</span>
                <span className="text-[13px] text-muted-foreground">{t("certificates.form.suggestHint")}</span>
              </span>
            </label>
          </div>
          <DialogFooter className="justify-between border-t-0 pt-0">
            <span />
            <div className="flex gap-3">
              <Button className={DIALOG_BUTTON_CLASS} disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">{t("actions.cancel")}</Button>
              <Button className={DIALOG_BUTTON_CLASS} disabled={pending} type="submit">
                {pending ? t(editing ? "certificates.form.saving" : "certificates.form.adding") : t(editing ? "certificates.form.save" : "certificates.form.add")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
