import { z } from "zod";
import type { UserDto, UserHistoryResponse } from "@/api/generated/types.gen";

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

export const inviteEmployeeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid corporate email address"),
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  job_title: z
    .string()
    .trim()
    .max(100, "Job title cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .trim()
    .max(100, "Department cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{8,20}$/, "Work phone must be 8–20 digits")
    .optional()
    .or(z.literal("")),
});

export type InviteEmployeeFormValues = z.infer<typeof inviteEmployeeSchema>;

export const editEmployeeSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name cannot exceed 100 characters"),
  job_title: z
    .string()
    .trim()
    .max(100, "Job title cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .trim()
    .max(100, "Department cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{8,20}$/, "Work phone must be 8–20 digits")
    .optional()
    .or(z.literal("")),
});

export type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;

export const changeEmployeeStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type ChangeEmployeeStatusFormValues = z.infer<
  typeof changeEmployeeStatusSchema
>;
