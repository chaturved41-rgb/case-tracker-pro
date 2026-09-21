import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Info, Loader2, MessageSquare, Globe, User, Wallet, Image, FlaskConical, ShieldCheck, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import {
  analyzeTrust,
  detectSensitiveData,
  saveAnalysis,
  DEMO_SCENARIOS,
  CATEGORY_LABELS,
  type AnalysisCategory,
  type AnalysisInput,
  type TrustAnalysis,
} from "@/lib/trustAnalysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS: Array<{
  key: AnalysisCategory;
  icon: typeof MessageSquare;
  blurb: string;
}> = [
  { key: "message", icon: MessageSquare, blurb: "Emails, SMS, WhatsApp forwards" },
  { key: "link", icon: Globe, blurb: "A website you were asked to open" },
  { key: "account", icon: User, blurb: "A profile or username that contacted you" },
  { key: "payment", icon: Wallet, blurb: "Someone asking you to pay or transfer" },
  { key: "screenshot", icon: Image, blurb: "Paste what a screenshot says" },
];

const LOADING_STEPS = [
  "Reviewing the submitted information…",
  "Checking for common warning signals…",
  "Preparing an explainable result…",
];

const CONSENT_NOTICE =
  "Do not enter passwords, OTPs, bank PINs, private keys, Aadhaar numbers, card numbers, or other highly sensitive information. By continuing, you agree that DIP will analyze the information you submit for safety signals.";

const EMPTY: AnalysisInput = {
  category: "message",
  senderName: "",
  senderEmail: "",
  messageText: "",
  url: "",
  platform: "",
  username: "",
  profileLink: "",
  description: "",
  paymentMethod: "",
  amount: "",
};

