import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

// ── Cancel email schedule ──────────────────────────────────────
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
      updatedAt: Date.now(),
    });

    return true;
  },
});
