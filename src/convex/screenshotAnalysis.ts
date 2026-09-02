import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeText } from "./sanitize";

// ── Common bank names in India ─────────────────────────────────
const KNOWN_BANKS = [
  "State Bank of India", "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Punjab National Bank", "PNB", "Bank of Baroda", "BOB", "Canara Bank",
  "Union Bank", "Indian Bank", "Bank of India", "Central Bank",
  "Kotak Mahindra", "IndusInd", "Federal Bank", "IDFC First",
  "Yes Bank", "RBL Bank", "South Indian Bank", "Karur Vysya",
  "Indian Overseas Bank", "UCO Bank", "Punjab and Sind Bank",
  "Bank of Maharashtra", "Andhra Bank", "Corporation Bank",
];

// ── Known cyber cell patterns ──────────────────────────────────
const CYBER_CELL_PATTERNS = [
  "cyber crime", "cybercell", "cyber cell", "cybercrime",
  "ccps", "crime branch", "economic offence",
];

// ── Extract information from text ──────────────────────────────
function extractInfo(text: string): {
  bankName: string | null;
  accountMasked: string | null;
  freezeType: string | null;
  policeStation: string | null;
  referenceNumber: string | null;
} {
  const lower = text.toLowerCase();

  // Bank name detection
  let bankName: string | null = null;
  for (const bank of KNOWN_BANKS) {
    if (lower.includes(bank.toLowerCase())) {
      bankName = bank;
      break;
    }
  }

  // Account number detection (masked pattern like XXXX1234 or ****1234)
  const accountMatch = text.match(/([Xx*\d]{0,4}[Xx*]{2,}\d{3,4})/);
  const accountMasked = accountMatch ? accountMatch[1].toUpperCase() : null;

  // Freeze type detection
  let freezeType: string | null = null;
  if (lower.includes("lien")) freezeType = "lien";
  else if (lower.includes("debit freeze")) freezeType = "debit_freeze";
  else if (lower.includes("full freeze") || lower.includes("account freeze"))
    freezeType = "full_freeze";
  else if (lower.includes("freeze") || lower.includes("frozen"))
    freezeType = "full_freeze";

  // Police station / cyber cell detection
  let policeStation: string | null = null;
  for (const pattern of CYBER_CELL_PATTERNS) {
    const idx = lower.indexOf(pattern);
    if (idx !== -1) {
      const surrounding = text.substring(Math.max(0, idx - 50), idx + 80);
      policeStation = surrounding.trim();
      break;
    }
  }

  // Reference number detection
  const refMatch = text.match(
    /(?:fir|complaint|reference|reg|case\s*no|no\.?)\s*[:#\/\s]*([A-Z0-9\/\-]+)/i,
  );
  const referenceNumber = refMatch ? refMatch[1] : null;

  return { bankName, accountMasked, freezeType, policeStation, referenceNumber };
}

// ── Generate step-by-step instructions ─────────────────────────
function generateInstructions(info: {
  bankName: string | null;
  policeStation: string | null;
}): string[] {
  const steps: string[] = [
    "Contact your bank branch and ask for written details about the freeze — including the freeze type, date, and the reason (investigation reference number).",
    "Ask the bank for the police station name and the Investigating Officer (IO) name and email/contact, if they have it.",
  ];

  if (!info.policeStation) {
    steps.push(
      "If you don't know which police station is handling the case, ask the bank or check your SMS/email for any cyber crime cell notification.",
    );
  }

  steps.push(
    "Gather supporting documents — invoices, receipts, chat screenshots, delivery proofs — anything that shows the legitimacy of the transaction.",
    "Come back to DIP and create a case. Upload your evidence, generate your report, and share it with the bank and IO.",
    "Track your case on the DIP dashboard. Use the automated email composer to send follow-ups at regular intervals.",
  );

  return steps;
}

// ── Analyze uploaded screenshot text ───────────────────────────
export const analyzeText = mutation({
  args: {
    fileName: v.string(),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const text = args.extractedText;
    const info = extractInfo(text);

    // Generate suggestions
    let suggestedPoliceStation: string | undefined;
    let suggestedIoEmail: string | undefined;

    if (info.policeStation) {
      suggestedPoliceStation = info.policeStation;
    }
    if (info.policeStation || info.bankName) {
      suggestedIoEmail = "cybercell@statepolice.gov.in (suggested – verify before use)";
    }

    const instructions = generateInstructions(info);

    const analysisId = await ctx.db.insert("screenshotAnalyses", {
      userId,
      fileName: sanitizeText(args.fileName),
      extractedText: text,
      extractedBankName: info.bankName ?? undefined,
      extractedAccountMasked: info.accountMasked ?? undefined,
      extractedFreezeType: info.freezeType ?? undefined,
      extractedPoliceStation: info.policeStation ?? undefined,
      extractedReferenceNumber: info.referenceNumber ?? undefined,
      suggestedPoliceStation,
      suggestedIoEmail,
      instructions: JSON.stringify(instructions),
      createdAt: Date.now(),
    });

    // Create in-app notification
    await ctx.db.insert("notifications", {
      userId,
      type: "screenshot_analyzed",
      subject: "Screenshot analysis complete",
      body: `We analyzed "${args.fileName}" and extracted key information. Review the results and proceed to create a case.`,
      channel: "in_app",
      sentAt: Date.now(),
      isRead: false,
    });

    return {
      id: analysisId,
      bankName: info.bankName,
      accountMasked: info.accountMasked,
      freezeType: info.freezeType,
      policeStation: info.policeStation,
      referenceNumber: info.referenceNumber,
      suggestedPoliceStation: suggestedPoliceStation ?? null,
      suggestedIoEmail: suggestedIoEmail ?? null,
      instructions,
    };
  },
});

// ── Get analysis history ───────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("screenshotAnalyses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
