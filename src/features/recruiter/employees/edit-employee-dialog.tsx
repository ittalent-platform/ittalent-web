import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateEmployeeMutation } from "./employees.queries";
import {
  editEmployeeSchema,
  type EditEmployeeFormValues,
  type Employee,
} from "./employees.types";

type EditEmployeeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
};

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EditEmployeeDialogProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateMutation = useUpdateEmployeeMutation(employee?.id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema),
    values: employee
      ? {
          full_name: employee.fullName ?? employee.username ?? "",
          job_title:
            (employee as unknown as { job_title?: string }).job_title ?? "",
          department:
            (employee as unknown as { department?: string }).department ?? "",
          phone: employee.phone ?? "",
        }
      : undefined,
  });

  if (!employee) return null;

  const onSubmit = async (values: EditEmployeeFormValues) => {
    setErrorMessage(null);
    try {
      const payload: { fullName?: string; phone?: string | null } = {};
      if (values.full_name && values.full_name !== employee.fullName) {
        payload.fullName = values.full_name;
      }
      if (values.phone !== (employee.phone ?? "")) {
        payload.phone = values.phone ? values.phone : null;
      }

      if (Object.keys(payload).length > 0) {
        await updateMutation.mutateAsync({ ...payload, expectedVersion: employee.version ?? 0 });
      }

      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(
        errorObj.message ?? t("recruiterEmployees.edit.failed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl">{t("recruiterEmployees.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("recruiterEmployees.edit.description", { name: employee.fullName || employee.username })}
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <div className="my-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("enterpriseRegistration.step2.workEmail")}</Label>
              <Input
                value={employee.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-full-name" className="text-sm font-medium">
                {t("recruiterEmployees.form.displayName")} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="edit-full-name"
                placeholder={t("recruiterEmployees.form.fullNameExample")}
                {...register("full_name")}
                aria-invalid={Boolean(errors.full_name)}
              />
              {errors.full_name ? (
                <p className="text-xs text-rose-500">
                  {errors.full_name.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("recruiterEmployees.form.displayNameHint")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-job-title" className="text-sm font-medium">
                  {t("recruiterEmployees.form.jobTitle")}
                </Label>
                <Input
                  id="edit-job-title"
                  placeholder={t("recruiterEmployees.form.jobTitleExample")}
                  {...register("job_title")}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-department"
                  className="text-sm font-medium"
                >
                  {t("recruiterEmployees.form.department")}
                </Label>
                <Input
                  id="edit-department"
                  placeholder={t("recruiterEmployees.form.departmentExample")}
                  {...register("department")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-sm font-medium">
                {t("recruiterEmployees.form.workPhone")}
              </Label>
              <Input
                id="edit-phone"
                placeholder={t("recruiterEmployees.form.phoneExample")}
                {...register("phone")}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? (
                <p className="text-xs text-rose-500">{errors.phone.message}</p>
              ) : null}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {t("recruiterEmployees.form.lockedNote")}
              </span>
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
              disabled={isSubmitting || updateMutation.isPending}
            >
              {isSubmitting || updateMutation.isPending
                ? t("state.saving")
                : t("adminUsers.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
