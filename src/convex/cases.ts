import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Create a new case ──────────────────────────────────────────
export const create = mutation({
  args: {
    bankName: v.string(),
    branch: v.optional(v.string()),
    accountMasked: v.string(),
    freezeType: v.string(),
    freezeDate: v.string(),
    policeStationName: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    ioName: v.optional(v.string()),
    ioEmail: v.optional(v.string()),
    firNumber: v.optional(v.string()),
    transactionDate: v.string(),
    transactionAmount: v.number(),
    senderName: v.string(),
    purpose: v.string(),
    relationship: v.string(),
    narrative: v.string(),
    consentGiven: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const caseId = await ctx.db.insert("cases", {
      userId,
      ...args,
      statusIntakeComplete: true,
      statusReportGenerated: false,
      statusDispatched: false,
      resolutionStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Create timeline event
    await ctx.db.insert("timelineEvents", {
      caseId,
      eventType: "case_created",
      description: `Case created for ${args.bankName} account ${args.accountMasked}`,
      createdAt: now,
    });

    return caseId;
  },
});

// ── List cases for current user ────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const cases = await ctx.db
      .query("cases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return cases;
  },
});

// ── Get full case details ──────────────────────────────────────
export const get = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    const evidenceItems = await ctx.db
      .query("evidenceItems")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();

    const consistencyChecks = await ctx.db
      .query("consistencyChecks")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();

    const reports = await ctx.db
      .query("generatedReports")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();

    const timelineEvents = await ctx.db
      .query("timelineEvents")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .order("asc")
      .collect();

    const escalationDrafts = await ctx.db
      .query("escalationDrafts")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .order("desc")
      .collect();

    const responses = await ctx.db
      .query("responses")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .order("desc")
      .collect();

    return {
      ...caseData,
      evidenceItems,
      consistencyChecks,
      reports,
      timelineEvents,
      escalationDrafts,
      responses,
    };
  },
});

// ── Update case ────────────────────────────────────────────────
export const update = mutation({
  args: {
    caseId: v.id("cases"),
    resolutionStatus: v.optional(v.string()),
    policeStationName: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    ioName: v.optional(v.string()),
    ioEmail: v.optional(v.string()),
    firNumber: v.optional(v.string()),
    statusDispatched: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.resolutionStatus !== undefined)
      updates.resolutionStatus = args.resolutionStatus;
    if (args.policeStationName !== undefined)
      updates.policeStationName = args.policeStationName;
    if (args.city !== undefined) updates.city = args.city;
    if (args.state !== undefined) updates.state = args.state;
    if (args.ioName !== undefined) updates.ioName = args.ioName;
    if (args.ioEmail !== undefined) updates.ioEmail = args.ioEmail;
    if (args.firNumber !== undefined) updates.firNumber = args.firNumber;
    if (args.statusDispatched !== undefined)
      updates.statusDispatched = args.statusDispatched;

    await ctx.db.patch(args.caseId, updates);

    // Timeline event
    if (args.resolutionStatus) {
      await ctx.db.insert("timelineEvents", {
        caseId: args.caseId,
        eventType: "status_updated",
        description: `Status updated to "${args.resolutionStatus}"`,
        createdAt: Date.now(),
      });
    }

    return args.caseId;
  },
});

// ── Record dispatch ────────────────────────────────────────────
export const recordDispatch = mutation({
  args: {
    caseId: v.id("cases"),
    targets: v.array(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.patch(args.caseId, {
      statusDispatched: true,
      updatedAt: now,
    });

    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "dispatch_simulated",
      description: `Report shared with: ${args.targets.join(", ")}${args.note ? ` — ${args.note}` : ""}`,
      metadata: JSON.stringify({ targets: args.targets, note: args.note }),
      createdAt: now,
    });

    return true;
  },
});

// ── Create escalation draft ────────────────────────────────────
export const createEscalation = mutation({
  args: {
    caseId: v.id("cases"),
    target: v.string(),
    draftText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    const now = Date.now();
    const draftId = await ctx.db.insert("escalationDrafts", {
      caseId: args.caseId,
      target: args.target,
      draftText: args.draftText,
      sent: false,
      createdAt: now,
    });

    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "escalation_draft_created",
      description: `Escalation draft created for ${args.target}`,
      createdAt: now,
    });

    return draftId;
  },
});

// ── Record response ────────────────────────────────────────────
export const recordResponse = mutation({
  args: {
    caseId: v.id("cases"),
    fromActor: v.string(),
    mode: v.string(),
    summary: v.string(),
    responseDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.insert("responses", {
      caseId: args.caseId,
      fromActor: args.fromActor,
      mode: args.mode,
      summary: args.summary,
      responseDate: args.responseDate,
      createdAt: now,
    });

    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "response_recorded",
      description: `Response recorded from ${args.fromActor} via ${args.mode}`,
      metadata: JSON.stringify({
        fromActor: args.fromActor,
        mode: args.mode,
        responseDate: args.responseDate,
      }),
      createdAt: now,
    });

    // Auto-update status to responded if currently pending
    if (caseData.resolutionStatus === "pending") {
      await ctx.db.patch(args.caseId, {
        resolutionStatus: "responded",
        updatedAt: now,
      });
    }

    return true;
  },
});

// ── Add user note to timeline ──────────────────────────────────
export const addNote = mutation({
  args: {
    caseId: v.id("cases"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "user_note",
      description: args.description,
      createdAt: Date.now(),
    });

    return true;
  },
});
