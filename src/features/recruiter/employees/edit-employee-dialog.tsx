import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";

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
        await updateMutation.mutateAsync(payload);
      }

      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(
        errorObj.message ?? "Failed to update employee information.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-xl">Edit employee</DialogTitle>
            <DialogDescription>
              Update internal staff record details for{" "}
              {employee.fullName || employee.username}.
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <div className="my-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Work email</Label>
              <Input
                value={employee.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-full-name" className="text-sm font-medium">
                Display name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="edit-full-name"
                placeholder="e.g. Trần Bảo"
                {...register("full_name")}
                aria-invalid={Boolean(errors.full_name)}
              />
              {errors.full_name ? (
                <p className="text-xs text-rose-500">
                  {errors.full_name.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Shown to the team and on job posts · 2–100 characters
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-job-title" className="text-sm font-medium">
                  Job title
                </Label>
                <Input
                  id="edit-job-title"
                  placeholder="e.g. Senior recruiter"
                  {...register("job_title")}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-department"
                  className="text-sm font-medium"
                >
                  Department
                </Label>
                <Input
                  id="edit-department"
                  placeholder="e.g. Talent acquisition"
                  {...register("department")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-sm font-medium">
                Work phone
              </Label>
              <Input
                id="edit-phone"
                placeholder="e.g. 0912 345 678"
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
                Email, password and role belong to the person’s own ITTalent
                account, so they can’t be changed here.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
            >
              {isSubmitting || updateMutation.isPending
                ? "Saving..."
                : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
