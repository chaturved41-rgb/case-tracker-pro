import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeText } from "./sanitize";

// ── Email templates for different recipient types ──────────────
export const EMAIL_TEMPLATES: Record<
  string,
  { subject: string; body: string }
> = {
  bank_manager: {
    subject:
      "Request for Review – Account Freeze (Cyber Fraud Investigation) – Account {{accountMasked}}",
    body: `To,
The Branch Manager
{{bankName}}

Date: {{currentDate}}

Respected Sir/Madam,

I am writing to bring to your attention that my savings account (ending {{accountMasked}}) at {{bankName}} has been frozen since {{freezeDate}}.

I wish to state that I am a genuine account holder and the disputed transaction of ₹{{transactionAmount}} from {{senderName}} was a legitimate {{purpose}} transaction.

I kindly request you to:
1. Review the evidence provided
2. Share the specific complaint or investigation reference
3. Consider unfreezing my account

I have prepared a detailed evidence report through DIP (Digital Innocence Protocol) which I can share upon request.

Thank you for your time.

Yours sincerely,
[Your Name]
Account: {{accountMasked}}`,
  },
  bank_nodal: {
    subject:
      "Follow-up – Lien on Account {{accountMasked}} – Request for Status Update",
    body: `To,
The Nodal Officer
{{bankName}}

Date: {{currentDate}}

Respected Sir/Madam,

I am writing regarding the freeze on my account (ending {{accountMasked}}) at {{bankName}} since {{freezeDate}}.

I would like to request:
1. An update on the investigation status
2. A timeline for resolution
3. Details of the investigating agency, if available

The disputed transaction of ₹{{transactionAmount}} from {{senderName}} was a legitimate {{purpose}} transaction.

Please find my evidence report attached for your review.

Yours sincerely,
[Your Name]
Account: {{accountMasked}}`,
  },
  police_io: {
    subject:
      "Representation Regarding Frozen Bank Account – {{bankName}} – Account {{accountMasked}}",
    body: `To,
The Investigating Officer
{{policeStationName}}

Date: {{currentDate}}

Respected Sir/Madam,

My bank account has been frozen in connection with a cyber fraud investigation. I wish to present my evidence for your consideration.

Details:
- Bank: {{bankName}}
- Account: {{accountMasked}}
- Freeze date: {{freezeDate}}
{{firNumberLine}}

The disputed transaction of ₹{{transactionAmount}} from {{senderName}} was a legitimate {{purpose}} transaction.

I respectfully request an opportunity to present my evidence and have my account unfrozen.

Yours sincerely,
[Your Name]`,
  },
  cyber_cell: {
    subject:
      "Request for Status Update – Cyber Crime Investigation – Account {{accountMasked}}",
    body: `To,
The Cyber Crime Cell
{{city}} {{state}}

Date: {{currentDate}}

Respected Sir/Madam,

I am writing to inquire about the status of a cyber crime investigation that has resulted in a freeze on my bank account.

Details:
- Bank: {{bankName}}
- Account: {{accountMasked}}
- Freeze date: {{freezeDate}}
{{firNumberLine}}

I am willing to cooperate fully with the investigation and have prepared a comprehensive evidence package.

I request:
1. An update on the investigation progress
2. An opportunity to provide my evidence
3. Consideration for unfreezing my account

Yours sincerely,
[Your Name]`,
  },
  other: {
    subject: "Follow-up – Account {{accountMasked}} – {{bankName}}",
    body: `Date: {{currentDate}}

Dear Sir/Madam,

I am writing regarding my frozen bank account (ending {{accountMasked}}) at {{bankName}}.

The account has been frozen since {{freezeDate}} due to a cyber fraud investigation.

I have prepared evidence demonstrating the legitimacy of the disputed transaction (₹{{transactionAmount}} from {{senderName}}).

I would appreciate your assistance in resolving this matter.

Yours sincerely,
[Your Name]`,
  },
  self_test: {
    subject: "DIP Test Email — Delivery Check",
    body: `Hello,

This is a real test email from DIP — Digital Innocence Protocol.

If you received this message, your DIP email delivery setup is working correctly.

This test does not contact any bank, police station, cyber cell, or government authority.

Case reference: {{caseId}}

— Team DIP`,
  },
};

