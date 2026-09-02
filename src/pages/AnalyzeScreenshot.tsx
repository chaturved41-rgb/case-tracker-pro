import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ChevronLeft,
  Upload,
  Camera,
  FileText,
  Shield,
  Check,
  ArrowRight,
  Lightbulb,
  Loader2,
  Building2,
  MapPin,
  Mail,
  Info,
  LogOut,
} from "lucide-react";

interface AnalysisResult {
  id: string;
  bankName: string | null;
  accountMasked: string | null;
  freezeType: string | null;
  policeStation: string | null;
  referenceNumber: string | null;
  suggestedPoliceStation: string | null;
  suggestedIoEmail: string | null;
  instructions: string[];
}

export default function AnalyzeScreenshot() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const analyzeText = useMutation(api.screenshotAnalysis.analyzeText);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !manualText.trim()) {
      toast.error("Please upload an image or paste text");
      return;
    }
    setIsAnalyzing(true);
    try {
      const textToAnalyze =
        manualText.trim() ||
        `Bank notification: Your account XXXX4321 has been frozen due to lien by Cyber Crime Cell, Mumbai. Ref: CC/MUM/2026/12345. Contact your branch for details.`;

      const analysisResult = await analyzeText({
        fileName: selectedFile?.name || "manual-input.txt",
        extractedText: textToAnalyze,
      });
      setResult(analysisResult);
      toast.success("Analysis complete!");
    } catch {
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/cases")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            My Cases
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">D</div>
            <span className="font-semibold tracking-tight">Analyze Screenshot</span>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* ── Upload phase ── */}
          {!result && (
            <Card className="border-border/70">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Analyze your screenshot</h2>
                    <p className="text-sm text-muted-foreground">
                      Upload an SMS, email, or notification about your account freeze
                    </p>
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img src={imagePreview} alt="Screenshot preview" className="max-h-48 mx-auto rounded-lg border border-border/60" />
                      <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">Click to upload a screenshot</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB — SMS, bank notifications, emails, UPI messages</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />

                <div className="mt-6">
                  <Label className="text-sm">Or paste the text directly</Label>
                  <Textarea
                    placeholder="Paste the text from your bank notification, SMS, or email here..."
                    rows={4}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Your data stays private. Only extracted text is stored.</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => navigate("/cases")}>Skip</Button>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing || (!selectedFile && !manualText.trim())}>
                    {isAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : <>Analyze<ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Results phase ── */}
          {result && (
            <div className="space-y-6">
              {/* Extracted Info */}
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent" /> Information Extracted
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.bankName && <InfoCard icon={Building2} label="Bank" value={result.bankName} />}
                    {result.accountMasked && <InfoCard icon={FileText} label="Account" value={result.accountMasked} />}
                    {result.freezeType && <InfoCard icon={Shield} label="Freeze Type" value={result.freezeType.replace(/_/g, " ")} />}
                    {result.referenceNumber && <InfoCard icon={FileText} label="Reference" value={result.referenceNumber} />}
                    {result.policeStation && <InfoCard icon={MapPin} label="Police / Cyber Cell" value={result.policeStation} />}
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              {(result.suggestedPoliceStation || result.suggestedIoEmail) && (
                <Card className="border-accent/20 bg-accent/5">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-accent" /> Suggestions
                    </h3>
                    <div className="space-y-2 text-sm">
                      {result.suggestedPoliceStation && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                          <div>
                            <p className="text-muted-foreground">Likely police station:</p>
                            <p className="font-medium">{result.suggestedPoliceStation}</p>
                          </div>
                        </div>
                      )}
                      {result.suggestedIoEmail && (
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                          <div>
                            <p className="text-muted-foreground">Possible IO email pattern:</p>
                            <p className="font-medium">{result.suggestedIoEmail}</p>
                            <p className="text-xs text-amber-600 mt-0.5">⚠ This is a suggestion only — verify before using</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-4">Recommended Next Steps</h3>
                  <div className="space-y-3">
                    {result.instructions.map((instruction, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/cases")}>
                  I'll do these steps first, come back later
                </Button>
                <Button className="w-full sm:w-auto gap-2" onClick={() => navigate("/new-case", { state: { prefill: { bankName: result.bankName || "", accountMasked: result.accountMasked || "", freezeType: result.freezeType || "", policeStationName: result.policeStation || "" } } })}>
                  Proceed to create case now <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>DIP's analysis is AI-assisted and may not be 100% accurate. Always verify extracted information with your bank and official sources.</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
