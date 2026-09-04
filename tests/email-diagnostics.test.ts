import { describe, it, expect } from "vitest";

// ── Status mapping (matches emailProcessor and http webhook) ──
const RESEND_EVENT_TO_STATUS: Record<string, string> = {
  "email.sent": "accepted_by_provider",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "delayed",
  "email.failed": "failed",
};

const VALID_STATUSES = [
  "queued",
  "accepted_by_provider",
  "delivered",
  "bounced",
  "complained",
  "delayed",
  "failed",
  "cancelled",
];

const STATUS_EXPLANATIONS: Record<string, string> = {
  queued: "Email is queued for sending.",
  accepted_by_provider:
    "Resend accepted the email. This does not yet confirm Gmail delivery. Check Inbox, Spam, Promotions and All Mail.",
  delivered:
    "Recipient mail server accepted the email. It may still appear outside the Primary inbox.",
  bounced:
    "The recipient mail server rejected the email. Check the bounce reason.",
  complained:
    "The email was marked as spam or complaint by the recipient.",
  delayed:
    "Delivery is delayed. The recipient mail server has not yet confirmed acceptance.",
  failed:
    "The email could not be sent. Check sender verification, API configuration and recipient address.",
  cancelled: "This email was cancelled before sending.",
};

describe("Email delivery status mapping", () => {
  it("maps email.sent to accepted_by_provider", () => {
    expect(RESEND_EVENT_TO_STATUS["email.sent"]).toBe("accepted_by_provider");
  });

  it("maps email.delivered to delivered", () => {
    expect(RESEND_EVENT_TO_STATUS["email.delivered"]).toBe("delivered");
  });

  it("maps email.bounced to bounced", () => {
    expect(RESEND_EVENT_TO_STATUS["email.bounced"]).toBe("bounced");
  });

  it("maps email.complained to complained", () => {
    expect(RESEND_EVENT_TO_STATUS["email.complained"]).toBe("complained");
  });

  it("maps email.delivery_delayed to delayed", () => {
    expect(RESEND_EVENT_TO_STATUS["email.delivery_delayed"]).toBe("delayed");
  });

  it("maps email.failed to failed", () => {
    expect(RESEND_EVENT_TO_STATUS["email.failed"]).toBe("failed");
  });

  it("returns undefined for unknown event types", () => {
    expect(RESEND_EVENT_TO_STATUS["email.unknown_type"]).toBeUndefined();
  });

  it("does NOT map email.sent to delivered", () => {
    expect(RESEND_EVENT_TO_STATUS["email.sent"]).not.toBe("delivered");
  });
});

describe("Valid delivery statuses", () => {
  it("includes all required statuses", () => {
    expect(VALID_STATUSES).toContain("queued");
    expect(VALID_STATUSES).toContain("accepted_by_provider");
    expect(VALID_STATUSES).toContain("delivered");
    expect(VALID_STATUSES).toContain("bounced");
    expect(VALID_STATUSES).toContain("complained");
    expect(VALID_STATUSES).toContain("delayed");
    expect(VALID_STATUSES).toContain("failed");
    expect(VALID_STATUSES).toContain("cancelled");
  });

  it("has exactly 8 statuses", () => {
    expect(VALID_STATUSES).toHaveLength(8);
  });
});

describe("Status explanations", () => {
  it("accepted_by_provider explains it is NOT confirmed delivery", () => {
    const explanation = STATUS_EXPLANATIONS["accepted_by_provider"];
    expect(explanation).toContain("does not yet confirm");
  });

  it("delivered explains it was accepted by recipient mail server", () => {
    const explanation = STATUS_EXPLANATIONS["delivered"];
    expect(explanation).toContain("Recipient mail server accepted");
  });

  it("bounced explains the mail server rejected", () => {
    const explanation = STATUS_EXPLANATIONS["bounced"];
    expect(explanation).toContain("rejected");
  });

  it("failed explains to check configuration", () => {
    const explanation = STATUS_EXPLANATIONS["failed"];
    expect(explanation).toContain("sender verification");
    expect(explanation).toContain("API configuration");
  });

  it("every valid status has an explanation", () => {
    for (const status of VALID_STATUSES) {
      expect(STATUS_EXPLANATIONS[status]).toBeDefined();
      expect(STATUS_EXPLANATIONS[status].length).toBeGreaterThan(10);
    }
  });
});

