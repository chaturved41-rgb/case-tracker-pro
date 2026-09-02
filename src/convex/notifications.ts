import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── List notifications for current user ────────────────────────
export const list = query({
  args: {
    caseId: v.optional(v.id("cases")),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.caseId) {
      let q = ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId));
      const all = await q.collect();
      let filtered = all.filter((n) => n.caseId === args.caseId);
      if (args.unreadOnly) filtered = filtered.filter((n) => !n.isRead);
      return filtered.sort((a, b) => b.sentAt - a.sentAt);
    }

    let q = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId));
    const all = await q.collect();
    if (args.unreadOnly) return all.filter((n) => !n.isRead).sort((a, b) => b.sentAt - a.sentAt);
    return all.sort((a, b) => b.sentAt - a.sentAt);
  },
});

// ── Count unread notifications ─────────────────────────────────
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.filter((n) => !n.isRead).length;
  },
});

// ── Mark notification as read ──────────────────────────────────
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.notificationId, { isRead: true });
    return true;
  },
});

// ── Mark all as read ───────────────────────────────────────────
export const markAllRead = mutation({
  args: { caseId: v.optional(v.id("cases")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const n of notifications) {
      if (!n.isRead && (!args.caseId || n.caseId === args.caseId)) {
        await ctx.db.patch(n._id, { isRead: true });
      }
    }
    return true;
  },
});

// ── Create notification ────────────────────────────────────────
export const create = mutation({
  args: {
    caseId: v.optional(v.id("cases")),
    type: v.string(),
    subject: v.string(),
    body: v.string(),
    channel: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("notifications", {
      userId,
      caseId: args.caseId,
      type: args.type,
      subject: args.subject,
      body: args.body,
      channel: args.channel,
      sentAt: Date.now(),
      isRead: false,
      metadata: args.metadata,
    });
  },
});
