export type ValidationIssue = {
  message: string;
  path: (string | number)[];
};

export type ApiErrorBody = {
  code?: string;
  issues?: ValidationIssue[];
  message?: string;
};

export function getValidationIssues(error: unknown): ValidationIssue[] | null {
  const body = error as ApiErrorBody | undefined;

  if (body && Array.isArray(body.issues)) {
    return body.issues;
  }

  return null;
}

export function getErrorCode(error: unknown): string | undefined {
  return (error as ApiErrorBody | undefined)?.code;
}

export function getErrorStatus(error: unknown): number | undefined {
  return (error as { status?: number } | undefined)?.status;
}
