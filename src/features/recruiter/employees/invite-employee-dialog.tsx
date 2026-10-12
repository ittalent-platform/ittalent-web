import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, Lock, Mail, Send } from "lucide-react";

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
import { useMyEnterpriseProfileQuery } from "@/features/recruiter/company-profile/company-profile.queries";
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

  const { data: enterprise } = useMyEnterpriseProfileQuery();
  const enterpriseName = enterprise?.name || "Workspace";
  const enterpriseInitials = enterpriseName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
      <DialogContent className="sm:max-w-[520px] rounded-2xl p-6">
        {step === "form" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Invite HR employee
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                They get an email with a link to join. Nobody gets access until
                they accept.
              </DialogDescription>
            </DialogHeader>

            {errorMessage ? (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-3.5 pt-1">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                  Full name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  aria-label="Display name"
                  placeholder="e.g. Trần Bảo"
                  className="h-10 rounded-xl text-sm"
                  {...register("full_name")}
                  aria-invalid={Boolean(errors.full_name)}
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>{errors.full_name?.message || "2–100 characters"}</span>
                </div>
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Work email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. tran.b@novafintech.vn"
                  className="h-10 rounded-xl text-sm"
                  {...register("email")}
                  aria-invalid={Boolean(errors.email)}
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>
                    {errors.email?.message ||
                      "The invitation only works for this address."}
                  </span>
                </div>
              </div>

              {/* Job title & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="job_title" className="text-xs font-semibold text-foreground">
                    Job title
                  </Label>
                  <Input
                    id="job_title"
                    placeholder="e.g. Senior recruiter"
                    className="h-10 rounded-xl text-sm"
                    {...register("job_title")}
                  />
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="department" className="text-xs font-semibold text-foreground">
                    Department
                  </Label>
                  <Input
                    id="department"
                    placeholder="e.g. Talent acquisition"
                    className="h-10 rounded-xl text-sm"
                    {...register("department")}
                  />
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </div>
              </div>

              {/* Work Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                  Work phone
                </Label>
                <Input
                  id="phone"
                  placeholder="e.g. 0912 345 678"
                  className="h-10 rounded-xl text-sm"
                  {...register("phone")}
                  aria-invalid={Boolean(errors.phone)}
                />
                <span className="text-[11px] text-muted-foreground">
                  {errors.phone?.message ||
                    "Optional · 9–15 digits, may start with +"}
                </span>
              </div>

              <div className="h-px bg-border my-2" />

              {/* Access Role Card */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground block">
                  Access
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs tracking-wider">
                    {enterpriseInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      HR at {enterpriseName}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Can post jobs, review applications and schedule interviews.
                    </p>
                  </div>
                  <Lock className="size-4 text-muted-foreground/60 shrink-0" />
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  You can only invite HR here. Admin roles can’t be given from this form.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="rounded-xl gap-1.5"
              >
                <Send className="size-3.5" />
                <span>
                  {isSubmitting || createMutation.isPending
                    ? "Sending..."
                    : "Send invitation"}
                </span>
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
