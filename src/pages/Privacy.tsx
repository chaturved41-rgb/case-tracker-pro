import { useNavigate } from "react-router";
import { Shield, ArrowLeft } from "lucide-react";

export default function Privacy() {
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
            <span className="font-semibold tracking-tight">Privacy Policy</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Your privacy matters</p>
                <p className="text-muted-foreground mt-1">
                  DIP is designed to be privacy-preserving. We never store full account numbers, Aadhaar numbers, PAN numbers, passwords, UPI PINs, or OTPs. We only collect the minimum data needed to help you organise your evidence.
                </p>
              </div>
            </div>
          </div>

          <Section title="1. Data We Collect">
            <p className="text-muted-foreground">When you use DIP, we collect:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• <strong className="text-foreground">Account information:</strong> Email address and optional phone number for authentication.</li>
              <li>• <strong className="text-foreground">Case data:</strong> Bank name, masked account number (e.g., XXXX4321), freeze details, transaction information, narrative, and uploaded evidence files.</li>
              <li>• <strong className="text-foreground">Evidence files:</strong> Invoices, receipts, chat screenshots, and other supporting documents you choose to upload.</li>
              <li>• <strong className="text-foreground">Usage data:</strong> Timeline events, dispatch records, escalation drafts, responses, and email schedules you create.</li>
            </ul>
          </Section>

          <Section title="2. Data We Do NOT Collect">
            <ul className="space-y-1 text-muted-foreground">
              <li>• Full account numbers (only masked versions are stored)</li>
              <li>• Aadhaar numbers</li>
              <li>• PAN numbers</li>
              <li>• Passwords or PINs</li>
              <li>• OTPs (One-Time Passwords)</li>
              <li>• UPI PINs</li>
              <li>• Any biometric data</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p className="text-muted-foreground">Your data is used solely to:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• Generate evidence reports for your case</li>
              <li>• Track case timelines and milestones</li>
              <li>• Schedule automated follow-up emails on your behalf</li>
              <li>• Provide consistency checks on your evidence</li>
              <li>• Send you notifications about your cases</li>
            </ul>
          </Section>

          <Section title="4. Data Storage & Security">
            Your data is stored on encrypted cloud infrastructure. We use Convex (a serverless database platform) with enterprise-grade security. Files are stored securely and accessible only to you.
          </Section>

          <Section title="5. Email Integration">
            If you enable email integration (optional), DIP reads your emails to detect status updates from banks and police. This feature:
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• Is entirely opt-in — you must explicitly enable it</li>
              <li>• Only scans emails matching keywords related to your cases</li>
              <li>• Can be disabled at any time in Settings</li>
              <li>• Does not store full email bodies unless necessary</li>
            </ul>
          </Section>

          <Section title="6. Automated Emails">
            DIP can send scheduled follow-up emails on your behalf. These emails are sent from templates you review and approve. DIP does not read incoming email replies unless you have enabled email integration.
          </Section>

          <Section title="7. Data Sharing">
            DIP does not share your data with third parties. Your data is visible only to you. We do not sell, rent, or distribute your personal information.
          </Section>

          <Section title="8. Your Rights">
            You can:
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• View all your data in the DIP dashboard</li>
              <li>• Export your data as JSON reports</li>
              <li>• Delete your cases and associated data</li>
              <li>• Disable email integration at any time</li>
              <li>• Contact us to request complete data deletion</li>
            </ul>
          </Section>

          <Section title="9. Cookies">
            DIP uses essential cookies to keep you logged in. We do not use tracking or advertising cookies. You can manage your cookie preferences in Settings.
          </Section>

          <Section title="10. Contact">
            For privacy-related questions or data deletion requests, contact: privacy@diginnocence.in
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
      {children}
    </div>
  );
}
