import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ChevronLeft, ClipboardList, ScanSearch, MessageSquareQuote, Compass } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "Step 1",
    title: "Submit only necessary information",
    description:
      "Choose what you want checked — a message, link, account, payment request, or screenshot text — and add just the details DIP needs. A safety notice reminds you never to submit passwords, OTPs, PINs, or other secrets, and DIP actively detects and blocks accidental secrets before analysis.",
  },
  {
    icon: ScanSearch,
    step: "Step 2",
    title: "DIP checks available warning signals",
    description:
      "A transparent rule engine looks for known risk patterns: urgent payment pressure, requests for credentials, brand-lookalike links, shortened URLs, unusual payment methods, impersonation-style usernames, and more. Every signal is shown with its reason and its weight — nothing is hidden inside a black box.",
  },
  {
    icon: MessageSquareQuote,
    step: "Step 3",
    title: "DIP explains the assessment",
    description:
      "The result states a cautious status — Low concern, Needs verification, High concern, or Unable to assess — and explains why. Positive signals are shown too, so a clean message is not treated as suspicious without reason. Every result carries its limitations.",
  },
  {
    icon: Compass,
    step: "Step 4",
    title: "You decide the next safe action",
    description:
      "Each assessment ends with concrete recommendations: verify through official channels, avoid paying or sharing, save evidence, or report the sender. DIP supports your decision — it never makes it for you.",
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

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
          <button
            onClick={() => navigate("/analyze")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Analyze safely
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-medium text-accent uppercase tracking-wider">How it works</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From suspicious message to safer decision
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            DIP is a decision-support layer: it explains what it can see, states what it cannot
            determine, and leaves the judgment to you.
          </p>
        </motion.div>

        <div className="mt-12 space-y-6">
          {steps.map((s, i) => (
            <motion.section
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {s.step}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{s.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-2xl border border-border/60 bg-muted/30 p-6"
        >
          <h2 className="text-base font-semibold">What DIP is — and is not</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• DIP does not determine guilt or innocence. It identifies observable digital risk signals and helps users make safer decisions.</li>
            <li>• DIP does not replace antivirus software, browser protection, banks, or law enforcement.</li>
            <li>• DIP cannot look up external databases, confirm who operates a domain, or verify anyone's identity.</li>
            <li>• A "Low concern" result is not a certificate of safety — continue with caution.</li>
          </ul>
        </motion.div>

        <div className="mt-12 flex flex-wrap gap-3">
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
            Read the privacy promise
          </button>
        </div>
      </main>
    </div>
  );
}
