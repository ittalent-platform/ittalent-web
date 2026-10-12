import { describe, expect, it } from "vitest";
import {
  acceptInvitationFormSchema,
  adminDecisionFormSchema,
  startRegistrationSchema,
  step1CompanyDetailsSchema,
  step2RepresentativeSchema,
  step3DocumentsSchema,
} from "@/features/enterprise-registration/enterprise-registration.schemas";
import i18n from "@/i18n";
import { REGISTRATION_MESSAGE_KEYS } from "@/features/enterprise-registration/enterprise-registration.constants";

describe("enterprise-registration schemas", () => {
  describe("startRegistrationSchema & corporate email policy (BR-39)", () => {
    it("rejects personal webmail domains", () => {
      const personalEmails = ["john@gmail.com", "recruiter@yahoo.com", "admin@hotmail.com"];
      for (const email of personalEmails) {
        const res = startRegistrationSchema.safeParse({
          corporate_email: email,
          representative_name: "John Doe",
          representative_phone: "0901234567",
        });
        expect(res.success).toBe(false);
        if (!res.success) {
          const err = res.error.issues.find((i) => i.path.includes("corporate_email"));
          expect(err?.message).toBe(i18n.t(REGISTRATION_MESSAGE_KEYS.PERSONAL_EMAIL_REJECTED));
        }
      }
    });

    it("accepts corporate work email domains and validates representative name", () => {
      expect(
        startRegistrationSchema.safeParse({
          corporate_email: "recruitment@blueorbit.vn",
          representative_name: "Hoàng Nam",
          representative_phone: "0901234567",
          representative_position: "Talent Acquisition Lead",
        }).success,
      ).toBe(true);

      expect(
        startRegistrationSchema.safeParse({
          corporate_email: "hr@company.com",
          representative_name: "J",
          representative_phone: "0901234567",
        }).success,
      ).toBe(false);
    });
  });

  describe("step1CompanyDetailsSchema & tax code validation (BR-27)", () => {
    const validBaseData = {
      name: "BlueOrbit Studio",
      legal_name: "BlueOrbit Technology Solutions JSC",
      industry: "Software Engineering",
      company_size: "51-200" as const,
      address: { street: "123 Nguyễn Huệ", city: "Hồ Chí Minh", country: "Việt Nam" },
    };

    it("accepts valid 10-digit and 13-digit tax codes", () => {
      expect(step1CompanyDetailsSchema.safeParse({ ...validBaseData, tax_code: "0108889990" }).success).toBe(true);
      expect(step1CompanyDetailsSchema.safeParse({ ...validBaseData, tax_code: "0108889990001" }).success).toBe(true);
    });

    it("rejects invalid tax codes", () => {
      for (const tax of ["12345", "01088899901234", "010888ABCD", ""]) {
        expect(step1CompanyDetailsSchema.safeParse({ ...validBaseData, tax_code: tax }).success).toBe(false);
      }
    });
  });

  describe("step2 & step3 documents dynamic authorization requirement (BR-41)", () => {
    it("validates representative declaration", () => {
      expect(
        step2RepresentativeSchema.safeParse({
          full_name: "Đỗ Minh Châu",
          phone: "0912345678",
          position: "HR Manager",
          is_legal_representative: false,
        }).success,
      ).toBe(true);
    });

    it("accepts document upload with only BRC when representative is legal rep", () => {
      expect(
        step3DocumentsSchema.safeParse({
          is_legal_representative: true,
          documents: [
            {
              document_type: "business_license",
              file_name: "giay_phep_kinh_doanh.pdf",
              file_url: "https://storage.ittalent.vn/docs/brc-123.pdf",
              file_size: 2 * 1024 * 1024,
            },
          ],
        }).success,
      ).toBe(true);
    });

    it("rejects without LoA when representative is NOT legal rep, but accepts when LoA is present", () => {
      const withoutLoa = step3DocumentsSchema.safeParse({
        is_legal_representative: false,
        documents: [
          {
            document_type: "business_license",
            file_name: "giay_phep_kinh_doanh.pdf",
            file_url: "https://storage.ittalent.vn/docs/brc-123.pdf",
          },
        ],
      });
      expect(withoutLoa.success).toBe(false);

      const withLoa = step3DocumentsSchema.safeParse({
        is_legal_representative: false,
        documents: [
          {
            document_type: "business_license",
            file_name: "giay_phep_kinh_doanh.pdf",
            file_url: "https://storage.ittalent.vn/docs/brc-123.pdf",
          },
          {
            document_type: "power_of_attorney",
            file_name: "giay_uy_quyen.pdf",
            file_url: "https://storage.ittalent.vn/docs/loa-123.pdf",
          },
        ],
      });
      expect(withLoa.success).toBe(true);
    });
  });

  describe("adminDecisionFormSchema (BR-43)", () => {
    it("approves when all 3 checklist items are verified and rejects if any is unchecked", () => {
      expect(
        adminDecisionFormSchema.safeParse({
          decision: "approved",
          version: 3,
          checklist: { tax_code_verified: true, legal_representative_verified: true, documents_verified: true },
        }).success,
      ).toBe(true);

      expect(
        adminDecisionFormSchema.safeParse({
          decision: "approved",
          version: 3,
          checklist: { tax_code_verified: true, legal_representative_verified: false, documents_verified: true },
        }).success,
      ).toBe(false);
    });

    it("requires rejection rationale of at least 20 characters", () => {
      expect(
        adminDecisionFormSchema.safeParse({
          decision: "rejected",
          version: 3,
          rejection_reason: "The attached business registration certificate is expired. Please re-upload.",
        }).success,
      ).toBe(true);

      expect(
        adminDecisionFormSchema.safeParse({
          decision: "rejected",
          version: 3,
          rejection_reason: "Too short",
        }).success,
      ).toBe(false);
    });
  });

  describe("acceptInvitationFormSchema", () => {
    it("validates password strength, matching confirmation and terms", () => {
      expect(
        acceptInvitationFormSchema.safeParse({
          password: "StrongPassword123!",
          confirm_password: "StrongPassword123!",
          agree_to_terms: true,
        }).success,
      ).toBe(true);

      expect(
        acceptInvitationFormSchema.safeParse({
          password: "StrongPassword123!",
          confirm_password: "MismatchedPassword123!",
          agree_to_terms: true,
        }).success,
      ).toBe(false);
    });
  });
});