// ── Render template with case data ─────────────────────────────
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

// ── Get templates for a case ───────────────────────────────────
export const getTemplates = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

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
      caseId: args.caseId,
    };

    return Object.entries(EMAIL_TEMPLATES).map(([key, tmpl]) => ({
      recipientType: key,
      subject: renderTemplate(tmpl.subject, data),
      body: renderTemplate(tmpl.body, data),
    }));
  },
});

// ── Create email schedule ──────────────────────────────────────
export const createSchedule = mutation({
  args: {
    caseId: v.id("cases"),
    recipientType: v.string(),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    subjectTemplate: v.string(),
    bodyTemplate: v.string(),
    intervalDays: v.number(),
    maxSends: v.number(),
    sendImmediately: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    if (!args.recipientEmail.includes("@")) {
      throw new Error("Invalid recipient email");
    }

    const now = Date.now();
    const scheduleId = await ctx.db.insert("emailSchedules", {
      caseId: args.caseId,
      userId,
      recipientType: sanitizeText(args.recipientType),
      recipientEmail: args.recipientEmail.trim(),
      recipientName: args.recipientName ? sanitizeText(args.recipientName) : undefined,
      subjectTemplate: args.subjectTemplate,
      bodyTemplate: args.bodyTemplate,
      intervalDays: args.intervalDays,
      maxSends: args.maxSends,
      sendsCount: 0,
      nextSendAt: args.sendImmediately ? now : now + args.intervalDays * 24 * 60 * 60 * 1000,
      active: true,
      paused: false,
      testMode: args.recipientType === "self_test",
      deliveryStatus: args.sendImmediately ? "sending" : "scheduled",
      createdAt: now,
      updatedAt: now,
    });

    // Timeline event
    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "email_schedule_created",
      description: `Email schedule created for ${args.recipientType} (${args.recipientEmail})${args.intervalDays > 0 ? ` – repeat every ${args.intervalDays} days` : " – send once"}`,
      createdAt: now,
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId,
      caseId: args.caseId,
      type: "email_schedule_created",
      subject: "Email schedule created",
      body: `Scheduled ${args.recipientType} email to ${args.recipientEmail}${args.intervalDays > 0 ? ` every ${args.intervalDays} days` : " (once)"}`,
      channel: "in_app",
      sentAt: now,
      isRead: false,
    });

    return scheduleId;
  },
});

// ── List email schedules for a case ────────────────────────────
export const listSchedules = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("emailSchedules")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

// ── List delivery log for a case ───────────────────────────────
export const listDeliveryLog = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("emailDeliveryLog")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .order("desc")
      .collect();
  },
});

// ── Pause email schedule ───────────────────────────────────────
export const pauseSchedule = mutation({
  args: { scheduleId: v.id("emailSchedules") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.scheduleId, {
      paused: true,
      updatedAt: Date.now(),
    });

    // Timeline
    await ctx.db.insert("timelineEvents", {
      caseId: schedule.caseId,
      eventType: "email_schedule_paused",
      description: `Email schedule to ${schedule.recipientType} (${schedule.recipientEmail}) paused`,
      createdAt: Date.now(),
    });

    return true;
  },
});

// ── Resume email schedule ──────────────────────────────────────
export const resumeSchedule = mutation({
  args: { scheduleId: v.id("emailSchedules") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.userId !== userId) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.patch(args.scheduleId, {
      paused: false,
      active: true,
      nextSendAt: now,
      updatedAt: now,
    });

    // Timeline
    await ctx.db.insert("timelineEvents", {
      caseId: schedule.caseId,
      eventType: "email_schedule_resumed",
      description: `Email schedule to ${schedule.recipientType} (${schedule.recipientEmail}) resumed`,
      createdAt: now,
    });

    return true;
  },
});

