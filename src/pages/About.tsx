import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  Mail,
  ChevronLeft,
  FileText,
  Clock,
} from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">
            About DIP — Digital Innocence Protocol
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A citizen-facing evidence and case-tracking layer for people whose bank accounts are
            frozen due to cyber-fraud investigations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12 space-y-10"
        >
          {/* What DIP does */}
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              What DIP does
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Lets you enter freeze details (bank, masked account, freeze type/date) and
                  describe the disputed transaction.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Helps you upload evidence — invoices, chat screenshots, delivery proofs, platform
                  receipts, and more.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Auto-generates a structured JSON evidence report with consistency checks.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Tracks your case timeline with key checkpoints at Day 7, 30, and 90.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Generates draft emails and letters to bank nodal officers, investigating officers,
                  grievance officers, SP offices, and RBI Ombudsman.
                </span>
              </li>
            </ul>
          </section>

          {/* What DIP is NOT */}
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              What DIP is NOT
            </h2>
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm leading-relaxed text-muted-foreground space-y-3">
              <p>
                <strong className="text-foreground">DIP does not certify innocence.</strong> It
                organises your evidence — you and the authorities determine the outcome.
              </p>
              <p>
                <strong className="text-foreground">DIP cannot unfreeze accounts.</strong> Only
                banks, police, and courts can unfreeze your account.
              </p>
              <p>
                <strong className="text-foreground">DIP is not a law firm.</strong> It does not
                provide legal advice. Consult a qualified lawyer for case-specific guidance.
              </p>
              <p>
                <strong className="text-foreground">DIP does not guarantee outcomes.</strong>{" "}
                Timelines and results depend on the investigation and authorities involved.
              </p>
            </div>
          </section>

          {/* Privacy & Data */}
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" />
              Privacy & Data
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                DIP is built with privacy at its core. We enforce strict data protection:
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <strong className="text-foreground">No full account numbers.</strong> Only masked
                  accounts (e.g., XXXX4321) are stored.
                </li>
                <li>
                  <strong className="text-foreground">No Aadhaar or PAN.</strong> We never ask for
                  or store government IDs.
                </li>
                <li>
                  <strong className="text-foreground">No passwords, OTPs, or UPI PINs.</strong>{" "}
                  We never request sensitive authentication credentials.
                </li>
                <li>
                  <strong className="text-foreground">Your data is yours.</strong> Evidence and
                  case data are associated with your account only.
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-border/70 bg-card p-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Contact
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              For questions, feedback, or support, reach us at{" "}
              <span className="font-medium text-foreground">support@digitalinnocence.org</span>.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              DIP is an open initiative. If you're a developer or legal professional interested in
              contributing, we'd love to hear from you.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="rounded-xl bg-muted/50 p-6 text-xs leading-relaxed text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Disclaimer:</strong> DIP — Digital Innocence
              Protocol is a tool for evidence organisation and case tracking. It does not certify
              innocence, provide legal advice, or guarantee the unfreezing of any account. Users
              are solely responsible for the truthfulness of their submissions. Knowingly false
              statements or fabricated evidence may have legal consequences.
            </p>
            <p>
              DIP does not integrate with I4C, NCRP, banks, or police systems in its current
              version. All evidence sharing and communication with authorities is done by the user
              externally.
            </p>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
