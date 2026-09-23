import { z } from "zod";

export const vietnamesePhoneSchema = z
  .string()
  .trim()
  .regex(
    /^0(?:3|5|7|8|9)\d{8}$/,
    "Use a 10-digit Vietnamese mobile number starting with 03, 05, 07, 08, or 09.",
  );
