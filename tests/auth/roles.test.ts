import { describe, expect, it } from "vitest";

import {
  canManageJobPostings,
  dashboardPathForRole,
} from "@/auth/roles";

describe("job posting role permissions", () => {
  it.each(["recruiter", "enterprise_admin"])(
    "allows %s to manage job postings",
    (role) => {
      expect(canManageJobPostings(role)).toBe(true);
      expect(dashboardPathForRole(role)).toBe("/recruiter/job-postings");
    },
  );

  it.each(["admin", "user", "applicant", "interviewer", undefined])(
    "does not grant job management to %s",
    (role) => {
      expect(canManageJobPostings(role)).toBe(false);
    },
  );
});
