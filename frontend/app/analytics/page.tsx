"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Activity, BarChart3, CheckCircle2, Clock3, FileText, Layers3, LineChart, Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "../../components/providers";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [startups, setStartups] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [executions, setExecutions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [loading, token, router]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!token) return;
      try {
        const [startupsRes, metricsRes, executionsRes, reportsRes] = await Promise.all([
          axios.get("/api/v1/startups").catch(() => ({ data: [] })),
          axios.get("/api/v1/dashboard/metrics").catch(() => ({ data: {} })),
          axios.get("/api/v1/dashboard/executions").catch(() => ({ data: [] })),
          axios.get("/api/v1/reports").catch(() => ({ data: [] })),
        ]);
        setStartups(startupsRes.data || []);
        setMetrics(metricsRes.data || {});
        setExecutions(executionsRes.data || []);
        setReports(reportsRes.data || []);
      } catch (err) {
        console.error("Analytics unavailable", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, [token]);

  const completionRate = useMemo(() => {
    if (startups.length === 0) return 0;
    return Math.round((startups.filter((startup) => startup.status === "completed").length / startups.length) * 100);
  }, [startups]);

  const trendRows = useMemo(() => {
    const industries = new Map<string, number>();
    startups.forEach((startup) => industries.set(startup.industry || "Uncategorized", (industries.get(startup.industry || "Uncategorized") || 0) + 1));
    return Array.from(industries.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [startups]);

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
        <div className="border-b border-border pb-6">
          <div className="metric-label text-accent font-semibold tracking-wider">Analytics</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Venture studio performance</h1>
          <p className="mt-1 text-sm text-textSecondary">Enterprise-grade metrics for startups, compiled deliverables, and agent executions.</p>
        </div>

        {isLoading ? (
          <div className="premium-card flex min-h-96 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                [Layers3, "Total Startups", startups.length],
                [CheckCircle2, "Validation Scores", `${completionRate}% complete`],
                [FileText, "Compiled Reports", reports.length],
                [Activity, "Agent Runs", metrics.total_runs || executions.length],
                [BarChart3, "Workflow Success Rate", `${metrics.success_rate || completionRate}%`],
                [Clock3, "Execution Duration", `${metrics.avg_execution_time || 0}s avg`],
                [LineChart, "Token Usage", (metrics.total_tokens || 0).toLocaleString()],
                [TrendingUp, "Failed Runs", metrics.failed_runs || 0],
              ].map(([Icon, label, value]: any) => (
                <div key={label} className="premium-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
                      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-textSecondary">{label}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-card-secondary/50 border border-border/40">
                      <Icon className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-8 xl:grid-cols-[1fr_420px]">
              <div className="premium-card p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Market opportunity trends</h2>
                <p className="mt-1 text-xs text-textSecondary font-medium">Startup distribution by industry domain in the workspace.</p>
                <div className="mt-6 space-y-5">
                  {trendRows.length === 0 ? (
                    <p className="text-xs text-textSecondary">No startup data available.</p>
                  ) : trendRows.map(([industry, count], index) => {
                    const width = Math.max(10, Math.round((count / Math.max(...trendRows.map(([, value]) => value))) * 100));
                    const colors = ["bg-accent", "bg-success", "bg-textSecondary"];
                    const barColor = colors[index % colors.length];
                    return (
                      <div key={industry} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{industry}</span>
                          <span className="text-textSecondary">{count} startup{count === 1 ? "" : "s"}</span>
                        </div>
                        <div className="h-2 rounded-full bg-card-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="premium-card p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Execution duration logs</h2>
                <p className="mt-1 text-xs text-textSecondary font-medium">Telemetry metrics from recent agent runs.</p>
                <div className="mt-6 space-y-3">
                  {executions.slice(0, 8).map((run, index) => {
                    const colors = ["bg-success", "bg-textSecondary", "bg-accent"];
                    const barColor = colors[index % colors.length];
                    return (
                      <div key={run.id} className="rounded-xl border border-border bg-card-secondary/25 p-3.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3 text-xs font-bold">
                          <span className="text-foreground">{run.agent_role || "Venture"} Node</span>
                          <span className="text-textSecondary font-mono">{run.execution_time ? `${Number(run.execution_time).toFixed(1)}s` : "Pending"}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, Number(run.execution_time || 1) * 8)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {executions.length === 0 && <p className="text-xs text-textSecondary">No executions recorded yet.</p>}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
