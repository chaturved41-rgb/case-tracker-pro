import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ChevronLeft,
  Clock,
  FileText,
  Shield,
  Check,
  AlertTriangle,
  Download,
  Send,
  MessageSquare,
  LogOut,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  Mail,
  Eye,
  EyeOff,
  CalendarClock,
  X,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  History,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  responded: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  unknown: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800",
};

const FREEZE_LABELS: Record<string, string> = {
  lien: "Lien",
  debit_freeze: "Debit Freeze",
  full_freeze: "Full Freeze",
};

const CHECK_ICONS: Record<string, typeof Check> = {
  pass: CheckCircle2,
  warning: AlertCircle,
  fail: XCircle,
};

const CHECK_COLORS: Record<string, string> = {
  pass: "text-emerald-500",
  warning: "text-amber-500",
  fail: "text-red-500",
};

const TIMELINE_ICONS: Record<string, typeof Clock> = {
  case_created: FileText,
  evidence_uploaded: FileText,
  report_generated: FileText,
  dispatch_simulated: Send,
  escalation_draft_created: MessageSquare,
  response_recorded: MessageSquare,
  status_updated: Check,
  user_note: AlertCircle,
};

const ESCALATION_TARGETS = [
  { value: "bank_nodal", label: "Bank Nodal Officer" },
  { value: "bank_grievance", label: "Bank Grievance Officer" },
  { value: "sp_office", label: "SP / Police Office" },
  { value: "rbi_ombudsman", label: "RBI Ombudsman" },
];

const RESPONSE_ACTORS = [
  { value: "bank_nodal", label: "Bank Nodal Officer" },
  { value: "io", label: "Investigating Officer" },
  { value: "sp_office", label: "SP Office" },
  { value: "other", label: "Other" },
];

