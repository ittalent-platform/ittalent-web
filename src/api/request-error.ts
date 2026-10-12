/** A failed API call: the server's message, plus the HTTP status and the error `code` when it sent one. */
export type RequestError = Error & { status?: number; code?: string };

type ApiResult<T> = { data?: T; error?: unknown; response?: Response };

export function requestError(result: ApiResult<unknown>, fallback: string): RequestError {
  const error = new Error(requestErrorMessage(result.error, fallback)) as RequestError;
  error.status = result.response?.status;
  const code = typeof result.error === "object" && result.error !== null && "code" in result.error ? result.error.code : undefined;
  if (typeof code === "string") error.code = code;
  return error;
}

/** The data of a generated-client call, or a thrown RequestError. */
export function unwrap<T>(result: ApiResult<T>, fallback = "Unable to complete this request."): T {
  if (!result.error && result.response?.ok !== false) return result.data as T;
  throw requestError(result, fallback);
}

export function requestErrorMessage(error: unknown, fallback = "Unable to complete this request.") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function requestStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
}
