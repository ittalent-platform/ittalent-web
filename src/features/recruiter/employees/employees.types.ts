import { z } from "zod";
import type { UserAuditHistoryResponse, UserDto } from "@/api/generated/types.gen";
import { REASON_MAX_LENGTH, REASON_MIN_LENGTH } from "@/components/common/reason-field";
import { validationMessage as msg } from "@/lib/validation-message";

// The employee screens use the recruiter-side contract of /api/v1/users, which differs from the system-admin
// operations in the generated client (username, expectedVersion, audit shape), so these are typed here.
export type CreateEmployeeRequest = {
  fullName: string;
  email: string;
  phone?: string | null;
  role?: "recruiter";
  enterpriseId?: string;
  status?: "active" | "inactive";
};
export type UpdateEmployeeRequest = { fullName?: string; phone?: string | null; expectedVersion: number };
export type UpdateEmployeeStatusRequest = { status: "active" | "suspended"; reason: string; expectedVersion: number };
export type UserHistoryResponse = UserAuditHistoryResponse;

export type Employee = UserDto;

export type EmployeeHistoryItem = UserHistoryResponse["items"][number];

export type EmployeeStatus = "active" | "inactive" | "suspended";

export type EmployeeSortField = "createdAt" | "full_name" | "status" | "email";
export type EmployeeSortOrder = "asc" | "desc";

export type EmployeesListParams = {
  page: number;
  limit?: number;
  search?: string;
  status?: EmployeeStatus | "all";
  department?: string;
  sortBy?: EmployeeSortField;
  sortOrder?: EmployeeSortOrder;
  enabled?: boolean;
};

export const FULL_NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const JOB_TITLE_MAX_LENGTH = 100;
export const DEPARTMENT_MAX_LENGTH = 100;
const PHONE_PATTERN = /^[0-9+() -]{8,20}$/;

export const inviteEmployeeSchema = z.object({
  email: z
    .string()
    .trim()
    .email(msg("recruiterEmployees.validation.emailInvalid")),
  full_name: z
    .string()
    .trim()
    .min(FULL_NAME_MIN_LENGTH, msg("recruiterEmployees.validation.fullNameMin", { min: FULL_NAME_MIN_LENGTH }))
    .max(NAME_MAX_LENGTH, msg("recruiterEmployees.validation.fullNameMax", { max: NAME_MAX_LENGTH })),
  job_title: z
    .string()
    .trim()
    .max(JOB_TITLE_MAX_LENGTH, msg("recruiterEmployees.validation.jobTitleMax", { max: JOB_TITLE_MAX_LENGTH }))
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .trim()
    .max(DEPARTMENT_MAX_LENGTH, msg("recruiterEmployees.validation.departmentMax", { max: DEPARTMENT_MAX_LENGTH }))
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, msg("recruiterEmployees.validation.phoneInvalid"))
    .optional()
    .or(z.literal("")),
});

export type InviteEmployeeFormValues = z.infer<typeof inviteEmployeeSchema>;

export const editEmployeeSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(FULL_NAME_MIN_LENGTH, msg("recruiterEmployees.validation.displayNameMin", { min: FULL_NAME_MIN_LENGTH }))
    .max(NAME_MAX_LENGTH, msg("recruiterEmployees.validation.displayNameMax", { max: NAME_MAX_LENGTH })),
  job_title: z
    .string()
    .trim()
    .max(JOB_TITLE_MAX_LENGTH, msg("recruiterEmployees.validation.jobTitleMax", { max: JOB_TITLE_MAX_LENGTH }))
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .trim()
    .max(DEPARTMENT_MAX_LENGTH, msg("recruiterEmployees.validation.departmentMax", { max: DEPARTMENT_MAX_LENGTH }))
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, msg("recruiterEmployees.validation.phoneInvalid"))
    .optional()
    .or(z.literal("")),
});

export type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;

export const changeEmployeeStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z
    .string()
    .trim()
    .min(REASON_MIN_LENGTH, msg("reason.tooShort", { min: REASON_MIN_LENGTH }))
    .max(REASON_MAX_LENGTH, msg("recruiterEmployees.validation.reasonMax", { max: REASON_MAX_LENGTH })),
});

export type ChangeEmployeeStatusFormValues = z.infer<
  typeof changeEmployeeStatusSchema
>;
