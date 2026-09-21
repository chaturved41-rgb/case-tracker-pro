import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ChevronLeft,
  Shield,
  ShieldAlert,
  Clock,
  Trash2,
  ServerCrash,
  Scale,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearAllSessionData } from "@/lib/trustAnalysis";

const ACCEPTED = [
  "Message or email text you paste (without secrets)",
  "A website link (URL) you want checked",
  "A platform name, username, or profile link",
  "Payment-request text, method, and amount",
  "Typed text describing what a screenshot says",
];

const NEVER_SUBMIT = [
  "Passwords or password hints",
  "OTPs and one-time codes",
  "Bank PINs and UPI PINs",
  "Private keys and seed phrases",
  "Full payment-card numbers or CVV",
  "Aadhaar, PAN, passport, or other government ID numbers",
];

export default function Privacy() {
  const navigate = useNavigate();

  const handleDeleteData = () => {
    clearAllSessionData();
    toast.success("All local analysis data deleted from this browser session.");
  };

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
          <p className="text-sm font-medium text-accent uppercase tracking-wider">
            Privacy &amp; Safety
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Data handling, explained plainly
          </h1>
          <p className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm leading-relaxed text-muted-foreground">
            DIP is designed to minimize data collection. Submit only the information needed for the
            analysis. Never submit passwords, OTPs, PINs, private keys, full payment-card details,
            or government identification numbers.
          </p>
        </motion.div>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-accent" /> What information DIP accepts
            </h2>
            <ul className="mt-3 space-y-2">
              {ACCEPTED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert className="h-5 w-5 text-destructive" /> What you must never submit
            </h2>
            <ul className="mt-3 space-y-2">
              {NEVER_SUBMIT.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              DIP actively scans submissions for these patterns before analysis and blocks the
              analysis if secrets are detected. Detected values are never stored or transmitted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Why submitted information is analyzed</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Submitted text is analyzed in your browser solely to detect observable warning
              signals and produce the explainable assessment shown on the result page. Nothing is
              profiled, scored for advertising, or shared with anyone.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-accent" /> Whether information is stored, and for how long
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              In the current prototype, analysis results live only in your browser's session
              storage: they exist until you close the tab, are never uploaded to a server, and are
              capped at your 20 most recent analyses. Feedback and issue reports are also stored
              session-only. Registered users who use the separate case-workspace features (frozen
              bank account cases) have their case data stored in the project database under their
              account, protected by authentication, and can delete individual cases from the
              dashboard.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ServerCrash className="h-5 w-5 text-accent" /> Third-party APIs
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The public trust analysis uses no external verification APIs — it is a transparent,
              rule-based engine that runs locally. The separate registered-user workspace uses
              Convex (database and authentication) and Resend (transactional email delivery for
              notifications the user explicitly schedules). No submission from the public
              trust-analysis flow is sent to any third party.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Scale className="h-5 w-5 text-accent" /> Results are not legal proof
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              DIP results are decision support, not legal evidence. This assessment is based only
              on the information provided and available signals. It is not proof of identity,
              intent, or criminal activity. DIP does not determine guilt or innocence. If you
              believe a result is wrong, you can report it from the result page or the{" "}
              <button onClick={() => navigate("/help")} className="underline underline-offset-2">
                Help page
              </button>
              .
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Trash2 className="h-5 w-5 text-destructive" /> Delete my data
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Because prototype analyses never leave your device, deleting your data is immediate
              and complete:
            </p>
            <Card className="mt-4">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium">Clear all local analysis data</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Removes every stored analysis result, feedback entry, and issue report from
                    this browser session.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteData} className="gap-2 shrink-0">
                  <Trash2 className="h-4 w-4" /> Delete my data
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
