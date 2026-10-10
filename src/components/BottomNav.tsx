import { useLocation, useNavigate } from "react-router";
import { FileText, Home, Plus, Settings, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

type TabDef = {
  label: string;
  icon: typeof Home;
  path: string;
};

const LEFT_TABS: TabDef[] = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Cases", icon: FileText, path: "/cases" },
];

const RIGHT_TABS: TabDef[] = [
  { label: "Analyze", icon: ShieldQuestion, path: "/analyze" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

/**
 * Mobile bottom navigation (hidden ≥ md, where pages show their own headers).
 * Layout: Home · Cases · [＋ New case] · Analyze · Settings.
 * Height reserves room for the iOS/Android home-indicator safe area.
 */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
        paddingTop: "0.5rem",
      }}
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
        {LEFT_TABS.map((tab) => (
          <TabButton
            key={tab.path}
            tab={tab}
            active={isActive(tab.path)}
            onClick={() => navigate(tab.path)}
          />
        ))}

        {/* Center action: New case */}
        <button
          type="button"
          onClick={() => navigate("/new-case")}
          aria-label="New case"
          className="flex min-h-[3.25rem] min-w-[3.5rem] flex-1 flex-col items-center justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Plus className="h-5 w-5" />
          </span>
          <span className="sr-only">New case</span>
        </button>

        {RIGHT_TABS.map((tab) => (
          <TabButton
            key={tab.path}
            tab={tab}
            active={isActive(tab.path)}
            onClick={() => navigate(tab.path)}
          />
        ))}
      </div>
    </nav>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: TabDef;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[3.25rem] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-lg transition-colors",
        active ? "text-accent" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{tab.label}</span>
      <span
        className={cn(
          "h-0.5 w-6 rounded-full",
          active ? "bg-accent" : "bg-transparent",
        )}
      />
    </button>
  );
}
