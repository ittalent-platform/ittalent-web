export const MAX_DOCUMENT_MB = 5;
export const MAX_DOCUMENT_BYTES = MAX_DOCUMENT_MB * 1024 * 1024;

export const DOCUMENT_EXTENSION_PATTERN = /\.(pdf|doc|docx)$/i;
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx";

export const DOCUMENT_TABS = ["all", "cv", "cover_letter"] as const;

/** Returns the i18n key (under `documents.errors`) of the first problem with the file, or null when it is acceptable. */
export function documentFileErrorKey(file: File) {
  // Browsers report unreliable MIME types, so only the extension is checked here; the server verifies the content.
  if (!DOCUMENT_EXTENSION_PATTERN.test(file.name)) return "format";
  if (file.size === 0) return "empty";
  if (file.size > MAX_DOCUMENT_BYTES) return "size";
  return null;
}