export default function Analyze() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<AnalysisCategory>("message");
  const [input, setInput] = useState<AnalysisInput>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<AnalysisInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const scannedText = useMemo(
    () => [input.messageText, input.description, input.url, input.profileLink].filter(Boolean).join(" "),
    [input.messageText, input.description, input.url, input.profileLink],
  );
  const sensitiveFound = useMemo(() => detectSensitiveData(scannedText), [scannedText]);

  const canContinueFromStep2 = useMemo(() => {
    switch (category) {
      case "message":
        return (input.messageText ?? "").trim().length >= 10;
      case "link":
        return /^https?:\/\/\S+\.\S+/i.test((input.url ?? "").trim());
      case "account":
        return Boolean((input.username ?? "").trim() || (input.profileLink ?? "").trim()) &&
          Boolean((input.platform ?? "").trim() || (input.description ?? "").trim().length >= 10);
      case "payment":
        return (input.messageText ?? "").trim().length >= 10;
      case "screenshot":
        return (input.description ?? "").trim().length >= 10;
    }
  }, [category, input]);

  const invalidUrl =
    category === "link" && (input.url ?? "").trim().length > 0 && !/^https?:\/\//i.test((input.url ?? "").trim());

  const runAnalysis = (override?: AnalysisInput, demo = false) => {
    if (!consent && !demo) {
      setError("Please confirm the safety notice before analyzing.");
      return;
    }
    if (sensitiveFound.length > 0 && !demo) {
      setError("Please remove passwords, OTPs, PINs, and other secrets before continuing.");
      return;
    }
    setAnalyzing(true);
    setLoadingStep(0);
    // Show honest plain-language progress; the engine is local and fast,
    // but the pacing keeps the states visible without faking technical checks.
    const timers = [
      setTimeout(() => setLoadingStep(1), 600),
      setTimeout(() => setLoadingStep(2), 1200),
    ];
    setTimeout(() => {
      timers.forEach(clearTimeout);
      const result = analyzeTrust(override ?? input);
      result.demo = demo;
      saveAnalysis(result);
      setAnalyzing(false);
      navigate(`/result/${result.id}`);
    }, 1800);
  };

  const runDemo = (scenarioKey: "A" | "B" | "C") => {
    const scenario = DEMO_SCENARIOS.find((s) => s.key === scenarioKey);
    if (!scenario) return;
    setCategory(scenario.input.category);
    setInput({ ...EMPTY, ...scenario.input });
    setStep(2);
    runAnalysis({ ...EMPTY, ...scenario.input }, true);
  };

  if (analyzing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <div className="space-y-2">
              {LOADING_STEPS.map((s, i) => (
                <p
                  key={s}
                  className={cn(
                    "text-sm transition-opacity",
                    i <= loadingStep ? "text-foreground" : "text-muted-foreground/40",
                  )}
                >
                  {s}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => (step === 1 ? navigate("/") : setStep(step === 3 ? 2 : 1))}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? "Home" : "Back"}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight">DIP</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Progress */}
        <ol className="mb-10 flex items-center gap-2 text-xs font-medium" aria-label="Progress">
          {["Choose type", "Enter information", "Safety notice"].map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                    active && "border-accent bg-accent text-accent-foreground",
                    done && "border-accent bg-accent/10 text-accent",
                    !active && !done && "border-border text-muted-foreground",
                  )}
                >
                  {n}
                </span>
                <span className={cn("hidden sm:block", active ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {n < 3 && <span className="h-px flex-1 bg-border" />}
              </li>
            );
          })}
        </ol>

        {/* Demo mode */}
        <Card className="mb-8 border-accent/25 bg-accent/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Demo Mode — try it instantly</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Three prepared examples run the full workflow. All examples use synthetic
                  demonstration data — none are real reports.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DEMO_SCENARIOS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => runDemo(s.key)}
                      className="rounded-lg border border-accent/30 bg-card px-3 py-2 text-left text-xs hover:border-accent/60 transition-colors"
                    >
                      <span className="font-semibold">{s.title}</span>
                      <span className="block text-muted-foreground">{s.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1 — category */}
        {step === 1 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What would you like to analyze?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the type of content you want checked for warning signals.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setCategory(opt.key);
                    set({ category: opt.key });
                    setStep(2);
                  }}
                  className={cn(
                    "group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:border-accent/50 hover:shadow-md",
                    category === opt.key && "border-accent/60 ring-1 ring-accent/30",
                  )}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/15">
                    <opt.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{CATEGORY_LABELS[opt.key]}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{opt.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2 — input */}
        {step === 2 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {CATEGORY_LABELS[category]}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Submit only what is needed for the analysis. Nothing is uploaded to a server —
                the assessment runs in your browser.
              </p>
            </div>

            <Card>
              <CardContent className="space-y-5 p-6">
                {category === "message" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="senderName">Sender name (optional)</Label>
                        <Input
                          id="senderName"
                          value={input.senderName}
                          onChange={(e) => set({ senderName: e.target.value })}
                          placeholder="e.g. Unknown number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="senderEmail">Sender email (optional)</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          value={input.senderEmail}
                          onChange={(e) => set({ senderEmail: e.target.value })}
                          placeholder="e.g. offers@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="messageText">Message text</Label>
                      <Textarea
                        id="messageText"
                        rows={6}
                        value={input.messageText}
                        onChange={(e) => set({ messageText: e.target.value })}
                        placeholder="Paste the full message here…"
                      />
                    </div>
                  </>
                )}

                {category === "link" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="url">Website link</Label>
                    <Input
                      id="url"
                      value={input.url}
                      onChange={(e) => set({ url: e.target.value })}
                      placeholder="https://…"
                      inputMode="url"
                    />
                    {invalidUrl && (
                      <p className="text-xs text-destructive">
                        Please enter a complete website link beginning with http:// or https://.
                      </p>
                    )}
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="linkContext">Context (optional)</Label>
                      <Textarea
                        id="linkContext"
                        rows={4}
                        value={input.description}
                        onChange={(e) => set({ description: e.target.value })}
                        placeholder="Where did you get this link? What did the surrounding message say?"
                      />
                    </div>
                  </div>
                )}

                {category === "account" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="platform">Platform</Label>
                        <Input
                          id="platform"
                          value={input.platform}
                          onChange={(e) => set({ platform: e.target.value })}
                          placeholder="e.g. Instagram, Telegram"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={input.username}
                          onChange={(e) => set({ username: e.target.value })}
                          placeholder="e.g. official_sbi_support"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profileLink">Profile link (optional)</Label>
                      <Input
                        id="profileLink"
                        value={input.profileLink}
                        onChange={(e) => set({ profileLink: e.target.value })}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="accountContext">What happened? (optional but helps)</Label>
                      <Textarea
                        id="accountContext"
                        rows={4}
                        value={input.description}
                        onChange={(e) => set({ description: e.target.value })}
                        placeholder="Describe what this account sent or asked you."
                      />
                    </div>
                  </>
                )}

                {category === "payment" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="payText">Payment request text</Label>
                      <Textarea
                        id="payText"
                        rows={6}
                        value={input.messageText}
                        onChange={(e) => set({ messageText: e.target.value })}
                        placeholder="Paste the request exactly as you received it…"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="payMethod">Payment method requested</Label>
                        <Input
                          id="payMethod"
                          value={input.paymentMethod}
                          onChange={(e) => set({ paymentMethod: e.target.value })}
                          placeholder="e.g. UPI, gift card, bank transfer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payAmount">Requested amount (optional)</Label>
                        <Input
                          id="payAmount"
                          value={input.amount}
                          onChange={(e) => set({ amount: e.target.value })}
                          placeholder="e.g. ₹4,999"
                        />
                      </div>
                    </div>
                  </>
                )}

                {category === "screenshot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        This prototype reads typed text only — images are never uploaded or
                        stored. Type or paste what the screenshot says (without secrets) and DIP
                        will assess the text.
                      </span>
                    </div>
                    <Label htmlFor="shotText">What does the screenshot say?</Label>
                    <Textarea
                      id="shotText"
                      rows={6}
                      value={input.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="Type or paste the text visible in the screenshot…"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Change type
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canContinueFromStep2 || invalidUrl}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* Step 3 — consent */}
        {step === 3 && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Safety notice</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                One last check before the analysis runs.
              </p>
            </div>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="text-sm leading-relaxed">{CONSENT_NOTICE}</p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => {
                      setConsent(v === true);
                      setError(null);
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-sm font-medium">
                    I understand and will not submit passwords, OTPs, or highly sensitive secrets.
                  </span>
                </label>
                {sensitiveFound.length > 0 && (
                  <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    We detected what looks like sensitive information ({sensitiveFound.join(", ")})
                    in your submission. Please remove it before continuing.
                  </p>
                )}
                {error && (
                  <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" /> Edit information
              </Button>
              <Button
                onClick={() => runAnalysis()}
                disabled={!consent || sensitiveFound.length > 0}
                className="gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Analyze safely
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
