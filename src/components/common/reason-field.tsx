import { useTranslation } from "react-i18next";

import { FormField } from "./form-field";
import { Textarea } from "@/components/ui/textarea";

/** Every audited action (suspend, reactivate, role change, cancel…) asks for a reason of this length. */
export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 500;

export const isValidReason = (reason: string) => reason.trim().length >= REASON_MIN_LENGTH && reason.trim().length <= REASON_MAX_LENGTH;

/** Required reason; the API accepts 10–500 characters for every audited action (the textarea stops at the maximum). */
export function ReasonField({ id, label, onChange, placeholder, value }: { id: string; label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  const { t } = useTranslation();
  const length = value.trim().length;
  const tooShort = value.length > 0 && length < REASON_MIN_LENGTH;
  return (
    <FormField
      error={tooShort ? t("reason.tooShort", { min: REASON_MIN_LENGTH }) : undefined}
      hint={t("reason.hint", { min: REASON_MIN_LENGTH })}
      htmlFor={id}
      label={label}
      required
    >
      <Textarea aria-invalid={tooShort} id={id} maxLength={REASON_MAX_LENGTH} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </FormField>
  );
}
