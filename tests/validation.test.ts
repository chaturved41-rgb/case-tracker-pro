import { describe, it, expect } from "vitest";
import {
  validateFreezeStep,
  validateTransactionStep,
  validateConsentStep,
  isValidRedirectPath,
  isValidAccountMask,
  isValidEmail,
  isValidDate,
  sanitizeTextInput,
  validateFileUpload,
  type CaseInput,
} from "@/lib/validation";

const validForm: CaseInput = {
  bankName: "State Bank of India",
  branch: "Andheri West",
  accountMasked: "XXXX4321",
  freezeType: "debit_freeze",
  freezeDate: "2026-01-15",
  policeStationName: "",
  city: "",
  state: "",
  ioName: "",
  ioEmail: "",
  firNumber: "",
  transactionDate: "2026-01-10",
  transactionAmount: "15000",
  senderName: "Rahul Enterprises",
  purpose: "freelance",
  relationship: "client",
  narrative: "I received payment for freelance web development work.",
  consentGiven: true,
};

describe("Validation Functions", () => {
  describe("validateFreezeStep", () => {
    it("should pass with valid data", () => {
      const errors = validateFreezeStep(validForm);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("should require bank name", () => {
      const errors = validateFreezeStep({ ...validForm, bankName: "" });
      expect(errors.bankName).toBeDefined();
    });

    it("should reject whitespace-only bank name", () => {
      const errors = validateFreezeStep({ ...validForm, bankName: "   " });
      expect(errors.bankName).toBeDefined();
    });

    it("should require masked account", () => {
      const errors = validateFreezeStep({ ...validForm, accountMasked: "" });
      expect(errors.accountMasked).toBeDefined();
    });

    it("should require freeze type", () => {
      const errors = validateFreezeStep({ ...validForm, freezeType: "" });
      expect(errors.freezeType).toBeDefined();
    });

    it("should require freeze date", () => {
      const errors = validateFreezeStep({ ...validForm, freezeDate: "" });
      expect(errors.freezeDate).toBeDefined();
    });

    it("should not require branch (optional)", () => {
      const errors = validateFreezeStep({ ...validForm, branch: "" });
      expect(errors.branch).toBeUndefined();
    });
  });

  describe("validateTransactionStep", () => {
    it("should pass with valid data", () => {
      const errors = validateTransactionStep(validForm);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("should require transaction date", () => {
      const errors = validateTransactionStep({
        ...validForm,
        transactionDate: "",
      });
      expect(errors.transactionDate).toBeDefined();
    });

    it("should require positive amount", () => {
      const errors = validateTransactionStep({
        ...validForm,
        transactionAmount: "0",
      });
      expect(errors.transactionAmount).toBeDefined();
    });

    it("should reject negative amount", () => {
      const errors = validateTransactionStep({
        ...validForm,
        transactionAmount: "-5000",
      });
      expect(errors.transactionAmount).toBeDefined();
    });

    it("should require sender name", () => {
      const errors = validateTransactionStep({
        ...validForm,
        senderName: "",
      });
      expect(errors.senderName).toBeDefined();
    });

    it("should require purpose", () => {
      const errors = validateTransactionStep({ ...validForm, purpose: "" });
      expect(errors.purpose).toBeDefined();
    });

    it("should require relationship", () => {
      const errors = validateTransactionStep({
        ...validForm,
        relationship: "",
      });
      expect(errors.relationship).toBeDefined();
    });

    it("should require narrative", () => {
      const errors = validateTransactionStep({ ...validForm, narrative: "" });
      expect(errors.narrative).toBeDefined();
    });

    it("should reject whitespace-only narrative", () => {
      const errors = validateTransactionStep({
        ...validForm,
        narrative: "   ",
      });
      expect(errors.narrative).toBeDefined();
    });
  });

  describe("validateConsentStep", () => {
    it("should pass when consent is given", () => {
      const errors = validateConsentStep({ ...validForm, consentGiven: true });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("should fail when consent is not given", () => {
      const errors = validateConsentStep({
        ...validForm,
        consentGiven: false,
      });
      expect(errors.consentGiven).toBeDefined();
    });
  });
});

describe("Security Helpers", () => {
  describe("isValidRedirectPath", () => {
    it("should accept valid relative paths", () => {
      expect(isValidRedirectPath("/cases")).toBe(true);
      expect(isValidRedirectPath("/new-case")).toBe(true);
      expect(isValidRedirectPath("/cases/abc123")).toBe(true);
    });

    it("should reject protocol-relative URLs", () => {
      expect(isValidRedirectPath("//evil.com")).toBe(false);
      expect(isValidRedirectPath("//attacker.com/phish")).toBe(false);
    });

    it("should reject null/empty", () => {
      expect(isValidRedirectPath(null)).toBe(false);
      expect(isValidRedirectPath("")).toBe(false);
    });

    it("should reject absolute URLs", () => {
      expect(isValidRedirectPath("https://evil.com")).toBe(false);
      expect(isValidRedirectPath("http://evil.com")).toBe(false);
    });
  });

  describe("isValidAccountMask", () => {
    it("should accept valid masks", () => {
      expect(isValidAccountMask("XXXX4321")).toBe(true);
      expect(isValidAccountMask("XXXX0001")).toBe(true);
    });

    it("should reject incomplete masks", () => {
      expect(isValidAccountMask("4321")).toBe(false);
      expect(isValidAccountMask("XX4321")).toBe(false);
    });

    it("should reject full account numbers", () => {
      expect(isValidAccountMask("12345678901234")).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.in")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("notanemail")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
    });
  });

  describe("isValidDate", () => {
    it("should accept valid dates", () => {
      expect(isValidDate("2026-01-15")).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isValidDate("")).toBe(false);
      expect(isValidDate("not-a-date")).toBe(false);
      expect(isValidDate("2026-13-45")).toBe(false);
    });
  });

  describe("sanitizeTextInput", () => {
    it("should remove script tags", () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeTextInput(input);
      expect(result).toBe("Hello  World");
      expect(result).not.toContain("<script>");
    });

    it("should remove HTML tags", () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const result = sanitizeTextInput(input);
      expect(result).toBe("Bold and italic");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeTextInput(input);
      expect(result).toBe("Hello World");
    });

    it("should handle nested script tags", () => {
      const input = '<script><script>alert("xss")</script></script>';
      const result = sanitizeTextInput(input);
      expect(result).not.toContain("<script>");
    });
  });

  describe("validateFileUpload", () => {
    it("should accept valid PDF", () => {
      const file = new File(["test"], "test.pdf", {
        type: "application/pdf",
      });
      expect(validateFileUpload(file).valid).toBe(true);
    });

    it("should accept valid image", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      expect(validateFileUpload(file).valid).toBe(true);
    });

    it("should reject executable files", () => {
      const file = new File(["test"], "malware.exe", {
        type: "application/x-executable",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("should reject oversized files", () => {
      // Create a mock file that reports large size
      const file = new File(["x"], "large.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 15 * 1024 * 1024 }); // 15MB
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10MB");
    });

    it("should accept files with empty MIME type (some browsers)", () => {
      const file = new File(["test"], "document", { type: "" });
      expect(validateFileUpload(file).valid).toBe(true);
    });
  });
});
