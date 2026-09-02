import { describe, it, expect } from "vitest";
import {
  checkAmountMatch,
  checkDateOrder,
  checkNameMatch,
  checkMinimumEvidence,
  runAllChecks,
  type EvidenceItem,
  type CaseData,
} from "@/lib/consistencyChecks";

const mockCase: CaseData = {
  transactionAmount: 15000,
  freezeDate: "2026-01-20",
  senderName: "Rahul Enterprises",
};

describe("Consistency Checks", () => {
  describe("checkAmountMatch", () => {
    it("should return null when no evidence has amounts", () => {
      const evidence: EvidenceItem[] = [
        { metadataAmount: null },
        { metadataAmount: undefined },
      ];
      expect(checkAmountMatch(evidence, mockCase)).toBeNull();
    });

    it("should pass when at least one evidence matches the amount", () => {
      const evidence: EvidenceItem[] = [
        { metadataAmount: 15000 },
        { metadataAmount: 5000 },
      ];
      const result = checkAmountMatch(evidence, mockCase);
      expect(result).not.toBeNull();
      expect(result!.result).toBe("pass");
      expect(result!.details).toContain("1 evidence item(s) match");
    });

    it("should warn when no evidence matches the amount", () => {
      const evidence: EvidenceItem[] = [
        { metadataAmount: 5000 },
        { metadataAmount: 10000 },
      ];
      const result = checkAmountMatch(evidence, mockCase);
      expect(result).not.toBeNull();
      expect(result!.result).toBe("warning");
      expect(result!.details).toContain("No evidence items match");
    });

    it("should count multiple matching items", () => {
      const evidence: EvidenceItem[] = [
        { metadataAmount: 15000 },
        { metadataAmount: 15000 },
      ];
      const result = checkAmountMatch(evidence, mockCase);
      expect(result!.result).toBe("pass");
      expect(result!.details).toContain("2 evidence item(s) match");
    });
  });

  describe("checkDateOrder", () => {
    it("should return null when no evidence has dates", () => {
      const evidence: EvidenceItem[] = [{ metadataDate: null }];
      expect(checkDateOrder(evidence, mockCase)).toBeNull();
    });

    it("should pass when all evidence dates are before freeze date", () => {
      const evidence: EvidenceItem[] = [
        { metadataDate: "2026-01-10" },
        { metadataDate: "2026-01-15" },
      ];
      const result = checkDateOrder(evidence, mockCase);
      expect(result!.result).toBe("pass");
    });

    it("should warn when evidence dates are after freeze date", () => {
      const evidence: EvidenceItem[] = [
        { metadataDate: "2026-01-10" },
        { metadataDate: "2026-01-25" }, // After freeze
      ];
      const result = checkDateOrder(evidence, mockCase);
      expect(result!.result).toBe("warning");
      expect(result!.details).toContain("1 evidence item(s) have dates after");
    });

    it("should handle equal dates (same day as freeze)", () => {
      const evidence: EvidenceItem[] = [
        { metadataDate: "2026-01-20" }, // Same as freeze
      ];
      const result = checkDateOrder(evidence, mockCase);
      expect(result!.result).toBe("pass");
    });
  });

  describe("checkNameMatch", () => {
    it("should return null when no evidence has counterparty names", () => {
      const evidence: EvidenceItem[] = [
        { metadataCounterpartyName: null },
        { metadataCounterpartyName: "" },
      ];
      expect(checkNameMatch(evidence, mockCase)).toBeNull();
    });

    it("should pass on exact name match", () => {
      const evidence: EvidenceItem[] = [
        { metadataCounterpartyName: "Rahul Enterprises" },
      ];
      const result = checkNameMatch(evidence, mockCase);
      expect(result!.result).toBe("pass");
    });

    it("should pass on partial name match (evidence contains sender)", () => {
      const evidence: EvidenceItem[] = [
        { metadataCounterpartyName: "Rahul Enterprises Pvt Ltd" },
      ];
      const result = checkNameMatch(evidence, mockCase);
      expect(result!.result).toBe("pass");
    });

    it("should pass on reverse partial match (sender contains evidence name)", () => {
      const evidence: EvidenceItem[] = [
        { metadataCounterpartyName: "Rahul" },
      ];
      const result = checkNameMatch(evidence, mockCase);
      expect(result!.result).toBe("pass");
    });

    it("should warn on name mismatch", () => {
      const evidence: EvidenceItem[] = [
        { metadataCounterpartyName: "Completely Different Corp" },
      ];
      const result = checkNameMatch(evidence, mockCase);
      expect(result!.result).toBe("warning");
    });

    it("should be case-insensitive", () => {
      const evidence: EvidenceItem[] = [
        { metadataCounterpartyName: "RAHUL enterprises" },
      ];
      const result = checkNameMatch(evidence, mockCase);
      expect(result!.result).toBe("pass");
    });
  });

  describe("checkMinimumEvidence", () => {
    it("should fail with 0 evidence", () => {
      const result = checkMinimumEvidence(0);
      expect(result.result).toBe("fail");
    });

    it("should warn with 1-2 evidence items", () => {
      expect(checkMinimumEvidence(1).result).toBe("warning");
      expect(checkMinimumEvidence(2).result).toBe("warning");
    });

    it("should pass with 3+ evidence items", () => {
      expect(checkMinimumEvidence(3).result).toBe("pass");
      expect(checkMinimumEvidence(5).result).toBe("pass");
    });
  });

  describe("runAllChecks", () => {
    it("should run all applicable checks", () => {
      const evidence: EvidenceItem[] = [
        {
          metadataAmount: 15000,
          metadataDate: "2026-01-10",
          metadataCounterpartyName: "Rahul Enterprises",
        },
        {
          metadataAmount: 5000,
          metadataDate: "2026-01-05",
          metadataCounterpartyName: "Other Corp",
        },
      ];
      const checks = runAllChecks(evidence, mockCase);
      expect(checks.length).toBe(4); // amount, date, name, minimum
      expect(checks.map((c) => c.checkType)).toEqual([
        "amount_match",
        "date_order",
        "name_match",
        "duplicate_detection",
      ]);
    });

    it("should handle empty evidence list", () => {
      const checks = runAllChecks([], mockCase);
      // Only minimum evidence check should run (amount/date/name return null)
      expect(checks.length).toBe(1);
      expect(checks[0].checkType).toBe("duplicate_detection");
      expect(checks[0].result).toBe("fail");
    });

    it("should include pass/warning/fail results", () => {
      const evidence: EvidenceItem[] = [
        {
          metadataAmount: 15000,
          metadataDate: "2026-01-10",
          metadataCounterpartyName: "Rahul Enterprises",
        },
      ];
      const checks = runAllChecks(evidence, mockCase);
      const results = checks.map((c) => c.result);
      expect(results).toContain("pass");
    });
  });
});
