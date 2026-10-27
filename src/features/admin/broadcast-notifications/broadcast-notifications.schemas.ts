import { z } from "zod";

import {
  BROADCAST_AUDIENCES,
  BROADCAST_CATEGORIES,
  BROADCAST_CHANNELS,
  BROADCAST_PRIORITIES,
} from "./broadcast-notifications.constants";
import type {
  BroadcastAudience,
  BroadcastCategory,
  BroadcastChannel,
  BroadcastPriority,
} from "./broadcast-notifications.types";

/**
 * Validates that a string is a safe HTTP/HTTPS URL.
 * Strictly prevents javascript:, data:, file:, and other unsafe URI schemes.
 */
export function isSafeHttpUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const broadcastFormSchema = z
  .object({
    action_label: z
      .string()
      .trim()
      .max(50, "Action label cannot exceed 50 characters")
      .optional()
      .or(z.literal("")),
    action_url: z
      .string()
      .trim()
      .max(2048, "Action URL cannot exceed 2048 characters")
      .refine(
        (val) => !val || isSafeHttpUrl(val),
        "Action URL must be a valid web address starting with http:// or https://",
      )
      .optional()
      .or(z.literal("")),
    category: z.enum(BROADCAST_CATEGORIES as unknown as [BroadcastCategory, ...BroadcastCategory[]]),
    channels: z
      .array(z.enum(BROADCAST_CHANNELS as unknown as [BroadcastChannel, ...BroadcastChannel[]]))
      .min(1, "At least one delivery channel must be selected"),
    content: z
      .string()
      .trim()
      .min(10, "Content must be at least 10 characters")
      .max(2000, "Content cannot exceed 2000 characters"),
    priority: z.enum(BROADCAST_PRIORITIES as unknown as [BroadcastPriority, ...BroadcastPriority[]]),
    target_audience: z.enum(
      BROADCAST_AUDIENCES as unknown as [BroadcastAudience, ...BroadcastAudience[]],
    ),
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(150, "Title cannot exceed 150 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.action_url && data.action_url.trim() !== "") {
      if (!data.action_label || data.action_label.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Action button label is required when an Action URL is provided",
          path: ["action_label"],
        });
      }
    }
    if (!data.channels.includes("In-App Inbox")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In-App Inbox is mandatory and must be included",
        path: ["channels"],
      });
    }
  });

export type BroadcastFormValues = z.infer<typeof broadcastFormSchema>;
