import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

// ── Count data owned by the current user (for the delete confirmation UI) ──
export const getMyDataSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const cases = await ctx.db
      .query("cases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const screenshotAnalyses = await ctx.db
      .query("screenshotAnalyses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      cases: cases.length,
      screenshotAnalyses: screenshotAnalyses.length,
    };
  },
});

/**
 * Permanently delete the signed-in user's account and every record they own:
 * cases, evidence metadata, consistency checks, generated reports, timeline
 * events, escalation drafts, responses, notifications, email schedules,
 * delivery logs, detected emails, screenshot analyses, plus all auth
 * sessions/accounts/tokens. The user document itself is removed last.
 *
 * The current browser session is invalidated in the process, so the client
 * must sign out and navigate home immediately afterwards.
 *
 * Note: binary evidence files previously stored in Convex file storage
 * cannot be bulk-enumerated per user by design; metadata rows are deleted
 * and orphaned storage blobs expire with the deployment's storage policy.
 */
export const deleteMyAccount = mutation({
  args: { confirm: v.literal("DELETE") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (args.confirm !== "DELETE") throw new Error("Confirmation required");

    // 1. Delete all cases plus everything attached to them.
    const userCases = await ctx.db
      .query("cases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const caseRow of userCases) {
      const caseId = caseRow._id;
      const perCaseTables = [
        "evidenceItems",
        "consistencyChecks",
        "generatedReports",
        "timelineEvents",
        "escalationDrafts",
        "responses",
        "emailSchedules",
        "emailDeliveryLog",
        "detectedEmails",
      ] as const;
      for (const tableName of perCaseTables) {
        const rows = await ctx.db
          .query(tableName)
          .withIndex("by_case", (q) => q.eq("caseId", caseId))
          .collect();
        for (const row of rows) await ctx.db.delete(row._id);
      }
      await ctx.db.delete(caseId);
    }

    // 2. Delete user-scoped rows.
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of notifications) await ctx.db.delete(row._id);

    const screenshotAnalyses = await ctx.db
      .query("screenshotAnalyses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of screenshotAnalyses) await ctx.db.delete(row._id);

    // 3. Delete auth data: refresh tokens and verifiers per session, then
    //    verification codes per account, then sessions/accounts.
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const sessionIdSet = new Set(sessions.map((s) => s._id));

    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) await ctx.db.delete(token._id);
    }

    const verifiers = await ctx.db.query("authVerifiers").collect();
    for (const verifier of verifiers) {
      if (verifier.sessionId && sessionIdSet.has(verifier.sessionId)) {
        await ctx.db.delete(verifier._id);
      }
    }

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    for (const session of sessions) await ctx.db.delete(session._id);

    // 4. Finally, remove the user document.
    await ctx.db.delete(userId);

    return true;
  },
});
