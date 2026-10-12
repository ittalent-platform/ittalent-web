import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, Mail, UserPlus } from "lucide-react";

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
import { useCreateEmployeeMutation } from "./employees.queries";
import {
  inviteEmployeeSchema,
  type InviteEmployeeFormValues,
} from "./employees.types";

type InviteEmployeeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteEmployeeDialog({
  open,
  onOpenChange,
}: InviteEmployeeDialogProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateEmployeeMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteEmployeeFormValues>({
    resolver: zodResolver(inviteEmployeeSchema),
    defaultValues: {
      email: "",
      full_name: "",
      job_title: "",
      department: "",
      phone: "",
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("form");
      setInvitedEmail("");
      setCopied(false);
      setErrorMessage(null);
      reset();
    }, 200);
  };

  const onSubmit = async (values: InviteEmployeeFormValues) => {
    setErrorMessage(null);
    try {
      await createMutation.mutateAsync({
        email: values.email,
        fullName: values.full_name,
        role: "recruiter",
        phone: values.phone || undefined,
      });

      setInvitedEmail(values.email);
      setStep("success");
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      if (errorObj.status === 409) {
        setErrorMessage(
          "An account with this email already exists in the system.",
        );
      } else {
        setErrorMessage(
          errorObj.message ?? "Failed to send invitation. Please try again.",
        );
      }
    }
  };

  const handleCopyLink = () => {
    const fakeLink = `${window.location.origin}/register?invite_email=${encodeURIComponent(invitedEmail)}`;
    void navigator.clipboard.writeText(fakeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="size-5" />
              </div>
              <DialogTitle className="text-xl">Invite HR employee</DialogTitle>
              <DialogDescription>
                They will receive an email invitation to join your company’s
                workspace on ITTalent.
              </DialogDescription>
            </DialogHeader>

            {errorMessage ? (
              <div className="my-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Work email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. tran.b@novafintech.vn"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? (
                  <p className="text-xs text-rose-500">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Display name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="e.g. Trần Bảo"
                  {...register("full_name")}
                  aria-invalid={Boolean(errors.full_name)}
                />
                {errors.full_name ? (
                  <p className="text-xs text-rose-500">
                    {errors.full_name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="job_title" className="text-sm font-medium">
                    Job title
                  </Label>
                  <Input
                    id="job_title"
                    placeholder="e.g. Senior recruiter"
                    {...register("job_title")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <Input
                    id="department"
                    placeholder="e.g. Talent acquisition"
                    {...register("department")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Work phone
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. 0912 345 678"
                  {...register("phone")}
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone ? (
                  <p className="text-xs text-rose-500">
                    {errors.phone.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Optional phone number for internal directory contact.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
              >
                {isSubmitting || createMutation.isPending
                  ? "Sending..."
                  : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <DialogTitle className="text-xl">Invitation sent</DialogTitle>
              <DialogDescription>
                We dispatched an invitation email to{" "}
                <strong className="text-foreground">{invitedEmail}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="my-5 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="size-4 text-primary" />
                <span>Next steps for the invitee</span>
              </div>
              <p>
                They have 7 days to open the link in their email, verify their
                corporate identity and set their password.
              </p>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopyLink}
              >
                <Copy className="size-4" />
                {copied ? "Link copied!" : "Copy invitation link"}
              </Button>
              <Button type="button" className="w-full" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
