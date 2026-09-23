import { z } from "zod";

export const publicEnvSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3000"),
  VITE_APP_NAME: z.string().min(1).default("iTalent"),
});

export function getPublicEnv(source: Record<string, unknown>) {
  return publicEnvSchema.parse({
    VITE_API_URL: source.VITE_API_URL,
    VITE_APP_NAME: source.VITE_APP_NAME,
  });
}