// ── Delete (cancel) email schedule ─────────────────────────────
export const cancelSchedule = mutation({
  args: { scheduleId: v.id("emailSchedules") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.scheduleId, {
      active: false,
      paused: true,
      deliveryStatus: "cancelled",
      updatedAt: Date.now(),
    });

    // Timeline
    await ctx.db.insert("timelineEvents", {
      caseId: schedule.caseId,
      eventType: "email_schedule_deleted",
      description: `Email schedule to ${schedule.recipientType} (${schedule.recipientEmail}) cancelled`,
      createdAt: Date.now(),
    });

    return true;
  },
});

// ── Claim a schedule for sending (atomic lock) ─────────────────
// Used by both cron and manual "run now" to prevent duplicate sends
export const claimScheduleForSending = internalMutation({
  args: { scheduleId: v.id("emailSchedules") },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    const now = Date.now();

    // Check if already locked
    if (schedule.sendingLockUntil && schedule.sendingLockUntil > now) {
      return { claimed: false, reason: "Schedule is currently being processed" };
    }

    // Check if active and not paused
    if (!schedule.active || schedule.paused) {
      return { claimed: false, reason: "Schedule is inactive or paused" };
    }

    // Check max sends
    if (schedule.maxSends !== -1 && schedule.sendsCount >= schedule.maxSends) {
      return { claimed: false, reason: "Maximum sends reached" };
    }

    // Atomically claim: set lock for 10 minutes
    await ctx.db.patch(args.scheduleId, {
      sendingLockUntil: now + 10 * 60 * 1000,
      deliveryStatus: "sending",
      updatedAt: now,
    });

    return { claimed: true };
  },
});

// ── Record successful send ─────────────────────────────────────
export const recordSuccessfulSend = internalMutation({
  args: {
    scheduleId: v.id("emailSchedules"),
    caseId: v.id("cases"),
    userId: v.id("users"),
    recipientType: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    providerMessageId: v.string(),
    idempotencyKey: v.string(),
    testMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const schedule = await ctx.db.get(args.scheduleId);

    // Log delivery attempt
    await ctx.db.insert("emailDeliveryLog", {
      caseId: args.caseId,
      userId: args.userId,
      scheduleId: args.scheduleId,
      recipientEmail: args.recipientEmail,
      recipientType: args.recipientType,
      subject: args.subject,
      status: "accepted_by_provider",
      provider: "resend",
      providerMessageId: args.providerMessageId,
      idempotencyKey: args.idempotencyKey,
      testMode: args.testMode,
      createdAt: now,
      attemptedAt: now,
      completedAt: now,
    });

    // Update schedule
    if (schedule) {
      const newSendsCount = schedule.sendsCount + 1;
      const updates: Record<string, unknown> = {
        sendsCount: newSendsCount,
        lastSentAt: now,
        lastProviderMessageId: args.providerMessageId,
        lastError: undefined,
        sendingLockUntil: undefined,
        deliveryStatus: "accepted_by_provider",
        updatedAt: now,
      };

      // If recurring and not at max, advance nextSendAt
      if (schedule.intervalDays > 0 && (schedule.maxSends === -1 || newSendsCount < schedule.maxSends)) {
        updates.nextSendAt = now + schedule.intervalDays * 24 * 60 * 60 * 1000;
      } else {
        // Send-once or max reached → deactivate
        updates.active = false;
      }

      await ctx.db.patch(args.scheduleId, updates);
    }

    // Timeline event
    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "email_sent",
      description: `Email accepted by provider for ${args.recipientType}. Message ID: ${args.providerMessageId}`,
      metadata: JSON.stringify({
        providerMessageId: args.providerMessageId,
        recipientType: args.recipientType,
        testMode: args.testMode,
      }),
      createdAt: now,
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      caseId: args.caseId,
      type: "email_sent",
      subject: "Email accepted by provider",
      body: `${args.recipientType} email to ${args.recipientEmail} was accepted. ID: ${args.providerMessageId}`,
      channel: "in_app",
      sentAt: now,
      isRead: false,
    });
  },
});

