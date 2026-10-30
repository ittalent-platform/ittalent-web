export const REPORT_REASONS = [
  'scam_or_fraud',
  'misleading_information',
  'discrimination',
  'inappropriate_content',
  'something_else',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  'pending',
  'reviewing',
  'resolved',
  'rejected',
  'withdrawn',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const OPEN_REPORT_STATUSES: readonly ReportStatus[] = ['pending', 'reviewing'];
export const CLOSED_REPORT_STATUSES: readonly ReportStatus[] = ['resolved', 'rejected', 'withdrawn'];

export const REPORT_CANDIDATE_TABS = ['all', 'open', 'closed'] as const;
export type ReportCandidateTab = (typeof REPORT_CANDIDATE_TABS)[number];

export type ReportTargetType = 'job' | 'company' | 'enterprise' | 'user';

export const CANDIDATE_REPORT_ROLES = ['user', 'applicant'] as const;

export function isCandidateReportRole(role?: string | null): boolean {
  return Boolean(role && (CANDIDATE_REPORT_ROLES as readonly string[]).includes(role));
}

export const REPORT_LIMITS = {
  STATEMENT_MIN: 1,
  STATEMENT_MAX: 2000,
  INTERNAL_NOTES_MIN: 5,
  INTERNAL_NOTES_MAX: 1000,
  MESSAGE_TO_REPORTER_MIN: 10,
  MESSAGE_TO_REPORTER_MAX: 500,
  MAX_FILES: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 5,
} as const;

export const REPORT_EVIDENCE_MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

export type AllowedEvidenceExtension = keyof typeof REPORT_EVIDENCE_MIME_BY_EXT;

export const REPORT_EVIDENCE_ACCEPT =
  '.png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,image/png,image/jpeg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function extractLowerExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return '';
  return fileName.slice(dotIndex + 1).toLowerCase();
}

/**
 * Validates an evidence file against backend rules (type, non-empty, <= 5 MB).
 * Returns null if valid, or the failure kind ('format' | 'empty' | 'size').
 */
export function validateReportEvidenceFile(file: File): 'format' | 'empty' | 'size' | null {
  const ext = extractLowerExtension(file.name);
  if (!ext || !(ext in REPORT_EVIDENCE_MIME_BY_EXT)) {
    return 'format';
  }

  const expectedMime = REPORT_EVIDENCE_MIME_BY_EXT[ext as AllowedEvidenceExtension];
  if (
    file.type &&
    file.type !== expectedMime &&
    !((ext === 'jpg' || ext === 'jpeg') && file.type === 'image/jpg')
  ) {
    return 'format';
  }

  if (file.size <= 0) {
    return 'empty';
  }

  if (file.size > REPORT_LIMITS.MAX_FILE_SIZE_BYTES) {
    return 'size';
  }

  return null;
}

/**
 * Ensures the File carries the canonical MIME type expected by backend multer validation
 * even when the OS/browser omits file.type (e.g. .docx / .webp on some platforms).
 */
export function normalizeEvidenceFileForUpload(file: File): File {
  const ext = extractLowerExtension(file.name);
  if (!ext || !(ext in REPORT_EVIDENCE_MIME_BY_EXT)) {
    return file;
  }
  const expectedMime = REPORT_EVIDENCE_MIME_BY_EXT[ext as AllowedEvidenceExtension];
  if (file.type === expectedMime) {
    return file;
  }
  return new File([file], file.name, {
    type: expectedMime,
    lastModified: file.lastModified,
  });
}

/**
 * Extracts a clean display filename from a stored filename or Cloudinary URL,
 * collapsing duplicate trailing extensions (e.g. `evidence-uuid.png.png` -> `evidence-uuid.png`).
 */
export function cleanEvidenceFileName(
  rawNameOrUrl: string | undefined | null,
  fallbackIndex = 0,
): string {
  const fallback = `Evidence ${fallbackIndex + 1}`;
  if (!rawNameOrUrl) return fallback;

  const withoutQuery = rawNameOrUrl.split(/[?#]/)[0] ?? '';
  const rawBase = withoutQuery.split('/').pop()?.trim() ?? '';
  if (!rawBase) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawBase);
  } catch {
    decoded = rawBase;
  }

  return decoded
    .replace(/(\.[a-z0-9]{2,5})\1+$/i, '$1')
    .replace(/\.jpeg\.jpg$/i, '.jpg')
    .replace(/\.jpg\.jpeg$/i, '.jpeg');
}

const KNOWN_TARGET_TYPE_NAMES = [
  'job',
  'company',
  'enterprise',
  'user',
  'tin tuyển dụng',
  'doanh nghiệp',
  'người dùng',
];

export const UNAVAILABLE_TARGET_BACKEND_SUBTITLE = 'This item is no longer available on ITTalent.';

/**
 * Formats a report target subtitle without duplicating the target type prefix.
 * E.g. typeLabel="Job", subtitle="Job · Nova Fintech" -> "Job · Nova Fintech"
 *      typeLabel="Company", subtitle="Company" -> "Company"
 */
export function formatReportTargetSubtitle(options: {
  subtitle?: string | null;
  typeLabel: string;
  isAvailable?: boolean;
}): string {
  const { subtitle, typeLabel, isAvailable } = options;
  const trimmed = (subtitle ?? '').trim();

  if (!trimmed || isAvailable === false || trimmed === UNAVAILABLE_TARGET_BACKEND_SUBTITLE) {
    return typeLabel;
  }

  const lower = trimmed.toLowerCase();
  const typeLower = typeLabel.trim().toLowerCase();

  if (lower === typeLower || KNOWN_TARGET_TYPE_NAMES.includes(lower)) {
    return typeLabel;
  }

  const separatorIndex = trimmed.indexOf('·');
  if (separatorIndex !== -1) {
    const prefix = trimmed.slice(0, separatorIndex).trim().toLowerCase();
    const rest = trimmed.slice(separatorIndex + 1).trim();
    if (prefix === typeLower || KNOWN_TARGET_TYPE_NAMES.includes(prefix)) {
      if (
        !rest ||
        rest.toLowerCase() === typeLower ||
        KNOWN_TARGET_TYPE_NAMES.includes(rest.toLowerCase())
      ) {
        return typeLabel;
      }
      return `${typeLabel} · ${rest}`;
    }
  }

  return `${typeLabel} · ${trimmed}`;
}
