import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const COOKIE_CONSENT_KEY = "dip_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border/60 bg-card/95 backdrop-blur-xl shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-4">
        <div className="flex items-start gap-3 flex-1">
          <Shield className="h-5 w-5 shrink-0 text-accent mt-0.5" />
          <div className="text-sm">
            <p className="text-foreground">
              We use essential cookies to keep you logged in and improve the site.
            </p>
            <p className="text-muted-foreground mt-0.5">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground transition-colors">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground transition-colors">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <a href="/privacy">Manage</a>
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
