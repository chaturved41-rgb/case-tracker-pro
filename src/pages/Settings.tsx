import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronLeft,
  Bell,
  Mail,
  Shield,
  LogOut,
  Trash2,
  Globe,
  Check,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const settings = useQuery(api.settings.getSettings);
  const updateNotifPrefs = useMutation(api.settings.updateNotificationPrefs);
  const toggleEmailIntegration = useMutation(api.settings.toggleEmailIntegration);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailIntegration, setEmailIntegration] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user || settings === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading settings...</div>
      </div>
    );
  }

  // Sync local state with server
  const emailNotifEnabled = settings?.emailNotificationsEnabled ?? true;
  const smsNotifEnabled = settings?.smsNotificationsEnabled ?? false;
  const emailIntegEnabled = settings?.emailIntegrationEnabled ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/cases")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            My Cases
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">D</div>
            <span className="font-semibold tracking-tight">Settings</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
        </div>

        {/* Notification Preferences */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive case updates and reminders via email</p>
              </div>
              <Switch
                checked={emailNotifEnabled}
                onCheckedChange={async (checked) => {
                  setEmailEnabled(checked);
                  await updateNotifPrefs({ emailNotificationsEnabled: checked });
                  toast.success(checked ? "Email notifications enabled" : "Email notifications disabled");
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">SMS notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive day 7/30/90 reminders via SMS</p>
              </div>
              <Switch
                checked={smsNotifEnabled}
                onCheckedChange={async (checked) => {
                  setSmsEnabled(checked);
                  await updateNotifPrefs({ smsNotificationsEnabled: checked });
                  toast.success(checked ? "SMS notifications enabled" : "SMS notifications disabled");
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Integration */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" />
              Email Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Auto-read emails</Label>
                  <Badge variant="outline" className="text-[10px]">Optional</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scan incoming emails for bank/police notifications and auto-update case status
                </p>
              </div>
              <Switch
                checked={emailIntegEnabled}
                onCheckedChange={async (checked) => {
                  setEmailIntegration(checked);
                  await toggleEmailIntegration({
                    enabled: checked,
                    provider: checked ? "google" : undefined,
                  });
                  toast.success(checked ? "Email integration enabled" : "Email integration disabled");
                }}
              />
            </div>
            {emailIntegEnabled && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
                <p><strong className="text-foreground">How it works:</strong> DIP will scan incoming emails for keywords related to your cases (bank name, account number, "freeze", "lien", "NOC", etc.).</p>
                <p><strong className="text-foreground">Privacy:</strong> Only matching emails are processed. Full email bodies are not stored unless necessary. You can disable this at any time.</p>
                <p><strong className="text-foreground">OAuth required:</strong> In production, you'll connect your Google or Microsoft account to enable this. For the MVP, this feature is stubbed.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Cookies */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              Privacy & Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 p-4 text-xs text-muted-foreground space-y-2">
              <p>• DIP uses essential cookies to keep you logged in.</p>
              <p>• We do not use tracking or advertising cookies.</p>
              <p>• Your data is encrypted and stored securely.</p>
              <p>• We never store full account numbers, Aadhaar, PAN, passwords, or OTPs.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/terms")}>
                Terms & Conditions
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/privacy")}>
                Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">{user.email || user.name || "Guest"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Signed in</p>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
