"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth, useCurrency, type CurrencyCode, CURRENCY_RATES } from "../../components/providers";
import Button from "../../components/ui/Button";
import Badge, { toneForStatus } from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";

type Startup = {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  status?: string;
  created_at?: string;
  budget?: string;
  country?: string;
  target_audience?: string;
};

const emptyMetrics = {
  total_runs: 0,
  success_rate: 0,
  avg_execution_time: 0,
  total_tokens: 0,
  failed_runs: 0,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { formatVal } = useCurrency();
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>("USD");
  const [startups, setStartups] = useState<Startup[]>([]);
  const [metrics, setMetrics] = useState<any>(emptyMetrics);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    budget: "",
    country: "",
    targetAudience: "",
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const [shakeModal, setShakeModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKbd = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKbd);
    return () => window.removeEventListener("keydown", handleKbd);
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleESC = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
      }
    };
    if (showModal) {
      window.addEventListener("keydown", handleESC);
    }
    return () => window.removeEventListener("keydown", handleESC);
  }, [showModal]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === modalOverlayRef.current) {
      setShowModal(false);
    }
  };

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [loading, token, router]);

  const loadDashboard = async () => {
    try {
      const [startupsRes, metricsRes, executionsRes] = await Promise.all([
        axios.get("/api/v1/startups"),
        axios.get("/api/v1/dashboard/metrics"),
        axios.get("/api/v1/dashboard/executions"),
      ]);
      setStartups(startupsRes.data || []);
      setMetrics(metricsRes.data || emptyMetrics);
      setExecutions(executionsRes.data || []);
    } catch (err) {
      console.error("Dashboard data unavailable", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadDashboard();
  }, [token]);

  const filteredStartups = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return startups;
    return startups.filter((startup) => `${startup.name} ${startup.industry} ${startup.description}`.toLowerCase().includes(normalized));
  }, [query, startups]);

  const handleCreateStartup = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      const numericBudget = parseFloat(form.budget.replace(/,/g, ""));
      if (isNaN(numericBudget)) {
        setFormErrors({ budget: true });
        throw new Error("Please enter a valid numeric budget.");
      }
      
      const rate = CURRENCY_RATES[formCurrency] || 1.0;
      const budgetInUsd = Math.round(numericBudget / rate);
      const budgetString = `$${budgetInUsd.toLocaleString()}`;

      const startupRes = await axios.post("/api/v1/startups", {
        name: form.name,
        description: form.description,
        industry: form.industry,
        budget: budgetString,
        country: form.country,
        target_audience: form.targetAudience,
      });

      await axios.post("/api/v1/reports/generate", {
        startup_id: startupRes.data.id,
        report_type: "complete_plan",
      });

      setShowModal(false);
      setForm({ name: "", description: "", industry: "", budget: "", country: "", targetAudience: "" });
      setFormErrors({});
      router.push(`/project/${startupRes.data.id}`);
    } catch (err: any) {
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 500);
      setError(err.response?.data?.detail || err.message || "Could not create the startup workspace.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this startup workspace? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/v1/startups/${id}`);
      setNotification({ type: "success", message: "Startup deleted successfully." });
      setStartups((current) => current.filter((startup) => startup.id !== id));
      await loadDashboard();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Could not delete startup.";
      setNotification({ type: "error", message: errMsg });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (loading || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-6 lg:p-10">
        {notification && (
          <div className={`rounded-xl border p-4 text-xs font-semibold tracking-wide transition-all animate-fade-in ${
            notification.type === "success" 
              ? "border-success/20 bg-success/5 text-success" 
              : "border-error/20 bg-error/5 text-error"
          }`}>
            {notification.message}
          </div>
        )}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <div className="metric-label text-accent">Dashboard</div>
            <h1 className="mt-2 text-section text-foreground">Venture portfolio</h1>
            <p className="mt-1 text-subtitle text-textSecondary">Track startup workspaces, agent execution metrics, and investor-readiness signals.</p>
          </div>
          <Button onClick={() => setShowModal(true)} icon={<Plus className="h-4 w-4" strokeWidth={2.5} />}>
            New startup
          </Button>
        </div>

        {/* 1 — Most important metrics first */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Startups"
            value={startups.length}
            helper="Active ideas in the studio"
            icon={Building2}
            emphasis
          />
          <StatCard
            label="Agent Runs"
            value={metrics.total_runs || 0}
            helper={`${metrics.failed_runs || 0} failed runs`}
            icon={BarChart3}
          />
          <StatCard
            label="Success Rate"
            value={`${metrics.success_rate || 0}%`}
            helper="Workflow completion quality"
            icon={CheckCircle2}
          />
          <StatCard
            label="Token Usage"
            value={(metrics.total_tokens || 0).toLocaleString()}
            helper={`Avg ${metrics.avg_execution_time || 0}s execution`}
            icon={DollarSign}
          />
        </section>

        <section className="grid gap-8 xl:grid-cols-[1fr_360px]">
          {/* 2 — Workspace */}
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-caption text-foreground">Startup workspaces</h2>
              <label className="relative block w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" strokeWidth={1.75} />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search startups"
                  className="glass-search w-full pl-9 pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-textMuted bg-card-secondary/60 px-1.5 py-0.5 rounded border border-border pointer-events-none select-none">Ctrl K</span>
              </label>
            </div>

            {isLoading ? (
              <div className="premium-card flex min-h-56 items-center justify-center p-10">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : filteredStartups.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No startup workspaces yet"
                description="Create a startup workspace to coordinate validation, market research, financials, and pitch decks."
                actionLabel="Create first workspace"
                onAction={() => setShowModal(true)}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredStartups.map((startup) => (
                  <button
                    key={startup.id}
                    type="button"
                    onClick={() => router.push(`/project/${startup.id}`)}
                    className="premium-card group p-5 text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-bold text-foreground">{startup.name}</h3>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-accent">{startup.industry || "Uncategorized"}</p>
                        </div>
                        <Badge tone={toneForStatus(startup.status)} pulse={startup.status === "processing"}>
                          {startup.status || "draft"}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-textSecondary font-medium">{startup.description || "No description provided."}</p>
                    </div>
                    
                    <div>
                      <div className="mt-4 text-[11px] font-semibold text-textSecondary">
                        Capital budget: <span className="text-foreground font-bold">{formatVal(startup.budget)}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-textSecondary font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {startup.created_at ? new Date(startup.created_at).toLocaleDateString() : "Recently"}
                        </span>
                        <span className="flex items-center gap-2">
                          <ArrowUpRight className="h-3.5 w-3.5 text-accent opacity-0 transition group-hover:opacity-100" strokeWidth={2} />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => handleDelete(startup.id, event as unknown as React.MouseEvent)}
                            className="rounded-lg p-1.5 text-textSecondary hover:bg-error/5 hover:text-error transition-colors"
                            aria-label={`Delete ${startup.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </span>
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3 — Recent execution / 4 — AI agent activity */}
          <aside className="space-y-4">
            <h2 className="text-caption text-foreground">Agent execution activity</h2>
            <div className="premium-card max-h-[640px] overflow-y-auto p-5">
              {executions.length === 0 ? (
                <p className="py-12 text-center text-xs text-textSecondary">No agent executions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {executions.slice(0, 12).map((execution) => (
                    <div key={execution.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-foreground">{execution.agent_role || "Agent"} Agent</p>
                        <Badge tone={toneForStatus(execution.status)} pulse={execution.status === "processing"}>
                          {execution.status || "queued"}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-textSecondary">{execution.logs || execution.startup_name || "Execution payload recorded."}</p>
                      <div className="mt-2.5 flex justify-between text-numbers text-[10px] text-textMuted font-medium">
                        <span>{execution.execution_time ? `${Number(execution.execution_time).toFixed(1)}s` : "Pending"}</span>
                        <span>{execution.token_consumption ? `${execution.token_consumption} tokens` : "No token data"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>

      <AnimatePresence>
        {showModal && (
          <div
            ref={modalOverlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#031716]/50 px-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
              className={`premium-card w-full max-w-2xl p-7 relative bg-card !shadow-popover ${
                shakeModal ? "shake-error" : ""
              }`}
            >
              <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-title text-foreground">Create startup workspace</h2>
                  <p className="mt-1 text-xs text-textSecondary font-medium">These inputs seed validation, research, financials, and pitch generation.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="w-7 h-7 rounded-lg bg-card-secondary hover:bg-border flex items-center justify-center font-bold text-xs text-foreground transition-colors"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              {error && <div className="mb-4 rounded-xl border border-error/20 bg-error/5 p-3 text-xs text-error font-semibold">{error}</div>}

              <form onSubmit={handleCreateStartup} className="grid gap-4 sm:grid-cols-2">
                {[
                  ["name", "Startup Name", "HealthFlow AI"],
                  ["industry", "Industry Domain", "Digital Health"],
                  ["budget", "Capital Budget Plan", "25000"],
                  ["country", "Target Country", "United States"],
                  ["targetAudience", "Primary Customer Persona", "Independent clinics"],
                ].map(([key, label, placeholder]) => {
                  if (key === "budget") {
                    return (
                      <div key={key} className="block">
                        <span className="metric-label mb-1.5 block">{label}</span>
                        <div className="flex gap-2">
                          <select
                            value={formCurrency}
                            onChange={(e) => setFormCurrency(e.target.value as CurrencyCode)}
                            className="rounded-xl border border-border bg-card-secondary px-2.5 py-2 text-sm outline-none focus:border-accent"
                          >
                            <option value="USD">🇺🇸 USD ($)</option>
                            <option value="INR">🇮🇳 INR (₹)</option>
                            <option value="EUR">🇪🇺 EUR (€)</option>
                            <option value="GBP">🇬🇧 GBP (£)</option>
                            <option value="AED">🇦🇪 AED (د.إ)</option>
                            <option value="SGD">🇸🇬 SGD (S$)</option>
                          </select>
                          <input
                            required
                            type="number"
                            min="1"
                            value={(form as any)[key]}
                            onChange={(event) => {
                              setFormErrors((prev) => ({ ...prev, budget: false }));
                              setForm((current) => ({ ...current, [key]: event.target.value }));
                            }}
                            placeholder={placeholder}
                            className={`w-full flex-1 ${formErrors.budget ? "border-error/50 shake-error" : ""}`}
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <label key={key} className="block">
                      <span className="metric-label mb-1.5 block">{label}</span>
                      <input
                        required
                        value={(form as any)[key]}
                        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="w-full"
                      />
                    </label>
                  );
                })}
                <label className="block sm:col-span-2">
                  <span className="metric-label mb-1.5 block">Core Value Narrative</span>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe the problem, buyer pain point, product service, and expected revenue loops."
                    className="w-full resize-none"
                  />
                </label>
                <div className="flex justify-end gap-3 border-t border-border pt-5 sm:col-span-2 mt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={creating}>
                    {creating ? "Launching workflow…" : "Create and run pipeline"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
