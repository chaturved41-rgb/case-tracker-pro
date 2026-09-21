import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Shield,
  Lock,
  Users,
  Lightbulb,
  Target,
  Scale,
  FileText,
} from "lucide-react";

const TARGET_USERS = [
  "Students",
  "Families",
  "First-time internet users",
  "Small businesses",
  "Community support workers",
  "Anyone receiving suspicious digital requests",
];

const PROPOSED_METRICS = [
  "Number of analyses completed",
  "Percentage of users who understand the recommended action",
  "Number of suspicious signals identified",
  "Number of users who avoid submitting sensitive information",
  "Number of reports correctly handled by the workflow",
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
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
          <button
            onClick={() => navigate("/analyze")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Analyze safely
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-medium text-accent uppercase tracking-wider">About</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            DIP — Digital Innocence Protocol
          </h1>
          <p className="mt-2 text-lg font-medium text-accent">"Verify before you trust."</p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A privacy-first digital trust assistant for suspicious messages, links, accounts, and
            online requests — a Trust &amp; Safety Assistant that explains warning signals and
            safer next steps.
          </p>
          <p className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
            DIP does not determine guilt or innocence. It identifies observable digital risk
            signals and helps users make safer decisions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12 space-y-10"
        >
          {/* Project facts */}
          <section className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FileText className="h-5 w-5 text-accent" />
              Project facts
            </h2>
            <dl className="mt-5 space-y-5 text-sm leading-relaxed">
              <div>
                <dt className="font-semibold text-foreground">Problem</dt>
                <dd className="mt-1 text-muted-foreground">
                  People often receive online messages, links, and requests without a simple way to
                  understand whether they contain warning signals.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Solution</dt>
                <dd className="mt-1 text-muted-foreground">
                  DIP provides an explainable, privacy-first assessment before users trust, reply,
                  pay, or share information.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Innovation</dt>
                <dd className="mt-1 text-muted-foreground">
                  DIP combines guided input, transparent risk signals, plain-language explanations,
                  and safer next actions in one workflow. Unlike black-box threat scores, every
                  signal DIP reports is shown with its reason and its weight.
                </dd>
              </div>
            </dl>
          </section>

          {/* Target users */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Users className="h-5 w-5 text-accent" />
              Target users
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {TARGET_USERS.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* Proposed success metrics */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Target className="h-5 w-5 text-accent" />
              Proposed success metrics
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Proposed success metrics — no real user research has been conducted yet; these are
              the measures the prototype is designed to track.
            </p>
            <ul className="mt-4 space-y-2">
              {PROPOSED_METRICS.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {m}
                </li>
              ))}
            </ul>
          </section>

          {/* Positioning */}
          <section className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Scale className="h-5 w-5 text-accent" />
              How DIP is different
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Existing tools often focus on blocking threats or scanning technical indicators.
                DIP is a user-facing explanation and decision-support layer for people who need
                help evaluating suspicious digital interactions.
              </p>
              <p>DIP focuses on helping ordinary users understand:</p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Why something may be risky.</li>
                <li>What evidence or signal caused concern.</li>
                <li>What the user should do next.</li>
                <li>What the system cannot determine.</li>
              </ul>
              <p>
                DIP does not replace antivirus software, email security, browser protection,
                banks, or law enforcement.
              </p>
            </div>
          </section>

          {/* The name, clarified */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Lightbulb className="h-5 w-5 text-accent" />
              About the name
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The project's formal name is <strong className="text-foreground">Digital Innocence
              Protocol</strong>. In everyday use, DIP works as a{" "}
              <strong className="text-foreground">Trust &amp; Safety Assistant</strong>: it helps
              people verify before they trust. The name reflects the original motivation — helping
              ordinary people protect themselves and make defensible decisions online — not any
              claim about legal outcomes.
            </p>
          </section>

          {/* Registered-user workspace */}
          <section className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Lock className="h-5 w-5 text-accent" />
              For registered users: the case workspace
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              DIP also offers an optional, account-based workspace for people whose bank accounts
              were frozen due to a cyber-fraud investigation. It helps them organise evidence,
              generate structured reports, track case timelines, and prepare follow-up
              communication — with strict data minimisation (masked account numbers only, no
              government IDs, no credentials). This workspace is separate from the public trust
              analysis and requires signing in.
            </p>
          </section>

          {/* Limitations & disclaimer */}
          <section className="rounded-2xl bg-muted/50 p-6 text-xs leading-relaxed text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Limitations &amp; disclaimer:</strong> DIP
              provides early-warning and decision-support assessments based only on the
              information available. It does not prove that a website, account, or message is safe
              or unsafe; it does not confirm criminal activity; and it does not replace human
              investigation. Every result carries an explicit statement of what DIP cannot
              determine. Users are responsible for the accuracy of information they submit.
            </p>
            <p>
              The public trust analysis is a transparent, rule-based prototype — not a
              scientifically validated model. Its risk indicator is not a probability of fraud.
            </p>
            <p>
              DIP does not integrate with I4C, NCRP, banks, or police systems in its current
              version.
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/analyze")}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Analyze safely
            </button>
            <button
              onClick={() => navigate("/privacy")}
              className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent/5 transition-colors"
            >
              Privacy &amp; Safety
            </button>
            <button
              onClick={() => navigate("/help")}
              className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent/5 transition-colors"
            >
              Report an issue
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
