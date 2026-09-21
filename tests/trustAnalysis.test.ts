import { describe, expect, it, beforeEach } from "vitest";
import {
  analyzeTrust,
  detectSensitiveData,
  DEMO_SCENARIOS,
  buildReportText,
  saveAnalysis,
  loadAnalysis,
  clearAllSessionData,
  ASSESSMENT_NOTICE,
  RISK_LABELS,
  PROTOTYPE_LABEL,
  type TrustAnalysis,
} from "@/lib/trustAnalysis";

describe("sensitive-data detection", () => {
  it("flags OTP, password, card, CVV, PIN, Aadhaar, private keys", () => {
    expect(detectSensitiveData("my otp is 123456")).toContain("OTP / one-time code");
    expect(detectSensitiveData("password: hunter2")).toContain("Password");
    expect(detectSensitiveData("card 4111 1111 1111 1111")).toContain("Card number");
    expect(detectSensitiveData("cvv: 123")).toContain("CVV");
    expect(detectSensitiveData("PIN 4321")).toContain("Bank PIN");
    expect(detectSensitiveData("aadhaar 1234 5678 9012")).toContain("Aadhaar number");
    expect(detectSensitiveData("-----BEGIN RSA PRIVATE KEY-----")).toContain(
      "Private key / seed phrase",
    );
  });

  it("does not flag ordinary text", () => {
    expect(detectSensitiveData("Your appointment is confirmed for tomorrow at 10 AM.")).toEqual([]);
  });
});

describe("demo scenarios", () => {
  it("Scenario A (prize + OTP + fee) is high concern", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[0].input);
    expect(r.riskLevel).toBe("high_concern");
    expect(r.signals.map((s) => s.id)).toContain("prize-claim");
    expect(r.signals.map((s) => s.id)).toContain("secret-request");
    expect(r.signals.map((s) => s.id)).toContain("fee-to-claim");
  });

  it("Scenario B (threat + unverified link) is high concern or needs verification", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[1].input);
    expect(["high_concern", "needs_verification"]).toContain(r.riskLevel);
    expect(r.signals.map((s) => s.id)).toContain("threat-pressure");
  });

  it("Scenario C (ordinary appointment message) is low concern", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[2].input);
    expect(r.riskLevel).toBe("low_concern");
    expect(r.positiveSignals.map((s) => s.id)).toContain("official-contact-guidance");
  });
});

describe("risk classification", () => {
  it("returns unable_to_assess for a too-short message", () => {
    const r = analyzeTrust({ category: "message", messageText: "hi" });
    expect(r.riskLevel).toBe("unable_to_assess");
    expect(r.signals).toHaveLength(0);
  });

  it("returns unable_to_assess for a link page without a URL", () => {
    const r = analyzeTrust({ category: "link" });
    expect(r.riskLevel).toBe("unable_to_assess");
  });

  it("returns unable_to_assess for a username without platform or context", () => {
    const r = analyzeTrust({ category: "account", username: "someuser" });
    expect(r.riskLevel).toBe("unable_to_assess");
  });

  it("scores a link-only category with an http url", () => {
    const r = analyzeTrust({
      category: "link",
      url: "http://example-security-check.test",
      description: "Your account will be closed today. Verify immediately at http://example-security-check.test",
    });
    // insecure-http + threat-pressure + urgency at minimum
    expect(r.score).toBeGreaterThanOrEqual(6);
    expect(r.riskLevel).toBe("high_concern");
  });
});

describe("honesty guarantees", () => {
  it("every result carries the assessment notice in limitations", () => {
    const inputs = [
      ...DEMO_SCENARIOS.map((d) => d.input),
      { category: "payment" as const, messageText: "Send ₹2000 via gift card right now" },
      { category: "account" as const, username: "official_sbi_support", platform: "Instagram", description: "They DMed me about my account." },
    ];
    for (const input of inputs) {
      const r = analyzeTrust(input);
      expect(r.limitations.some((l) => l.includes("not proof of identity, intent, or criminal activity"))).toBe(true);
    }
  });

  it("report text includes disclaimer and prototype label source", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[0].input);
    const report = buildReportText(r);
    expect(report).toContain(ASSESSMENT_NOTICE);
    expect(report).toContain(r.id);
    expect(report).toContain("DIP does not determine guilt or innocence");
  });

  it("never says 'safe' in the low-concern summary", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[2].input);
    expect(RISK_LABELS[r.riskLevel]).toBe("Low concern");
  });

  it("redacts secrets from the report input summary", () => {
    const r = analyzeTrust({
      category: "message",
      messageText: "Here is my password: hunter2secret please check",
    });
    const report = buildReportText(r);
    expect(report).not.toContain("hunter2secret");
  });
});

describe("account analysis", () => {
  it("flags brand-borrowing usernames", () => {
    const r = analyzeTrust({
      category: "account",
      username: "sbi.official.support",
      platform: "Telegram",
      description: "This account messaged me about my bank KYC expiring.",
    });
    expect(r.signals.map((s) => s.id)).toContain("username-brand-borrow");
    expect(r.riskLevel).toBe("needs_verification");
  });
});

describe("payment analysis", () => {
  it("flags unusual payment methods from the dedicated field", () => {
    const r = analyzeTrust({
      category: "payment",
      messageText: "Please settle the invoice amount today to receive your warranty extension.",
      paymentMethod: "Google Play gift card",
    });
    expect(r.signals.map((s) => s.id)).toContain("unusual-payment-method");
  });
});

describe("session storage", () => {
  beforeEach(() => clearAllSessionData());

  it("saves and loads an analysis by id", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[0].input);
    saveAnalysis(r);
    const loaded = loadAnalysis(r.id);
    expect(loaded?.id).toBe(r.id);
    expect(loaded?.riskLevel).toBe("high_concern");
  });

  it("returns null for unknown ids", () => {
    expect(loadAnalysis("DIP-DOES-NOT-EXIST")).toBeNull();
  });

  it("clearAllSessionData removes stored analyses", () => {
    const r = analyzeTrust(DEMO_SCENARIOS[1].input) as TrustAnalysis;
    saveAnalysis(r);
    clearAllSessionData();
    expect(loadAnalysis(r.id)).toBeNull();
  });
});

describe("labels", () => {
  it("exposes the prototype indicator label", () => {
    expect(PROTOTYPE_LABEL).toContain("not a probability of fraud");
  });
});
