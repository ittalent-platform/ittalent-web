import { describe, expect, it } from "vitest";

import {
  broadcastFormSchema,
  isSafeHttpUrl,
} from "@/features/admin/broadcast-notifications/broadcast-notifications.schemas";

describe("Broadcast Notifications Schemas & Security Validation", () => {
  describe("isSafeHttpUrl", () => {
    it("accepts valid https and http URLs", () => {
      expect(isSafeHttpUrl("https://italent.com")).toBe(true);
      expect(isSafeHttpUrl("http://localhost:3000/status")).toBe(true);
      expect(isSafeHttpUrl("https://example.com/announcements?id=123#top")).toBe(true);
    });

    it("rejects malicious, non-http, and invalid schemes", () => {
      expect(isSafeHttpUrl("javascript:alert(document.cookie)")).toBe(false);
      expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeHttpUrl("file:///C:/Windows/System32/cmd.exe")).toBe(false);
      expect(isSafeHttpUrl("ftp://ftp.example.com/file.txt")).toBe(false);
      expect(isSafeHttpUrl("not-a-valid-url")).toBe(false);
      expect(isSafeHttpUrl("")).toBe(false);
      expect(isSafeHttpUrl(null)).toBe(false);
      expect(isSafeHttpUrl(undefined)).toBe(false);
    });
  });

  describe("broadcastFormSchema", () => {
    it("validates valid broadcast form values", () => {
      const valid = {
        action_label: "View Status",
        action_url: "https://status.italent.com",
        category: "System Maintenance",
        channels: ["In-App Inbox"],
        content: "Platform undergoing scheduled maintenance this weekend.",
        priority: "High",
        target_audience: "All Users",
        title: "Platform Maintenance Window",
      };

      const result = broadcastFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects title shorter than 5 chars", () => {
      const invalid = {
        action_label: "",
        action_url: "",
        category: "System Maintenance",
        channels: ["In-App Inbox"],
        content: "Platform undergoing scheduled maintenance this weekend.",
        priority: "Normal",
        target_audience: "All Users",
        title: "Down",
      };

      const result = broadcastFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects content shorter than 10 chars", () => {
      const invalid = {
        action_label: "",
        action_url: "",
        category: "System Maintenance",
        channels: ["In-App Inbox"],
        content: "Short",
        priority: "Normal",
        target_audience: "All Users",
        title: "Valid Title Long Enough",
      };

      const result = broadcastFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects unsafe javascript URL in action_url", () => {
      const invalid = {
        action_label: "Click",
        action_url: "javascript:alert(1)",
        category: "System Maintenance",
        channels: ["In-App Inbox"],
        content: "Platform undergoing scheduled maintenance this weekend.",
        priority: "Normal",
        target_audience: "All Users",
        title: "Valid Title Long Enough",
      };

      const result = broadcastFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects missing action_label when action_url is provided", () => {
      const invalid = {
        action_label: "",
        action_url: "https://italent.com",
        category: "System Maintenance",
        channels: ["In-App Inbox"],
        content: "Platform undergoing scheduled maintenance this weekend.",
        priority: "Normal",
        target_audience: "All Users",
        title: "Valid Title Long Enough",
      };

      const result = broadcastFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects channels array when In-App Inbox is missing", () => {
      const invalid = {
        action_label: "",
        action_url: "",
        category: "System Maintenance",
        channels: ["Email Digest"],
        content: "Platform undergoing scheduled maintenance this weekend.",
        priority: "Normal",
        target_audience: "All Users",
        title: "Valid Title Long Enough",
      };

      const result = broadcastFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
