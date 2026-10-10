import { useState, useEffect, useCallback } from "react";

const PIN_HASH_KEY = "dip_lock_pin_hash";
const BIOMETRIC_KEY = "dip_lock_biometric_enabled";

export function normalizePin(pin: string): string {
  return pin.replace(/\D/g, "").slice(0, 6);
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`dip:v1:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isPinSet(): boolean {
  try {
    return Boolean(localStorage.getItem(PIN_HASH_KEY));
  } catch {
    return false;
  }
}

export function isBiometricUnlockEnabled(): boolean {
  try {
    return localStorage.getItem(BIOMETRIC_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBiometricUnlockEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(BIOMETRIC_KEY, enabled ? "true" : "false");
  } catch {
    /* private mode */
  }
}

export async function savePin(pin: string): Promise<void> {
  const normalized = normalizePin(pin);
  if (normalized.length < 4) throw new Error("PIN must be 4-6 digits");
  const hash = await hashPin(normalized);
  try {
    localStorage.setItem(PIN_HASH_KEY, hash);
  } catch {
    throw new Error("Could not save PIN (private browsing?)");
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = await hashPin(normalizePin(pin));
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(PIN_HASH_KEY);
  } catch {
    return false;
  }
  return stored === hash;
}

export function removePin(): void {
  try {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(BIOMETRIC_KEY);
  } catch {
    /* private mode */
  }
}

/** Detect whether this device offers a platform biometric authenticator. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(available);
  } catch {
    return false;
  }
}

export interface AppLockState {
  /** PIN/biometric gate armed and this device not yet unlocked. */
  isLocked: boolean;
  /** True when a PIN is configured (device-local). */
  pinConfigured: boolean;
  unlock: () => void;
  relock: () => void;
}

/**
 * App-lock state hook. Locking is device-local (PIN hash lives in
 * localStorage) and only guards entry into the app shell, not server data.
 */
export function useAppLock(): AppLockState {
  const [pinConfigured, setPinConfigured] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setPinConfigured(isPinSet());
    setIsLocked(isPinSet());
  }, []);

  const unlock = useCallback(() => setIsLocked(false), []);
  const relock = useCallback(() => {
    if (isPinSet()) setIsLocked(true);
  }, []);

  return { isLocked, pinConfigured, unlock, relock };
}
