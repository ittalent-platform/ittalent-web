import { client } from "./client";

export type ApiError = { code?: string; message?: string; status?: number };

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const result = await client.post<{ 200: T; 201: T }, { "*": ApiError }>({ url, body });
  if (result.error || !result.data) {
    throw Object.assign(result.error && typeof result.error === "object" ? result.error : {}, {
      status: result.response?.status,
    });
  }
  return result.data;
}
