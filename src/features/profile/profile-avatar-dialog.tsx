import { useEffect, useId, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InlineErrorAlert } from "@/components/common/inline-error-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestErrorMessage } from "@/api/request-error";

import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
} from "./profile.constants";

type AvatarUploadDialogProps = {
  currentAvatarUrl: string | null;
  name: string;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => Promise<void>;
  open: boolean;
};


export function AvatarUploadDialog({ onOpenChange, onUpload, open }: AvatarUploadDialogProps) {
  const { t } = useTranslation();
  const descriptionId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function clearSelection() {
    setFile(null);
    setPreview(null);
    setImageReady(false);
    setError(null);
    if (input.current) input.current.value = "";
  }

  function selectFile(candidate?: File) {
    clearSelection();
    if (!candidate) return;
    if (candidate.size === 0) {
      setError(t("myProfile.avatarEmpty"));
      return;
    }
    if (candidate.size > AVATAR_MAX_BYTES) {
      setError(t("myProfile.avatarTooLarge"));
      return;
    }
    if (!AVATAR_TYPES.includes(candidate.type as (typeof AVATAR_TYPES)[number])) {
      setError(t("myProfile.avatarType"));
      return;
    }
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }

  async function save() {
    if (!file || !imageReady) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      clearSelection();
      onOpenChange(false);
    } catch (failure) {
      setError(requestErrorMessage(failure, t("myProfile.avatarFailed")));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        if (uploading) return;
        if (!next) clearSelection();
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("myProfile.uploadAvatar")}</DialogTitle>
          <DialogDescription id={descriptionId}>
            {t("myProfile.avatarHint")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-[26px] py-5">
          <input
            ref={input}
            accept={AVATAR_ACCEPT}
            aria-describedby={descriptionId}
            aria-label={t("myProfile.chooseAvatar")}
            className="sr-only"
            onChange={(event) => selectFile(event.target.files?.[0])}
            type="file"
          />

          {!preview ? (
            <button
              className="flex min-h-[120px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-dashed bg-canvas px-4 text-center text-[13px] text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => input.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFile(event.dataTransfer.files[0]);
              }}
              type="button"
            >
              <ImageUp aria-hidden className="size-5" />
              <span className="font-semibold text-foreground">
                {t("myProfile.dropAvatar")}
              </span>
              <span>{t("myProfile.avatarHint")}</span>
            </button>
          ) : (
            <div className="flex items-center gap-6 py-1">
              <div className="relative size-[148px] shrink-0 overflow-hidden rounded-full bg-muted">
                <img alt={t("myProfile.avatarPreview")} className="size-full object-cover" draggable={false} onError={() => { setImageReady(false); setError(t("myProfile.avatarDecodeFailed")); }} onLoad={() => { setImageReady(true); setError(null); }} src={preview} />
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <p className="text-[12px] font-bold tracking-[0.05em] text-muted-foreground">{t("myProfile.avatarPreview")}</p>
                <div className="flex items-center gap-3">
                  {["size-12", "size-8", "size-6"].map((size) => (
                    <div
                      className={`shrink-0 overflow-hidden rounded-full bg-muted ${size}`}
                      key={size}
                    >
                      <img alt="" className="size-full object-cover" draggable={false} src={preview} />
                    </div>
                  ))}
                </div>
                <p className="truncate text-[13px] text-muted-foreground">{file?.name}</p>
              </div>
            </div>
          )}

          {error ? (
            <div role="alert">
              <InlineErrorAlert>{error}</InlineErrorAlert>
            </div>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button className="mr-auto" disabled={uploading} onClick={() => input.current?.click()} size="lg" type="button" variant="link">
            {t("myProfile.chooseDifferentAvatar")}
          </Button>
          <Button
            disabled={uploading}
            onClick={() => {
              clearSelection();
              onOpenChange(false);
            }}
            size="lg"
            type="button"
            variant="outline"
          >
            {t("myProfile.cancel")}
          </Button>
          <Button
            disabled={!file || !imageReady || uploading}
            onClick={() => void save()}
            size="lg"
            type="button"
          >
            {uploading ? t("myProfile.uploading") : t("myProfile.saveAvatar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
