import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

/**
 * Branded splash screen shown while the app boots (auth/convex hydration).
 * Fades out once the app signals readiness.
 */
export function SplashScreen({ ready }: { ready: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: ready ? 0 : 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
      aria-hidden={ready}
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: ready ? 0.95 : 1, opacity: ready ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10"
      >
        <ShieldCheck className="h-12 w-12 text-primary" />
      </motion.div>
      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: ready ? 4 : 0, opacity: ready ? 0 : 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-6 text-lg font-bold tracking-tight text-foreground"
      >
        DIP
      </motion.p>
      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: ready ? 4 : 0, opacity: ready ? 0 : 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-1 text-sm text-muted-foreground"
      >
        Verify before you trust
      </motion.p>
    </motion.div>
  );
}
