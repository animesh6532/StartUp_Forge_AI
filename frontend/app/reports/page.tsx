"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Download, FileArchive, FileText, Loader2, Presentation, Search, Sheet } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../components/providers";

function statusClass(status?: string) {
  if (status === "completed") return "bg-success/10 text-success border border-success/15";
  if (status === "processing") return "bg-accent/10 text-accent border border-accent/15 animate-pulse";
  if (status === "failed") return "bg-red-500/10 text-red-500 border border-red-500/15";
  return "bg-card-secondary text-textSecondary border border-border";
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [startups, setStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [loading, token, router]);

  useEffect(() => {
    const loadReports = async () => {
      if (!token) return;
      try {
        const [startupsRes, reportsRes] = await Promise.all([
          axios.get("/api/v1/startups").catch(() => ({ data: [] })),
          axios.get("/api/v1/reports").catch(() => ({ data: [] })),
        ]);
        setStartups(startupsRes.data || []);
        setReports(reportsRes.data || []);
      } catch (err) {
        console.error("Reports unavailable", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, [token]);

  const startupById = useMemo(() => new Map(startups.map((startup) => [startup.id, startup])), [startups]);
  const filteredReports = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return reports;
    return reports.filter((report) => {
      const startup = startupById.get(report.startup_id);
      return `${report.report_type} ${report.status} ${startup?.name || ""}`.toLowerCase().includes(normalized);
    });
  }, [query, reports, startupById]);

  const exportReport = async (reportId: string, format: string) => {
    const startup = startupById.get(reports.find((r) => r.id === reportId)?.startup_id);
    try {
      const response = await axios.get(`/api/v1/reports/${reportId}/export?format=${format}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const contentType = response.headers["content-type"];
      const blob = new Blob([response.data], { type: typeof contentType === "string" ? contentType : undefined });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      
      let extension = format;
      if (format === "pptx") extension = "pptx";
      else if (format === "docx") extension = "docx";
      else extension = "pdf";
      
      link.setAttribute("download", `${startup?.name || "startup"}-report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export download failed", err);
      alert("Export failed. Please check authentication and try again.");
    }
  };

  if (loading || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const counts = {
    all: reports.length,
    pdf: reports.filter((report) => report.status === "completed").length,
    ppt: reports.filter((report) => report.report_type?.includes("pitch") || report.report_type?.includes("deck")).length,
    processing: reports.filter((report) => report.status === "processing").length,
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <div className="metric-label text-accent font-semibold tracking-wider">Report Center</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Investor deliverables</h1>
            <p className="mt-1 text-sm text-textSecondary">Manage compiled reports, SWOT logs, and export presentation assets.</p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-textSecondary" strokeWidth={1.75} />
            <input 
              value={query} 
              onChange={(event) => setQuery(event.target.value)} 
              placeholder="Search reports" 
              className="w-full pl-9" 
            />
          </label>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            [FileArchive, "Total Deliverables", counts.all],
            [FileText, "Validated Packages", counts.pdf],
            [Presentation, "Slide Assets", counts.ppt],
            [Sheet, "Compiling Status", counts.processing],
          ].map(([Icon, label, value]: any) => (
            <div key={label} className="premium-card p-5">
              <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
              <div className="mt-4 text-2xl font-bold tracking-tight text-foreground">{value}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-textSecondary">{label}</div>
            </div>
          ))}
        </section>

        {/* Premium Redesigned Table / List View */}
        <section className="premium-card overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_180px_220px] border-b border-border bg-card-secondary/40 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-textSecondary max-lg:hidden">
            <span>Venture Plan Scope</span>
            <span>Compilation Status</span>
            <span>Generated Checkpoint</span>
            <span className="text-right">Export Deliverables</span>
          </div>
          
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-16 text-center text-xs text-textSecondary font-medium">No reports match this view yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredReports.map((report) => {
                const startup = startupById.get(report.startup_id);
                return (
                  <div key={report.id} className="grid gap-4 px-6 py-5 text-xs lg:grid-cols-[1fr_140px_180px_220px] lg:items-center hover:bg-card-secondary/25 transition">
                    <div>
                      <div className="font-bold text-foreground text-sm tracking-tight">{report.report_type || "Venture analysis"}</div>
                      <button 
                        type="button" 
                        onClick={() => report.startup_id && router.push(`/project/${report.startup_id}`)} 
                        className="mt-1.5 text-xs text-textSecondary hover:text-accent font-semibold flex items-center gap-1 transition"
                      >
                        {startup?.name || "Startup workspace"}
                      </button>
                    </div>
                    <div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold capitalize tracking-wider ${statusClass(report.status)}`}>
                        {report.status || "queued"}
                      </span>
                    </div>
                    <span className="text-xs text-textSecondary font-semibold">
                      {report.created_at ? new Date(report.created_at).toLocaleString() : "Recently"}
                    </span>
                    <div className="flex justify-start gap-2 lg:justify-end">
                      {["pdf", "pptx", "docx"].map((format) => (
                        <button
                          key={format}
                          type="button"
                          disabled={report.status !== "completed"}
                          onClick={() => exportReport(report.id, format)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-textSecondary hover:bg-card-secondary hover:text-foreground disabled:opacity-40 transition"
                        >
                          <Download className="h-3.5 w-3.5 text-accent" strokeWidth={2} /> {format}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
