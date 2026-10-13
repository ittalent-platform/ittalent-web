import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FilterSelect } from "@/components/ui/filter-select";
import type { EnterpriseRegistrationDetail } from "@/features/enterprise-registration/enterprise-registration.types";
import { getInitials } from "@/features/admin/registrations/registrations.formatters";

interface RejectRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: EnterpriseRegistrationDetail;
  isLoading: boolean;
  onConfirm: (reason: string) => void;
}

const REJECTION_TEMPLATES: Record<string, string> = {
  tax_mismatch:
    "The tax code on the form does not match the official business registration certificate. Please check the tax identification number and submit again.",
  docs_incomplete:
    "The uploaded business registration documents are incomplete, illegible, or missing required pages. Please re-upload clear PDF scans.",
  unauthorized_rep:
    "The requester is not named as the legal representative on the business certificate, and no valid Letter of Authorization was provided.",
  license_invalid:
    "The business license is expired or not registered with the National Business Registration Portal.",
  other:
    "The registration information could not be verified in accordance with employer verification standards. Please review your company details and resubmit.",
};

export function RejectRegistrationDialog({
  open,
  onOpenChange,
  registration,
  isLoading,
  onConfirm,
}: RejectRegistrationDialogProps) {
  const { t } = useTranslation();

  const company = registration.company_data as Record<string, unknown> | undefined;
  const companyName =
    (company?.name as string) ||
    (company?.legal_name as string) ||
    registration.corporate_email;

  const initials = getInitials(companyName);
  const repName = registration.representative.full_name;

  const [category, setCategory] = useState<string>("tax_mismatch");
  const [message, setMessage] = useState<string>(REJECTION_TEMPLATES.tax_mismatch);
  const [internalNote, setInternalNote] = useState<string>("");

  const reasonOptions = [
    { value: "tax_mismatch", label: t("admin.registrations.rejectDialog.reasonTax", "Tax code doesn't match the documents") },
    { value: "docs_incomplete", label: t("admin.registrations.rejectDialog.reasonDocs", "Incomplete or unreadable legal documents") },
    { value: "unauthorized_rep", label: t("admin.registrations.rejectDialog.reasonAuth", "Unauthorized representative submission") },
    { value: "license_invalid", label: t("admin.registrations.rejectDialog.reasonLicense", "Business license revoked or invalid") },
    { value: "other", label: t("admin.registrations.rejectDialog.reasonOther", "Other") },
  ];

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (REJECTION_TEMPLATES[val]) {
      setMessage(REJECTION_TEMPLATES[val]);
    }
  };

  const isMessageValid = message.trim().length >= 20 && message.trim().length <= 1000;

  const handleSubmit = () => {
    if (!isMessageValid) return;
    onConfirm(message.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl p-6">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              {initials}
            </div>

            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("admin.registrations.rejectDialog.title", {
                  defaultValue: "Reject {{name}}, version {{version}}?",
                  name: companyName,
                  version: registration.version,
                })}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[13px] text-muted-foreground">
                {t("admin.registrations.rejectDialog.subtitle", "The requester is told why. This can't be undone from here.")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {/* Reason Category */}
          <div>
            <label className="block text-[12.5px] font-medium text-foreground">
              <span>{t("admin.registrations.rejectDialog.reasonLabel", "Reason")}</span>
              <span className="text-destructive ml-1">*</span>
            </label>
            <FilterSelect
              value={category}
              onChange={handleCategoryChange}
              options={reasonOptions}
              size="md"
              className="mt-1.5 h-10 w-full rounded-xl"
            />
          </div>

          {/* Message to Requester */}
          <div>
            <label className="block text-[12.5px] font-medium text-foreground">
              <span>{t("admin.registrations.rejectDialog.messageLabel", "Message to the requester")}</span>
              <span className="text-destructive ml-1">*</span>
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                "admin.registrations.rejectDialog.messagePlaceholder",
                "Explain clearly what needs to be corrected...",
              )}
              className="mt-1.5 min-h-[110px] text-[13px] rounded-xl"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>
                {t("admin.registrations.rejectDialog.messageHelper", "Required · 20–1,000 characters · sent by email and shown on status page")}
              </span>
              <span className={message.trim().length < 20 ? "text-destructive" : ""}>
                {message.trim().length}/1000
              </span>
            </div>
          </div>

          {/* Optional Internal Note */}
          <div>
            <label className="block text-[12.5px] font-medium text-foreground">
              {t("admin.registrations.rejectDialog.internalNoteLabel", "Internal note")}
            </label>
            <Textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder={t("admin.registrations.rejectDialog.internalNotePlaceholder", "Only admins can see this")}
              className="mt-1.5 min-h-[60px] text-[13px] rounded-xl"
            />
            <span className="mt-1 block text-[11.5px] text-muted-foreground">
              {t("admin.registrations.rejectDialog.internalNoteHelper", "Optional · not shown to the requester")}
            </span>
          </div>

          {/* What happens callout */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-[12.5px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">
              {t("admin.registrations.rejectDialog.whatHappensPrefix", "What happens: ")}
            </span>
            {t("admin.registrations.rejectDialog.whatHappensText", {
              defaultValue: "the case becomes Rejected. No company is created and {{name}}'s account isn't changed. The tax code and corporate email are freed for new registration.",
              name: repName,
            })}
          </div>
        </div>

        <DialogFooter className="mt-5 flex items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-10 px-4"
          >
            {t("common.cancel", "Cancel")}
          </Button>

          <Button
            type="button"
            disabled={isLoading || !isMessageValid}
            onClick={handleSubmit}
            className="rounded-xl h-10 px-4.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium shadow-xs"
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            <span>{t("admin.registrations.rejectDialog.confirmBtn", "Reject registration")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
