export type RequestError = Error & { status?: number };

export function requestError(result: {
  data?: unknown;
  error?: unknown;
  response?: Response;
}, fallback: string): RequestError {
  const error = new Error(requestErrorMessage(result.error, fallback)) as RequestError;
  error.status = result.response?.status;
  return error;
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
