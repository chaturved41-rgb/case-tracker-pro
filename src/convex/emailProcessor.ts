"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

// ── Helper: convert plain text to basic HTML ──
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split("\n\n").map((p) => `<p style="margin: 0 0 12px 0;">${p.replace(/\n/g, "<br/>")}</p>`).join("");
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155; line-height: 1.6;">${paragraphs}</div>`;
}

// ── Helper: render email template with case data ──
function renderTemplate(
  template: string,
  data: {
    accountMasked: string;
    bankName: string;
    freezeDate: string;
    transactionAmount: number;
    senderName: string;
    purpose: string;
    policeStationName?: string;
    city?: string;
    state?: string;
    firNumber?: string;
    caseId?: string;
  },
): string {
  const firNumberLine = data.firNumber
    ? `- FIR: ${data.firNumber}`
    : "- FIR: Not available";

  return template
    .replace(/\{\{accountMasked\}\}/g, data.accountMasked)
    .replace(/\{\{bankName\}\}/g, data.bankName)
    .replace(/\{\{freezeDate\}\}/g, data.freezeDate)
    .replace(/\{\{transactionAmount\}\}/g, data.transactionAmount.toLocaleString("en-IN"))
    .replace(/\{\{senderName\}\}/g, data.senderName)
    .replace(/\{\{purpose\}\}/g, data.purpose)
    .replace(/\{\{policeStationName\}\}/g, data.policeStationName || "[Police Station]")
    .replace(/\{\{city\}\}/g, data.city || "[City]")
    .replace(/\{\{state\}\}/g, data.state || "[State]")
    .replace(/\{\{firNumberLine\}\}/g, firNumberLine)
    .replace(/\{\{caseId\}\}/g, data.caseId || "")
    .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString("en-IN"));
}

// ── Helper: send email via Resend ──
async function sendViaResend(args: {
  recipientEmail: string;
  subject: string;
  textBody: string;
  testMode: boolean;
}): Promise<{ success: boolean; providerMessageId?: string; safeError?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      safeError: "Email delivery is not configured. Add RESEND_API_KEY to Convex environment variables.",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(args.recipientEmail)) {
    return { success: false, safeError: "Invalid recipient email address format." };
  }

  const emailFrom = process.env.EMAIL_FROM;
  const emailFromName = process.env.EMAIL_FROM_NAME || "DIP — Digital Innocence Protocol";

  let from: string;
  if (emailFrom) {
    from = `${emailFromName} <${emailFrom}>`;
  } else if (args.testMode) {
    from = "DIP <onboarding@resend.dev>";
  } else {
    return {
      success: false,
      safeError: "No verified sender configured. Set EMAIL_FROM in environment variables, or use test mode.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const htmlBody = textToHtml(args.textBody);
    const result = await resend.emails.send({
      from,
      to: args.recipientEmail,
      subject: args.subject,
      html: htmlBody,
      text: args.textBody,
    });

    if (result.error) {
      return { success: false, safeError: result.error.message || "Provider returned an error." };
    }

    return { success: true, providerMessageId: result.data?.id || undefined };
  } catch (err: any) {
    const msg =
      err?.message?.includes("unauthorized")
        ? "Provider rejected the API key. Check RESEND_API_KEY."
        : err?.message?.includes("domain")
          ? "Sender domain is not verified. Use onboarding@resend.dev for testing."
          : err?.message?.includes("Invalid API key")
            ? "Invalid API key. Check RESEND_API_KEY."
            : "Email sending failed due to a provider error.";
    return { success: false, safeError: msg };
  }
}

// ── Health check ──
export const healthCheck = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;
    const emailFromName = process.env.EMAIL_FROM_NAME || "DIP — Digital Innocence Protocol";
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    const configured = !!apiKey;
    const senderConfigured = !!emailFrom;
    const testModeAvailable = !!apiKey && !senderConfigured;

    // Determine sender display and verification state
    let senderAddress = "Not configured";
    let senderVerificationState: "verified" | "test_sender" | "not_configured" = "not_configured";

    if (senderConfigured && emailFrom) {
      senderAddress = `${emailFromName} <${emailFrom}>`;
      senderVerificationState = "verified";
    } else if (configured) {
      senderAddress = "DIP <onboarding@resend.dev>";
      senderVerificationState = "test_sender";
    }

    if (!configured) {
      return {
        configured: false,
        provider: "resend" as const,
        senderConfigured: false,
        testModeAvailable: false,
        senderAddress,
        senderVerificationState,
        webhookConfigured: false,
        safeError:
          "Real email delivery is not configured yet. To enable it:\n" +
          "1. Create a Resend account at https://resend.com\n" +
          "2. Create a Resend API key.\n" +
          "3. Add RESEND_API_KEY to this project's Convex environment variables.\n" +
          "4. Set EMAIL_FROM to a Resend-approved sender address.\n" +
          "5. Redeploy and use Send Test Email.",
      };
    }

    if (!senderConfigured) {
      return {
        configured: true,
        provider: "resend" as const,
        senderConfigured: false,
        testModeAvailable: true,
        senderAddress,
        senderVerificationState,
        webhookConfigured: !!webhookSecret,
        safeError:
          "Using Resend test sender (onboarding@resend.dev). Emails to your own address may be delivered, but recipient delivery cannot be confirmed through test sender. For production, verify a domain in Resend and set EMAIL_FROM.",
      };
    }

    return {
      configured: true,
      provider: "resend" as const,
      senderConfigured: true,
      testModeAvailable: true,
      senderAddress,
      senderVerificationState,
      webhookConfigured: !!webhookSecret,
    };
  },
});

