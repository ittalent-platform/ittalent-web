import { describe, expect, it } from "vitest";

import { chipValue } from "@/features/admin/users/users-filter-chips";
import { emailVerifiedFilter, isValidSearch, parseUsersFilters } from "@/features/admin/users/use-users-filters";

const ID = "6a4a5424c8097df77a6ed9be";

describe("parseUsersFilters", () => {
  it("reads comma separated values", () => {
    const parsed = parseUsersFilters(new URLSearchParams(`role=user,admin&status=active&email=verified&company=${ID}`));
    expect(parsed).toEqual({ companies: [ID], dropped: false, emails: ["verified"], roles: ["user", "admin"], statuses: ["active"] });
  });

  it("drops unknown values and malformed company ids, and reports it", () => {
    const parsed = parseUsersFilters(new URLSearchParams("role=root,admin&status=gone&email=maybe&company=123"));
    expect(parsed).toMatchObject({ companies: [], dropped: true, emails: [], roles: ["admin"], statuses: [] });
  });

  it("ignores duplicates without reporting them as invalid", () => {
    expect(parseUsersFilters(new URLSearchParams("role=admin,admin")).roles).toEqual(["admin"]);
  });
});

describe("emailVerifiedFilter", () => {
  it("is a filter only when exactly one option is chosen", () => {
    expect(emailVerifiedFilter([])).toBeUndefined();
    expect(emailVerifiedFilter(["verified", "unverified"])).toBeUndefined();
    expect(emailVerifiedFilter(["unverified"])).toBe(false);
    expect(emailVerifiedFilter(["verified"])).toBe(true);
  });
});

describe("isValidSearch", () => {
  it("accepts empty or 2 to 100 characters", () => {
    expect(isValidSearch("")).toBe(true);
    expect(isValidSearch("a")).toBe(false);
    expect(isValidSearch("ab")).toBe(true);
    expect(isValidSearch("x".repeat(101))).toBe(false);
  });
});

describe("chipValue", () => {
  it("joins names and collapses extras into +N", () => {
    expect(chipValue(["HR", "Enterprise admin"])).toBe("HR, Enterprise admin");
    expect(chipValue(["Nova Fintech", "B", "C"], 1)).toBe("Nova Fintech +2");
  });
});
