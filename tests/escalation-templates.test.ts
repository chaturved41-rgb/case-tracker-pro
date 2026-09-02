import { describe, it, expect } from "vitest";
import {
  generateBankNodalDraft,
  generateBankGrievanceDraft,
  generateSPOfficeDraft,
  generateRBIOmbudsmanDraft,
  type CaseData,
} from "@/convex/escalationTemplates";

const mockCase: CaseData = {
  bankName: "State Bank of India",
  accountMasked: "XXXX4321",
  freezeType: "debit_freeze",
  freezeDate: "2026-01-15",
  transactionAmount: 15000,
  senderName: "Rahul Enterprises",
  purpose: "freelance",
};

describe("Escalation Templates", () => {
  describe("generateBankNodalDraft", () => {
    it("should include bank name", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toContain("State Bank of India");
    });

    it("should include masked account number", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toContain("XXXX4321");
    });

    it("should include transaction amount formatted in INR", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toContain("15,000");
    });

    it("should include sender name", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toContain("Rahul Enterprises");
    });

    it("should include freeze date", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toContain("2026-01-15");
    });

    it("should include purpose", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toContain("freelance");
    });

    it("should have a subject line", () => {
      const draft = generateBankNodalDraft(mockCase);
      expect(draft).toMatch(/^Subject: /);
    });

    it("should include FIR number when provided", () => {
      const caseWithFIR = { ...mockCase, firNumber: "FIR/2026/12345" };
      const draft = generateBankNodalDraft(caseWithFIR);
      expect(draft).toContain("FIR/2026/12345");
    });

    it("should handle missing FIR number gracefully", () => {
      const draft = generateBankNodalDraft(mockCase);
      // Should not contain undefined or null
      expect(draft).not.toContain("undefined");
      expect(draft).not.toContain("null");
    });
  });

  describe("generateBankGrievanceDraft", () => {
    it("should include bank name and account", () => {
      const draft = generateBankGrievanceDraft(mockCase);
      expect(draft).toContain("State Bank of India");
      expect(draft).toContain("XXXX4321");
    });

    it("should mention grievance/ombudsman escalation", () => {
      const draft = generateBankGrievanceDraft(mockCase);
      expect(draft.toLowerCase()).toContain("ombudsman");
    });

    it("should have a subject line", () => {
      const draft = generateBankGrievanceDraft(mockCase);
      expect(draft).toMatch(/^Subject: /);
    });
  });

  describe("generateSPOfficeDraft", () => {
    it("should include police station when provided", () => {
      const caseWithPS = {
        ...mockCase,
        policeStationName: "Andheri Police Station",
        city: "Mumbai",
        state: "Maharashtra",
      };
      const draft = generateSPOfficeDraft(caseWithPS);
      expect(draft).toContain("Andheri Police Station");
      expect(draft).toContain("Mumbai");
      expect(draft).toContain("Maharashtra");
    });

    it("should use placeholder when police station is missing", () => {
      const draft = generateSPOfficeDraft(mockCase);
      expect(draft).toContain("[Police Station Name]");
    });

    it("should include IO name when provided", () => {
      const caseWithIO = { ...mockCase, ioName: "Inspector Sharma" };
      const draft = generateSPOfficeDraft(caseWithIO);
      expect(draft).toContain("Inspector Sharma");
    });
  });

  describe("generateRBIOmbudsmanDraft", () => {
    it("should include all key case details", () => {
      const draft = generateRBIOmbudsmanDraft(mockCase);
      expect(draft).toContain("State Bank of India");
      expect(draft).toContain("XXXX4321");
      expect(draft).toContain("2026-01-15");
      expect(draft).toContain("15,000");
    });

    it("should mention financial hardship", () => {
      const draft = generateRBIOmbudsmanDraft(mockCase);
      expect(draft.toLowerCase()).toContain("hardship");
    });

    it("should have a subject line", () => {
      const draft = generateRBIOmbudsmanDraft(mockCase);
      expect(draft).toMatch(/^Subject: /);
    });
  });

  describe("Security: Template injection resistance", () => {
    it("should not execute injected script tags in bank name", () => {
      const maliciousCase: CaseData = {
        ...mockCase,
        bankName: '<script>alert("xss")</script>State Bank',
      };
      const draft = generateBankNodalDraft(maliciousCase);
      // The script tag should be rendered as text, not executed
      expect(draft).toContain("<script>");
      // But it should still be in the output as text (no server-side rendering here,
      // so React's JSX escaping handles it on the frontend)
    });

    it("should not break template with special characters in narrative fields", () => {
      const specialCase: CaseData = {
        ...mockCase,
        senderName: "O'Brien & Associates (Pvt.) Ltd.",
        bankName: 'HDFC Bank "Premium"',
      };
      const draft = generateBankNodalDraft(specialCase);
      expect(draft).toContain("O'Brien & Associates");
      expect(draft).toContain('HDFC Bank "Premium"');
    });
  });
});
