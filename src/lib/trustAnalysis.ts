// ─────────────────────────────────────────────────────────────
// DIP Trust Analysis Engine — transparent, rule-based prototype.
// No external APIs. Every signal carries its reason and points.
// Results are decision support, not proof of identity or intent.
// ─────────────────────────────────────────────────────────────

export type AnalysisCategory =
  | "message"
  | "link"
  | "account"
  | "payment"
  | "screenshot";

export type RiskLevel =
  | "low_concern"
  | "needs_verification"
  | "high_concern"
  | "unable_to_assess";

export interface TrustSignal {
  id: string;
  title: string;
  explanation: string;
  recommendation?: string;
  points: number;
}

export interface AnalysisInput {
  category: AnalysisCategory;
  senderName?: string;
  senderEmail?: string;
  messageText?: string;
  url?: string;
  platform?: string;
  username?: string;
  profileLink?: string;
  description?: string;
  paymentMethod?: string;
  amount?: string;
}

export interface TrustAnalysis {
  id: string;
  category: AnalysisCategory;
  riskLevel: RiskLevel;
  score: number;
  signals: TrustSignal[];
  positiveSignals: TrustSignal[];
  recommendations: string[];
  limitations: string[];
  inputSummary: Record<string, string>;
  sensitiveDataBlocked: string[];
  demo: boolean;
  createdAt: string;
}

// ── Sensitive-data detection ─────────────────────────────────

const SECRET_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "OTP / one-time code", re: /\botp\s*(?:is|:|=)?\s*\d{4,8}\b/i },
  { label: "Password", re: /\bpassword\s*(?:is|:|=)\s*\S+/i },
  { label: "Card number", re: /\b(?:\d[ -]?){13,16}\b/ },
  { label: "CVV", re: /\bcvv\b\s*[:=\-]?\s*\d{3,4}/i },
  { label: "Bank PIN", re: /\bpin\s*(?:is|:|=)?\s*\d{4,6}\b/i },
  { label: "Aadhaar number", re: /\b\d{4}\s?\d{4}\s?\d{4}\b/ },
  { label: "Private key / seed phrase", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bseed phrase\b\s*[:\-]/i },
];

export function detectSensitiveData(text: string): string[] {
  if (!text) return [];
  return SECRET_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.label);
}

function redactSecrets(text: string): string {
  let out = text;
  for (const p of SECRET_PATTERNS) {
    out = out.replace(p.re, "[REDACTED]");
  }
  return out;
}

// ── URL helpers ──────────────────────────────────────────────

const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy",
  "tiny.cc", "rebrand.ly", "shorturl.at", "ow.ly", "buff.ly",
];

const RISKY_TLDS = ["xyz", "top", "tk", "click", "buzz", "rest", "cam", "monster", "work"];

const KNOWN_BRANDS = [
  "sbi", "hdfcbank", "icicibank", "axisbank", "kotak", "paytm", "phonepe",
  "googlepay", "amazon", "flipkart", "google", "facebook", "instagram",
  "whatsapp", "paypal", "apple", "microsoft",
];

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi);
  return matches ?? [];
}

function registrableDomain(url: string): string | null {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    // crude two-level TLD handling for co.uk / co.in / com.au etc.
    const twoLevel = ["co", "com", "org", "net", "gov", "ac"];
    const tld = parts[parts.length - 1];
    const secondLevel = parts[parts.length - 2];
    if (tld.length === 2 && twoLevel.includes(secondLevel)) {
      return `${parts[parts.length - 3]}.${secondLevel}.${tld}`;
    }
    return `${secondLevel}.${tld}`;
  } catch {
    return null;
  }
}

