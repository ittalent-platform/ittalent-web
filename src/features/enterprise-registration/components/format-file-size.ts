import { BYTES_PER_MB } from "@/features/enterprise-registration/enterprise-registration.constants";

const BYTES_PER_KB = 1024;

/** "193 B", "1.2 KB" or "1.2 MB"; undefined when the size is unknown so the caller can say so in the active language. */
export function formatFileSize(bytes?: number): string | undefined {
  if (!bytes) return undefined;
  if (bytes < BYTES_PER_KB) return `${bytes} B`;
  if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
}
