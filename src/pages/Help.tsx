import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronLeft, Flag, Send, ShieldQuestion, Bug, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ISSUE_TYPES = [
  {
    key: "false_flag",
    icon: ShieldQuestion,
    label: "A result seemed wrong (false flag)",
    blurb: "DIP flagged something that turned out to be legitimate, or missed something concerning.",
  },
  {
    key: "broken_workflow",
    icon: Bug,
    label: "Broken workflow",
    blurb: "A page, button, or form did not work as expected.",
  },
  {
    key: "unsafe_output",
    icon: Flag,
    label: "Unsafe output",
    blurb: "A result, report, or message seemed misleading, alarming, or unsafe.",
  },
  {
    key: "technical",
    icon: Lightbulb,
    label: "Technical problem or suggestion",
    blurb: "Something else — crashes, errors, or an idea for improvement.",
  },
];

const STORAGE_KEY = "dip_issue_reports_v1";

export default function Help() {
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [details, setDetails] = useState("");
  const [reportId, setReportId] = useState("");
  const [noPersonalInfo, setNoPersonalInfo] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const canSubmit = issueType && details.trim().length >= 15 && noPersonalInfo;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const id = `ISSUE-${Date.now().toString(36).toUpperCase()}`;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      // Privacy: store only category, length of report, and optional report ID reference.
      map[id] = {
        type: issueType,
        detailsLength: details.length,
        hasContact: contact.trim().length > 0,
        relatedReportId: reportId.trim() || null,
        at: new Date().toISOString(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* private mode */
    }
    setSubmitted(id);
    toast.success("Issue report recorded locally");
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Thank you — issue recorded</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Reference <span className="font-mono">{submitted}</span>. This prototype stores the
                report only in your current browser session. In a future version, reports will be
                reviewable by the project team.
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <Button onClick={() => navigate("/analyze")}>Start a new analysis</Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight">DIP</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Help</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Report an issue
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Report a false flag, broken workflow, unsafe output, or technical problem. Your report
            helps improve the signal library and the fairness of assessments.
          </p>
        </motion.div>

        <div className="mt-10 space-y-5">
          <section>
            <h2 className="text-sm font-semibold">What kind of issue?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {ISSUE_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setIssueType(t.key)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-accent/50",
                    issueType === t.key && "border-accent/60 ring-1 ring-accent/30",
                  )}
                >
                  <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{t.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="help-details">What happened? (required)</Label>
              <Textarea
                id="help-details"
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the issue. Do not include passwords, OTPs, or other secrets."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="help-report-id">Related report ID (optional)</Label>
                <Input
                  id="help-report-id"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  placeholder="e.g. DIP-XXXXX-XXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="help-contact">Contact (optional)</Label>
                <Input
                  id="help-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email, only if you want a reply"
                />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Privacy note: in this prototype, issue reports are stored only in your current
              browser session and are cleared when you close the tab. Please do not include
              personal details, message content, or account numbers in this form.
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors">
              <Checkbox
                checked={noPersonalInfo}
                onCheckedChange={(v) => setNoPersonalInfo(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium">
                I have not included passwords, OTPs, or sensitive personal information in this report.
              </span>
            </label>
          </section>

          {canSubmit ? (
            <Button onClick={handleSubmit} className="gap-2" size="lg">
              <Send className="h-4 w-4" /> Submit report
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Choose an issue type, describe it (at least 15 characters), and confirm the privacy
              checkbox to submit.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
