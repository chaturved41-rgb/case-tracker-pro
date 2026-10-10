/*
 * PWA runtime glue for DIP.
 *  - registerServiceWorker(): registers /sw.js, reports updates and offline state.
 *  - shareText(): native share sheet when available, clipboard fallback otherwise.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

export type SwState = {
  supported: boolean;
  registered: boolean;
  /** A new service worker is waiting — offer the user an update. */
  updateReady: boolean;
  /** Apply the waiting update and reload. */
  applyUpdate: () => void;
};

type SwListeners = {
  onUpdateReady: (applyUpdate: () => void) => void;
};

export async function registerServiceWorker(
  listeners?: SwListeners,
): Promise<SwState> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { supported: false, registered: false, updateReady: false, applyUpdate: () => {} };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    swRegistration = registration;

    // A waiting worker means a new version has been downloaded and is ready.
    const notifyIfWaiting = () => {
      const waiting = registration.waiting;
      if (waiting && listeners?.onUpdateReady) {
        listeners.onUpdateReady(() => {
          waiting.postMessage("SKIP_WAITING");
        });
      }
    };
    notifyIfWaiting();
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          notifyIfWaiting();
        }
      });
    });
    registration.waiting?.addEventListener("statechange", () => {
      // Once the waiting worker activates (after SKIP_WAITING), reload.
      if (registration.waiting?.state === "activated") {
        window.location.reload();
      }
    });

    return {
      supported: true,
      registered: true,
      updateReady: Boolean(registration.waiting),
      applyUpdate: () => {
        registration.waiting?.postMessage("SKIP_WAITING");
      },
    };
  } catch {
    return { supported: true, registered: false, updateReady: false, applyUpdate: () => {} };
  }
}

export function getSwRegistration() {
  return swRegistration;
}

/** Native share with graceful clipboard fallback. Returns how it was shared. */
export async function shareText(title: string, text: string): Promise<"shared" | "copied" | "failed"> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && "share" in nav) {
    try {
      await nav.share({ title, text });
      return "shared";
    } catch (err) {
      // User dismissed the sheet — not an error worth surfacing.
      if (err instanceof Error && err.name === "AbortError") return "failed";
      // Fall through to clipboard for other failures (e.g. unsupported value).
    }
  }
  if (nav?.clipboard) {
    try {
      await nav.clipboard.writeText(text);
      return "copied";
    } catch {
      /* fall through */
    }
  }
  return "failed";
}