// ── Record failed send ─────────────────────────────────────────
export const recordFailedSend = internalMutation({
  args: {
    scheduleId: v.optional(v.id("emailSchedules")),
    caseId: v.id("cases"),
    userId: v.id("users"),
    recipientType: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    errorMessage: v.string(),
    idempotencyKey: v.string(),
    testMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Log delivery attempt
    await ctx.db.insert("emailDeliveryLog", {
      caseId: args.caseId,
      userId: args.userId,
      scheduleId: args.scheduleId,
      recipientEmail: args.recipientEmail,
      recipientType: args.recipientType,
      subject: args.subject,
      status: "failed",
      provider: "resend",
      errorMessage: args.errorMessage,
      idempotencyKey: args.idempotencyKey,
      testMode: args.testMode,
      createdAt: now,
      attemptedAt: now,
      completedAt: now,
    });

    // Update schedule if exists
    if (args.scheduleId) {
      const schedule = await ctx.db.get(args.scheduleId);
      if (schedule) {
        const updates: Record<string, unknown> = {
          lastError: args.errorMessage,
          deliveryStatus: "failed",
          sendingLockUntil: undefined,
          updatedAt: now,
        };

        // For failures: retry in 1 hour if not at max sends
        if (schedule.intervalDays > 0 && (schedule.maxSends === -1 || schedule.sendsCount < schedule.maxSends)) {
          updates.nextSendAt = now + 60 * 60 * 1000; // retry in 1 hour
        }

        await ctx.db.patch(args.scheduleId, updates);
      }
    }

    // Timeline event
    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "email_failed",
      description: `Email sending failed for ${args.recipientType}. Error: ${args.errorMessage}`,
      metadata: JSON.stringify({
        recipientType: args.recipientType,
        errorMessage: args.errorMessage,
        testMode: args.testMode,
      }),
      createdAt: now,
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      caseId: args.caseId,
      type: "email_failed",
      subject: "Email sending failed",
      body: `Failed to send ${args.recipientType} email to ${args.recipientEmail}. ${args.errorMessage}`,
      channel: "in_app",
      sentAt: now,
      isRead: false,
    });
  },
});

// ── Get due schedules (internal query) ─────────────────────────
export const getDueSchedules = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const allActive = await ctx.db
      .query("emailSchedules")
      .withIndex("by_active_sends", (q) =>
        q.eq("active", true).lte("nextSendAt", args.now),
      )
      .collect();

    // Filter out paused and locked schedules
    return allActive.filter((s) => {
      if (s.paused) return false;
      if (s.sendingLockUntil && s.sendingLockUntil > args.now) return false;
      if (s.maxSends !== -1 && s.sendsCount >= s.maxSends) return false;
      return true;
    });
  },
});

// ── Get case data for schedule (internal query) ────────────────
export const getCaseForSchedule = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.caseId);
  },
});

// ── Send test email immediately (client-callable) ──────────────
export const sendTestEmailNow = mutation({
  args: {
    caseId: v.id("cases"),
    recipientEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    if (!args.recipientEmail.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Schedule it for immediate processing by setting nextSendAt to now
    const now = Date.now();
    const scheduleId = await ctx.db.insert("emailSchedules", {
      caseId: args.caseId,
      userId,
      recipientType: "self_test",
      recipientEmail: args.recipientEmail.trim(),
      subjectTemplate: "DIP Test Email — Delivery Check",
      bodyTemplate: `Hello,

This is a real test email from DIP — Digital Innocence Protocol.

If you received this message, your DIP email delivery setup is working correctly.

This test does not contact any bank, police station, cyber cell, or government authority.

Case reference: ${args.caseId}

— Team DIP`,
      intervalDays: 0,
      maxSends: 1,
      sendsCount: 0,
      nextSendAt: now,
      active: true,
      paused: false,
      testMode: true,
      deliveryStatus: "scheduled",
      createdAt: now,
      updatedAt: now,
    });

    // Timeline event
    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "email_test_scheduled",
      description: `Test email scheduled to ${args.recipientEmail}`,
      createdAt: now,
    });

    return scheduleId;
  },
});
