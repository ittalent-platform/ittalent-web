import { describe, expect, it } from "vitest";

import { hasLinkCredentials, isInsecureLink, isWebLink, linkHost, linkSummary } from "@/lib/web-link";

describe("web links", () => {
  it("accepts http(s) links with a real host and no credentials only", () => {
    expect(isWebLink("https://anguyen.dev/work")).toBe(true);
    expect(isWebLink(" http://anguyen.dev ")).toBe(true);
    for (const value of ["javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "ftp://files.example.com/a", "https://localhost/x", "https://u:p@anguyen.dev", "not a link", ""]) {
      expect(isWebLink(value)).toBe(false);
    }
  });

  it("spots credentials, insecure links and the host to show", () => {
    expect(hasLinkCredentials("https://an:secret@anguyen.dev/work")).toBe(true);
    expect(hasLinkCredentials("https://anguyen.dev/work")).toBe(false);
    expect(isInsecureLink("HTTP://anguyen.dev")).toBe(true);
    expect(isInsecureLink("https://anguyen.dev")).toBe(false);
    expect(linkHost("https://www.anguyen.dev/work")).toBe("anguyen.dev");
    expect(linkSummary("https://www.anguyen.dev/work/loan-dashboard?x=1")).toBe("anguyen.dev/work/loan-dashboard");
    expect(linkSummary("https://anguyen.dev/")).toBe("anguyen.dev");
  });
});
