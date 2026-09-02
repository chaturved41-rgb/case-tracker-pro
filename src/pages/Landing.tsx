import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import {
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  ChevronRight,
  Lock,
  Eye,
  BarChart3,
  Mail,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: FileText,
    title: "Structured Evidence Reports",
    description:
      "Auto-generate machine-readable and human-readable reports from your evidence. Consistent, professional, ready to share.",
  },
  {
    icon: Clock,
    title: "Case Timeline Tracking",
    description:
      "Track every milestone — from first report to follow-ups at Day 7, 30, and 90. Never lose sight of what's next.",
  },
  {
    icon: Mail,
    title: "Draft Escalation Letters",
    description:
      "Generate ready-to-send letters for bank nodal officers, grievance officers, SP offices, and RBI Ombudsman.",
  },
  {
    icon: BarChart3,
    title: "Consistency Checks",
    description:
      "Automated checks verify amounts, dates, and names across your evidence. Catch gaps before you submit.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
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
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/about")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/cases")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                My Cases
              </button>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            )}
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1.5 text-xs font-medium text-accent">
              <Shield className="h-3.5 w-3.5" />
              Citizen-first evidence protection
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Digital Innocence
              <br />
              <span className="text-accent">Protocol</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              When your bank account is frozen due to a cyber-fraud investigation, you need a
              structured way to prove your innocence. DIP helps you organise evidence, generate
              professional reports, and track every step toward resolution.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate(isAuthenticated ? "/new-case" : "/auth?returnTo=/new-case")
                }
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                My account is frozen — Start here
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate("/about")}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-card-foreground hover:bg-accent/5 transition-colors"
              >
                Learn more
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeInUp}
              className="text-sm font-medium text-accent uppercase tracking-wider"
            >
              How DIP helps
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="mt-3 text-3xl font-bold tracking-tight"
            >
              Everything you need to build your case
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-3 text-muted-foreground max-w-lg mx-auto"
            >
              From evidence collection to escalation letters — DIP gives you the tools to
              present a clear, organised explanation.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeInUp}
                className="group rounded-2xl border border-border/70 bg-card p-6 shadow-sm hover:shadow-md hover:border-accent/30 transition-all"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/15 transition-colors">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-sm font-medium text-accent uppercase tracking-wider">
              Simple process
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              From freeze to resolution in 5 steps
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-5">
            {[
              {
                step: "1",
                title: "Enter freeze details",
                desc: "Bank, account (masked), freeze type and date",
              },
              {
                step: "2",
                title: "Add the transaction",
                desc: "Date, amount, sender, purpose, and your story",
              },
              {
                step: "3",
                title: "Upload evidence",
                desc: "Invoices, receipts, chats, delivery proofs",
              },
              {
                step: "4",
                title: "Get your report",
                desc: "Auto-generated PDF + JSON with consistency checks",
              },
              {
                step: "5",
                title: "Track & escalate",
                desc: "Timeline, follow-ups, and draft escalation letters",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ethics Box ── */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl"
          >
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">What DIP is — and isn't</h3>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <strong className="text-foreground">DIP is a tool.</strong> It helps you
                        organise evidence and present it professionally. It does not make legal
                        decisions.
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <strong className="text-foreground">DIP does not certify innocence.</strong>{" "}
                        It helps you tell your story clearly — you are responsible for the
                        truthfulness of your submission.
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <strong className="text-foreground">DIP cannot unfreeze accounts.</strong>{" "}
                        Resolution depends on the bank, police, and legal authorities. DIP gives
                        you structure and tracking.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              Ready to take control of your case?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Start documenting your evidence today. It's free, private, and designed to help you
              navigate the process.
            </p>
            <button
              onClick={() =>
                navigate(isAuthenticated ? "/new-case" : "/auth?returnTo=/new-case")
              }
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Start your case now
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
          <div className="flex gap-6 text-xs text-muted-foreground">
            <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">
              About
            </button>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
            <span className="cursor-default">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
