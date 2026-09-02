import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Check,
  Upload,
  X,
  Shield,
  Lightbulb,
  Camera,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface FormData {
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
  evidenceFiles: EvidenceFile[];
  consentGiven: boolean;
  termsAccepted: boolean;
}

interface EvidenceFile {
  id: string;
  file: File;
  type: string;
  metadataDate: string;
  metadataAmount: string;
  metadataCounterpartyName: string;
  notes: string;
}

const defaultFormData: FormData = {
  bankName: "",
  branch: "",
  accountMasked: "",
  freezeType: "",
  freezeDate: "",
  policeStationName: "",
  city: "",
  state: "",
  ioName: "",
  ioEmail: "",
  firNumber: "",
  transactionDate: "",
  transactionAmount: "",
  senderName: "",
  purpose: "",
  relationship: "",
  narrative: "",
  evidenceFiles: [],
  consentGiven: false,
  termsAccepted: false,
};

const STEPS = [
  { title: "Freeze Details", subtitle: "Bank and account information" },
  { title: "Investigation Info", subtitle: "Police and IO details (all optional)" },
  { title: "Disputed Transaction", subtitle: "What happened" },
  { title: "Evidence", subtitle: "Upload supporting documents" },
  { title: "Review & Consent", subtitle: "Verify and submit" },
];

const FREEZE_TYPES = [
  { value: "lien", label: "Lien" },
  { value: "debit_freeze", label: "Debit Freeze" },
  { value: "full_freeze", label: "Full Freeze" },
];

const PURPOSES = [
  { value: "freelance", label: "Freelance work" },
  { value: "sale", label: "Sale of goods" },
  { value: "family", label: "Family transfer" },
  { value: "salary", label: "Salary / wages" },
  { value: "other", label: "Other" },
];

const RELATIONSHIPS = [
  { value: "client", label: "Client" },
  { value: "customer", label: "Customer" },
  { value: "family", label: "Family member" },
  { value: "friend", label: "Friend" },
  { value: "stranger", label: "Stranger" },
  { value: "other", label: "Other" },
];

const EVIDENCE_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "order_confirmation", label: "Order Confirmation" },
  { value: "delivery_proof", label: "Delivery Proof" },
  { value: "chat_screenshot", label: "Chat Screenshot" },
  { value: "platform_receipt", label: "Platform Receipt" },
  { value: "relationship_proof", label: "Relationship Proof" },
  { value: "other", label: "Other" },
];

