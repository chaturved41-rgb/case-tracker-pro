// ── Consistency check logic (extracted for testability) ──

export interface EvidenceItem {
  metadataAmount?: number | null;
  metadataDate?: string | null;
  metadataCounterpartyName?: string | null;
}

export interface CaseData {
  transactionAmount: number;
  freezeDate: string;
  senderName: string;
}

export interface ConsistencyCheck {
  checkType: string;
  result: "pass" | "warning" | "fail";
  details: string;
}

/**
 * Check if any evidence amounts match the disputed transaction amount.
 */
export function checkAmountMatch(
  evidence: EvidenceItem[],
  caseData: CaseData,
): ConsistencyCheck | null {
  const evidenceWithAmount = evidence.filter(
    (e) => e.metadataAmount !== undefined && e.metadataAmount !== null,
  );
  if (evidenceWithAmount.length === 0) return null;

  const matchingAmounts = evidenceWithAmount.filter(
    (e) => e.metadataAmount === caseData.transactionAmount,
  );

  return {
    checkType: "amount_match",
    result: matchingAmounts.length > 0 ? "pass" : "warning",
    details:
      matchingAmounts.length > 0
        ? `${matchingAmounts.length} evidence item(s) match the disputed amount of ₹${caseData.transactionAmount}`
        : `No evidence items match the disputed amount of ₹${caseData.transactionAmount}. Consider adding receipts or invoices with the matching amount.`,
  };
}

/**
 * Check if evidence dates are on or before the freeze date.
 */
export function checkDateOrder(
  evidence: EvidenceItem[],
  caseData: CaseData,
): ConsistencyCheck | null {
  const evidenceWithDate = evidence.filter(
    (e) => e.metadataDate !== undefined && e.metadataDate !== null,
  );
  if (evidenceWithDate.length === 0) return null;

  const datesBeforeFreeze = evidenceWithDate.filter(
    (e) => e.metadataDate! <= caseData.freezeDate,
  );

  return {
    checkType: "date_order",
    result:
      datesBeforeFreeze.length === evidenceWithDate.length ? "pass" : "warning",
    details:
      datesBeforeFreeze.length === evidenceWithDate.length
        ? `All ${evidenceWithDate.length} dated evidence items are on or before the freeze date (${caseData.freezeDate})`
        : `${evidenceWithDate.length - datesBeforeFreeze.length} evidence item(s) have dates after the freeze date. Ensure dates are accurate.`,
  };
}

/**
 * Check if evidence counterparty names match the sender name.
 */
export function checkNameMatch(
  evidence: EvidenceItem[],
  caseData: CaseData,
): ConsistencyCheck | null {
  const evidenceWithNames = evidence.filter(
    (e) =>
      e.metadataCounterpartyName !== undefined &&
      e.metadataCounterpartyName !== null &&
      e.metadataCounterpartyName !== "",
  );
  if (evidenceWithNames.length === 0) return null;

  const nameMatch = evidenceWithNames.some(
    (e) =>
      e
        .metadataCounterpartyName!.toLowerCase()
        .includes(caseData.senderName.toLowerCase()) ||
      caseData.senderName
        .toLowerCase()
        .includes(e.metadataCounterpartyName!.toLowerCase()),
  );

  return {
    checkType: "name_match",
    result: nameMatch ? "pass" : "warning",
    details: nameMatch
      ? `Evidence counterparty name matches sender "${caseData.senderName}"`
      : `No evidence counterparty names match sender "${caseData.senderName}". Consider adding evidence that links the sender to the transaction.`,
  };
}

/**
 * Check minimum evidence count.
 */
export function checkMinimumEvidence(
  evidenceCount: number,
): ConsistencyCheck {
  return {
    checkType: "duplicate_detection",
    result:
      evidenceCount >= 3 ? "pass" : evidenceCount >= 1 ? "warning" : "fail",
    details:
      evidenceCount >= 3
        ? `${evidenceCount} evidence items uploaded — good coverage`
        : evidenceCount === 1
          ? "Only 1 evidence item uploaded. Consider adding more supporting documents for a stronger case."
          : "No evidence items uploaded yet. Upload invoices, receipts, chat screenshots, or other supporting documents.",
  };
}

/**
 * Run all consistency checks on a case.
 */
export function runAllChecks(
  evidence: EvidenceItem[],
  caseData: CaseData,
): ConsistencyCheck[] {
  const checks: ConsistencyCheck[] = [];

  const amountCheck = checkAmountMatch(evidence, caseData);
  if (amountCheck) checks.push(amountCheck);

  const dateCheck = checkDateOrder(evidence, caseData);
  if (dateCheck) checks.push(dateCheck);

  const nameCheck = checkNameMatch(evidence, caseData);
  if (nameCheck) checks.push(nameCheck);

  checks.push(checkMinimumEvidence(evidence.length));

  return checks;
}
