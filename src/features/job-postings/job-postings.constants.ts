import type { CreateJobPostingRequest } from "@/api/generated/types.gen";

/** Same limits as the backend (UC-JOB-01 Field rules). */
export const JOB_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"] as const satisfies readonly CreateJobPostingRequest["employment_type"][];
export const JOB_LEVELS = ["Intern", "Junior", "Mid", "Senior", "Lead"] as const;

export const JOB_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 150,
  CONTENT_MIN: 20,
  CONTENT_MAX: 5000,
  LOCATION_MIN: 2,
  LOCATION_MAX: 150,
  LEVEL_MAX: 100,
  CURRENCY_MAX: 10,
} as const;

export const DEFAULT_CURRENCY = "VND";

/** Deadlines are dates meaning the end of the day in Asia/Ho_Chi_Minh (UTC+7, no daylight saving). */
export const DEADLINE_OFFSET_HOURS = 7;
export const MS_PER_HOUR = 3_600_000;

export const JOB_POSTINGS_PATH = "/recruiter/job-postings";
