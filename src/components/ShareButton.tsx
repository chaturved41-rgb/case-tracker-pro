import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { shareText } from "@/lib/pwa";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Native share sheet with clipboard fallback. Works on mobile (system share
 * targets) and desktop (copies to clipboard).
 */
export function ShareButton({
  title,
  text,
  className,
  variant = "outline",
  size = "default",
}: {
  title: string;
  text: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const result = await shareText(title, text);
    if (result === "shared") {
      toast.success("Shared");
    } else if (result === "copied") {
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not share right now");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={handleShare}
      aria-label={`Share: ${title}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {size !== "icon" && <span>Share</span>}
    </Button>
  );
}
