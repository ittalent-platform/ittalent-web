import { describe, expect, it } from "vitest";

import { historyChips } from "@/features/admin/users/user-history";

describe("historyChips", () => {
  it("merges previousEmail and newEmail into one Email chip", () => {
    expect(historyChips({ previousEmail: "t***@a.vn", newEmail: "b***@a.vn" })).toEqual([{ after: "b***@a.vn", before: "t***@a.vn", field: "email" }]);
  });

  it("still pairs previousRole with role", () => {
    expect(historyChips({ previousRole: "recruiter", role: "enterprise_admin" })).toEqual([{ after: "enterprise_admin", before: "recruiter", field: "role" }]);
  });
});
