import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateEmployeeStatusMutation } from "./employees.queries";
import {
  changeEmployeeStatusSchema,
  type ChangeEmployeeStatusFormValues,
  type Employee,
} from "./employees.types";

type ChangeEmployeeStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
};

export function ChangeEmployeeStatusDialog({
  open,
  onOpenChange,
  employee,
}: ChangeEmployeeStatusDialogProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusMutation = useUpdateEmployeeStatusMutation(employee?.id ?? "");

  const isCurrentlyActive = employee?.status === "active";
  const targetStatus = isCurrentlyActive ? "suspended" : "active";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmployeeStatusFormValues>({
    resolver: zodResolver(changeEmployeeStatusSchema),
    defaultValues: {
      status: targetStatus,
      reason: "",
    },
  });

  if (!employee) return null;

  const onSubmit = async (values: ChangeEmployeeStatusFormValues) => {
    setErrorMessage(null);
    try {
      await statusMutation.mutateAsync({
        status: values.status,
        reason: values.reason,
        expectedVersion: employee.version ?? 0,
      });

      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(
        errorObj.message ?? t("recruiterEmployees.statusDialog.failed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div
              className={`flex size-10 items-center justify-center rounded-full ${
                isCurrentlyActive
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}
            >
              {isCurrentlyActive ? (
                <AlertTriangle className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {isCurrentlyActive ? t("recruiterEmployees.menu.suspend") : t("recruiterEmployees.menu.activate")}
            </DialogTitle>
            <DialogDescription>
              {isCurrentlyActive
                ? t("recruiterEmployees.statusDialog.suspendBody", { name: employee.fullName || employee.username })
                : t("recruiterEmployees.statusDialog.activateBody", { name: employee.fullName || employee.username })}
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <div className="my-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-4 py-4">
            <input type="hidden" value={targetStatus} {...register("status")} />

            <div className="space-y-1.5">
              <Label htmlFor="status-reason" className="text-sm font-medium">
                {t("recruiterEmployees.statusDialog.reasonLabel")}{" "}
                <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="status-reason"
                rows={3}
                placeholder={
                  isCurrentlyActive
                    ? t("recruiterEmployees.statusDialog.suspendPlaceholder")
                    : t("recruiterEmployees.statusDialog.activatePlaceholder")
                }
                {...register("reason")}
                aria-invalid={Boolean(errors.reason)}
              />
              {errors.reason ? (
                <p className="text-xs text-rose-500">{errors.reason.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("recruiterEmployees.statusDialog.auditNote")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              variant={isCurrentlyActive ? "destructive" : "default"}
              disabled={isSubmitting || statusMutation.isPending}
            >
              {isSubmitting || statusMutation.isPending
                ? t("recruiterApplications.statusDialog.updating")
                : isCurrentlyActive
                  ? t("recruiterEmployees.menu.suspend")
                  : t("recruiterEmployees.menu.activate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
