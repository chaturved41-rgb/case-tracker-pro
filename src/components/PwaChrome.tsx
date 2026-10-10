import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { registerServiceWorker } from "@/lib/pwa";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/** Smooth page transition wrapper keyed on the current route. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Slim connectivity banner shown when the device is offline. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          transition={{ type: "tween", duration: 0.25 }}
          className="fixed inset-x-0 top-0 z-[60] bg-amber-500/95 py-1.5 text-center text-xs font-medium text-amber-950"
          style={{ paddingTop: "max(env(safe-area-inset-top), 0.375rem)", paddingBottom: "0.375rem" }}
          role="status"
        >
          <span className="inline-flex items-center gap-1.5">
            <WifiOff className="h-3.5 w-3.5" />
            You're offline — some features need internet. Cached pages stay available.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Bottom install banner using the browser's native install prompt. */
export function InstallBanner() {
  const { canInstall, hasPendingPrompt, promptInstall, markDismissed } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show the banner a moment after load so it doesn't fight the splash screen.
  useEffect(() => {
    if (!canInstall) return;
    const t = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(t);
  }, [canInstall]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "tween", duration: 0.28 }}
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-50 md:bottom-4"
      >
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Install DIP</p>
            <p className="text-xs text-muted-foreground">
              Add to your home screen for a full-screen app experience.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss install banner"
            onClick={() => {
              markDismissed();
              setVisible(false);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          {hasPendingPrompt && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const outcome = await promptInstall();
                setBusy(false);
                if (outcome === "accepted") {
                  setVisible(false);
                } else if (outcome === "dismissed") {
                  markDismissed();
                  setVisible(false);
                }
              }}
              className="min-h-[2.75rem] shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Mount once near the app root. Registers the service worker and offers a
 * toast when a new version has been downloaded and is waiting to activate.
 */
export function PwaServiceWorkerBridge() {
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    let dismissed = false;
    registerServiceWorker({
      onUpdateReady: (apply) => {
        if (dismissed) return;
        setApplyUpdate(() => apply);
        toast("A new version of DIP is ready", {
          description: "Reload to get the latest improvements.",
          duration: Infinity,
          id: "dip-sw-update",
          action: {
            label: "Reload",
            onClick: () => apply(),
          },
        });
      },
    }).then((state) => {
      if (!state.registered) {
        console.warn("[DIP] Service worker registration unavailable.");
      }
    });
    return () => {
      dismissed = true;
    };
  }, []);

  useEffect(() => {
    if (!applyUpdate) return;
    // Keep a handle so the toast action can trigger it after remounts.
    (window as unknown as { __dipApplySwUpdate?: () => void }).__dipApplySwUpdate = applyUpdate;
  }, [applyUpdate]);

  return null;
}

/** Hook returning the active service worker registration (for push setup). */
export function useServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    getSwRegistrationSafe().then(setRegistration);
  }, []);
  return registration;
}

async function getSwRegistrationSafe() {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      return (await navigator.serviceWorker.getRegistration("/")) ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}
