import { describe, expect, it } from "vitest";

import { requestCode, requestError, requestStatus } from "@/api/request-error";

describe("requestError", () => {
  it("keeps the server's message, the HTTP status and the machine-readable code", () => {
    const error = requestError(
      { error: { code: "INTERVIEW_STATUS_FINAL", message: "The interview status is final" }, response: new Response(null, { status: 409 }) },
      "fallback",
    );
    expect(error.message).toBe("The interview status is final");
    expect(requestStatus(error)).toBe(409);
    expect(requestCode(error)).toBe("INTERVIEW_STATUS_FINAL");
  });

  it("has no code when the server sent none", () => {
    const error = requestError({ error: { message: "Not found" }, response: new Response(null, { status: 404 }) }, "fallback");
    expect(requestCode(error)).toBeUndefined();
  });

  it("falls back to the given message when the body has none", () => {
    expect(requestError({ error: undefined }, "Could not load").message).toBe("Could not load");
  });
});

describe("requestCode", () => {
  it("is undefined for anything that carries no string code", () => {
    expect(requestCode(undefined)).toBeUndefined();
    expect(requestCode(new Error("plain"))).toBeUndefined();
    expect(requestCode({ code: 12 })).toBeUndefined();
  });
});
