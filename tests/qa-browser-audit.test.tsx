/**
 * Browser-level QA audit of the completed DIP implementation.
 * Renders the REAL app through the REAL router (jsdom) and tests the
 * actual running component tree — the same code the preview executes.
 *
 * QA only. No fixes, no new features.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";

// jsdom lacks IntersectionObserver (real browsers have it). framer-motion's
// whileInView needs it. Polyfill for the QA harness only — no app changes.
class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// The app's own Convex client is only needed by auth-backed routes.
// Stub the network layer the same way Convex does, then import the real
// main.tsx router configuration indirectly by rebuilding it here from the
// real lazy pages — this exercises the real page components.
import Landing from "@/pages/Landing";
import Analyze from "@/pages/Analyze";
import AnalysisResult from "@/pages/AnalysisResult";
import HowItWorks from "@/pages/HowItWorks";
import Help from "@/pages/Help";
import Privacy from "@/pages/Privacy";
import About from "@/pages/About";
import AnalyzeScreenshot from "@/pages/AnalyzeScreenshot";
import { RequireAuth } from "@/components/RequireAuth";

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return {
    ...actual,
    useAuth: () => ({
      isLoading: false,
      isAuthenticated: true,
      user: { _id: "test-user", name: "QA Tester", email: "qa@example.com" },
      signIn: vi.fn(),
      signOut: vi.fn(async () => {}),
    }),
  };
});

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("convex/react")>();
  return {
    ...actual,
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: () => ({ _id: "test-user", name: "QA Tester", email: "qa@example.com" }),
    useMutation: () => vi.fn(async () => ({
      id: "qa-analysis",
      bankName: "Test Bank",
      accountMasked: "XXXX4321",
      freezeType: "lien",
      policeStation: "Cyber Crime Cell",
      referenceNumber: "REF-001",
      suggestedPoliceStation: "Cyber Crime Cell",
      suggestedIoEmail: null,
      instructions: ["Step 1: contact bank", "Step 2: ask for IO details"],
    })),
    useAction: () => vi.fn(async () => ({})),
    ConvexProviderWithAuth: actual.ConvexProviderWithAuth,
    ConvexReactClient: actual.ConvexReactClient,
  };
});

vi.mock("@convex-dev/auth/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@convex-dev/auth/react")>();
  return {
    ...actual,
    useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn(async () => {}) }),
  };
});

function renderAt(path: string) {
  const router = createMemoryRouter([
    {
      children: [
        { path: "/", element: <Landing /> },
        { path: "/analyze", element: <Analyze /> },
        { path: "/result/:resultId", element: <AnalysisResult /> },
        { path: "/how-it-works", element: <HowItWorks /> },
        { path: "/help", element: <Help /> },
        { path: "/privacy", element: <Privacy /> },
        { path: "/about", element: <About /> },
        {
          path: "/analyze-freeze",
          element: (
            <RequireAuth>
              <AnalyzeScreenshot />
            </RequireAuth>
          ),
        },
        { path: "/auth", element: <div data-testid="auth-page">Auth</div> },
      ],
    },
  ], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

// Timing: Analyze uses 1.8s of paced loading states before navigating.
const ANALYZE_NAV_MS = 2200;

beforeEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.scrollTo = vi.fn();
});

describe("QA audit: DIP browser-level checks", () => {
  it("1. landing page loads without errors", async () => {
    const err = vi.spyOn(console, "error");
    renderAt("/");
    expect((await screen.findAllByText(/verify before/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Analyze safely").length).toBeGreaterThan(0);
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("2. 'Analyze safely' opens the public /analyze page", async () => {
    const user = userEvent.setup();
    renderAt("/");
    const heroCta = screen.getAllByRole("button", { name: /analyze safely/i })[0];
    await user.click(heroCta);
    // Analyze step 1 asks what to analyze
    expect(await screen.findByText(/what would you like to analyze/i)).toBeTruthy();
  });

  it("3. Demo Mode cards are visible", async () => {
    renderAt("/analyze");
    expect(await screen.findByText(/demo mode — try it instantly/i)).toBeTruthy();
    expect(screen.getByText(/suspicious payment message/i)).toBeTruthy();
    expect(screen.getByText(/suspicious link/i)).toBeTruthy();
    expect(screen.getByText(/ordinary low-concern message/i)).toBeTruthy();
    expect(screen.getByText(/synthetic demonstration data/i)).toBeTruthy();
  });

  it("4. suspicious payment demo can be selected", async () => {
    renderAt("/analyze");
    const user = userEvent.setup();
    await screen.findByText(/demo mode — try it instantly/i);
    await user.click(screen.getByText(/suspicious payment message/i));
    // runAnalysis navigates to result after ~1.8s
    await waitFor(
      () => expect(screen.getByText(/high concern/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
  });

  it("5–6. suspicious payment demo produces a result with a risk level", async () => {
    renderAt("/analyze");
    const user = userEvent.setup();
    await user.click(await screen.findByText(/suspicious payment message/i));
    await waitFor(
      () => expect(screen.getByText(/high concern/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
    expect(screen.getByText(/report id:/i)).toBeTruthy();
  });

  it("7. result explains the warning signals", async () => {
    renderAt("/analyze");
    const user = userEvent.setup();
    await user.click(await screen.findByText(/suspicious payment message/i));
    await waitFor(
      () => expect(screen.getByText(/warning signals found/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
    // Demo A must include prize / OTP / fee signals with explanations
    expect(screen.getByText(/unexpected prize or reward claim/i)).toBeTruthy();
    expect(screen.getByText(/request for sensitive information/i)).toBeTruthy();
    expect(screen.getAllByText(/never share otps/i).length).toBeGreaterThan(0);
  });

  it("8. result displays recommended next actions", async () => {
    renderAt("/analyze");
    const user = userEvent.setup();
    await user.click(await screen.findByText(/suspicious payment message/i));
    await waitFor(
      () => expect(screen.getByText(/recommended next actions/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
    expect(screen.getByText(/do not share passwords, otps, pins/i)).toBeTruthy();
  });

  it("9. result displays limitations and the disclaimer", async () => {
    renderAt("/analyze");
    const user = userEvent.setup();
    await user.click(await screen.findByText(/suspicious payment message/i));
    await waitFor(
      () => expect(screen.getByText(/what dip cannot determine/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
    expect(
      screen.getAllByText(/not proof of identity, intent, or criminal activity/i).length,
    ).toBeGreaterThan(0);
  });

  it("10. 'Start a new analysis' button works", async () => {
    renderAt("/analyze");
    const user = userEvent.setup();
    await user.click(await screen.findByText(/suspicious payment message/i));
    await waitFor(
      () => expect(screen.getByText(/high concern/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
    await user.click(screen.getByRole("button", { name: /start a new analysis/i }));
    expect(await screen.findByText(/what would you like to analyze/i)).toBeTruthy();
  });

  it("11. report download button works", async () => {
    const clickSpy = vi.fn();
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:qa");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    // jsdom HTMLAnchorElement.click() does not navigate; stub click on the prototype
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(clickSpy as unknown as () => void);

    renderAt("/analyze");
    const user = userEvent.setup();
    await user.click(await screen.findByText(/suspicious payment message/i));
    await waitFor(
      () => expect(screen.getByText(/generate report/i)).toBeTruthy(),
      { timeout: ANALYZE_NAV_MS + 2000 },
    );
    await user.click(screen.getByRole("button", { name: /download report/i }));
    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();

    anchorClickSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it("12. 'Privacy' link opens the Privacy page", async () => {
    const user = userEvent.setup();
    renderAt("/");
    const privacyButtons = screen.getAllByRole("button", { name: /^privacy$/i });
    await user.click(privacyButtons[0]);
    expect(
      await screen.findByText(/data handling, explained plainly/i),
    ).toBeTruthy();
    expect(screen.getAllByText(/delete my data/i).length).toBeGreaterThan(0);
  });

  it("13. 'How it works' link opens the How It Works page", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getAllByRole("button", { name: /how it works/i })[0]);
    expect(
      await screen.findByText(/from suspicious message to safer decision/i),
    ).toBeTruthy();
    expect(screen.getByText(/submit only necessary information/i)).toBeTruthy();
  });

  it("14. /analyze-freeze still opens the authenticated freeze workflow", async () => {
    renderAt("/analyze-freeze");
    expect(
      await screen.findByText(/analyze your screenshot/i),
    ).toBeTruthy();
    expect(screen.getByText(/upload an sms, email, or notification about your account freeze/i)).toBeTruthy();
  });
});
