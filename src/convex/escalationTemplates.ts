// Escalation draft template generator
// These are templates that users can review, edit, and send externally

export interface CaseData {
  bankName: string;
  accountMasked: string;
  freezeType: string;
  freezeDate: string;
  transactionAmount: number;
  senderName: string;
  purpose: string;
  firNumber?: string;
  ioName?: string;
  policeStationName?: string;
  city?: string;
  state?: string;
}

export function generateBankNodalDraft(caseData: CaseData): string {
  return `Subject: Request for Review – Account Freeze (Cyber Fraud Investigation)

To,
The Nodal Officer
${caseData.bankName}

Date: ${new Date().toLocaleDateString("en-IN")}

Respected Sir/Madam,

I am writing to bring to your attention that my savings account (ending ${caseData.accountMasked}) at ${caseData.bankName} has been frozen under what appears to be a lien/debit freeze (${caseData.freezeType}) since ${caseData.freezeDate}.

I wish to state that I am a genuine account holder and the disputed transaction of ₹${caseData.transactionAmount.toLocaleString("en-IN")} from ${caseData.senderName} was a legitimate ${caseData.purpose} transaction.

I have prepared a comprehensive evidence report through DIP (Digital Innocence Protocol) which includes:
- Transaction details and purpose
- Supporting evidence (invoices, receipts, chat records)
- Consistency checks on the evidence

I kindly request you to:
1. Review the evidence provided
2. Share the specific complaint or investigation reference that led to this freeze
3. Consider unfreezing my account or providing a pathway to resolution

I am willing to cooperate fully with any verification process.

Thank you for your time and consideration.

Yours sincerely,
[Your Name]
Account: ${caseData.accountMasked}
${caseData.firNumber ? `FIR Number: ${caseData.firNumber}` : ""}
`;
}

export function generateBankGrievanceDraft(caseData: CaseData): string {
  return `Subject: Grievance – Prolonged Account Freeze Without Resolution

To,
The Grievance Officer
${caseData.bankName}

Date: ${new Date().toLocaleDateString("en-IN")}

Respected Sir/Madam,

I wish to formally register a grievance regarding the continued freeze on my savings account (ending ${caseData.accountMasked}) at ${caseData.bankName}.

Account details:
- Account: ${caseData.accountMasked}
- Freeze type: ${caseData.freezeType}
- Freeze date: ${caseData.freezeDate}
- Disputed amount: ₹${caseData.transactionAmount.toLocaleString("en-IN")}

Despite my account being frozen since ${caseData.freezeDate}, I have not received adequate communication regarding the status of the investigation or a clear resolution pathway.

I have prepared a detailed evidence report through DIP (Digital Innocence Protocol) demonstrating that the transaction in question was legitimate.

I request that you:
1. Provide a written explanation for the continued freeze
2. Share the timeline for resolution
3. Consider the evidence I have submitted
4. Escalate this matter internally if further investigation is required

If this grievance is not addressed within 15 business days, I may be compelled to escalate this matter to the Banking Ombudsman / RBI.

Yours sincerely,
[Your Name]
Account: ${caseData.accountMasked}
`;
}

export function generateSPOfficeDraft(caseData: CaseData): string {
  return `Subject: Representation Regarding Frozen Bank Account in Cyber Fraud Investigation

To,
The Station House Officer / Senior Police Inspector
${caseData.policeStationName || "[Police Station Name]"}
${caseData.city || "[City]"}, ${caseData.state || "[State]"}

Date: ${new Date().toLocaleDateString("en-IN")}

Respected Sir/Madam,

I am writing to bring to your notice that my bank account has been frozen in connection with a cyber fraud investigation. I wish to present my case and provide evidence of my innocence.

Details:
- Bank: ${caseData.bankName}
- Account: ${caseData.accountMasked}
- Freeze type: ${caseData.freezeType}
- Freeze date: ${caseData.freezeDate}
${caseData.firNumber ? `- FIR Number: ${caseData.firNumber}` : ""}
${caseData.ioName ? `- Investigating Officer: ${caseData.ioName}` : ""}

The disputed transaction of ₹${caseData.transactionAmount.toLocaleString("en-IN")} from ${caseData.senderName} was a legitimate ${caseData.purpose} transaction. I have prepared a comprehensive evidence report through DIP (Digital Innocence Protocol) which includes:

1. Transaction records and purpose documentation
2. Supporting evidence (invoices, delivery proofs, chat records)
3. Identity verification documents

I respectfully request:
1. An opportunity to present my evidence
2. Consideration for unfreezing my account
3. Written confirmation of the investigation status

I am fully cooperating and willing to appear in person if required.

Yours sincerely,
[Your Name]
[Contact Number]
Account: ${caseData.accountMasked}
`;
}

export function generateRBIOmbudsmanDraft(caseData: CaseData): string {
  return `Subject: Complaint to Banking Ombudsman – Unreasonable Account Freeze

To,
The Banking Ombudsman
[Applicable RBI Office]

Date: ${new Date().toLocaleDateString("en-IN")}

Respected Sir/Madam,

I wish to file a complaint regarding the unreasonable and prolonged freeze on my bank account without adequate explanation or resolution pathway.

Complainant details:
- Name: [Your Name]
- Bank: ${caseData.bankName}
- Account: ${caseData.accountMasked}
- Branch: [Your Branch]

Complaint details:
- Account frozen since: ${caseData.freezeDate}
- Freeze type: ${caseData.freezeType}
- Disputed amount: ₹${caseData.transactionAmount.toLocaleString("en-IN")}

Grievances:
1. My account has been frozen since ${caseData.freezeDate} without adequate explanation
2. I have submitted evidence demonstrating the legitimate nature of the transaction
3. The bank has not provided a reasonable timeline for resolution
4. The prolonged freeze is causing severe financial hardship

Evidence submitted:
- DIP Evidence Report (attached)
- Supporting documents for the transaction

I have previously attempted to resolve this with the bank's nodal/grievance officer but have not received a satisfactory response.

I request the Banking Ombudsman to:
1. Direct the bank to review the evidence
2. Provide a reasonable timeline for resolution
3. Consider unfreezing the account pending investigation

Enclosures:
1. DIP Evidence Report
2. Bank correspondence (if any)
3. Identity documents

Yours sincerely,
[Your Name]
[Contact Details]
`;
}
