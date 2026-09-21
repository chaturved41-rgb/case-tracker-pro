import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Copy,
  Download,
  HelpCircle,
  Loader2,
  MinusCircle,
  Printer,
  RotateCcw,
  ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";
import {
  ASSESSMENT_NOTICE,
  buildReportText,
  CATEGORY_LABELS,
  loadAnalysis,
  PROTOTYPE_LABEL,
  RISK_EXPLANATIONS,
  RISK_LABELS,
  type RiskLevel,
  type TrustAnalysis,
} from "@/lib/trustAnalysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const RISK_STYLES: Record<RiskLevel, { chip: string; Icon: typeof ShieldQuestion }> = {
  low_concern: {
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  needs_verification: {
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Icon: HelpCircle,
  },
  high_concern: {
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    Icon: AlertTriangle,
  },
  unable_to_assess: {
    chip: "border-border bg-muted text-muted-foreground",
    Icon: MinusCircle,
  },
};

const STATUS_HELP: Record<RiskLevel, string> = {
  low_concern:
    "No major warning signals were detected. Delivery or trust is still not guaranteed — verify important requests independently.",
  needs_verification:
    "Signals found deserve a closer look before you trust, reply, pay, or share information.",
  high_concern:
    "Several warning signals were found. Be cautious and do not share secrets or payments.",
  unable_to_assess:
    "There is not enough information to produce a meaningful assessment.",
};

const FEEDBACK_OPTIONS = [
  "Too alarming",
  "Not clear",
  "Missing information",
  "Incorrect result",
  "Technical problem",
] as const;

const FEEDBACK_KEY = "dip_feedback_v1";

function saveFeedback(id: string, helpful: string, detail?: string) {
  try {
    const raw = sessionStorage.getItem(FEEDBACK_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[id] = { helpful, detail, at: new Date().toISOString() };
    sessionStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

export default function AnalysisResult() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<TrustAnalysis | null | "missing">("missing");
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [feedbackDetailOpen, setFeedbackDetailOpen] = useState(false);

  useEffect(() => {
    if (!resultId) {
      setAnalysis("missing");
      return;
    }
    const a = loadAnalysis(resultId);
    setAnalysis(a);
  }, [resultId]);

  if (analysis === "missing") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <CircleAlert className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">Result not available</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This analysis was not found. Results are kept only in your current browser session
                for privacy — starting a new analysis in this tab will bring you back here.
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
      </main>
    );
  }

  if (analysis === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Restoring your result…</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const a: TrustAnalysis = analysis;
  const style = RISK_STYLES[a.riskLevel];
  const reportText = buildReportText(a);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Could not access the clipboard. Try the download button instead.");
    }
  };

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DIP-report-${a.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate("/analyze")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            New analysis
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight">DIP</span>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Status header */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[a.category]}
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <span className={cn("inline-flex items-center gap-2 rounded-xl border px-4 py-1.5 text-xl", style.chip)}>
                <style.Icon className="h-5 w-5" />
                {RISK_LABELS[a.riskLevel]}
              </span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Report ID: <span className="font-mono">{a.id}</span>
          </p>
        </div>

        {a.demo && (
          <p className="mt-4 inline-block rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent">
            Synthetic demonstration data (Demo Mode)
          </p>
        )}

        {/* Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <p className="text-base leading-relaxed">{RISK_EXPLANATIONS[a.riskLevel]}</p>
            <p className="mt-3 text-xs text-muted-foreground">{PROTOTYPE_LABEL}</p>
          </CardContent>
        </Card>

        {/* Warning signals */}
        {a.signals.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Warning signals found</h2>
            <div className="mt-3 space-y-3">
              {a.signals.map((s) => (
                <div key={s.id} className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <span className="shrink-0 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      +{s.points}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.explanation}</p>
                  {s.recommendation && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {s.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Positive signals */}
        {a.positiveSignals.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Positive signals found</h2>
            <div className="mt-3 space-y-3">
              {a.positiveSignals.map((s) => (
                <div key={s.id} className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Recommended next actions</h2>
          <ol className="mt-3 space-y-2">
            {a.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </section>

        {/* Limitations */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">What DIP cannot determine</h2>
          <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-5">
            <ul className="space-y-2">
              {a.limitations.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {ASSESSMENT_NOTICE}
          </p>
        </section>

        {/* Report actions */}
        <section className="mt-8 print:hidden">
          <h2 className="text-lg font-semibold">Generate report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reports redact detected secrets and never include passwords, OTPs, or PINs.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadReport} className="gap-2">
              <Download className="h-4 w-4" /> Download report
            </Button>
            <Button variant="outline" onClick={copySummary} className="gap-2">
              <Copy className="h-4 w-4" /> Copy summary
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </Button>
            <Button onClick={() => navigate("/analyze")} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Start a new analysis
            </Button>
          </div>
        </section>

        {/* Feedback */}
        <section className="mt-8 rounded-2xl border border-border/70 bg-card p-6 print:hidden">
          <h2 className="text-base font-semibold">Was this assessment helpful?</h2>
          {feedbackGiven === null ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { saveFeedback(a.id, "yes"); setFeedbackGiven("yes"); toast.success("Thanks for your feedback"); }}>
                  Yes
                </Button>
                <Button variant="outline" size="sm" onClick={() => { saveFeedback(a.id, "not_sure"); setFeedbackGiven("not_sure"); toast.success("Thanks for your feedback"); }}>
                  Not sure
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setFeedbackGiven("no"); setFeedbackDetailOpen(true); }}>
                  No, report an issue
                </Button>
              </div>
              {feedbackDetailOpen && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">What was wrong?</p>
                  <div className="flex flex-wrap gap-2">
                    {FEEDBACK_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          saveFeedback(a.id, "no", opt);
                          setFeedbackGiven("no");
                          setFeedbackDetailOpen(false);
                          toast.success("Feedback recorded. You can also report this from the Help page.");
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent/50 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Feedback recorded — thank you. {feedbackGiven === "no" && <>You can add details on the <button onClick={() => navigate("/help")} className="underline underline-offset-2">Help page</button>.</>}
            </p>
          )}
        </section>

        {/* Help link */}
        <p className="mt-8 text-center text-xs text-muted-foreground print:hidden">
          Think this result is wrong?{" "}
          <button onClick={() => navigate("/help")} className="underline underline-offset-2 hover:text-foreground">
            Report an incorrect result
          </button>
        </p>
      </article>
    </main>
  );
}
