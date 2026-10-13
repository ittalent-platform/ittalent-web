import { CheckCircle2, Loader2 } from "lucide-react";
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
import type { EnterpriseRegistrationDetail } from "@/features/enterprise-registration/enterprise-registration.types";

interface ApproveRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: EnterpriseRegistrationDetail;
  isLoading: boolean;
  onConfirm: () => void;
}

export function ApproveRegistrationDialog({
  open,
  onOpenChange,
  registration,
  isLoading,
  onConfirm,
}: ApproveRegistrationDialogProps) {
  const { t } = useTranslation();

  const company = registration.company_data as Record<string, unknown> | undefined;
  const companyName =
    (company?.name as string) ||
    (company?.legal_name as string) ||
    registration.corporate_email;

  const repName = registration.representative.full_name;
  const email = registration.corporate_email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl p-6">
        <DialogHeader className="gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>

          <div>
            <DialogTitle className="text-lg font-bold text-foreground">
              {t("admin.registrations.approveDialog.title", {
                defaultValue: "Approve {{name}}, version {{version}}?",
                name: companyName,
                version: registration.version,
              })}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13.5px] text-muted-foreground">
              {t("admin.registrations.approveDialog.subtitle", "This happens once and can't be undone from here.")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 4-step impact summary */}
        <div className="mt-2 flex flex-col gap-3 text-[13px] text-foreground">
          <div className="flex items-start gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold text-muted-foreground mt-0.5">
              1
            </span>
            <span>
              {t("admin.registrations.approveDialog.step1", {
                defaultValue: "Create the company {{name}} as Active.",
                name: companyName,
              })}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold text-muted-foreground mt-0.5">
              2
            </span>
            <span>
              {t("admin.registrations.approveDialog.step2", "Move the tax code and corporate email from this case to the new company.")}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold text-muted-foreground mt-0.5">
              3
            </span>
            <span>
              {t("admin.registrations.approveDialog.step3", {
                defaultValue: "Add {{name}} as an Enterprise admin, pending.",
                name: repName,
              })}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold text-muted-foreground mt-0.5">
              4
            </span>
            <span>
              {t("admin.registrations.approveDialog.step4", {
                defaultValue: "Send one invitation to {{email}}.",
                email,
              })}
            </span>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3.5 text-[12.5px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">
            {t("admin.registrations.approveDialog.notePrefix", "No access yet. ")}
          </span>
          {t("admin.registrations.approveDialog.noteText", {
            defaultValue: "{{name}} can't manage the company until they accept the invitation with this exact email.",
            name: repName,
          })}
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
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-xl h-10 px-4.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            <span>{t("admin.registrations.approveDialog.confirmBtn", "Approve and send invitation")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
