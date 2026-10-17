import { describe, expect, it } from "vitest";

import {
  APPLICATION_STATUSES,
  CLOSED_STATUSES,
  IN_PROGRESS_STATUSES,
  INTERVIEW_REPLY_TONES,
  KANBAN_COLUMNS,
  PERMITTED_TRANSITIONS,
  STATUS_TONES,
  TIMELINE_TONES,
  isKanbanDraggable,
  isTransitionPermitted,
  type ApplicationStatus,
  type InterviewReplyState,
} from "@/features/recruiter/applications/applications.constants";
import { recruiterApplicationKeys } from "@/features/recruiter/applications/applications.queries";

describe("recruiter applications constants & transition rules (BR-17)", () => {
  it("defines standard application lifecycle statuses and subsets", () => {
    expect(APPLICATION_STATUSES).toContain("submitted");
    expect(APPLICATION_STATUSES).toContain("under_review");
    expect(APPLICATION_STATUSES).toContain("interviewing");
    expect(APPLICATION_STATUSES).toContain("offered");
    expect(APPLICATION_STATUSES).toContain("hired");
    expect(APPLICATION_STATUSES).toContain("rejected");
    expect(APPLICATION_STATUSES).toContain("withdrawn");
    expect(APPLICATION_STATUSES).toContain("position_filled");

    expect(IN_PROGRESS_STATUSES).toEqual(["submitted", "under_review", "interviewing", "offered"]);
    expect(CLOSED_STATUSES).toEqual(["hired", "rejected", "withdrawn", "position_filled"]);
  });

  it("enforces permitted recruitment pipeline forward transitions", () => {
    expect(PERMITTED_TRANSITIONS.submitted).toEqual(["under_review", "rejected"]);
    expect(PERMITTED_TRANSITIONS.under_review).toEqual(["interviewing", "rejected"]);
    expect(PERMITTED_TRANSITIONS.interviewing).toEqual(["offered", "rejected"]);
    expect(PERMITTED_TRANSITIONS.offered).toEqual(["hired", "rejected"]);

    expect(isTransitionPermitted("submitted", "under_review")).toBe(true);
    expect(isTransitionPermitted("under_review", "interviewing")).toBe(true);
    expect(isTransitionPermitted("interviewing", "offered")).toBe(true);
    expect(isTransitionPermitted("offered", "hired")).toBe(true);
  });

  it("allows rejection from any active non-terminal status", () => {
    expect(isTransitionPermitted("submitted", "rejected")).toBe(true);
    expect(isTransitionPermitted("under_review", "rejected")).toBe(true);
    expect(isTransitionPermitted("interviewing", "rejected")).toBe(true);
    expect(isTransitionPermitted("offered", "rejected")).toBe(true);
  });

  it("treats terminal states as closed with zero outgoing transitions", () => {
    const terminalStatuses: ApplicationStatus[] = ["hired", "rejected", "withdrawn", "position_filled"];

    for (const status of terminalStatuses) {
      expect(PERMITTED_TRANSITIONS[status]).toEqual([]);
      for (const target of APPLICATION_STATUSES) {
        expect(isTransitionPermitted(status, target)).toBe(false);
      }
    }
  });

  it("disallows skipping recruitment pipeline stages", () => {
    expect(isTransitionPermitted("submitted", "interviewing")).toBe(false);
    expect(isTransitionPermitted("submitted", "offered")).toBe(false);
    expect(isTransitionPermitted("submitted", "hired")).toBe(false);
    expect(isTransitionPermitted("under_review", "offered")).toBe(false);
    expect(isTransitionPermitted("under_review", "hired")).toBe(false);
    expect(isTransitionPermitted("interviewing", "hired")).toBe(false);
  });

  it("provides comprehensive tone and timeline mappings for every status", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_TONES[status]).toBeDefined();
      expect(STATUS_TONES[status].badge).toBeTruthy();
      expect(STATUS_TONES[status].text).toBeTruthy();
      expect(STATUS_TONES[status].dot).toBeTruthy();
      expect(STATUS_TONES[status].border).toBeTruthy();

      expect(TIMELINE_TONES[status]).toBeDefined();
    }
  });

  it("maps interview reply states to visual tokens", () => {
    const replyStates: InterviewReplyState[] = [
      "awaiting_reply",
      "accepted",
      "new_time_requested",
      "declined",
    ];

    for (const state of replyStates) {
      expect(INTERVIEW_REPLY_TONES[state]).toBeDefined();
      expect(INTERVIEW_REPLY_TONES[state].badge).toBeTruthy();
      expect(INTERVIEW_REPLY_TONES[state].text).toBeTruthy();
      expect(INTERVIEW_REPLY_TONES[state].dot).toBeTruthy();
    }
  });
});

describe("recruiterApplicationKeys query key factory", () => {
  it("produces hierarchical, unique query keys", () => {
    expect(recruiterApplicationKeys.all).toEqual(["recruiter", "applications"]);
    expect(recruiterApplicationKeys.lists()).toEqual(["recruiter", "applications", "list"]);

    const filterParams = { page: 1, limit: 10, status: "submitted" };
    expect(recruiterApplicationKeys.list(filterParams)).toEqual([
      "recruiter",
      "applications",
      "list",
      filterParams,
    ]);

    expect(recruiterApplicationKeys.details()).toEqual(["recruiter", "applications", "detail"]);
    expect(recruiterApplicationKeys.detail("app-101")).toEqual([
      "recruiter",
      "applications",
      "detail",
      "app-101",
    ]);

    expect(recruiterApplicationKeys.cv("app-101")).toEqual([
      "recruiter",
      "applications",
      "detail",
      "app-101",
      "cv",
    ]);

    expect(recruiterApplicationKeys.notes("app-101")).toEqual([
      "recruiter",
      "applications",
      "detail",
      "app-101",
      "notes",
    ]);

    expect(recruiterApplicationKeys.companyHistory("app-101")).toEqual([
      "recruiter",
      "applications",
      "detail",
      "app-101",
      "company-history",
    ]);
  });

  it("configures 7 kanban lifecycle columns and drag-eligibility", () => {
    expect(KANBAN_COLUMNS).toEqual([
      "submitted",
      "under_review",
      "interviewing",
      "offered",
      "hired",
      "rejected",
      "withdrawn",
    ]);

    expect(isKanbanDraggable("submitted")).toBe(true);
    expect(isKanbanDraggable("under_review")).toBe(true);
    expect(isKanbanDraggable("interviewing")).toBe(true);
    expect(isKanbanDraggable("offered")).toBe(true);

    expect(isKanbanDraggable("hired")).toBe(false);
    expect(isKanbanDraggable("rejected")).toBe(false);
    expect(isKanbanDraggable("withdrawn")).toBe(false);
    expect(isKanbanDraggable("position_filled")).toBe(false);
  });
});