function hostname(url: string): string | null {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// ── Signal library ───────────────────────────────────────────

const SIGNALS = {
  secretRequest: {
    id: "secret-request",
    title: "Request for sensitive information",
    explanation:
      "The message asks for an OTP, password, PIN, card details, or another secret. Legitimate organisations never ask for these.",
    recommendation: "Never share OTPs, passwords, or PINs — with anyone.",
    points: 4,
  },
  threatPressure: {
    id: "threat-pressure",
    title: "Threatening or pressure language",
    explanation:
      "Warnings like account closure, suspension, or legal action create fear that can push you into acting before verifying.",
    recommendation: "Pause. Contact the organisation directly using the number on its official website.",
    points: 3,
  },
  urgency: {
    id: "urgency",
    title: "Urgent language detected",
    explanation:
      "Pressure to act quickly reduces your ability to verify the request independently.",
    recommendation: "Take your time. Real requests can survive a short delay for verification.",
    points: 2,
  },
  prizeClaim: {
    id: "prize-claim",
    title: "Unexpected prize or reward claim",
    explanation:
      "Unexpected winnings, refunds, or rewards are a common pattern in fraudulent messages.",
    recommendation: "Do not pay any fee to claim a prize. Verify through official channels first.",
    points: 3,
  },
  paymentPressure: {
    id: "payment-pressure",
    title: "Payment requested with pressure",
    explanation:
      "The message asks for money while creating urgency or promising a benefit in return.",
    recommendation: "Do not pay until you have verified the request through an official contact method.",
    points: 2,
  },
  feeToClaim: {
    id: "fee-to-claim",
    title: "Fee demanded to release money or a prize",
    explanation:
      "Asking for a small 'processing' or 'verification' fee to unlock a larger amount is a classic advance-fee pattern.",
    recommendation: "Never pay a fee to receive a prize, refund, or transfer.",
    points: 3,
  },
  unusualPaymentMethod: {
    id: "unusual-payment-method",
    title: "Unusual payment method requested",
    explanation:
      "Gift cards, vouchers, crypto, or wire transfers to individuals are hard to trace and commonly abused.",
    recommendation: "Refuse unusual payment methods and verify the payee independently.",
    points: 3,
  },
  unofficialChannel: {
    id: "unofficial-channel",
    title: "Request to move to an unofficial channel",
    explanation:
      "Being asked to continue on a personal WhatsApp, Telegram, or other unofficial channel avoids organisational records.",
    recommendation: "Keep important conversations on the organisation's official channels.",
    points: 2,
  },
  attachmentRisk: {
    id: "attachment-risk",
    title: "Unexpected attachment or download requested",
    explanation:
      "Unexpected files — especially apps (.apk) or programs (.exe) — can contain malware.",
    recommendation: "Do not open unexpected attachments or install apps from links.",
    points: 3,
  },
  shortenedUrl: {
    id: "shortened-url",
    title: "Shortened link hides the real destination",
    explanation:
      "Shortened URLs hide where the link actually leads, preventing you from checking the destination.",
    recommendation: "Avoid shortened links in unexpected messages.",
    points: 2,
  },
  brandLookalike: {
    id: "brand-lookalike",
    title: "Link resembles a known brand but cannot be verified",
    explanation:
      "The address contains a well-known brand name, but DIP cannot confirm the domain is genuinely operated by that organisation.",
    recommendation: "Type the organisation's official address yourself instead of using the link.",
    points: 2,
  },
  riskyTld: {
    id: "risky-tld",
    title: "Less common domain ending",
    explanation:
      "Some domain endings are cheap to register and appear disproportionately in suspicious links. This alone is not proof of fraud.",
    recommendation: "Verify the website through an independent source before trusting it.",
    points: 2,
  },
  ipAddressHost: {
    id: "ip-address-host",
    title: "Link uses a raw IP address",
    explanation:
      "Legitimate consumer websites almost never use bare IP addresses. This suggests an unregulated host.",
    recommendation: "Do not enter any information on this site.",
    points: 3,
  },
  insecureHttp: {
    id: "insecure-http",
    title: "Link is not encrypted (http://)",
    explanation:
      "The link does not use HTTPS, so anything submitted could be intercepted or altered.",
    recommendation: "Only submit information on sites that use HTTPS.",
    points: 1,
  },
  senderLinkMismatch: {
    id: "sender-link-mismatch",
    title: "Sender identity and link domain do not match",
    explanation:
      "The sender's address domain differs from the linked website's domain — a common phishing pattern.",
    recommendation: "Contact the claimed organisation directly instead of using the link.",
    points: 2,
  },
  unrealisticReturn: {
    id: "unrealistic-return",
    title: "Promise of unrealistic returns",
    explanation:
      "Guaranteed high returns with no risk are a hallmark of investment fraud.",
    recommendation: "Treat guaranteed-profit offers as warning signals.",
    points: 3,
  },
  usernameBrandBorrow: {
    id: "username-brand-borrow",
    title: "Username imitates an official or support identity",
    explanation:
      "Usernames containing words like 'official', 'support', or a bank name are frequently used for impersonation. DIP cannot verify account ownership.",
    recommendation: "Contact the organisation through its verified official account or website.",
    points: 3,
  },
  usernameDigitHeavy: {
    id: "username-digit-heavy",
    title: "Username is dominated by digits",
    explanation:
      "Long runs of digits in a username can indicate auto-generated or throwaway accounts, though many genuine users also have numeric names.",
    recommendation: "Check the account's history, followers, and verification through the platform itself.",
    points: 1,
  },
  noRequests: {
    id: "no-requests",
    title: "No requests for secrets, payments, or urgent action",
    explanation:
      "The message does not press you to share credentials, pay money, or act under time pressure.",
    points: 1,
  },
  officialContactGuidance: {
    id: "official-contact-guidance",
    title: "Directs you to official contact channels",
    explanation:
      "The message points you to independently verifiable contact details rather than links or numbers supplied in the message.",
    points: 1,
  },
} as const satisfies Record<string, TrustSignal>;

type SignalKey = keyof typeof SIGNALS;

// ── Analysis ─────────────────────────────────────────────────

function insufficient(category: AnalysisCategory, advice: string): TrustAnalysis {
  return {
    id: makeId(),
    category,
    riskLevel: "unable_to_assess",
    score: 0,
    signals: [],
    positiveSignals: [],
    recommendations: [advice],
    limitations: [
      "There is not enough information to produce a meaningful assessment.",
      "DIP assesses only the information you submit and cannot look up external records.",
    ],
    inputSummary: {},
    sensitiveDataBlocked: [],
    demo: false,
    createdAt: new Date().toISOString(),
  };
}

function makeId(): string {
  return `DIP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

function classify(score: number): RiskLevel {
  if (score >= 6) return "high_concern";
  if (score >= 3) return "needs_verification";
  return "low_concern";
}

function push(map: Map<SignalKey, TrustSignal>, key: SignalKey) {
  if (!map.has(key)) map.set(key, SIGNALS[key]);
}

function evaluateText(text: string, urls: string[], senderEmail?: string): {
  signals: TrustSignal[];
  positives: TrustSignal[];
} {
  const found = new Map<SignalKey, TrustSignal>();
  const t = text.toLowerCase();

  if (/\b(otp|one[- ]time (password|code)|password|pin\b|cvv|card number|bank pin|private key|seed phrase|secret code)\b/.test(t)) {
    push(found, "secretRequest");
  }
  if (/(account (will be|has been|is) (closed|blocked|suspended|frozen)|legal action|arrest|deactivate (your )?account|unauthorized (login|activity|transaction)|suspend(ed)?)\b/i.test(t)) {
    push(found, "threatPressure");
  }
  if (/(urgent|immediately|act now|right now|within \d+ (hours|minutes|days)|expires? (today|soon|within)|final (warning|notice)|last chance|today itself)\b/i.test(t)) {
    push(found, "urgency");
  }
  if (/(congratulations|you have won|you'?ve won|winner|lottery|prize|lucky draw|cashback claim|kbc)\b/i.test(t)) {
    push(found, "prizeClaim");
  }
  if (/(processing fee|verification fee|registration fee|pay .{0,30}(fee|to (claim|unlock|release))|send .{0,20}₹?\s?\d{2,6}\s*(to claim|immediately))/.test(t)) {
    push(found, "feeToClaim");
  }
  if (/\b(pay|payment|send (money|us)|transfer (₹|rs|inr)?\s?\d|deposit)\b/.test(t) && /(₹|rs\.?|inr|\d{3,})/.test(t)) {
    push(found, "paymentPressure");
  }
  if (/(gift card|gift voucher|itunes|google play (card|code)|crypto|bitcoin|usdt|wire transfer to a|western union)\b/i.test(t)) {
    push(found, "unusualPaymentMethod");
  }
  if (/(whatsapp|telegram)\s*(me|us|on|at|number)|move (the )?(conversation|chat|discussion) to\b/i.test(t)) {
    push(found, "unofficialChannel");
  }
  if (/\.(apk|exe|scr|jar|bat|dmg)\b|download the attachment|open the attached|install (the|this) (app|file|software)/i.test(t)) {
    push(found, "attachmentRisk");
  }
  if (/(double your|guaranteed (return|profit|income)|100% (return|profit|guarantee)|daily (income|profit) of|risk[- ]free (profit|return))/i.test(t)) {
    push(found, "unrealisticReturn");
  }

  // URL-derived signals
  const linkDomain = urls.length ? registrableDomain(urls[0]) : null;
  const senderDomain = senderEmail?.includes("@") ? senderEmail.split("@")[1]?.toLowerCase() : undefined;

  for (const url of urls) {
    const host = hostname(url);
    if (!host) continue;
    if (SHORTENERS.includes(host)) push(found, "shortenedUrl");
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) push(found, "ipAddressHost");
    const domain = registrableDomain(url);
    const tld = domain?.split(".").pop() ?? "";
    if (RISKY_TLDS.includes(tld)) push(found, "riskyTld");
    const brand = KNOWN_BRANDS.find((b) => domain?.includes(b));
    if (brand && domain !== brand) push(found, "brandLookalike");
  }

  if (urls.some((u) => u.startsWith("http://"))) push(found, "insecureHttp");

  if (senderDomain && linkDomain && !linkDomain.includes(senderDomain.split(".")[0])) {
    push(found, "senderLinkMismatch");
  }

  // Positives
  const requestSignals: SignalKey[] = ["secretRequest", "paymentPressure", "feeToClaim", "urgency", "threatPressure"];
  const positives: TrustSignal[] = [];
  if (!requestSignals.some((k) => found.has(k))) {
    positives.push(SIGNALS.noRequests);
  }
  if (/(contact (us |them )?(using|through|on) the official|official (number|website|app|helpline)|call the number (on|printed|listed)|the number on (its|their|the) (official )?(website|site))/.test(t)) {
    positives.push(SIGNALS.officialContactGuidance);
  }

  return { signals: [...found.values()], positives };
}

export function analyzeTrust(input: AnalysisInput): TrustAnalysis {
  const text = (input.messageText ?? input.description ?? "").trim();
  const urls = extractUrls(text) ?? [];
  if (input.url) urls.unshift(input.url);
  if (input.profileLink) urls.unshift(input.profileLink);

  // ── Insufficient-input gates ──
  if (input.category === "message" && text.length < 10 && urls.length === 0) {
    return insufficient("message", "Add the full message text (and sender details if known) without submitting passwords or OTPs.");
  }
  if (input.category === "link" && !input.url) {
    return insufficient("link", "Add the complete website link beginning with http:// or https://.");
  }
  if (input.category === "payment" && text.length < 10) {
    return insufficient("payment", "Add the payment request text so DIP can identify relevant signals.");
  }
  if (input.category === "account" && !input.username && !input.profileLink) {
    return insufficient("account", "Add the username or profile link, plus the platform and context.");
  }
  if (input.category === "account" && !input.platform && !input.description && !input.profileLink) {
    return insufficient("account", "A username alone is not enough. Add the platform or a short description of the interaction.");
  }
  if (input.category === "screenshot" && text.length < 10) {
    return insufficient(
      "screenshot",
      "This prototype cannot read image content. Type or paste what the screenshot says (without secrets) so DIP can assess the text.",
    );
  }

  const textToScan = input.category === "link" ? (input.description ?? input.url ?? "") : text;
  const { signals, positives } = evaluateText(
    textToScan || input.url || "",
    urls,
    input.senderEmail,
  );

  // Payment-specific: unusual method field
  const extraSignals: TrustSignal[] = [];
  if (input.category === "payment" && input.paymentMethod &&
      /(gift ?card|voucher|crypto|bitcoin|usdt|wire transfer|western union)/i.test(input.paymentMethod)) {
    extraSignals.push(SIGNALS.unusualPaymentMethod);
  }

  // Account-specific: username impersonation / throwaway signals
  if (input.category === "account") {
    const uname = (input.username ?? "").toLowerCase();
    if (uname) {
      const brand = KNOWN_BRANDS.find((b) => uname.includes(b));
      if (brand) {
        extraSignals.push(SIGNALS.usernameBrandBorrow);
      } else if (/\b(official|verified|support|helpdesk|customer.?care|admin|team)\b/.test(uname)) {
        extraSignals.push(SIGNALS.usernameBrandBorrow);
      }
      const digits = (uname.match(/\d/g) ?? []).length;
      if (uname.length >= 6 && digits / uname.length > 0.5) {
        extraSignals.push(SIGNALS.usernameDigitHeavy);
      }
    }
  }

  const all = [...signals, ...extraSignals];
  const score = all.reduce((s, x) => s + x.points, 0);
  const riskLevel = classify(score);

  const recommendations = buildRecommendations(riskLevel, all, input.category);

  const limitations = [
    "This assessment is based only on the information provided and available signals. It is not proof of identity, intent, or criminal activity.",
    "DIP cannot confirm the sender's true identity, check external databases, or determine what will happen if you respond.",
  ];
  if (input.category === "link" || urls.length > 0) {
    limitations.push("DIP cannot verify who operates a domain. A clean-looking or brand-like address can still be controlled by anyone.");
  }
  if (input.category === "screenshot") {
    limitations.push("Only the text you typed was analysed. DIP did not read or upload the image itself.");
  }

  // Redacted input summary for the report
  const inputSummary: Record<string, string> = {};
  if (input.senderName) inputSummary["Sender name"] = input.senderName;
  if (input.senderEmail) inputSummary["Sender email"] = input.senderEmail;
  if (input.platform) inputSummary["Platform"] = input.platform;
  if (input.username) inputSummary["Username"] = input.username;
  if (input.paymentMethod) inputSummary["Payment method"] = input.paymentMethod;
  if (input.amount) inputSummary["Requested amount"] = input.amount;
  if (input.url) inputSummary["Link"] = input.url;
  if (input.profileLink) inputSummary["Profile link"] = input.profileLink;
  if (text) inputSummary[input.category === "screenshot" ? "Screenshot description" : "Message text"] =
    redactSecrets(text).slice(0, 800);

  return {
    id: makeId(),
    category: input.category,
    riskLevel,
    score,
    signals: all,
    positiveSignals: positives,
    recommendations,
    limitations,
    inputSummary,
    sensitiveDataBlocked: [],
    demo: false,
    createdAt: new Date().toISOString(),
  };
}

function buildRecommendations(
  level: RiskLevel,
  signals: TrustSignal[],
  category: AnalysisCategory,
): string[] {
  const recs: string[] = [];
  const seen = new Set<string>();
  for (const s of signals) {
    if (s.recommendation && !seen.has(s.recommendation)) {
      recs.push(s.recommendation);
      seen.add(s.recommendation);
    }
  }

  if (level === "high_concern") {
    recs.push(
      "Do not share passwords, OTPs, PINs, or payment details.",
      "Do not open unknown attachments or links.",
      "Save evidence (screenshots, sender details) if you believe an attempt was made to deceive you.",
      "Report the account or message through the platform's official reporting tools.",
    );
  } else if (level === "needs_verification") {
    recs.push(
      "Verify the request through the organisation's official website or phone number — found independently, not from this message.",
      "Do not submit personal or financial information until verification is complete.",
    );
  } else if (level === "low_concern") {
    recs.push("Continue with caution and independently verify important requests.");
  }

  if (category === "link" && level !== "unable_to_assess") {
    recs.push("Type the organisation's official web address yourself instead of clicking the link.");
  }
  if (category === "payment" && level !== "low_concern") {
    recs.push("Confirm payment details through a second, independent channel before sending any money.");
  }

  return [...new Set(recs)];
}

// ── Report helpers ───────────────────────────────────────────

export const RISK_LABELS: Record<RiskLevel, string> = {
  low_concern: "Low concern",
  needs_verification: "Needs verification",
  high_concern: "High concern",
  unable_to_assess: "Unable to assess",
};

export const RISK_EXPLANATIONS: Record<RiskLevel, string> = {
  low_concern:
    "No major warning signals were detected from the submitted information. Continue with caution and independently verify important requests.",
  needs_verification:
    "This submission contains signals that deserve a closer look before you trust, reply, pay, or share information.",
  high_concern:
    "This submission contains several warning signals that require caution.",
  unable_to_assess:
    "There is not enough information to produce a meaningful assessment.",
};

export const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  message: "Message or email",
  link: "Website link",
  account: "Account or username",
  payment: "Payment request",
  screenshot: "Screenshot or conversation",
};

export const ASSESSMENT_NOTICE =
  "This assessment is based only on the information provided and available signals. It is not proof of identity, intent, or criminal activity.";

export const PROTOTYPE_LABEL = "Prototype risk indicator, not a probability of fraud.";

export function buildReportText(a: TrustAnalysis): string {
  const lines: string[] = [
    "DIP — Digital Innocence Protocol · Trust & Safety Assistant",
    `"Verify before you trust."`,
    "",
    `Report ID: ${a.id}`,
    `Generated: ${new Date(a.createdAt).toLocaleString()}`,
    `Input category: ${CATEGORY_LABELS[a.category]}`,
    a.demo ? "Data: Synthetic demonstration data (Demo Mode)" : "",
    "",
    `Risk status: ${RISK_LABELS[a.riskLevel]}`,
    `Summary: ${RISK_EXPLANATIONS[a.riskLevel]}`,
    "",
  ];

  if (Object.keys(a.inputSummary).length) {
    lines.push("Submitted information (secrets redacted):");
    for (const [k, v] of Object.entries(a.inputSummary)) lines.push(`  • ${k}: ${v}`);
    lines.push("");
  }

  if (a.signals.length) {
    lines.push("Warning signals found:");
    for (const s of a.signals) lines.push(`  • ${s.title} (+${s.points}) — ${s.explanation}`);
    lines.push("");
  }
  if (a.positiveSignals.length) {
    lines.push("Positive signals found:");
    for (const s of a.positiveSignals) lines.push(`  • ${s.title} — ${s.explanation}`);
    lines.push("");
  }

  lines.push("Recommended next actions:");
  for (const r of a.recommendations) lines.push(`  • ${r}`);
  lines.push("");
  lines.push("What DIP cannot determine:");
  for (const l of a.limitations) lines.push(`  • ${l}`);
  lines.push("");
  lines.push(`Disclaimer: ${ASSESSMENT_NOTICE}`);
  lines.push("DIP does not determine guilt or innocence and is not legal advice.");

  return lines.filter((l) => l !== "").join("\n");
}

// ── Session storage (privacy-first: nothing leaves the device) ──

const STORAGE_KEY = "dip_analyses_v1";

export function saveAnalysis(a: TrustAnalysis): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, TrustAnalysis>) : {};
    map[a.id] = a;
    // keep only the latest 20 analyses
    const entries = Object.entries(map).sort(
      (x, y) => (y[1].createdAt > x[1].createdAt ? 1 : -1),
    );
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(entries.slice(0, 20))),
    );
  } catch {
    // storage unavailable (private mode) — result page will show session-expired state
  }
}

export function loadAnalysis(id: string): TrustAnalysis | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, TrustAnalysis>;
    return map[id] ?? null;
  } catch {
    return null;
  }
}

export function clearAllSessionData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("dip_feedback_v1");
  } catch {
    // ignore
  }
}

// ── Demo scenarios (synthetic demonstration data) ─────────────

export interface DemoScenario {
  key: "A" | "B" | "C";
  title: string;
  blurb: string;
  input: AnalysisInput;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    key: "A",
    title: "Suspicious payment message",
    blurb: "Prize claim, OTP request, urgent payment",
    input: {
      category: "message",
      senderName: "Unknown number",
      messageText:
        "Congratulations! You have won ₹50,000. Send your OTP and pay ₹499 immediately to claim your prize.",
    },
  },
  {
    key: "B",
    title: "Suspicious link",
    blurb: "Threatening urgency, unverified link",
    input: {
      category: "link",
      url: "http://example-security-check.test",
      description:
        "Your account will be closed today. Verify immediately at http://example-security-check.test",
    },
  },
  {
    key: "C",
    title: "Ordinary low-concern message",
    blurb: "Appointment confirmation, official contact guidance",
    input: {
      category: "message",
      senderName: "City Clinic",
      messageText:
        "Your appointment is confirmed for tomorrow at 10 AM. Please contact the clinic using the official number on its website if you need to reschedule.",
    },
  },
];