// ── Send a single email (client-callable) ──
export const sendEmail = internalAction({
  args: {
    caseId: v.string(),
    scheduleId: v.optional(v.string()),
    recipientType: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
    textBody: v.string(),
    testMode: v.boolean(),
    idempotencyKey: v.string(),
  },
  handler: async (_ctx, args) => {
    const result = await sendViaResend({
      recipientEmail: args.recipientEmail,
      subject: args.subject,
      textBody: args.textBody,
      testMode: args.testMode,
    });
    return {
      success: result.success,
      status: result.success ? ("accepted_by_provider" as const) : ("failed" as const),
      providerMessageId: result.providerMessageId,
      safeError: result.safeError,
    };
  },
});

// ── Process all due schedules (cron + demo button) ──
// Core processing logic (shared by internal and public entry points)
async function processSchedules(ctx: any): Promise<{ found: number; accepted: number; failed: number }> {
  const now = Date.now();

  const schedules = await ctx.runQuery(internal.emailSchedules.getDueSchedules, { now });

  const results = { found: 0, accepted: 0, failed: 0 };

  for (const schedule of schedules) {
    results.found++;

    const claimResult = await ctx.runMutation(
      internal.emailSchedules.claimScheduleForSending,
      { scheduleId: schedule._id },
    );
    if (!claimResult.claimed) continue;

    const caseData = await ctx.runQuery(internal.emailSchedules.getCaseForSchedule, {
      caseId: schedule.caseId,
    });
    if (!caseData) {
      await ctx.runMutation(internal.emailSchedules.recordFailedSend, {
        scheduleId: schedule._id,
        caseId: schedule.caseId,
        userId: schedule.userId,
        recipientType: schedule.recipientType,
        recipientEmail: schedule.recipientEmail,
        subject: schedule.subjectTemplate,
        errorMessage: "Case data not found",
        idempotencyKey: `${schedule._id}:${now}`,
        testMode: schedule.testMode || false,
      });
      results.failed++;
      continue;
    }

    const data = {
      accountMasked: caseData.accountMasked,
      bankName: caseData.bankName,
      freezeDate: caseData.freezeDate,
      transactionAmount: caseData.transactionAmount,
      senderName: caseData.senderName,
      purpose: caseData.purpose,
      policeStationName: caseData.policeStationName,
      city: caseData.city,
      state: caseData.state,
      firNumber: caseData.firNumber,
      caseId: schedule.caseId,
    };

    const subject = renderTemplate(schedule.subjectTemplate, data);
    const body = renderTemplate(schedule.bodyTemplate, data);
    const idempotencyKey = `${schedule._id}:${now}`;

    const sendResult = await sendViaResend({
      recipientEmail: schedule.recipientEmail,
      subject,
      textBody: body,
      testMode: schedule.testMode || false,
    });

    if (sendResult.success) {
      await ctx.runMutation(internal.emailSchedules.recordSuccessfulSend, {
        scheduleId: schedule._id,
        caseId: schedule.caseId,
        userId: schedule.userId,
        recipientType: schedule.recipientType,
        recipientEmail: schedule.recipientEmail,
        subject,
        providerMessageId: sendResult.providerMessageId || "unknown",
        idempotencyKey,
        testMode: schedule.testMode || false,
      });
      results.accepted++;
    } else {
      await ctx.runMutation(internal.emailSchedules.recordFailedSend, {
        scheduleId: schedule._id,
        caseId: schedule.caseId,
        userId: schedule.userId,
        recipientType: schedule.recipientType,
        recipientEmail: schedule.recipientEmail,
        subject,
        errorMessage: sendResult.safeError || "Unknown error",
        idempotencyKey,
        testMode: schedule.testMode || false,
      });
      results.failed++;
    }
  }

  return results;
}

// ── Internal entry point (for cron jobs) ──
export const processDueSchedulesInternal = internalAction({
  args: {},
  handler: async (ctx) => {
    return await processSchedules(ctx);
  },
});

// ── Public entry point (for frontend demo button) ──
export const processDueSchedules = action({
  args: {},
  handler: async (ctx) => {
    return await processSchedules(ctx);
  },
});