// ── Component ──────────────────────────────────────────────────
export default function NewCase() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const createCase = useMutation(api.cases.create);
  const addEvidence = useMutation(api.evidence.add);
  const generateReport = useMutation(api.reports.generateReport);

  // Accept prefill from screenshot analyzer
  const prefill = (location.state as any)?.prefill;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    ...defaultFormData,
    bankName: prefill?.bankName || "",
    accountMasked: prefill?.accountMasked || "",
    freezeType: prefill?.freezeType || "",
    policeStationName: prefill?.policeStationName || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── AI Suggestions for police station / IO ────────────────────
  const aiSuggestions = useMemo(() => {
    if (!form.policeStationName && !form.city && !form.state) return null;
    const suggestions: { type: string; text: string }[] = [];

    if (form.policeStationName || form.city) {
      const location = [form.policeStationName, form.city, form.state]
        .filter(Boolean)
        .join(", ");
      suggestions.push({
        type: "police_station",
        text: `Cyber Crime Cell, ${form.city || "your city"}`,
      });
    }

    if (form.city || form.state) {
      suggestions.push({
        type: "io_email",
        text: `cybercell.${(form.city || "city").toLowerCase().replace(/\s+/g, "")}@statepolice.gov.in`,
      });
    }

    return suggestions;
  }, [form.policeStationName, form.city, form.state]);

  // ── Validation ────────────────────────────────────────────────
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!form.bankName.trim()) newErrors.bankName = "Bank name is required";
      if (!form.accountMasked.trim()) newErrors.accountMasked = "Masked account is required";
      if (!form.freezeType) newErrors.freezeType = "Freeze type is required";
      if (!form.freezeDate) newErrors.freezeDate = "Freeze date is required";
    }

    if (stepIndex === 2) {
      if (!form.transactionDate) newErrors.transactionDate = "Transaction date is required";
      if (!form.transactionAmount || parseFloat(form.transactionAmount) <= 0)
        newErrors.transactionAmount = "Valid amount is required";
      if (!form.senderName.trim()) newErrors.senderName = "Sender name is required";
      if (!form.purpose) newErrors.purpose = "Purpose is required";
      if (!form.relationship) newErrors.relationship = "Relationship is required";
      if (!form.narrative.trim()) newErrors.narrative = "Please describe what happened";
    }

    if (stepIndex === 4) {
      if (!form.consentGiven) newErrors.consentGiven = "You must agree to the terms";
      if (!form.termsAccepted) newErrors.termsAccepted = "You must accept the Terms & Conditions and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // ── Evidence file handling ────────────────────────────────────
  const addEvidenceFile = (files: FileList | null) => {
    if (!files) return;
    const newFiles: EvidenceFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      type: "other",
      metadataDate: "",
      metadataAmount: "",
      metadataCounterpartyName: "",
      notes: "",
    }));
    updateField("evidenceFiles", [...form.evidenceFiles, ...newFiles]);
  };

  const removeEvidenceFile = (id: string) => {
    updateField("evidenceFiles", form.evidenceFiles.filter((f) => f.id !== id));
  };

  const updateEvidenceMeta = (id: string, field: keyof EvidenceFile, value: string) => {
    updateField(
      "evidenceFiles",
      form.evidenceFiles.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    );
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);

    try {
      const caseId = await createCase({
        bankName: form.bankName.trim(),
        branch: form.branch.trim() || undefined,
        accountMasked: form.accountMasked.trim(),
        freezeType: form.freezeType,
        freezeDate: form.freezeDate,
        policeStationName: form.policeStationName.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        ioName: form.ioName.trim() || undefined,
        ioEmail: form.ioEmail.trim() || undefined,
        firNumber: form.firNumber.trim() || undefined,
        transactionDate: form.transactionDate,
        transactionAmount: parseFloat(form.transactionAmount),
        senderName: form.senderName.trim(),
        purpose: form.purpose,
        relationship: form.relationship,
        narrative: form.narrative.trim(),
        consentGiven: true,
      });

      for (const ev of form.evidenceFiles) {
        await addEvidence({
          caseId,
          type: ev.type,
          fileNameOriginal: ev.file.name,
          fileMimeType: ev.file.type || "application/octet-stream",
          fileSizeBytes: ev.file.size,
          metadataDate: ev.metadataDate || undefined,
          metadataAmount: ev.metadataAmount ? parseFloat(ev.metadataAmount) : undefined,
          metadataCounterpartyName: ev.metadataCounterpartyName || undefined,
          notes: ev.notes || undefined,
        });
      }

      await generateReport({ caseId });
      toast.success("Case created successfully!");
      navigate(`/cases/${caseId}`);
    } catch (error) {
      console.error("Failed to create case:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create case");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/cases")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            My Cases
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">D</div>
            <span className="font-semibold tracking-tight">New Case</span>
          </div>
          <button
            onClick={() => navigate("/analyze")}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            Analyze Screenshot
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Prefill indicator */}
        {prefill && (
          <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent shrink-0" />
            <span>Fields pre-filled from screenshot analysis. Review and edit as needed.</span>
            <button onClick={() => navigate("/new-case")} className="ml-auto text-xs underline text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        )}

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    i < step ? "bg-accent text-white" : i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/10" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`hidden sm:block h-0.5 w-12 md:w-20 ml-2 ${i < step ? "bg-accent" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="hidden sm:flex items-center justify-between">
            {STEPS.map((s, i) => (
              <span key={i} className={`text-xs ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Card className="border-border/70">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl font-semibold">{STEPS[step].title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{STEPS[step].subtitle}</p>

                <div className="mt-6 space-y-5">
                  {/* ── Step 0: Freeze Details ── */}
                  {step === 0 && (
                    <>
                      <Field label="Bank Name" required error={errors.bankName}>
                        <Input placeholder="e.g. State Bank of India" value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} />
                      </Field>
                      <Field label="Branch (optional)">
                        <Input placeholder="e.g. Andheri West" value={form.branch} onChange={(e) => updateField("branch", e.target.value)} />
                      </Field>
                      <Field label="Masked Account Number" required error={errors.accountMasked} hint="Only last 4 digits, e.g. XXXX4321">
                        <Input placeholder="XXXX4321" value={form.accountMasked} onChange={(e) => updateField("accountMasked", e.target.value)} />
                      </Field>
                      <Field label="Freeze Type" required error={errors.freezeType}>
                        <Select value={form.freezeType} onValueChange={(v) => updateField("freezeType", v)}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {FREEZE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Freeze Date" required error={errors.freezeDate}>
                        <Input type="date" value={form.freezeDate} onChange={(e) => updateField("freezeDate", e.target.value)} />
                      </Field>
                    </>
                  )}

                  {/* ── Step 1: Investigation Info (all optional) ── */}
                  {step === 1 && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">All optional</Badge>
                        <p className="text-xs text-muted-foreground">Fill these in if you have the information. You can always update later.</p>
                      </div>
                      <Field label="Police Station Name">
                        <Input placeholder="e.g. Andheri Police Station" value={form.policeStationName} onChange={(e) => updateField("policeStationName", e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="City">
                          <Input placeholder="e.g. Mumbai" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                        </Field>
                        <Field label="State">
                          <Input placeholder="e.g. Maharashtra" value={form.state} onChange={(e) => updateField("state", e.target.value)} />
                        </Field>
                      </div>

                      {/* AI Suggestions */}
                      {aiSuggestions && aiSuggestions.length > 0 && (
                        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-accent" />
                            <p className="text-xs font-semibold text-accent">AI Suggestions</p>
                            <Badge variant="outline" className="text-[10px] ml-1">Unverified</Badge>
                          </div>
                          <div className="space-y-2">
                            {aiSuggestions.map((s, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground capitalize">{s.type.replace(/_/g, " ")}:</span>
                                <span className="font-medium text-foreground">{s.text}</span>
                                {s.type === "police_station" && (
                                  <button onClick={() => updateField("policeStationName", s.text)} className="text-accent underline ml-1">Use</button>
                                )}
                                {s.type === "io_email" && (
                                  <button onClick={() => updateField("ioEmail", s.text)} className="text-accent underline ml-1">Use</button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-amber-600 mt-2">⚠ These are AI-generated suggestions — verify before using</p>
                        </div>
                      )}

                      <Field label="Investigating Officer (IO) Name">
                        <Input placeholder="e.g. Inspector Sharma" value={form.ioName} onChange={(e) => updateField("ioName", e.target.value)} />
                      </Field>
                      <Field label="IO Email">
                        <Input type="email" placeholder="io@police.gov.in" value={form.ioEmail} onChange={(e) => updateField("ioEmail", e.target.value)} />
                      </Field>
                      <Field label="FIR Number" hint="If you know it">
                        <Input placeholder="e.g. FIR/2026/12345" value={form.firNumber} onChange={(e) => updateField("firNumber", e.target.value)} />
                      </Field>
                    </>
                  )}

                  {/* ── Step 2: Disputed Transaction ── */}
                  {step === 2 && (
                    <>
                      <Field label="Transaction Date" required error={errors.transactionDate}>
                        <Input type="date" value={form.transactionDate} onChange={(e) => updateField("transactionDate", e.target.value)} />
                      </Field>
                      <Field label="Transaction Amount (₹)" required error={errors.transactionAmount}>
                        <Input type="number" placeholder="e.g. 15000" min="0" step="0.01" value={form.transactionAmount} onChange={(e) => updateField("transactionAmount", e.target.value)} />
                      </Field>
                      <Field label="Sender Name" required error={errors.senderName} hint="Who sent you the money?">
                        <Input placeholder="e.g. Rahul Enterprises" value={form.senderName} onChange={(e) => updateField("senderName", e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Purpose" required error={errors.purpose}>
                          <Select value={form.purpose} onValueChange={(v) => updateField("purpose", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Relationship" required error={errors.relationship}>
                          <Select value={form.relationship} onValueChange={(v) => updateField("relationship", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIPS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <Field label="Narrative" required error={errors.narrative} hint="Describe what happened in your own words">
                        <Textarea
                          placeholder="I received ₹15,000 from Rahul Enterprises on 15 Jan 2026 for a freelance web development project. I delivered the work on 10 Jan..."
                          rows={5}
                          value={form.narrative}
                          onChange={(e) => updateField("narrative", e.target.value)}
                        />
                      </Field>
                    </>
                  )}

                  {/* ── Step 3: Evidence Upload ── */}
                  {step === 3 && (
                    <>
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer"
                        onClick={() => document.getElementById("evidence-input")?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">Click to upload evidence files</p>
                        <p className="text-xs text-muted-foreground mt-1">Invoices, receipts, chat screenshots, delivery proofs, etc.</p>
                        <input id="evidence-input" type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.csv" onChange={(e) => addEvidenceFile(e.target.files)} />
                      </div>

                      {form.evidenceFiles.length > 0 && (
                        <div className="space-y-4 mt-4">
                          {form.evidenceFiles.map((ev) => (
                            <div key={ev.id} className="rounded-xl border border-border/70 bg-card p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                    {ev.file.name.split(".").pop()?.toUpperCase() || "?"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium truncate max-w-[200px]">{ev.file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(ev.file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button onClick={() => removeEvidenceFile(ev.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                  <Label className="text-xs">Type</Label>
                                  <Select value={ev.type} onValueChange={(v) => updateEvidenceMeta(ev.id, "type", v)}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {EVIDENCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Counterparty Name</Label>
                                  <Input className="h-8 text-xs" placeholder="Optional" value={ev.metadataCounterpartyName} onChange={(e) => updateEvidenceMeta(ev.id, "metadataCounterpartyName", e.target.value)} />
                                </div>
                                <div>
                                  <Label className="text-xs">Related Date</Label>
                                  <Input className="h-8 text-xs" type="date" value={ev.metadataDate} onChange={(e) => updateEvidenceMeta(ev.id, "metadataDate", e.target.value)} />
                                </div>
                                <div>
                                  <Label className="text-xs">Amount (₹)</Label>
                                  <Input className="h-8 text-xs" type="number" placeholder="Optional" value={ev.metadataAmount} onChange={(e) => updateEvidenceMeta(ev.id, "metadataAmount", e.target.value)} />
                                </div>
                              </div>
                              <div className="mt-3">
                                <Label className="text-xs">Notes</Label>
                                <Input className="h-8 text-xs" placeholder="Brief description" value={ev.notes} onChange={(e) => updateEvidenceMeta(ev.id, "notes", e.target.value)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {form.evidenceFiles.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">You can also add evidence later from the case dashboard.</p>
                      )}
                    </>
                  )}

                  {/* ── Step 4: Review & Consent ── */}
                  {step === 4 && (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Case Summary</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <SummaryItem label="Bank" value={form.bankName} />
                          <SummaryItem label="Account" value={form.accountMasked} />
                          <SummaryItem label="Freeze Type" value={form.freezeType.replace("_", " ")} />
                          <SummaryItem label="Freeze Date" value={form.freezeDate} />
                          {form.firNumber && <SummaryItem label="FIR" value={form.firNumber} />}
                          {form.ioName && <SummaryItem label="IO" value={form.ioName} />}
                          <SummaryItem label="Transaction Date" value={form.transactionDate} />
                          <SummaryItem label="Amount" value={`₹${parseFloat(form.transactionAmount).toLocaleString("en-IN")}`} />
                          <SummaryItem label="Sender" value={form.senderName} />
                          <SummaryItem label="Purpose" value={form.purpose} />
                          <SummaryItem label="Relationship" value={form.relationship} />
                          <SummaryItem label="Evidence" value={`${form.evidenceFiles.length} file(s)`} />
                        </div>
                        {form.narrative && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">NARRATIVE</p>
                            <p className="text-sm bg-muted/50 rounded-lg p-3 leading-relaxed">{form.narrative}</p>
                          </div>
                        )}
                      </div>

                      {/* Consent */}
                      <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
                        <div className="flex items-start gap-3">
                          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                          <div>
                            <h3 className="text-sm font-semibold">Consent & Disclaimers</h3>
                            <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                              <p>By checking this box, I confirm that:</p>
                              <p>1. All information and evidence I have provided is true and accurate to the best of my knowledge.</p>
                              <p>2. I understand that DIP does not certify innocence and cannot unfreeze accounts.</p>
                              <p>3. I understand that knowingly false statements or fabricated evidence may have legal consequences.</p>
                              <p>4. I remain solely responsible for the truthfulness of my submission.</p>
                            </div>
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Checkbox id="consent" checked={form.consentGiven} onCheckedChange={(c) => updateField("consentGiven", c === true)} />
                                <label htmlFor="consent" className="text-sm font-medium cursor-pointer">I agree to the above terms</label>
                              </div>
                              {errors.consentGiven && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> {errors.consentGiven}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Checkbox id="terms" checked={form.termsAccepted} onCheckedChange={(c) => updateField("termsAccepted", c === true)} />
                                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                                  I have read and agree to the{" "}
                                  <button type="button" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="underline text-accent">Terms & Conditions</button>
                                  {" "}and{" "}
                                  <button type="button" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} className="underline text-accent">Privacy Policy</button>
                                </label>
                              </div>
                              {errors.termsAccepted && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> {errors.termsAccepted}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={prevStep} disabled={step === 0 || isSubmitting}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.consentGiven || !form.termsAccepted} className="min-w-[140px]">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Submit Case"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1 text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm mt-0.5 capitalize">{value}</p>
    </div>
  );
}