const RESPONSE_MODES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Call" },
  { value: "letter", label: "Letter" },
  { value: "in_person", label: "In Person" },
];

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const caseData = useQuery(
    api.cases.get,
    caseId ? { caseId: caseId as any } : "skip",
  );
  const updateCase = useMutation(api.cases.update);
  const recordDispatch = useMutation(api.cases.recordDispatch);
  const createEscalation = useMutation(api.cases.createEscalation);
  const recordResponse = useMutation(api.cases.recordResponse);
  const addNote = useMutation(api.cases.addNote);

  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [dispatchTargets, setDispatchTargets] = useState<string[]>([]);
  const [dispatchNote, setDispatchNote] = useState("");

  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false);
  const [escalationTarget, setEscalationTarget] = useState("");
  const [escalationDraft, setEscalationDraft] = useState("");

  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseActor, setResponseActor] = useState("");
  const [responseMode, setResponseMode] = useState("");
  const [responseSummary, setResponseSummary] = useState("");
  const [responseDate, setResponseDate] = useState("");

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Notifications
  const caseNotifications = useQuery(
    api.notifications.list,
    caseId ? { caseId: caseId as any } : "skip",
  );
  const markNotifRead = useMutation(api.notifications.markRead);
  const markAllNotifsRead = useMutation(api.notifications.markAllRead);

  // Email schedules
  const emailSchedules = useQuery(
    api.emailSchedules.listSchedules,
    caseId ? { caseId: caseId as any } : "skip",
  );
  const emailTemplates = useQuery(
    api.emailSchedules.getTemplates,
    caseId ? { caseId: caseId as any } : "skip",
  );
  const deliveryLog = useQuery(
    api.emailSchedules.listDeliveryLog,
    caseId ? { caseId: caseId as any } : "skip",
  );
  const createSchedule = useMutation(api.emailSchedules.createSchedule);
  const cancelSchedule = useMutation(api.emailSchedules.cancelSchedule);
  const pauseSchedule = useMutation(api.emailSchedules.pauseSchedule);
  const resumeSchedule = useMutation(api.emailSchedules.resumeSchedule);
  const sendTestEmailNow = useMutation(api.emailSchedules.sendTestEmailNow);

  // Email processor actions
  const healthCheck = useAction(api.emailProcessor.healthCheck);
  const processDue = useAction(api.emailProcessor.processDueSchedules);

  // Email UI state
  const [emailHealth, setEmailHealth] = useState<null | { configured: boolean; senderConfigured: boolean; safeError?: string }>(null);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<null | { success: boolean; message: string }>(null);
  const [demoProcessing, setDemoProcessing] = useState(false);
  const [demoResult, setDemoResult] = useState<null | { found: number; accepted: number; failed: number }>(null);
  const [externalConfirmed, setExternalConfirmed] = useState(false);
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(false);

  const [automateDialogOpen, setAutomateDialogOpen] = useState(false);
  const [scheduleRecipient, setScheduleRecipient] = useState("");
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleInterval, setScheduleInterval] = useState("0");
  const [scheduleMaxSends, setScheduleMaxSends] = useState("3");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (caseData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Case not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/cases")}>
            Back to cases
          </Button>
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────
  const handleDispatch = async () => {
    if (dispatchTargets.length === 0) return;
    try {
      await recordDispatch({
        caseId: caseId as any,
        targets: dispatchTargets,
        note: dispatchNote || undefined,
      });
      toast.success("Dispatch recorded");
      setDispatchDialogOpen(false);
      setDispatchTargets([]);
      setDispatchNote("");
    } catch {
      toast.error("Failed to record dispatch");
    }
  };

  const handleEscalation = async () => {
    if (!escalationTarget || !escalationDraft.trim()) return;
    try {
      await createEscalation({
        caseId: caseId as any,
        target: escalationTarget,
        draftText: escalationDraft,
      });
      toast.success("Escalation draft saved");
      setEscalationDialogOpen(false);
      setEscalationTarget("");
      setEscalationDraft("");
    } catch {
      toast.error("Failed to save escalation draft");
    }
  };

  const handleResponse = async () => {
    if (!responseActor || !responseMode || !responseSummary.trim() || !responseDate) return;
    try {
      await recordResponse({
        caseId: caseId as any,
        fromActor: responseActor,
        mode: responseMode,
        summary: responseSummary,
        responseDate,
      });
      toast.success("Response recorded");
      setResponseDialogOpen(false);
      setResponseActor("");
      setResponseMode("");
      setResponseSummary("");
      setResponseDate("");
    } catch {
      toast.error("Failed to record response");
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote({ caseId: caseId as any, description: noteText });
      toast.success("Note added");
      setNoteDialogOpen(false);
      setNoteText("");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateCase({ caseId: caseId as any, resolutionStatus: status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const downloadJson = () => {
    if (!caseData.reports.length) return;
    const latest = caseData.reports.sort((a, b) => b.version - a.version)[0];
    const blob = new Blob([latest.reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DIP-Report-${caseData.bankName}-${caseData.accountMasked}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateEscalationDraft = (target: string) => {
    const templates: Record<string, string> = {
      bank_nodal: `Subject: Request for Review – Account Freeze (Cyber Fraud Investigation)\n\nTo,\nThe Nodal Officer\n${caseData.bankName}\n\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nRespected Sir/Madam,\n\nI am writing to bring to your attention that my savings account (ending ${caseData.accountMasked}) at ${caseData.bankName} has been frozen since ${caseData.freezeDate}.\n\nI wish to state that I am a genuine account holder and the disputed transaction of ₹${caseData.transactionAmount.toLocaleString("en-IN")} from ${caseData.senderName} was a legitimate ${caseData.purpose} transaction.\n\nI kindly request you to:\n1. Review the evidence provided\n2. Share the specific complaint or investigation reference\n3. Consider unfreezing my account\n\nThank you for your time.\n\nYours sincerely,\n[Your Name]\nAccount: ${caseData.accountMasked}`,
      bank_grievance: `Subject: Grievance – Prolonged Account Freeze\n\nTo,\nThe Grievance Officer\n${caseData.bankName}\n\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nRespected Sir/Madam,\n\nI wish to formally register a grievance regarding the continued freeze on my account (ending ${caseData.accountMasked}) since ${caseData.freezeDate}.\n\nDespite my account being frozen, I have not received adequate communication regarding the investigation status.\n\nI request that you:\n1. Provide a written explanation\n2. Share the timeline for resolution\n3. Consider the evidence I have submitted\n\nYours sincerely,\n[Your Name]`,
      sp_office: `Subject: Representation Regarding Frozen Bank Account\n\nTo,\nThe Station House Officer\n${caseData.policeStationName || "[Police Station]"}\n\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nRespected Sir/Madam,\n\nMy bank account has been frozen in connection with a cyber fraud investigation. I wish to present my evidence.\n\nDetails:\n- Bank: ${caseData.bankName}\n- Account: ${caseData.accountMasked}\n- Freeze date: ${caseData.freezeDate}\n${caseData.firNumber ? `- FIR: ${caseData.firNumber}` : ""}\n\nThe disputed transaction of ₹${caseData.transactionAmount.toLocaleString("en-IN")} was a legitimate ${caseData.purpose} transaction.\n\nI respectfully request an opportunity to present my evidence.\n\nYours sincerely,\n[Your Name]`,
      rbi_ombudsman: `Subject: Complaint to Banking Ombudsman\n\nTo,\nThe Banking Ombudsman\n[Applicable RBI Office]\n\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nRespected Sir/Madam,\n\nI wish to file a complaint regarding the unreasonable freeze on my bank account.\n\nDetails:\n- Bank: ${caseData.bankName}\n- Account: ${caseData.accountMasked}\n- Frozen since: ${caseData.freezeDate}\n- Disputed amount: ₹${caseData.transactionAmount.toLocaleString("en-IN")}\n\nThe bank has not provided adequate explanation or resolution.\n\nI request the Banking Ombudsman to direct the bank to review the evidence.\n\nYours sincerely,\n[Your Name]`,
    };
    return templates[target] || "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/cases")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            My Cases
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              D
            </div>
            <span className="font-semibold tracking-tight hidden sm:inline">
              {caseData.bankName} • {caseData.accountMasked}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Summary Card */}
          <Card className="border-border/70 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{caseData.bankName}</h1>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[caseData.resolutionStatus] || STATUS_COLORS.unknown}
                    >
                      {caseData.resolutionStatus.charAt(0).toUpperCase() + caseData.resolutionStatus.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    Account: {caseData.accountMasked} • {FREEZE_LABELS[caseData.freezeType] || caseData.freezeType} since {caseData.freezeDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={caseData.resolutionStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Key details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border/60">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Disputed Amount</p>
                  <p className="text-lg font-semibold mt-0.5">₹{caseData.transactionAmount.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sender</p>
                  <p className="text-sm font-medium mt-0.5">{caseData.senderName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Transaction Date</p>
                  <p className="text-sm mt-0.5">{caseData.transactionDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Purpose</p>
                  <p className="text-sm mt-0.5 capitalize">{caseData.purpose}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence & Reports row */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Evidence */}
            <Card className="border-border/70 md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  Evidence ({caseData.evidenceItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.evidenceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evidence uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {caseData.evidenceItems.map((ev) => (
                      <div key={ev._id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                          {ev.fileNameOriginal.split(".").pop()?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{ev.fileNameOriginal}</p>
                          <p className="text-xs text-muted-foreground">
                            {ev.type.replace(/_/g, " ")} • {(ev.fileSizeBytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reports & Checks */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download */}
                {caseData.reports.length > 0 ? (
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={downloadJson}>
                    <Download className="h-4 w-4" />
                    Download JSON Report
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No report generated yet.</p>
                )}

                {/* Consistency checks */}
                {caseData.consistencyChecks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Consistency Checks
                    </p>
                    <div className="space-y-2">
                      {caseData.consistencyChecks.map((ck) => {
                        const Icon = CHECK_ICONS[ck.result] || AlertCircle;
                        return (
                          <div key={ck._id} className="rounded-lg border border-border/60 p-2.5">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-3.5 w-3.5 ${CHECK_COLORS[ck.result] || "text-muted-foreground"}`} />
                              <span className="text-xs font-medium capitalize">
                                {ck.checkType.replace(/_/g, " ")}
                              </span>
                              <Badge variant="outline" className={`ml-auto text-[10px] ${CHECK_COLORS[ck.result]}`}>
                                {ck.result}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ck.details}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Narrative */}
          {caseData.narrative && (
            <Card className="border-border/70 mb-6">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Narrative</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{caseData.narrative}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Timeline, Dispatch, Escalations, Responses */}
          <Tabs defaultValue="timeline" className="mb-8">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="timeline" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="dispatch" className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Dispatch
              </TabsTrigger>
              <TabsTrigger value="escalations" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Escalations
              </TabsTrigger>
              <TabsTrigger value="responses" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Responses
              </TabsTrigger>
              <TabsTrigger value="automate" className="gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Automate
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Notifications
                {caseNotifications && caseNotifications.filter((n: any) => !n.isRead).length > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {caseNotifications.filter((n: any) => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Case Timeline</h3>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNoteDialogOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add Note
                    </Button>
                  </div>
                  {caseData.timelineEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events yet.</p>
                  ) : (
                    <div className="relative ml-3 border-l-2 border-border/60 pl-6 space-y-6">
                      {caseData.timelineEvents.map((ev) => {
                        const Icon = TIMELINE_ICONS[ev.eventType] || Clock;
                        return (
                          <div key={ev._id} className="relative">
                            <div className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-border/60">
                              <Icon className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">{ev.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(ev.createdAt).toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dispatch Tab */}
            <TabsContent value="dispatch">
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Dispatch & Sharing</h3>
                    <Button size="sm" className="gap-1.5" onClick={() => setDispatchDialogOpen(true)}>
                      <Send className="h-3.5 w-3.5" />
                      Record Dispatch
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Record when you share your DIP report with bank officers, investigating officers, or other authorities.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Status: {caseData.statusDispatched ? (
                      <span className="text-emerald-600 font-medium">Report has been dispatched</span>
                    ) : (
                      <span className="text-muted-foreground">Not yet dispatched</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Escalations Tab */}
            <TabsContent value="escalations">
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Escalation Drafts</h3>
                    <Button size="sm" className="gap-1.5" onClick={() => setEscalationDialogOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      New Draft
                    </Button>
                  </div>
                  {caseData.escalationDrafts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No escalation drafts yet. Generate a draft letter to send to authorities.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {caseData.escalationDrafts.map((draft) => (
                        <div key={draft._id} className="rounded-lg border border-border/60 p-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">
                              {draft.target.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(draft.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <pre className="mt-3 text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-40 overflow-auto">
                            {draft.draftText}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Responses Tab */}
            <TabsContent value="responses">
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Recorded Responses</h3>
                    <Button size="sm" className="gap-1.5" onClick={() => setResponseDialogOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Record Response
                    </Button>
                  </div>
                  {caseData.responses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No responses recorded yet. Log any communication from authorities here.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {caseData.responses.map((resp) => (
                        <div key={resp._id} className="rounded-lg border border-border/60 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {resp.fromActor.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">via {resp.mode}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{resp.responseDate}</span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{resp.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Automate Emails Tab ── */}
            <TabsContent value="automate">
              <div className="space-y-4">
                {/* Provider Status Card */}
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${emailHealth?.configured ? "bg-emerald-500" : emailHealth ? "bg-amber-500" : "bg-muted animate-pulse"}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {emailHealth === null ? "Checking email provider..." :
                             emailHealth.configured ? "Email delivery configured" : "Email delivery setup required"}
                          </p>
                          {emailHealth?.safeError && (
                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{emailHealth.safeError}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
                        try {
                          const result = await healthCheck();
                          setEmailHealth(result);
                        } catch { setEmailHealth({ configured: false, senderConfigured: false, safeError: "Could not check provider status." }); }
                      }}>
                        <RefreshCw className="h-3.5 w-3.5" /> Check Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Email Card */}
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">Send Test Email</p>
                        <p className="text-xs text-muted-foreground">Sends a real email to verify your delivery setup works.</p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={testEmailSending || !user?.email}
                        onClick={async () => {
                          if (!caseId || !user?.email) return;
                          setTestEmailSending(true);
                          setTestEmailResult(null);
                          try {
                            await sendTestEmailNow({ caseId: caseId as any, recipientEmail: user.email });
                            const procResult = await processDue();
                            if (procResult.accepted > 0) {
                              setTestEmailResult({ success: true, message: `Test email accepted by provider. Check Inbox, Spam, Promotions and All Mail.` });
                            } else if (procResult.failed > 0) {
                              setTestEmailResult({ success: false, message: `Email could not be sent. Check your RESEND_API_KEY and EMAIL_FROM settings.` });
                            } else {
                              setTestEmailResult({ success: false, message: `No schedules were processed. Check email configuration.` });
                            }
                          } catch (e: any) {
                            setTestEmailResult({ success: false, message: e?.message || "Failed to send test email." });
                          } finally {
                            setTestEmailSending(false);
                          }
                        }}
                      >
                        {testEmailSending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : <><Mail className="h-3.5 w-3.5" /> Send Test Email</>}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Recipient: {user?.email || "(log in required)"} • Test mode — sends only to your own email.</p>
                    {testEmailResult && (
                      <div className={`mt-3 rounded-lg border p-3 text-xs ${testEmailResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"}`}>
                        {testEmailResult.message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Run Due Scheduled Emails Now (Demo) */}
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Run Due Scheduled Emails Now (Demo)</p>
                        <p className="text-xs text-muted-foreground">Preview/demo environments may not run background jobs continuously. This button runs the same scheduled-email processor manually.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={demoProcessing}
                        onClick={async () => {
                          setDemoProcessing(true);
                          setDemoResult(null);
                          try {
                            const result = await processDue();
                            setDemoResult(result);
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to process schedules.");
                          } finally {
                            setDemoProcessing(false);
                          }
                        }}
                      >
                        {demoProcessing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</> : <><RefreshCw className="h-3.5 w-3.5" /> Run Now</>}
                      </Button>
                    </div>
                    {demoResult && (
                      <div className="mt-3 rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                        Found {demoResult.found} due schedule(s) • {demoResult.accepted} accepted by provider • {demoResult.failed} failed
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Schedules List */}
                <Card className="border-border/70">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold">Email Schedules</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Schedule follow-up emails to bank officers, police, and others</p>
                      </div>
                      <Button size="sm" className="gap-1.5" onClick={() => setAutomateDialogOpen(true)}>
                        <Plus className="h-3.5 w-3.5" /> New Schedule
                      </Button>
                    </div>

                    {emailSchedules === undefined ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : emailSchedules.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No email schedules yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Set up automated follow-ups to stay on top of your case.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {emailSchedules.map((sch: any) => (
                          <div key={sch._id} className="rounded-lg border border-border/60 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="capitalize text-[10px]">{sch.recipientType.replace(/_/g, " ")}</Badge>
                                  <Badge variant="outline" className={`text-[10px] ${sch.active && !sch.paused ? "bg-emerald-50 text-emerald-700" : sch.paused ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                                    {sch.paused ? "Paused" : sch.active ? "Active" : "Done"}
                                  </Badge>
                                  {sch.testMode && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">Test</Badge>}
                                  {sch.lastError && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700">Error</Badge>}
                                </div>
                                <p className="text-sm mt-1.5">To: <span className="font-medium">{sch.recipientEmail}</span></p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Sent {sch.sendsCount}/{sch.maxSends === -1 ? "∞" : sch.maxSends} times
                                  {sch.intervalDays > 0 ? ` • Every ${sch.intervalDays} days` : " • Once"}
                                </p>
                                {sch.lastError && (
                                  <p className="text-xs text-red-600 mt-1">Last error: {sch.lastError}</p>
                                )}
                                {sch.lastProviderMessageId && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">Last ID: {sch.lastProviderMessageId}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-3">
                                {sch.active && !sch.paused && (
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600" onClick={async () => { await pauseSchedule({ scheduleId: sch._id }); toast.success("Schedule paused"); }}>
                                    <Pause className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {sch.active && sch.paused && (
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600" onClick={async () => { await resumeSchedule({ scheduleId: sch._id }); toast.success("Schedule resumed"); }}>
                                    <Play className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {sch.active && (
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={async () => { await cancelSchedule({ scheduleId: sch._id }); toast.success("Schedule cancelled"); }}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery History */}
                <Card className="border-border/70">
                  <CardContent className="p-4">
                    <button className="flex items-center gap-2 text-sm font-medium w-full" onClick={() => setShowDeliveryHistory(!showDeliveryHistory)}>
                      <History className="h-4 w-4" />
                      Delivery History {deliveryLog ? `(${deliveryLog.length})` : ""}
                      <ChevronLeft className={`h-4 w-4 ml-auto transition-transform ${showDeliveryHistory ? "rotate-[-90deg]" : "rotate-[-270deg]"}`} />
                    </button>
                    {showDeliveryHistory && (
                      <div className="mt-4">
                        {deliveryLog === undefined ? (
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : deliveryLog.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No emails sent yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/60">
                                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Time</th>
                                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Recipient</th>
                                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Subject</th>
                                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Status</th>
                                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Message ID</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deliveryLog.map((log: any) => (
                                  <tr key={log._id} className="border-b border-border/30">
                                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                                      {new Date(log.completedAt || log.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                                    </td>
                                    <td className="py-2 pr-3">
                                      <span className="capitalize">{log.recipientType.replace(/_/g, " ")}</span>
                                      <span className="text-muted-foreground ml-1">{log.recipientEmail}</span>
                                    </td>
                                    <td className="py-2 pr-3 truncate max-w-[200px] text-muted-foreground">{log.subject}</td>
                                    <td className="py-2 pr-3">
                                      <Badge variant="outline" className={`text-[10px] ${
                                        log.status === "accepted_by_provider" ? "bg-emerald-50 text-emerald-700" : 
                                        log.status === "failed" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"
                                      }`}>
                                        {log.status.replace(/_/g, " ")}
                                      </Badge>
                                      {log.testMode && <Badge variant="outline" className="text-[9px] ml-1 bg-blue-50 text-blue-700">test</Badge>}
                                    </td>
                                    <td className="py-2 pr-3 font-mono text-[10px] text-muted-foreground">
                                      {log.providerMessageId || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Notifications Tab ── */}
            <TabsContent value="notifications">
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {caseNotifications && caseNotifications.some((n: any) => !n.isRead) && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => { await markAllNotifsRead({ caseId: caseId as any }); toast.success("All marked as read"); }}>
                        <Eye className="h-3.5 w-3.5" /> Mark all read
                      </Button>
                    )}
                  </div>

                  {caseNotifications === undefined ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : caseNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {caseNotifications.map((n: any) => (
                        <div
                          key={n._id}
                          className={`rounded-lg border p-4 transition-colors ${!n.isRead ? "border-accent/30 bg-accent/5" : "border-border/60"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{n.subject}</p>
                                {!n.isRead && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5">
                                {new Date(n.sentAt).toLocaleString("en-IN")} • {n.channel}
                              </p>
                            </div>
                            {!n.isRead && (
                              <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0" onClick={async () => { await markNotifRead({ notificationId: n._id }); }}>
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-xl mb-8">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              DIP does not certify innocence, cannot unfreeze accounts, and does not
              integrate with banks or police systems. You are responsible for the
              truthfulness of your submissions.
            </span>
          </div>
        </motion.div>
      </main>

      {/* ── Dispatch Dialog ── */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Dispatch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select who you shared your report with:
            </p>
            <div className="space-y-2">
              {["Bank Nodal Officer", "Investigating Officer", "Bank Branch Manager", "Other"].map(
                (target) => (
                  <label key={target} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dispatchTargets.includes(target)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDispatchTargets([...dispatchTargets, target]);
                        } else {
                          setDispatchTargets(dispatchTargets.filter((t) => t !== target));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{target}</span>
                  </label>
                ),
              )}
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Any additional notes about this dispatch..."
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDispatch} disabled={dispatchTargets.length === 0}>
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Escalation Dialog ── */}
      <Dialog open={escalationDialogOpen} onOpenChange={setEscalationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Escalation Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target</Label>
              <Select
                value={escalationTarget}
                onValueChange={(v) => {
                  setEscalationTarget(v);
                  const draft = generateEscalationDraft(v);
                  if (draft) setEscalationDraft(draft);
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select escalation target" />
                </SelectTrigger>
                <SelectContent>
                  {ESCALATION_TARGETS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Draft Letter</Label>
              <Textarea
                placeholder="Select a target above to auto-generate a draft, or write your own..."
                value={escalationDraft}
                onChange={(e) => setEscalationDraft(e.target.value)}
                rows={12}
                className="mt-1.5 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEscalation} disabled={!escalationTarget || !escalationDraft.trim()}>
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Response Dialog ── */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <Select value={responseActor} onValueChange={setResponseActor}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_ACTORS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={responseMode} onValueChange={setResponseMode}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={responseDate}
                onChange={(e) => setResponseDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea
                placeholder="Describe what was communicated..."
                value={responseSummary}
                onChange={(e) => setResponseSummary(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResponse}
              disabled={!responseActor || !responseMode || !responseSummary.trim() || !responseDate}
            >
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Note Dialog ── */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timeline Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add a note to the case timeline..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Automate Emails Dialog ── */}
      <Dialog open={automateDialogOpen} onOpenChange={setAutomateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Schedule Automated Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient Type</Label>
              <Select value={scheduleRecipient} onValueChange={(v) => {
                setScheduleRecipient(v);
                // Auto-select template
                if (emailTemplates) {
                  const tmpl = emailTemplates.find((t: any) => t.recipientType === v);
                  if (tmpl) setSelectedTemplate(JSON.stringify(tmpl));
                }
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_test">My Own Email (Test)</SelectItem>
                  <SelectItem value="bank_manager">Bank Branch Manager</SelectItem>
                  <SelectItem value="bank_nodal">Bank Nodal Officer</SelectItem>
                  <SelectItem value="police_io">Investigating Officer / Police</SelectItem>
                  <SelectItem value="cyber_cell">Cyber Cell</SelectItem>
                  <SelectItem value="custom">Custom Recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Send Interval</Label>
                <Select value={scheduleInterval} onValueChange={setScheduleInterval}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Send once now</SelectItem>
                    <SelectItem value="7">Repeat every 7 days</SelectItem>
                    <SelectItem value="14">Repeat every 14 days</SelectItem>
                    <SelectItem value="30">Repeat every 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Sends</Label>
                <Select value={scheduleMaxSends} onValueChange={setScheduleMaxSends}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 time</SelectItem>
                    <SelectItem value="3">3 times</SelectItem>
                    <SelectItem value="5">5 times</SelectItem>
                    <SelectItem value="-1">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedTemplate && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Preview</p>
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-40 overflow-auto">
                  {(() => { try { const tmpl = JSON.parse(selectedTemplate); return `Subject: ${tmpl.subject}\n\n${tmpl.body}`; } catch { return ''; } })()}
                </pre>
              </div>
            )}
            {scheduleRecipient && scheduleRecipient !== "self_test" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:bg-amber-950 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">⚠️ For hackathon use, choose your own email or a controlled test inbox. Do not send repeated messages to real banks, police stations or government addresses without explicit permission.</p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={externalConfirmed} onChange={(e) => setExternalConfirmed(e.target.checked)} className="mt-0.5 rounded" />
                  <span className="text-xs text-amber-700 dark:text-amber-300">I confirm that I have verified this recipient address and have authority to send this communication.</span>
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutomateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const email = scheduleRecipient === "self_test" ? (user?.email || scheduleEmail.trim()) : scheduleEmail.trim();
                if (!scheduleRecipient || !email) return;
                if (scheduleRecipient !== "self_test" && !externalConfirmed) {
                  toast.error("Please confirm the recipient address.");
                  return;
                }
                try {
                  let subject = "Follow-up regarding account " + caseData.accountMasked;
                  let body = "Default follow-up email body.";
                  if (selectedTemplate) {
                    try {
                      const tmpl = JSON.parse(selectedTemplate);
                      subject = tmpl.subject;
                      body = tmpl.body;
                    } catch { /* use defaults */ }
                  }
                  await createSchedule({
                    caseId: caseId as any,
                    recipientType: scheduleRecipient,
                    recipientEmail: email,
                    subjectTemplate: subject,
                    bodyTemplate: body,
                    intervalDays: parseInt(scheduleInterval),
                    maxSends: parseInt(scheduleMaxSends),
                    sendImmediately: true,
                  });
                  toast.success("Email schedule created");
                  setAutomateDialogOpen(false);
                  setScheduleRecipient("");
                  setScheduleEmail("");
                  setExternalConfirmed(false);
                } catch (e) {
                  toast.error("Failed to create schedule");
                }
              }}
              disabled={!scheduleRecipient || !(scheduleRecipient === "self_test" ? user?.email : scheduleEmail.trim()) || (scheduleRecipient !== "self_test" && !externalConfirmed)}
            >
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
