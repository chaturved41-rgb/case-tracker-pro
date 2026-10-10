import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  ChevronLeft,
  Download,
  FileText,
  Lock,
  Loader2,
  LogOut,
  Mail,
  MonitorSmartphone,
  Shield,
  Trash2,
} from "lucide-react";
import {
  isPinSet,
  savePin,
  removePin,
  verifyPin,
  isBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
} from "@/lib/appLock";
import {
  registerBiometricUnlock,
  removeBiometricCredential,
} from "@/lib/biometric";
import { isBiometricAvailable } from "@/lib/appLock";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { clearAllSessionData } from "@/lib/trustAnalysis";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const settings = useQuery(api.settings.getSettings);
  const updateNotifPrefs = useMutation(api.settings.updateNotificationPrefs);
  const toggleEmailIntegration = useMutation(api.settings.toggleEmailIntegration);
  const deleteMyAccount = useMutation(api.users.deleteMyAccount);
  const dataSummary = useQuery(api.users.getMyDataSummary);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailIntegration, setEmailIntegration] = useState(false);

  // App lock state
  const [pinConfigured, setPinConfigured] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Delete-account state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { canInstall, hasPendingPrompt, promptInstall } = useInstallPrompt();

  useEffect(() => {
    setPinConfigured(isPinSet());
    setBiometricOn(isBiometricUnlockEnabled());
    void isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleSignOut = async () => {
    removePin();
    removeBiometricCredential();
    try {
      clearAllSessionData();
    } catch {
      /* session storage unavailable */
    }
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

  const enableBiometrics = async () => {
    setBiometricBusy(true);
    const registered = await registerBiometricUnlock();
    setBiometricBusy(false);
    if (registered) {
      setBiometricUnlockEnabled(true);
      setBiometricOn(true);
      toast.success("Biometric unlock enabled");
    } else {
      setBiometricOn(false);
      toast.error("Could not register biometric unlock");
    }
  };

  const disableBiometrics = () => {
    removeBiometricCredential();
    setBiometricUnlockEnabled(false);
    setBiometricOn(false);
    toast.success("Biometric unlock disabled");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50 pt-safe">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate("/cases")}
            className="flex min-h-[2.75rem] items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-nav">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
        </div>

        {/* Notifications */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
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
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
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

        {/* Push notifications status */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="h-4 w-4 text-accent" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Case updates currently arrive in-app and via email/SMS. Web push (lock-screen notifications)
              needs a push service key that is not configured yet — the app is already structured for it,
              so devices will subscribe automatically once you enable a provider.
            </p>
          </CardContent>
        </Card>

        {/* App lock */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              App Lock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-sm font-medium">PIN lock</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pinConfigured
                    ? "A PIN is set on this device"
                    : "Require a 4–6 digit PIN when opening DIP"}
                </p>
              </div>
              {pinConfigured ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[2.75rem]"
                  onClick={async () => {
                    const entered = window.prompt("Enter your current PIN to remove it");
                    if (entered === null) return;
                    const ok = await verifyPin(entered);
                    if (ok) {
                      removePin();
                      removeBiometricCredential();
                      setPinConfigured(false);
                      setBiometricOn(false);
                      toast.success("PIN removed");
                    } else {
                      toast.error("Incorrect PIN");
                    }
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[2.75rem]"
                  onClick={() => setPinSetupOpen(true)}
                >
                  Set PIN
                </Button>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Unlock with biometrics</Label>
                  {biometricAvailable && (
                    <Badge variant="outline" className="text-[10px]">Device supports it</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {biometricAvailable
                    ? "Use fingerprint or face unlock instead of typing your PIN"
                    : "Not available on this device/browser"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {biometricBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch
                  checked={biometricOn}
                  disabled={!biometricAvailable || !pinConfigured || biometricBusy}
                  onCheckedChange={(checked) => (checked ? enableBiometrics() : disableBiometrics())}
                />
              </div>
            </div>

            {pinSetupOpen && (
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <Label className="text-sm font-medium">Set a 4–6 digit PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="New PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                {pinError && <p className="text-xs text-destructive">{pinError}</p>}
                <div className="flex gap-2">
                  <Button
                    className="min-h-[2.75rem] flex-1"
                    onClick={async () => {
                      if (newPin.length < 4) {
                        setPinError("PIN must be 4–6 digits");
                        return;
                      }
                      if (newPin !== confirmPin) {
                        setPinError("PINs do not match");
                        return;
                      }
                      try {
                        await savePin(newPin);
                        setPinConfigured(true);
                        setPinSetupOpen(false);
                        setNewPin("");
                        setConfirmPin("");
                        setPinError(null);
                        toast.success("PIN set for this device");
                      } catch {
                        setPinError("Could not save PIN");
                      }
                    }}
                  >
                    Save PIN
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-[2.75rem] flex-1"
                    onClick={() => {
                      setPinSetupOpen(false);
                      setNewPin("");
                      setConfirmPin("");
                      setPinError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Install App */}
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-accent" />
              Install App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Install DIP as an app for a full-screen, offline-capable experience with a home screen icon.
            </p>
            {canInstall && hasPendingPrompt ? (
              <Button
                className="min-h-[3rem] w-full gap-2"
                onClick={async () => {
                  const outcome = await promptInstall();
                  if (outcome === "accepted") {
                    toast.success("DIP was installed");
                  } else if (outcome === "dismissed") {
                    toast("You can install later from your browser menu");
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Install DIP on this device
              </Button>
            ) : (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                On iPhone/iPad (Safari): tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
                On Android (Chrome): tap <strong>⋮ menu</strong> → <strong>Install app</strong> (or "Add to Home screen").
                On desktop: use the install icon in your browser's address bar.
              </div>
            )}
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
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
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
                <p><strong className="text-foreground">How it works:</strong> DIP scans incoming emails for keywords related to your cases (bank name, account number, "freeze", "lien", "NOC", etc.).</p>
                <p><strong className="text-foreground">Privacy:</strong> only matching emails are processed. Full email bodies are not stored unless necessary. You can disable this at any time.</p>
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
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="min-h-[2.75rem]" onClick={() => navigate("/terms")}>
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Terms & Conditions
              </Button>
              <Button variant="outline" size="sm" className="min-h-[2.75rem]" onClick={() => navigate("/privacy")}>
                <Shield className="h-3.5 w-3.5 mr-1.5" />
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
            <Button variant="outline" size="sm" className="min-h-[2.75rem]" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone — delete account & data */}
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all data:{" "}
              <strong className="text-foreground">
                {dataSummary?.cases ?? "—"} case(s)
              </strong>{" "}
              with evidence, reports, timelines, email schedules, and delivery logs, plus{" "}
              <strong className="text-foreground">
                {dataSummary?.screenshotAnalyses ?? "—"} screenshot analysis(es)
              </strong>{" "}
              and your sign-in credentials. This cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="min-h-[3rem] w-full gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete my account and all data
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          DIP stores your data securely and never shares it with third parties.
        </p>
      </main>

      {/* Delete confirmation dialog */}
      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleting={deleting}
        onDelete={async () => {
          setDeleting(true);
          try {
            await deleteMyAccount({ confirm: "DELETE" });
            removePin();
            removeBiometricCredential();
            try {
              clearAllSessionData();
            } catch {
              /* session storage unavailable */
            }
            await signOut();
            toast.success("Your account and data have been deleted");
            navigate("/");
          } catch {
            toast.error("Could not delete your account. Please try again.");
          } finally {
            setDeleting(false);
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  deleting,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onDelete: () => Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account and all data?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes your account, every case with its evidence, reports, timelines,
            email schedules, delivery logs, screenshot analyses, and your sign-in credentials.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-confirm" className="text-sm font-medium">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm
          </Label>
          <Input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="min-h-[2.75rem] sm:mt-0" disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[2.75rem] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting || confirmText !== "DELETE"}
            onClick={(e) => {
              e.preventDefault();
              void onDelete();
            }}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Deleting…
              </>
            ) : (
              "Delete forever"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
