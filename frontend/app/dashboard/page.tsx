"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Globe2,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth, useCurrency, type CurrencyCode, CURRENCY_RATES } from "../../components/providers";

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

function statusClass(status?: string) {
  if (status === "completed") return "bg-success/10 text-success border border-success/15";
  if (status === "processing") return "bg-accent/10 text-accent border border-accent/15 animate-pulse";
  if (status === "failed") return "bg-red-500/10 text-red-500 border border-red-500/15";
  return "bg-card-secondary text-textSecondary border border-border";
}

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
      router.push(`/project/${startupRes.data.id}`);
    } catch (err: any) {
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
      <Sidebar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-6 lg:p-10">
        {notification && (
          <div className={`rounded-xl border p-4 text-xs font-semibold tracking-wide transition-all ${
            notification.type === "success" 
              ? "border-success/20 bg-success/5 text-success" 
              : "border-red-500/20 bg-red-500/5 text-red-500"
          }`}>
            {notification.message}
          </div>
        )}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <div className="metric-label text-accent font-semibold tracking-wider">Dashboard</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Venture portfolio</h1>
            <p className="mt-1 text-sm text-textSecondary">Track startup workspaces, agent execution metrics, and investor-readiness signals.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-white dark:text-[#0b1832] hover:bg-accent-hover transition duration-300 shadow-sm shadow-accent/5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New startup
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Startups", startups.length, Building2, "Active ideas in the studio"],
            ["Agent Runs", metrics.total_runs || 0, BarChart3, `${metrics.failed_runs || 0} failed runs`],
            ["Success Rate", `${metrics.success_rate || 0}%`, CheckCircle2, "Workflow completion quality"],
            ["Token Usage", (metrics.total_tokens || 0).toLocaleString(), DollarSign, `Avg ${metrics.avg_execution_time || 0}s execution`],
          ].map(([label, value, Icon, helper]: any) => (
            <div key={label} className="premium-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="metric-label">{label}</div>
                  <div className="mt-3 text-2xl font-bold text-foreground tracking-tight">{value}</div>
                </div>
                <div className="p-2 rounded-lg bg-card-secondary/50 border border-border/40">
                  <Icon className="h-4.5 w-4.5 text-accent" strokeWidth={1.75} />
                </div>
              </div>
              <p className="mt-4 border-t border-border pt-3 text-[11px] text-textSecondary font-medium">{helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Startup workspaces</h2>
              <label className="relative block w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-textSecondary" strokeWidth={1.75} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search startups"
                  className="w-full pl-9"
                />
              </label>
            </div>

            {isLoading ? (
              <div className="premium-card flex min-h-56 items-center justify-center p-10">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : filteredStartups.length === 0 ? (
              <div className="premium-card flex min-h-72 flex-col items-center justify-center p-10 text-center">
                <Building2 className="h-10 w-10 text-textSecondary opacity-60 mb-2" strokeWidth={1.5} />
                <h3 className="text-sm font-bold text-foreground">No startup workspaces yet</h3>
                <p className="mt-2 max-w-sm text-xs leading-5 text-textSecondary">Create a startup workspace to coordinate validation, market research, financials, and pitch decks.</p>
                <button type="button" onClick={() => setShowModal(true)} className="mt-5 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-white dark:text-[#0b1832] hover:bg-accent-hover transition duration-300">
                  Create first workspace
                </button>
              </div>
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
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold capitalize tracking-wider ${statusClass(startup.status)}`}>{startup.status || "draft"}</span>
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
                            className="rounded-lg p-1.5 text-textSecondary hover:bg-red-500/5 hover:text-red-500 transition-colors"
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

          <aside className="space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Execution activity</h2>
            <div className="premium-card max-h-[640px] overflow-y-auto p-5">
              {executions.length === 0 ? (
                <p className="py-12 text-center text-xs text-textSecondary">No agent executions recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {executions.slice(0, 12).map((execution) => (
                    <div key={execution.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-foreground">{execution.agent_role || "Agent"} Agent</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize tracking-wider ${statusClass(execution.status)}`}>{execution.status || "queued"}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-textSecondary font-medium">{execution.logs || execution.startup_name || "Execution payload recorded."}</p>
                      <div className="mt-2.5 flex justify-between text-[9px] text-textSecondary font-mono font-bold">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1832]/40 px-4 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true">
          <div className="premium-card w-full max-w-2xl p-7 relative bg-card shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-md font-bold text-foreground tracking-tight">Create startup workspace</h2>
                <p className="mt-1 text-xs text-textSecondary font-medium">These inputs seed validation, research, financials, and pitch generation.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="w-7 h-7 rounded-xl bg-card-secondary hover:bg-border flex items-center justify-center font-bold text-xs text-foreground transition"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500 font-semibold">{error}</div>}

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
                          onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                          placeholder={placeholder}
                          className="w-full flex-1"
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
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-border bg-card px-5 py-3 text-xs font-bold hover:bg-card-secondary transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-white dark:text-[#0b1832] hover:bg-accent-hover transition disabled:opacity-50">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Launching Workflow..." : "Create and Run Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
