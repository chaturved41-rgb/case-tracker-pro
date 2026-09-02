import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeText } from "./sanitize";

// ── Add evidence item ──────────────────────────────────────────
export const add = mutation({
  args: {
    caseId: v.id("cases"),
    type: v.string(),
    fileNameOriginal: v.string(),
    fileMimeType: v.string(),
    fileSizeBytes: v.number(),
    storageId: v.optional(v.string()),
    metadataDate: v.optional(v.string()),
    metadataAmount: v.optional(v.number()),
    metadataCounterpartyName: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const caseData = await ctx.db.get(args.caseId);
    if (!caseData) throw new Error("Case not found");
    if (caseData.userId !== userId) throw new Error("Unauthorized");

    // Validate file MIME type to prevent malicious uploads
    const allowedMimeTypes = [
      "image/png", "image/jpeg", "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "text/csv",
      "application/octet-stream", // fallback for unknown types
    ];
    if (args.fileMimeType && !allowedMimeTypes.includes(args.fileMimeType)) {
      throw new Error(`File type "${args.fileMimeType}" is not allowed`);
    }

    // Validate file size (10MB max)
    if (args.fileSizeBytes > 10 * 1024 * 1024) {
      throw new Error("File exceeds 10MB limit");
    }

    const now = Date.now();
    const evidenceId = await ctx.db.insert("evidenceItems", {
      caseId: args.caseId,
      type: sanitizeText(args.type),
      storageId: args.storageId,
      fileNameOriginal: sanitizeText(args.fileNameOriginal),
      fileMimeType: args.fileMimeType,
      fileSizeBytes: args.fileSizeBytes,
      metadataDate: args.metadataDate,
      metadataAmount: args.metadataAmount,
      metadataCounterpartyName: args.metadataCounterpartyName,
      notes: args.notes,
      uploadedAt: now,
    });

    // Timeline event
    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "evidence_uploaded",
      description: `Evidence uploaded: ${args.fileNameOriginal} (${args.type})`,
      createdAt: now,
    });

    return evidenceId;
  },
});
