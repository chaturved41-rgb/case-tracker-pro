import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { CookieConsent } from "@/components/CookieConsent";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router";
import "./index.css";

// ── Lazy-loaded page components ───────────────────────────────
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const CasesPage = lazy(() => import("./pages/Cases.tsx"));
const NewCase = lazy(() => import("./pages/NewCase.tsx"));
const CaseDetail = lazy(() => import("./pages/CaseDetail.tsx"));
const AboutPage = lazy(() => import("./pages/About.tsx"));
const AnalyzeScreenshot = lazy(() => import("./pages/AnalyzeScreenshot.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// ── Simple loading fallback ──────────────────────────────────
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

// ── Error boundaries ─────────────────────────────────────────
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              An unexpected error occurred. Please refresh the page or try again.
            </p>
            {import.meta.env.DEV && this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Convex client ────────────────────────────────────────────
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// ── RouteSyncer: syncs iframe routes with parent ─────────────
function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

// ── Root layout (rendered inside RouterProvider) ──────────────
function RootLayout() {
  return (
    <>
      <RouteSyncer />
      <Suspense fallback={<RouteLoading />}>
        <Outlet />
      </Suspense>
      <CookieConsent />
      <Toaster />
    </>
  );
}

// ── Router configuration ─────────────────────────────────────
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/terms", element: <Terms /> },
      { path: "/privacy", element: <Privacy /> },
      {
        path: "/auth",
        element: <AuthPage redirectAfterAuth="/cases" />,
      },
      {
        path: "/dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/cases",
        element: (
          <RequireAuth>
            <CasesPage />
          </RequireAuth>
        ),
      },
      {
        path: "/new-case",
        element: (
          <RequireAuth>
            <NewCase />
          </RequireAuth>
        ),
      },
      {
        path: "/cases/:caseId",
        element: (
          <RequireAuth>
            <CaseDetail />
          </RequireAuth>
        ),
      },
      {
        path: "/analyze",
        element: (
          <RequireAuth>
            <AnalyzeScreenshot />
          </RequireAuth>
        ),
      },
      {
        path: "/settings",
        element: (
          <RequireAuth>
            <Settings />
          </RequireAuth>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

// ── Render ───────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <RouterProvider router={router} />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
