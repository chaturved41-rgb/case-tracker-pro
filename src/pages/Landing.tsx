import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Shield,
  MessageSquare,
  Globe,
  User,
  Wallet,
  Image as ImageIcon,
  ChevronRight,
  Lock,
  Eye,
  Check,
  FileText,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const analysisTypes = [
  { icon: MessageSquare, label: "Message or email" },
  { icon: Globe, label: "Website link" },
  { icon: User, label: "Account or username" },
  { icon: Wallet, label: "Payment request" },
  { icon: ImageIcon, label: "Screenshot or conversation" },
];

const pillars = [
  {
    icon: FileText,
    title: "Explainable results",
    description:
      "Every assessment lists the exact signals found, why they matter, and what DIP cannot determine.",
  },
  {
    icon: Lock,
    title: "Privacy-first design",
    description:
      "Analyses run in your browser. Results stay in your current session — nothing is uploaded to a server.",
  },
  {
    icon: Check,
    title: "No passwords or OTPs required",
    description:
      "DIP never asks for credentials. Sensitive data is actively detected and blocked before analysis.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight">DIP</span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Trust &amp; Safety Assistant
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => navigate("/how-it-works")}
              className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block"
            >
              How it works
            </button>
            <button
              onClick={() => navigate("/privacy")}
              className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate("/analyze")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Analyze safely
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1.5 text-xs font-medium text-accent">
              <Shield className="h-3.5 w-3.5" />
              DIP — Digital Innocence Protocol · Verify before you trust.
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Verify before
              <br />
              <span className="text-accent">you trust.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              DIP analyzes suspicious digital messages, links, accounts, and requests to identify
              warning signals and explain what you should do next.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/analyze")}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Analyze safely
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate("/how-it-works")}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-card-foreground hover:bg-accent/5 transition-colors"
              >
                See how it works
              </button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Explainable results", "Privacy-first design", "No passwords or OTPs required"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-accent" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Why digital trust is difficult ── */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-medium text-accent uppercase tracking-wider">
                The problem
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Digital trust is hard — and the stakes keep rising
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  People often receive online messages, links, and requests without a simple way to
                  understand whether they contain warning signals. Scams create urgency, impersonate
                  trusted brands, and pressure people into acting before they can verify anything.
                </p>
                <p>
                  Existing tools focus on blocking threats or scanning technical indicators. But
                  when a confusing message arrives, an ordinary person is left alone with three
                  questions: <em className="text-foreground">Is this risky? Why? What should I do?</em>
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What a user is usually shown
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-muted-foreground line-through decoration-destructive/60">
                  "Blocklisted domain. Threat score 87/100."
                </div>
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                  <p className="font-semibold">What DIP shows instead</p>
                  <p className="mt-1 text-muted-foreground">
                    "The message creates urgency and the link does not match the sender's claimed
                    organisation. Here is what to check — and what DIP cannot confirm."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How DIP works ── */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-sm font-medium text-accent uppercase tracking-wider">How DIP works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Four steps to a safer decision</h2>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Submit only what's needed",
                desc: "Pick a category and add the message, link, or account — never secrets.",
              },
              {
                step: "2",
                title: "DIP checks warning signals",
                desc: "A transparent rule engine looks for known risk patterns, fully explainable.",
              },
              {
                step: "3",
                title: "DIP explains the assessment",
                desc: "Each signal comes with its reason, its weight, and honest limitations.",
              },
              {
                step: "4",
                title: "You decide the next action",
                desc: "Clear recommendations help you verify, avoid, report, or proceed with caution.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border/70 bg-card p-6"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported analysis types ── */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">
              Supported analyses
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Five kinds of suspicious content
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {analysisTypes.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-background p-6 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <t.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{t.label}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate("/analyze")}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Try Demo Mode — no signup needed
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Three synthetic examples run the full workflow in under a minute.
            </p>
          </div>
        </div>
      </section>

      {/* ── Privacy promise ── */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-2xl border border-accent/20 bg-accent/5 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Our privacy promise</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  DIP is designed to minimize data collection. Submit only the information needed
                  for the analysis. Never submit passwords, OTPs, PINs, private keys, full
                  payment-card details, or government identification numbers.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    Analysis runs locally in your browser — submissions are not uploaded.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    Results are stored only for your current session and disappear when you close
                    the tab.
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    DIP does not determine guilt or innocence. It identifies observable digital
                    risk signals and helps users make safer decisions.
                  </li>
                </ul>
                <button
                  onClick={() => navigate("/privacy")}
                  className="mt-5 text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  Read the full Privacy &amp; Safety policy →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Example result ── */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-medium text-accent uppercase tracking-wider">
              Example result
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              What an assessment looks like
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              Synthetic demonstration data — not a real report.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-10 max-w-2xl rounded-2xl border border-destructive/25 bg-card p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-1.5 text-sm font-semibold text-destructive">
                <Shield className="h-4 w-4" />
                High concern
              </span>
              <span className="text-xs text-muted-foreground">Message or email</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              This submission contains several warning signals that require caution.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {[
                "The message requests sensitive information.",
                "It creates urgency to act immediately.",
                "It promises an unexpected prize.",
              ].map((s) => (
                <div key={s} className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  {s}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Recommended: Do not share OTPs or payment details. Verify through the organisation's
              official website or phone number. DIP cannot confirm the sender's true identity or
              determine intent from this information alone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Received something suspicious?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Get an explainable assessment before you trust, reply, pay, or share information.
            </p>
            <button
              onClick={() => navigate("/analyze")}
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Analyze safely
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
              D
            </div>
            © 2026 DIP — Digital Innocence Protocol
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <button onClick={() => navigate("/how-it-works")} className="hover:text-foreground transition-colors">
              How it works
            </button>
            <button onClick={() => navigate("/help")} className="hover:text-foreground transition-colors">
              Help
            </button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">
              Privacy
            </button>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">
              Terms
            </button>
            <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">
              About
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
