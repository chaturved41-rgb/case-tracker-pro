/*
 * Device-local biometric unlock via the WebAuthn platform authenticator.
 *
 * This is a convenience lock for the phone itself: a credential is created
 * on-device (Touch ID / Face ID / fingerprint / Windows Hello) and later
 * verified on-device. No biometric data ever leaves the device and nothing is
 * registered server-side. The PIN always remains available as a fallback.
 */

const CREDENTIAL_ID_KEY = "dip_lock_biometric_credential_id";

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getCredentialId(): string | null {
  try {
    return localStorage.getItem(CREDENTIAL_ID_KEY);
  } catch {
    return null;
  }
}

/** Create a device-local credential and remember its ID. */
export async function registerBiometricUnlock(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return false;

    const challengeBytes = new Uint8Array(32);
    crypto.getRandomValues(challengeBytes);
    const userIdBytes = new TextEncoder().encode("dip-device-user");

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challengeBytes,
        rp: { name: "DIP" },
        user: {
          id: userIdBytes,
          name: "DIP device unlock",
          displayName: "DIP device unlock",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) return false;
    localStorage.setItem(CREDENTIAL_ID_KEY, credential.id);
    return true;
  } catch {
    return false;
  }
}

/** Verify the previously registered device credential. */
export async function verifyBiometricUnlock(): Promise<boolean> {
  try {
    const credentialId = getCredentialId();
    if (!credentialId) return false;
    const challengeBytes = new Uint8Array(32);
    crypto.getRandomValues(challengeBytes);

    await navigator.credentials.get({
      publicKey: {
        challenge: challengeBytes,
        rpId: window.location.hostname,
        allowCredentials: [
          { type: "public-key", id: fromBase64Url(credentialId) as BufferSource },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export function removeBiometricCredential(): void {
  try {
    localStorage.removeItem(CREDENTIAL_ID_KEY);
  } catch {
    /* private mode */
  }
}