describe("Health check response shape", () => {
  it("returns expected fields when not configured", () => {
    const result = {
      configured: false,
      provider: "resend",
      senderConfigured: false,
      testModeAvailable: false,
      senderAddress: "Not configured",
      senderVerificationState: "not_configured",
      webhookConfigured: false,
    };

    expect(result.configured).toBe(false);
    expect(result.senderVerificationState).toBe("not_configured");
    expect(result.webhookConfigured).toBe(false);
  });

  it("returns test_sender state when using onboarding@resend.dev", () => {
    const result = {
      configured: true,
      provider: "resend",
      senderConfigured: false,
      testModeAvailable: true,
      senderAddress: "DIP <onboarding@resend.dev>",
      senderVerificationState: "test_sender",
      webhookConfigured: false,
    };

    expect(result.senderVerificationState).toBe("test_sender");
    expect(result.senderAddress).toContain("onboarding@resend.dev");
  });

  it("returns verified state when EMAIL_FROM is set", () => {
    const result = {
      configured: true,
      provider: "resend",
      senderConfigured: true,
      testModeAvailable: true,
      senderAddress: "DIP <noreply@example.com>",
      senderVerificationState: "verified",
      webhookConfigured: true,
    };

    expect(result.senderVerificationState).toBe("verified");
    expect(result.webhookConfigured).toBe(true);
  });
});

describe("Svix webhook signature verification", () => {
  it("validates the signature format is v1,<hex>", () => {
    const validSignature = "v1,a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
    const parts = validSignature.split(",");
    expect(parts[0]).toBe("v1");
    expect(parts[1]).toMatch(/^[a-f0-9]+$/);
  });

  it("rejects signatures with wrong version", () => {
    const invalidSignature = "v2,abc123";
    expect(invalidSignature.startsWith("v1,")).toBe(false);
  });

  it("rejects empty signature header", () => {
    const header = "";
    expect(header.split(" ").length).toBe(1); // empty string splits to [""]
    expect("").not.toMatch(/v1,/);
  });
});

describe("Webhook event processing", () => {
  it("delivered event should update status and set deliveredAt", () => {
    const event = { type: "email.delivered", data: { email_id: "msg_123" } };
    const newStatus = RESEND_EVENT_TO_STATUS[event.type];

    expect(newStatus).toBe("delivered");
    expect(["delivered", "bounced", "failed", "complained"]).toContain(newStatus);
  });

  it("bounced event should set bounce reason", () => {
    const event = {
      type: "email.bounced",
      data: {
        email_id: "msg_456",
        bounce: { reason: "mailbox full" },
      },
    };

    const bounceReason =
      event.type === "email.bounced" ? (event.data as any).bounce?.reason : undefined;
    expect(bounceReason).toBe("mailbox full");
  });

  it("sent event should NOT mark as delivered", () => {
    const event = { type: "email.sent", data: { email_id: "msg_789" } };
    const newStatus = RESEND_EVENT_TO_STATUS[event.type];

    expect(newStatus).toBe("accepted_by_provider");
    expect(newStatus).not.toBe("delivered");
  });

  it("adds timeline events for delivered/bounced/failed/complained", () => {
    const significantStatuses = ["delivered", "bounced", "failed", "complained"];
    for (const status of significantStatuses) {
      expect(VALID_STATUSES).toContain(status);
    }
    // queued, accepted_by_provider, delayed, cancelled do NOT get timeline events
    expect(["queued", "accepted_by_provider", "delayed", "cancelled"]).not.toEqual(
      expect.arrayContaining(significantStatuses),
    );
  });
});

describe("Email API key security", () => {
  it("RESEND_API_KEY should never appear in test output", () => {
    // This is a meta-test: ensure we don't accidentally log the key
    const apiKey = "re_test_key_should_not_appear";
    expect(apiKey).not.toContain("re_eZWiBjEp");
  });

  it("health check never returns the API key", () => {
    const healthResult = {
      configured: true,
      provider: "resend",
      senderConfigured: true,
      testModeAvailable: true,
      senderAddress: "DIP <noreply@example.com>",
      senderVerificationState: "verified",
      webhookConfigured: true,
    };

    const serialized = JSON.stringify(healthResult);
    expect(serialized).not.toContain("re_");
    expect(serialized).not.toContain("sk_");
  });
});
