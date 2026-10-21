import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Trash2 } from "lucide-react";

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

type ChangeCoverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enterprise: EnterpriseDetail | null;
};

export function ChangeCoverDialog({
  open,
  onOpenChange,
  enterprise,
}: ChangeCoverDialogProps) {
  const { t } = useTranslation();
  const [coverUrl, setCoverUrl] = useState(enterprise?.coverUrl ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateMutation = useUpdateMyEnterpriseProfileMutation(
    enterprise?.id ?? "",
  );

  if (!enterprise) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t("recruiterCompanyProfile.cover.tooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCoverUrl(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({
        cover_url: coverUrl.trim(),
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message ?? t("recruiterCompanyProfile.cover.saveFailed"));
    }
  };

  const handleRemove = async () => {
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({
        cover_url: "",
      });
      setCoverUrl("");
      onOpenChange(false);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message ?? t("recruiterCompanyProfile.cover.removeFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ImageIcon className="size-5" />
          </div>
          <DialogTitle className="text-xl">{t("recruiterCompanyProfile.cover.title")}</DialogTitle>
          <DialogDescription>
            {t("recruiterCompanyProfile.cover.description")}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div className="my-2 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4 py-3">
          {/* Banner Preview */}
          <div className="overflow-hidden rounded-xl border border-border bg-muted/40 shadow-xs">
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={t("recruiterCompanyProfile.cover.previewAlt")}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-1">
                    <ImageIcon className="mx-auto size-8 text-muted-foreground/50" />
                    <p className="text-xs">{t("recruiterCompanyProfile.page.noCover")}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2 text-center text-xs text-muted-foreground">
              {t("recruiterCompanyProfile.cover.preview")}
            </div>
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <Label
              htmlFor="cover-file"
              className="text-xs font-medium text-foreground"
            >
              {t("recruiterCompanyProfile.cover.uploadFile")}
            </Label>
            <Input
              id="cover-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="cover-url"
              className="text-xs font-medium text-foreground"
            >
              {t("recruiterCompanyProfile.cover.orUrl")}
            </Label>
            <Input
              id="cover-url"
              placeholder="https://cdn.example.com/banner.jpg"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("recruiterCompanyProfile.cover.hintRatio")}
            <br />
            {t("recruiterCompanyProfile.cover.hintSize")}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
          {enterprise.coverUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
              disabled={updateMutation.isPending}
            >
              <Trash2 className="size-3.5 mr-1" />
              {t("recruiterCompanyProfile.cover.remove")}
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
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                updateMutation.isPending || (!coverUrl && !enterprise.coverUrl)
              }
            >
              {updateMutation.isPending ? t("state.saving") : t("recruiterCompanyProfile.cover.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
