import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Run consistency checks and generate report (all in one mutation) ──
export const generateReport = mutation({
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

    const now = Date.now();
    const checks: { checkType: string; result: string; details: string }[] = [];

    // 1. Amount match check
    const evidenceWithAmount = evidenceItems.filter(
      (e) => e.metadataAmount !== undefined && e.metadataAmount !== null,
    );
    if (evidenceWithAmount.length > 0) {
      const matchingAmounts = evidenceWithAmount.filter(
        (e) => e.metadataAmount === caseData.transactionAmount,
      );
      const amountCheck = {
        checkType: "amount_match",
        result: matchingAmounts.length > 0 ? "pass" : "warning",
        details:
          matchingAmounts.length > 0
            ? `${matchingAmounts.length} evidence item(s) match the disputed amount of ₹${caseData.transactionAmount}`
            : `No evidence items match the disputed amount of ₹${caseData.transactionAmount}. Consider adding receipts or invoices with the matching amount.`,
      };
      checks.push(amountCheck);
      await ctx.db.insert("consistencyChecks", { caseId: args.caseId, ...amountCheck, createdAt: now });
    }

    // 2. Date order check
    const evidenceWithDate = evidenceItems.filter(
      (e) => e.metadataDate !== undefined && e.metadataDate !== null,
    );
    if (evidenceWithDate.length > 0) {
      const datesBeforeFreeze = evidenceWithDate.filter(
        (e) => e.metadataDate! <= caseData.freezeDate,
      );
      const dateCheck = {
        checkType: "date_order",
        result: datesBeforeFreeze.length === evidenceWithDate.length ? "pass" : "warning",
        details:
          datesBeforeFreeze.length === evidenceWithDate.length
            ? `All ${evidenceWithDate.length} dated evidence items are on or before the freeze date (${caseData.freezeDate})`
            : `${evidenceWithDate.length - datesBeforeFreeze.length} evidence item(s) have dates after the freeze date. Ensure dates are accurate.`,
      };
      checks.push(dateCheck);
      await ctx.db.insert("consistencyChecks", { caseId: args.caseId, ...dateCheck, createdAt: now });
    }

    // 3. Name match check
    const evidenceWithNames = evidenceItems.filter(
      (e) => e.metadataCounterpartyName !== undefined && e.metadataCounterpartyName !== null && e.metadataCounterpartyName !== "",
    );
    if (evidenceWithNames.length > 0) {
      const nameMatch = evidenceWithNames.some(
        (e) =>
          e.metadataCounterpartyName!.toLowerCase().includes(caseData.senderName.toLowerCase()) ||
          caseData.senderName.toLowerCase().includes(e.metadataCounterpartyName!.toLowerCase()),
      );
      const nameCheck = {
        checkType: "name_match",
        result: nameMatch ? "pass" : "warning",
        details: nameMatch
          ? `Evidence counterparty name matches sender "${caseData.senderName}"`
          : `No evidence counterparty names match sender "${caseData.senderName}". Consider adding evidence that links the sender to the transaction.`,
      };
      checks.push(nameCheck);
      await ctx.db.insert("consistencyChecks", { caseId: args.caseId, ...nameCheck, createdAt: now });
    }

    // 4. Minimum evidence check
    const duplicateCheck = {
      checkType: "duplicate_detection",
      result: evidenceItems.length >= 3 ? "pass" : evidenceItems.length >= 1 ? "warning" : "fail",
      details:
        evidenceItems.length >= 3
          ? `${evidenceItems.length} evidence items uploaded — good coverage`
          : evidenceItems.length === 1
            ? "Only 1 evidence item uploaded. Consider adding more supporting documents for a stronger case."
            : "No evidence items uploaded yet. Upload invoices, receipts, chat screenshots, or other supporting documents.",
    };
    checks.push(duplicateCheck);
    await ctx.db.insert("consistencyChecks", { caseId: args.caseId, ...duplicateCheck, createdAt: now });

    // Generate report JSON
    const reportJson = JSON.stringify(
      {
        reportVersion: "1.0",
        generatedAt: new Date().toISOString(),
        case: {
          id: caseData._id,
          bank: caseData.bankName,
          branch: caseData.branch,
          maskedAccount: caseData.accountMasked,
          freezeType: caseData.freezeType,
          freezeDate: caseData.freezeDate,
          policeStation: caseData.policeStationName,
          city: caseData.city,
          state: caseData.state,
          ioName: caseData.ioName,
          ioEmail: caseData.ioEmail,
          firNumber: caseData.firNumber,
        },
        transaction: {
          date: caseData.transactionDate,
          amount: caseData.transactionAmount,
          sender: caseData.senderName,
          purpose: caseData.purpose,
          relationship: caseData.relationship,
          narrative: caseData.narrative,
        },
        evidence: evidenceItems.map((e) => ({
          type: e.type,
          fileName: e.fileNameOriginal,
          mimeType: e.fileMimeType,
          metadata: {
            date: e.metadataDate,
            amount: e.metadataAmount,
            counterparty: e.metadataCounterpartyName,
          },
          notes: e.notes,
        })),
        consistencyChecks: checks,
        disclaimers: [
          "DIP does not certify innocence.",
          "DIP cannot unfreeze accounts.",
          "You are responsible for the truthfulness of your submission.",
          "Knowingly false statements or fabricated evidence may have legal consequences.",
        ],
      },
      null,
      2,
    );

    // Save report
    const existingReports = await ctx.db
      .query("generatedReports")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const version = existingReports.length > 0 ? Math.max(...existingReports.map((r) => r.version)) + 1 : 1;

    await ctx.db.insert("generatedReports", {
      caseId: args.caseId,
      reportJson,
      generatedAt: now,
      version,
    });

    // Timeline event
    await ctx.db.insert("timelineEvents", {
      caseId: args.caseId,
      eventType: "report_generated",
      description: "Evidence report generated (JSON)",
      createdAt: now,
    });

    // Update case status
    await ctx.db.patch(args.caseId, {
      statusReportGenerated: true,
      updatedAt: now,
    });

    return { reportJson, checks };
  },
});

// ── Get latest report for a case ───────────────────────────────
export const getLatestReport = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("generatedReports")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .order("desc")
      .collect();

    return reports.length > 0 ? reports[0] : null;
  },
});
