// ── Validation helpers (extracted from NewCase for testability) ──

export interface CaseInput {
  bankName: string;
  branch: string;
  accountMasked: string;
  freezeType: string;
  freezeDate: string;
  policeStationName: string;
  city: string;
  state: string;
  ioName: string;
  ioEmail: string;
  firNumber: string;
  transactionDate: string;
  transactionAmount: string;
  senderName: string;
  purpose: string;
  relationship: string;
  narrative: string;
  consentGiven: boolean;
}

export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Validates the freeze details step (step 0).
 * Returns errors object — empty if valid.
 */
export function validateFreezeStep(form: CaseInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!form.bankName.trim()) errors.bankName = "Bank name is required";
  if (!form.accountMasked.trim())
    errors.accountMasked = "Masked account is required";
  if (!form.freezeType) errors.freezeType = "Freeze type is required";
  if (!form.freezeDate) errors.freezeDate = "Freeze date is required";
  return errors;
}

/**
 * Validates the disputed transaction step (step 2).
 */
export function validateTransactionStep(form: CaseInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!form.transactionDate)
    errors.transactionDate = "Transaction date is required";
  if (!form.transactionAmount || parseFloat(form.transactionAmount) <= 0)
    errors.transactionAmount = "Valid amount is required";
  if (!form.senderName.trim()) errors.senderName = "Sender name is required";
  if (!form.purpose) errors.purpose = "Purpose is required";
  if (!form.relationship) errors.relationship = "Relationship is required";
  if (!form.narrative.trim())
    errors.narrative = "Please describe what happened";
  return errors;
}

/**
 * Validates the consent step (step 4).
 */
export function validateConsentStep(form: CaseInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!form.consentGiven)
    errors.consentGiven = "You must agree to the terms";
  return errors;
}

/**
 * Validates the auth redirect path to prevent open redirect attacks.
 * Only allows paths starting with / that don't start with //
 */
export function isValidRedirectPath(path: string | null): boolean {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Validates that an account mask follows the expected pattern (XXXX####).
 */
export function isValidAccountMask(mask: string): boolean {
  // Must be at least 8 chars, start with XXXX, end with digits
  return /^X{4,}\d{1,}$/.test(mask.trim());
}

/**
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates that a date string is a valid ISO date.
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Sanitizes text input to prevent XSS.
 * Strips HTML tags and script content.
 */
export function sanitizeTextInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Validates file upload constraints.
 */
export function validateFileUpload(
  file: File,
): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File exceeds 10MB limit" };
  }

  if (!ALLOWED_TYPES.includes(file.type) && file.type !== "") {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed`,
    };
  }

  return { valid: true };
}
