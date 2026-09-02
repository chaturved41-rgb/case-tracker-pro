import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronRight,
  Shield,
  LogOut,
  FileText,
  Clock,
  Camera,
  Settings,
  Bell,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  responded:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  resolved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  unknown:
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800",
};

const FREEZE_LABELS: Record<string, string> = {
  lien: "Lien",
  debit_freeze: "Debit Freeze",
  full_freeze: "Full Freeze",
};

export default function CasesPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const cases = useQuery(api.cases.list);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              D
            </div>
            <span className="text-lg font-semibold tracking-tight">DIP</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email || user?.name || "Guest"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="text-muted-foreground">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Cases</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage your evidence cases
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/analyze")}
                className="gap-1.5"
              >
                <Camera className="h-4 w-4" />
                Analyze Screenshot
              </Button>
              <Button
                onClick={() => navigate("/new-case")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Case
              </Button>
            </div>
          </div>

          {/* Cases */}
          {cases === undefined ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-muted-foreground text-sm">
                Loading cases...
              </div>
            </div>
          ) : cases.length === 0 ? (
            <Card className="border-border/70">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No cases yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Create your first case to start organising evidence and
                  tracking your account freeze.
                </p>
                <Button
                  onClick={() => navigate("/new-case")}
                  className="mt-6 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Start your first case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Card className="border-border/70 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Bank
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Account
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Freeze
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                          Created
                        </TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((c) => (
                        <TableRow
                          key={c._id}
                          className="cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => navigate(`/cases/${c._id}`)}
                        >
                          <TableCell className="font-medium">
                            {c.bankName}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {c.accountMasked}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {FREEZE_LABELS[c.freezeType] || c.freezeType}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{c.transactionAmount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={STATUS_COLORS[c.resolutionStatus] || STATUS_COLORS.unknown}
                            >
                              {c.resolutionStatus.charAt(0).toUpperCase() +
                                c.resolutionStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {cases.map((c) => (
                  <Card
                    key={c._id}
                    className="border-border/70 cursor-pointer hover:border-accent/30 transition-all"
                    onClick={() => navigate(`/cases/${c._id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{c.bankName}</p>
                          <p className="text-sm font-mono text-muted-foreground">
                            {c.accountMasked}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[c.resolutionStatus] || STATUS_COLORS.unknown}
                        >
                          {c.resolutionStatus.charAt(0).toUpperCase() +
                            c.resolutionStatus.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                        <span>
                          ₹{c.transactionAmount.toLocaleString("en-IN")} •{" "}
                          {FREEZE_LABELS[c.freezeType] || c.freezeType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(c.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Disclaimer */}
          <div className="mt-8 flex items-start gap-2 text-xs text-muted-foreground max-w-xl">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              DIP does not certify innocence, cannot unfreeze accounts, and does
              not integrate with banks or police systems. You are responsible for
              the truthfulness of your submissions.
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
