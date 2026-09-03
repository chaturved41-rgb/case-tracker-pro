import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Home, FolderOpen } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-background text-foreground"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-4xl font-bold text-muted-foreground">
            404
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Please refresh the page or return to the home page.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </button>
            <button
              onClick={() => navigate("/cases")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-card-foreground hover:bg-accent/5 transition-colors"
            >
              <FolderOpen className="h-4 w-4" />
              My Cases
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
