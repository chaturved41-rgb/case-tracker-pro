import { useEffect, useRef, useState } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { normalizePin, verifyPin, isBiometricUnlockEnabled } from "@/lib/appLock";
import { verifyBiometricUnlock } from "@/lib/biometric";

const KEYPAD_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Device-local privacy gate. Verifies the stored PIN or a biometric
 * credential before revealing the app. Full-screen and standalone-safe.
 */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const biometricOffered = useRef(false);
  const biometricEnabled = isBiometricUnlockEnabled();

  const handleVerify = async (candidate: string) => {
    const ok = await verifyPin(candidate);
    if (ok) {
      onUnlock();
    } else {
      setError("Incorrect PIN. Try again.");
      setPin("");
    }
  };

  const pressDigit = (digit: string) => {
    setError(null);
    const next = normalizePin(pin + digit);
    if (next.length >= 4) {
      void handleVerify(next);
      setPin("");
    } else {
      setPin(next);
    }
  };

  const handleBiometric = async () => {
    const ok = await verifyBiometricUnlock();
    if (ok) {
      onUnlock();
    } else {
      setError("Biometric unlock failed — use your PIN.");
    }
  };

  // Auto-offer biometrics once when the lock screen appears.
  useEffect(() => {
    if (biometricEnabled && !biometricOffered.current) {
      biometricOffered.current = true;
      void handleBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <ShieldCheck className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">DIP is locked</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your PIN to continue.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3" aria-label="PIN entry progress">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={
              i < pin.length
                ? "h-3.5 w-3.5 rounded-full bg-primary"
                : "h-3.5 w-3.5 rounded-full bg-muted"
            }
          />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4">
        {KEYPAD_DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => pressDigit(digit)}
            className="h-16 w-16 rounded-full bg-muted text-xl font-semibold transition-colors hover:bg-accent/20"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPin("")}
          aria-label="Clear PIN entry"
          className="h-16 w-16 rounded-full bg-muted text-lg font-semibold transition-colors hover:bg-accent/20"
        >
          C
        </button>
        <button
          type="button"
          onClick={() => pressDigit("0")}
          className="h-16 w-16 rounded-full bg-muted text-xl font-semibold transition-colors hover:bg-accent/20"
        >
          0
        </button>
        {biometricEnabled ? (
          <button
            type="button"
            onClick={handleBiometric}
            aria-label="Unlock with biometrics"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-colors hover:bg-accent/20"
          >
            <Fingerprint className="h-6 w-6" />
          </button>
        ) : (
          <span aria-hidden className="h-16 w-16" />
        )}
      </div>
    </div>
  );
}
