// ── Server-side input sanitization ──
// Convex runs in a sandboxed environment, so this is defense-in-depth.
// React's JSX escaping handles most XSS on the frontend, but we sanitize
// on the backend as well for data integrity.

/**
 * Strips HTML tags and script content from user input.
 * This is a basic sanitizer — for production, consider a library like DOMPurify.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Validates that a string doesn't contain obviously malicious content.
 * Returns true if the input is safe.
 */
export function isSafeInput(input: string): boolean {
  // Block common injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:text\/html/i,
  ];
  return !dangerousPatterns.some((p) => p.test(input));
}
