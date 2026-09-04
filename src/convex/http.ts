import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// ── Resend Webhook Endpoint ──────────────────────────────────
// Receives delivery events (sent, delivered, bounced, complained, etc.)
// Verifies webhook signature using RESEND_WEBHOOK_SECRET
http.route({
  path: "/api/email-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // ── 1. Read body and headers ──
    const body = await request.text();
    const svixId = request.headers.get("svix-id") || "";
    const svixTimestamp = request.headers.get("svix-timestamp") || "";
    const svixSignature = request.headers.get("svix-signature") || "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing webhook headers", { status: 400 });
    }

    // ── 2. Verify webhook signature ──
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[webhook] RESEND_WEBHOOK_SECRET not configured — rejecting webhook");
      return new Response("Webhook not configured", { status: 500 });
    }

    const signatureValid = await verifySvixSignature(
      webhookSecret,
      svixId,
      svixTimestamp,
      body,
      svixSignature,
    );

    if (!signatureValid) {
      console.error("[webhook] Invalid signature — rejecting");
      return new Response("Invalid signature", { status: 401 });
    }

    // ── 3. Parse event ──
    let event: { type: string; data: { email_id: string; from?: string; to?: string[]; subject?: string } };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const eventType = event.type; // email.sent | email.delivered | email.bounced | etc.
    const emailId = event.data?.email_id;

    if (!emailId || !eventType) {
      return new Response("Missing email_id or type", { status: 400 });
    }

    // ── 4. Map Resend event to our status ──
    const statusMap: Record<string, string> = {
      "email.sent": "accepted_by_provider",
      "email.delivered": "delivered",
      "email.bounced": "bounced",
      "email.complained": "complained",
      "email.delivery_delayed": "delayed",
      "email.failed": "failed",
    };

    const newStatus = statusMap[eventType];
    if (!newStatus) {
      // Unknown event type — acknowledge but don't process
      return new Response("OK", { status: 200 });
    }

    // ── 5. Find matching delivery log entry ──
    const deliveryLog = await ctx.runQuery(
      internal.emailSchedules.findDeliveryByProviderMessageId,
      { providerMessageId: emailId },
    );

    if (!deliveryLog) {
      console.warn(`[webhook] No delivery log found for message ID: ${emailId}`);
      return new Response("OK", { status: 200 }); // Acknowledge to prevent retries for unknown IDs
    }

    // ── 6. Update delivery log ──
    await ctx.runMutation(internal.emailSchedules.updateDeliveryStatus, {
      deliveryLogId: deliveryLog._id,
      status: newStatus,
      webhookEventId: svixId,
      bounceReason: eventType === "email.bounced" ? (event.data as any)?.bounce?.reason || "Bounce reported by recipient mail server" : undefined,
      deliveredAt: eventType === "email.delivered" ? Date.now() : undefined,
    });

    // ── 7. Add timeline event for significant status changes ──
    if (["delivered", "bounced", "failed", "complained"].includes(newStatus)) {
      const timelineDescriptions: Record<string, string> = {
        delivered: `Email delivered to ${deliveryLog.recipientEmail}. Recipient mail server accepted the email.`,
        bounced: `Email bounced for ${deliveryLog.recipientEmail}. The recipient mail server rejected the email.`,
        failed: `Email delivery failed for ${deliveryLog.recipientEmail}.`,
        complained: `Email marked as spam/complaint by ${deliveryLog.recipientEmail}.`,
      };

      await ctx.runMutation(internal.emailSchedules.addTimelineEvent, {
        caseId: deliveryLog.caseId,
        eventType: `email_${newStatus}`,
        description: timelineDescriptions[newStatus] || `Email status updated to ${newStatus}`,
        metadata: JSON.stringify({ providerMessageId: emailId, status: newStatus, eventType }),
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

// ── Svix Signature Verification ──────────────────────────────
// Resend uses Svix for webhook signing. The signature is HMAC-SHA256.
async function verifySvixSignature(
  secret: string,
  msgId: string,
  timestamp: string,
  body: string,
  signatureHeader: string,
): Promise<boolean> {
  try {
    // Secret comes as "whsec_..." — strip the prefix for HMAC key
    const secretBytes = new TextEncoder().encode(secret.replace("whsec_", ""));
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Content to sign: msgId.timestamp.body
    const content = `${msgId}.${timestamp}.${body}`;
    const contentBytes = new TextEncoder().encode(content);
    const signature = await crypto.subtle.sign("HMAC", key, contentBytes);

    // Convert to hex
    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // signatureHeader format: "v1,<signature1> v1,<signature2>"
    const signatures = signatureHeader.split(" ");
    for (const sig of signatures) {
      const parts = sig.split(",");
      if (parts.length === 2 && parts[0] === "v1" && parts[1] === signatureHex) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("[webhook] Signature verification error:", err);
    return false;
  }
}

export default http;
