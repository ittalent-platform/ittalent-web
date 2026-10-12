import { useState } from "react";
import { Building2, Image as ImageIcon, Trash2 } from "lucide-react";

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
import { useUpdateMyEnterpriseProfileMutation } from "./company-profile.queries";
import type { EnterpriseDetail } from "./company-profile.types";

type ChangeLogoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterprise: EnterpriseDetail | null;
};

export function ChangeLogoDialog({
  open,
  onOpenChange,
  enterprise,
}: ChangeLogoDialogProps) {
  const [logoUrl, setLogoUrl] = useState(enterprise?.logoUrl ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateMutation = useUpdateMyEnterpriseProfileMutation(
    enterprise?.id ?? "",
  );

  if (!enterprise) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Image size exceeds 5MB limit. Please choose a smaller file.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({
        logo_url: logoUrl.trim() ? logoUrl.trim() : null,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message ?? "Failed to update company logo.");
    }
  };

  const handleRemove = async () => {
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({
        logo_url: null,
      });
      setLogoUrl("");
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message ?? "Failed to remove logo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <DialogTitle className="text-xl">Change company logo</DialogTitle>
          <DialogDescription>
            This logo appears on your public company profile, job postings, and
            emails to candidates.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div className="my-2 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4 py-3">
          {/* Preview box */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6">
            {logoUrl ? (
              <div className="relative group size-28 overflow-hidden rounded-2xl border border-border shadow-xs bg-background">
                <img
                  src={logoUrl}
                  alt="Company Logo Preview"
                  className="size-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ImageIcon className="size-10 text-muted-foreground/50" />
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Preview</p>
          </div>

          {/* Upload / URL Controls */}
          <div className="space-y-2">
            <Label
              htmlFor="logo-file"
              className="text-xs font-medium text-foreground"
            >
              Upload image file
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="logo-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="logo-url"
              className="text-xs font-medium text-foreground"
            >
              Or paste image URL
            </Label>
            <Input
              id="logo-url"
              placeholder="https://cdn.example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            • Square format (1:1 ratio), recommended minimum 400×400px.
            <br />• Maximum file size: 5MB. Formats: PNG, JPG, WebP, SVG.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
          {enterprise.logoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
              disabled={updateMutation.isPending}
            >
              <Trash2 className="size-3.5 mr-1" />
              Remove logo
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                updateMutation.isPending || (!logoUrl && !enterprise.logoUrl)
              }
            >
              {updateMutation.isPending ? "Saving..." : "Save logo"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
