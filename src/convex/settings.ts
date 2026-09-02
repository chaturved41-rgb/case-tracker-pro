import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Get user settings ──────────────────────────────────────────
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      termsAccepted: user.termsAccepted ?? false,
      termsAcceptedAt: user.termsAcceptedAt,
      emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
      smsNotificationsEnabled: user.smsNotificationsEnabled ?? false,
      emailIntegrationEnabled: user.emailIntegrationEnabled ?? false,
      emailIntegrationProvider: user.emailIntegrationProvider,
    };
  },
});

// ── Accept terms ───────────────────────────────────────────────
export const acceptTerms = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      termsAccepted: true,
      termsAcceptedAt: Date.now(),
    });
    return true;
  },
});

// ── Update notification preferences ────────────────────────────
export const updateNotificationPrefs = mutation({
  args: {
    emailNotificationsEnabled: v.optional(v.boolean()),
    smsNotificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = {};
    if (args.emailNotificationsEnabled !== undefined)
      updates.emailNotificationsEnabled = args.emailNotificationsEnabled;
    if (args.smsNotificationsEnabled !== undefined)
      updates.smsNotificationsEnabled = args.smsNotificationsEnabled;

    await ctx.db.patch(userId, updates);
    return true;
  },
});

// ── Toggle email integration ───────────────────────────────────
export const toggleEmailIntegration = mutation({
  args: {
    enabled: v.boolean(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      emailIntegrationEnabled: args.enabled,
      emailIntegrationProvider: args.enabled ? args.provider : undefined,
    });

    if (args.enabled) {
      await ctx.db.insert("notifications", {
        userId,
        type: "email_integration_enabled",
        subject: "Email integration enabled",
        body: "Email scanning has been enabled. DIP will scan incoming emails for keywords related to your cases.",
        channel: "in_app",
        sentAt: Date.now(),
        isRead: false,
      });
    }

    return true;
  },
});
