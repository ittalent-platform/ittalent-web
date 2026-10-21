import { describe, expect, it } from "vitest";

import { classifyAccountError } from "@/features/admin/users/account-error";

describe("classifyAccountError", () => {
  it("tells 409 conflicts apart by the API code, whatever the message says", () => {
    expect(classifyAccountError({ code: "LAST_ADMIN", message: "x", status: 409 })).toBe("lastAdmin");
    expect(classifyAccountError({ code: "LAST_ENTERPRISE_ADMIN", message: "x", status: 409 })).toBe("lastEnterpriseAdmin");
    expect(classifyAccountError({ code: "INVALID_TRANSITION", message: "x", status: 409 })).toBe("transition");
    expect(classifyAccountError({ code: "VERSION_CONFLICT", message: "x", status: 409 })).toBe("stale");
    expect(classifyAccountError({ code: "ACCOUNT_CONFLICT", message: "x", status: 409 })).toBe("accountConflict");
    expect(classifyAccountError({ code: "COMPANY_UNAVAILABLE", message: "x", status: 409 })).toBe("companyUnavailable");
    expect(classifyAccountError({ code: "ENTERPRISE_ONBOARDING_PENDING", message: "x", status: 409 })).toBe("onboardingPending");
    expect(classifyAccountError({ code: "COMPANY_UNAVAILABLE", message: "x", status: 404 })).toBe("companyUnavailable");
  });

  it("recognizes the stable company-unavailable code even on the legacy 404 status", () => {
    expect(classifyAccountError({ code: "COMPANY_UNAVAILABLE", message: "x", status: 404 })).toBe("companyUnavailable");
  });

  it("falls back to the message when a 409 has no code, and to stale when nothing matches", () => {
    expect(classifyAccountError({ message: "Unsupported account status transition", status: 409 })).toBe("transition");
    expect(classifyAccountError({ message: "something else", status: 409 })).toBe("stale");
  });

  it("maps 5xx to server and everything else to other", () => {
    expect(classifyAccountError({ status: 503 })).toBe("server");
    expect(classifyAccountError({ status: 400 })).toBe("other");
  });
});
