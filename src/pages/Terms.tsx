import { useNavigate } from "react-router";
import { Shield, ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Home
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">D</div>
            <span className="font-semibold tracking-tight">Terms & Conditions</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          {/* Disclaimer box */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-accent mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Important disclaimers</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong className="text-foreground">DIP does not certify innocence.</strong> It is an evidence organisation and case-tracking tool.</li>
                  <li>• <strong className="text-foreground">DIP cannot unfreeze accounts.</strong> Resolution depends on banks, police, and legal authorities.</li>
                  <li>• <strong className="text-foreground">DIP is not legal advice.</strong> Consult a qualified lawyer for case-specific guidance.</li>
                  <li>• <strong className="text-foreground">You are responsible for the truthfulness of your submissions.</strong> Knowingly false statements or fabricated evidence may have legal consequences.</li>
                </ul>
              </div>
            </div>
          </div>

          <Section title="1. Acceptance of Terms">
            By using DIP (Digital Innocence Protocol), you agree to these Terms & Conditions. If you do not agree, please do not use the service.
          </Section>

          <Section title="2. What DIP Provides">
            DIP is a citizen-facing tool that helps users organise evidence, generate structured reports, and track case timelines when their bank accounts are frozen due to cyber-fraud investigations. DIP provides templates for letters and emails, consistency checks on evidence, and automated follow-up scheduling.
          </Section>

          <Section title="3. What DIP Does NOT Do">
            DIP does not make legal decisions, guarantee account unfreezing, communicate directly with banks or police, or provide legal representation. All interactions with authorities are the user's responsibility.
          </Section>

          <Section title="4. User Responsibilities">
            You are solely responsible for the accuracy and truthfulness of all information you enter into DIP. Fabricating evidence or making knowingly false statements may have serious legal consequences. DIP may display disclaimers reminding you of this obligation.
          </Section>

          <Section title="5. Privacy & Data">
            DIP collects only the information you provide. We never store full account numbers, Aadhaar, PAN, passwords, or OTPs. Our Privacy Policy describes in detail what data is collected, how it is used, and your rights regarding that data.
          </Section>

          <Section title="6. Automated Emails">
            DIP can schedule automated follow-up emails on your behalf. These emails are sent from templates you review and approve. DIP is not responsible for the content of emails you choose to send, or for any consequences of sending them.
          </Section>

          <Section title="7. AI-Assisted Features">
            DIP may use AI to analyze screenshots, suggest police stations, or generate draft letters. These suggestions are informational only and may not be accurate. Always verify AI-generated information with official sources.
          </Section>

          <Section title="8. Limitation of Liability">
            DIP is provided "as is" without warranties. We are not liable for any damages arising from use of the service, including but not limited to loss of data, legal consequences, or delays in case resolution.
          </Section>

          <Section title="9. Changes to Terms">
            We may update these terms from time to time. Continued use of DIP after changes constitutes acceptance of the updated terms.
          </Section>

          <Section title="10. Contact">
            For questions about these terms, contact us at support@diginnocence.in
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
