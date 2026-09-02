import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      phone: v.optional(v.string()),
    }).index("email", ["email"]),

    // ── DIP Cases ──────────────────────────────────────────────
    cases: defineTable({
      userId: v.id("users"),

      // Freeze details
      bankName: v.string(),
      branch: v.optional(v.string()),
      accountMasked: v.string(),
      freezeType: v.string(), // lien | debit_freeze | full_freeze
      freezeDate: v.string(), // ISO date

      // Investigation info (optional)
      policeStationName: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      ioName: v.optional(v.string()),
      ioEmail: v.optional(v.string()),
      firNumber: v.optional(v.string()),

      // Disputed transaction
      transactionDate: v.string(),
      transactionAmount: v.number(),
      senderName: v.string(),
      purpose: v.string(), // freelance | sale | family | salary | other
      relationship: v.string(), // client | customer | family | friend | stranger | other
      narrative: v.string(),

      // Consent
      consentGiven: v.boolean(),

      // Statuses
      statusIntakeComplete: v.boolean(),
      statusReportGenerated: v.boolean(),
      statusDispatched: v.boolean(),
      resolutionStatus: v.string(), // pending | responded | resolved | rejected | unknown

      lastStatusCheckDate: v.optional(v.string()),

      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    // ── Evidence Items ─────────────────────────────────────────
    evidenceItems: defineTable({
      caseId: v.id("cases"),
      type: v.string(), // invoice | order_confirmation | delivery_proof | chat_screenshot | platform_receipt | relationship_proof | other
      storageId: v.optional(v.string()), // Convex storage ID
      fileNameOriginal: v.string(),
      fileMimeType: v.string(),
      fileSizeBytes: v.number(),
      metadataDate: v.optional(v.string()),
      metadataAmount: v.optional(v.number()),
      metadataCounterpartyName: v.optional(v.string()),
      notes: v.optional(v.string()),
      uploadedAt: v.number(),
    }).index("by_case", ["caseId"]),

    // ── Consistency Checks ─────────────────────────────────────
    consistencyChecks: defineTable({
      caseId: v.id("cases"),
      checkType: v.string(), // amount_match | date_order | name_match | duplicate_detection
      result: v.string(), // pass | warning | fail
      details: v.string(),
      createdAt: v.number(),
    }).index("by_case", ["caseId"]),

    // ── Generated Reports ──────────────────────────────────────
    generatedReports: defineTable({
      caseId: v.id("cases"),
      reportJson: v.string(), // serialized JSON report content
      generatedAt: v.number(),
      version: v.number(),
    }).index("by_case", ["caseId"]),

    // ── Timeline Events ────────────────────────────────────────
    timelineEvents: defineTable({
      caseId: v.id("cases"),
      eventType: v.string(),
      description: v.string(),
      metadata: v.optional(v.string()), // JSON string
      createdAt: v.number(),
    }).index("by_case", ["caseId"]),

    // ── Escalation Drafts ──────────────────────────────────────
    escalationDrafts: defineTable({
      caseId: v.id("cases"),
      target: v.string(), // bank_nodal | bank_grievance | sp_office | dgp_cyber | rbi_ombudsman
      draftText: v.string(),
      sent: v.boolean(),
      createdAt: v.number(),
    }).index("by_case", ["caseId"]),

    // ── Responses ──────────────────────────────────────────────
    responses: defineTable({
      caseId: v.id("cases"),
      fromActor: v.string(), // bank_nodal | io | sp_office | other
      mode: v.string(), // email | phone | letter | in_person
      summary: v.string(),
      responseDate: v.string(),
      attachmentPath: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_case", ["caseId"]),

    // ── Notifications ──────────────────────────────────────────
    notifications: defineTable({
      userId: v.id("users"),
      caseId: v.optional(v.id("cases")),
      type: v.string(),
      subject: v.string(),
      body: v.string(),
      channel: v.string(), // email | sms | in_app
      sentAt: v.number(),
      metadata: v.optional(v.string()),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
