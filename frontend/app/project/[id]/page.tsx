"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Globe2,
  Layers3,
  LineChart,
  Loader2,
  Presentation,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  MessageSquare,
  Cpu,
  Palette,
  Send,
  Shield
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import { useAuth, useCurrency } from "../../../components/providers";

const tabs = [
  ["overview", "Overview"],
  ["market", "Market Research"],
  ["competitor", "Competitor Analysis"],
  ["business", "Business Plan"],
  ["finance", "Financial Model"],
  ["brand", "Brand Strategy"],
  ["technical", "Technical Architecture"],
  ["website", "Website Copy"],
  ["pitchdeck", "Pitch Deck"],
  ["reports", "Reports & History"],
  ["cofounder", "AI Co-Founder Chat"],
];

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function firstDefined(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function scoreValue(value: any, fallback = 74) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function statusClass(status?: string) {
  if (status === "completed") return "bg-success/10 text-success border border-success/15";
  if (status === "processing") return "bg-accent/10 text-accent border border-accent/15 animate-pulse";
  if (status === "failed") return "bg-red-500/10 text-red-500 border border-red-500/15";
  return "bg-card-secondary text-textSecondary border border-border";
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { token, loading } = useAuth();
  const { formatVal } = useCurrency();
  const startupId = (params?.id || "") as string;
  const [startup, setStartup] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [loading, token, router]);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!token || !startupId) return;
      try {
        const [startupRes, reportsRes, executionsRes] = await Promise.all([
          axios.get(`/api/v1/startups/${startupId}`),
          axios.get(`/api/v1/reports?startup_id=${startupId}`),
          axios.get("/api/v1/dashboard/executions").catch(() => ({ data: [] })),
        ]);
        setStartup(startupRes.data);
        setReports(reportsRes.data || []);
        setExecutions((executionsRes.data || []).filter((run: any) => !run.startup_id || run.startup_id === startupId));
      } catch (err) {
        console.error("Workspace data unavailable", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorkspace();
  }, [token, startupId]);

  useEffect(() => {
    if (!startup || startup.status !== "processing") return;
    const timer = window.setInterval(async () => {
      try {
        const response = await axios.get(`/api/v1/startups/${startupId}`);
        setStartup(response.data);
        if (response.data.status !== "processing") {
          const reportsRes = await axios.get(`/api/v1/reports?startup_id=${startupId}`);
          setReports(reportsRes.data || []);
          window.clearInterval(timer);
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 3500);
    return () => window.clearInterval(timer);
  }, [startup, startupId]);

  const activeReport = useMemo(() => reports.find((report) => report.status === "completed")?.report_data || reports[0]?.report_data || {}, [reports]);
  const validator = activeReport.validator || {};
  const market = activeReport.market || {};
  const competitor = activeReport.competitor || {};
  const planner = activeReport.planner || {};
  const finance = activeReport.finance || {};
  const pitchdeck = activeReport.pitchdeck || {};
  const branding = activeReport.branding || activeReport.branding_result || {};
  const technical = activeReport.technical || activeReport.technical_result || {};
  const gtm = activeReport.gtm || activeReport.gtm_result || {};
  const website = activeReport.website || activeReport.website_result || {};
  const investor = activeReport.investor || activeReport.investor_result || {};
  const reviewer = activeReport.reviewer || {};

  const extractMarketSize = (val: any) => {
    if (!val) return undefined;
    const str = String(val).trim();
    if (str.split(" ").length === 1) return str;
    const firstWord = str.split(" ")[0];
    if (firstWord.startsWith("$") || firstWord.startsWith("₹") || firstWord.startsWith("€") || firstWord.startsWith("£") || firstWord.startsWith("A$") || firstWord.startsWith("C$") || firstWord.startsWith("S$")) {
      return firstWord;
    }
    return str;
  };

  const tamVal = firstDefined(market.tam, market.total_addressable_market, extractMarketSize(market.tam_sam_som?.tam), "Pending");
  const samVal = firstDefined(market.sam, market.serviceable_available_market, extractMarketSize(market.tam_sam_som?.sam), "Pending");
  const somVal = firstDefined(market.som, market.serviceable_obtainable_market, extractMarketSize(market.tam_sam_som?.som), "Pending");

  // AI Co-Founder Chat State
  const [cofounderChat, setCofounderChat] = useState<any[]>([]);
  const [cfQuestion, setCfQuestion] = useState("");
  const [loadingCf, setLoadingCf] = useState(false);
  const [cfAnalysis, setCfAnalysis] = useState<any | null>(null);

  const runCofounderAudit = async () => {
    setLoadingCf(true);
    try {
      const res = await axios.post("/api/v1/cofounder/analyze", {
        description: startup.description,
        industry: startup.industry,
        country: startup.country || "Global",
      });
      setCfAnalysis(res.data);
      setCofounderChat([
        {
          sender: "ai",
          text: `I've analyzed the venture idea for **${startup.name}** and evaluated the market opportunity.\n\nHere is my honest critique:\n\n*"${res.data.critique}"*`,
        }
      ]);
    } catch (err) {
      console.error("Co-founder audit failed", err);
    } finally {
      setLoadingCf(false);
    }
  };

  const handleSendCfMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfQuestion.trim()) return;
    const userMsg = cfQuestion;
    setCfQuestion("");
    
    const updatedHistory = [...cofounderChat, { sender: "user", text: userMsg }];
    setCofounderChat(updatedHistory);
    
    setLoadingCf(true);
    try {
      const response = await axios.post("/api/v1/cofounder/chat", {
        startup_id: startupId,
        message: userMsg,
        chat_history: cofounderChat
      });
      setCofounderChat((prev) => [...prev, { sender: "ai", text: response.data.response }]);
    } catch (err) {
      console.error("Co-founder chat failed, using local audit fallback", err);
      let aiResponse = "Interesting perspective. However, we must ensure our unit economics make sense and customer acquisition metrics remain sustainable.";
      if (cfAnalysis) {
        const lowerMsg = userMsg.toLowerCase();
        if (lowerMsg.includes("risk") || lowerMsg.includes("threat")) {
          aiResponse = `Here are the critical risks we face:\n\n${cfAnalysis.risks?.map((r: string) => `• ${r}`).join("\n\n")}`;
        } else if (lowerMsg.includes("alternative") || lowerMsg.includes("pivot") || lowerMsg.includes("better")) {
          aiResponse = `I recommend considering these alternative pivots:\n\n${cfAnalysis.better_alternatives?.map((a: string) => `• ${a}`).join("\n\n")}`;
        } else if (lowerMsg.includes("advantage") || lowerMsg.includes("moat") || lowerMsg.includes("positive")) {
          aiResponse = `Our main defensive advantages and moats:\n\n${cfAnalysis.advantages?.map((a: string) => `• ${a}`).join("\n\n")}`;
        } else if (lowerMsg.includes("score") || lowerMsg.includes("market") || lowerMsg.includes("competition")) {
          aiResponse = `Based on my assessment, our Market Opportunity Score is **${cfAnalysis.opportunity_score}%** and the Competition / Market Saturation level is **${cfAnalysis.competition_score}%** (${cfAnalysis.market_saturation}).`;
        }
      }
      setCofounderChat((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    } finally {
      setLoadingCf(false);
    }
  };

  useEffect(() => {
    if (activeTab === "cofounder" && !cfAnalysis && startup) {
      runCofounderAudit();
    }
  }, [activeTab, cfAnalysis, startup]);

  const workspaceScores = [
    ["Startup Score", scoreValue(firstDefined(reviewer.startup_score, activeReport.startup_score), 82), ShieldCheck],
    ["Validation Score", scoreValue(validator.viability_score, 72), CheckCircle2],
    ["Market Potential", scoreValue(firstDefined(market.market_potential_score, market.opportunity_score), 81), TrendingUp],
    ["Competition Score", scoreValue(firstDefined(competitor.competition_score, competitor.differentiation_score), 66), BarChart3],
    ["Investor Readiness", scoreValue(firstDefined(investor.investor_readiness_score, activeReport.investor_readiness_score), 85), Sparkles],
  ];

  const triggerExport = async (format: string) => {
    const completedReport = reports.find((report) => report.status === "completed");
    if (!completedReport) return;
    try {
      const response = await axios.get(`/api/v1/reports/${completedReport.id}/export?format=${format}`, {
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
      
      link.setAttribute("download", `${startup.name || "startup"}-report.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export download failed", err);
      alert("Export failed. Please check authentication and try again.");
    }
  };

  if (loading || isLoading || !startup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card px-5 py-5 lg:px-10 transition-colors">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/dashboard" className="w-8 h-8 rounded-xl bg-card-secondary hover:bg-border flex items-center justify-center text-foreground transition-colors" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              </Link>
              <div className="min-w-0">
                <div className="metric-label text-accent font-semibold tracking-wider">Startup Workspace</div>
                <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-foreground">{startup.name}</h1>
                <p className="mt-1 text-xs text-textSecondary font-medium">{startup.industry || "Uncategorized"} venture studio record</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["pdf", "pptx", "docx"].map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => triggerExport(format)}
                  disabled={!reports.some((report) => report.status === "completed")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-textSecondary hover:bg-card-secondary hover:text-foreground disabled:opacity-40 transition"
                >
                  <Download className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Scores Progress Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 border-t border-border pt-5">
            {workspaceScores.map(([label, value, Icon]: any) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-card-secondary/40 border border-border px-3.5 py-3 text-xs transition">
                <div className="p-1.5 rounded-lg bg-card border border-border">
                  <Icon className="h-4 w-4 text-accent shrink-0" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-textSecondary truncate">{label}</span>
                    <span className="font-bold text-foreground">{value}%</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <main className="grid flex-1 gap-0 overflow-hidden xl:grid-cols-[320px_1fr]">
          <aside className="border-b border-border bg-card p-5 xl:border-b-0 xl:border-r overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-thin">
            <div className="space-y-6">
              <div>
                <div className="metric-label">Concept Narrative</div>
                <p className="mt-3 rounded-xl border border-border bg-card-secondary/40 p-3.5 text-xs leading-relaxed text-textSecondary font-medium">{startup.description || "No description provided."}</p>
              </div>
              <div className="grid gap-3 text-xs">
                {[
                  [Globe2, "Country Target", startup.country || "Not set"],
                  [Users, "Primary Persona", startup.target_audience || "Not set"],
                  [LineChart, "Operational Budget", formatVal(startup.budget) || "Not set"],
                  [Clock3, "Lifecycle Status", startup.status || "draft"],
                ].map(([Icon, label, value]: any) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card-secondary/20 p-3">
                    <Icon className="h-4 w-4 text-textSecondary" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-textSecondary">{label}</div>
                      <div className="truncate font-bold text-foreground mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="metric-label mb-3">Workspace Tabs</div>
                <div className="flex flex-wrap gap-2 xl:flex-col">
                  {tabs.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold tracking-wide transition ${
                        activeTab === key 
                          ? "border-accent/10 bg-accent/5 text-accent font-bold shadow-sm" 
                          : "border-transparent text-textSecondary hover:bg-card-secondary hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 overflow-y-auto p-6 lg:p-9 max-h-[calc(100vh-12rem)]">
            {startup.status === "processing" && (
              <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <div>
                  <h4 className="text-xs font-bold text-accent">Autonomous agent validation in execution...</h4>
                  <p className="mt-1 text-[10px] text-textSecondary">Telemetry reports compilation will refresh once completed by LangGraph nodes.</p>
                </div>
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {workspaceScores.map(([label, value, Icon]: any) => (
                    <div key={label} className="premium-card p-5">
                      <Icon className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} />
                      <div className="mt-4 text-2xl font-bold tracking-tight text-foreground">{value}%</div>
                      <div className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-textSecondary">{label}</div>
                      <div className="mt-4 h-1.5 rounded-full bg-card-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(value, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="premium-card p-6">
                    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground"><Building2 className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} /> Business Model Plan</h2>
                    <p className="mt-4 text-xs leading-relaxed text-textSecondary font-medium">
                      {firstDefined(planner.business_model, planner.strategy_summary, planner.executive_summary, "Business model output will appear here after the planning agent completes.")}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {asArray(firstDefined(planner.key_activities, planner.revenue_streams, [])).slice(0, 4).map((item, index) => (
                        <div key={index} className="rounded-xl border border-border bg-card-secondary/25 p-3 text-[11px] font-medium text-textSecondary">{item}</div>
                      ))}
                    </div>
                  </div>

                  <div className="premium-card p-6">
                    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground"><FileText className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} /> Recent Workspace Deliverables</h2>
                    <div className="mt-5 space-y-3">
                      {reports.length === 0 ? (
                        <p className="text-xs text-textSecondary">No reports generated yet.</p>
                      ) : reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card-secondary/25 p-3.5 text-xs transition">
                          <div>
                            <div className="font-bold text-foreground">{report.report_type || "Venture report"}</div>
                            <div className="mt-1 text-[9px] text-textSecondary font-medium">{report.created_at ? new Date(report.created_at).toLocaleString() : "Generated recently"}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold capitalize tracking-wider ${statusClass(report.status)}`}>{report.status || "queued"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "market" && (
              <WorkspacePanel icon={Globe2} title="Market Research" description="Market sizing, customer segments, trends, and opportunity context.">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ["TAM", formatVal(tamVal)],
                    ["SAM", formatVal(samVal)],
                    ["SOM", formatVal(somVal)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-card-secondary/40 p-4">
                      <div className="metric-label">{label}</div>
                      <div className="mt-2 text-lg font-bold text-foreground tracking-tight">{value}</div>
                    </div>
                  ))}
                </div>
                <ListBlock title="Market Insights" items={asArray(firstDefined(market.insights, market.key_insights, market.trends, market.customer_pain_points, []))} />
              </WorkspacePanel>
            )}

            {activeTab === "competitor" && (
              <WorkspacePanel icon={BarChart3} title="Competitor Analysis" description="Competitive set, differentiation, and strategic risk.">
                <div className="grid gap-4 md:grid-cols-2">
                  {asArray(firstDefined(competitor.competitors, competitor.top_competitors, [])).slice(0, 6).map((item: any, index) => {
                    const name = item.name || item.company || `Competitor ${index + 1}`;
                    const marketShare = item.market_share || item.marketShare || "N/A";
                    const pricing = item.pricing || "N/A";
                    const strengths = item.strengths || item.strength || "N/A";
                    const weaknesses = item.weaknesses || item.weakness || "N/A";
                    const positioning = item.positioning || item.description || "N/A";

                    return (
                      <div key={index} className="premium-card p-5 space-y-4 text-xs">
                        <div className="flex justify-between items-start border-b border-border pb-3">
                          <div>
                            <h3 className="text-xs font-bold text-foreground">{name}</h3>
                            <p className="text-[9px] text-accent font-bold uppercase tracking-wider mt-1">Positioning: {positioning}</p>
                          </div>
                          <span className="bg-accent/10 border border-accent/15 text-accent text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide">
                            Share: {marketShare}
                          </span>
                        </div>
                        <div className="grid gap-3 font-medium text-textSecondary">
                          <div>
                            <span className="font-bold text-foreground">Pricing:</span>{" "}
                            <span>{pricing}</span>
                          </div>
                          <div>
                            <span className="font-bold text-foreground">Strengths:</span>{" "}
                            <span>{strengths}</span>
                          </div>
                          <div>
                            <span className="font-bold text-foreground">Weaknesses:</span>{" "}
                            <span>{weaknesses}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {competitor.positioning_matrix && (
                  <div className="premium-card p-5 mt-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} /> Competitor Positioning Matrix
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 text-xs">
                      <div className="space-y-2 bg-card-secondary/40 border border-border p-3.5 rounded-xl">
                        <div>
                          <span className="font-bold text-foreground">X-Axis:</span>{" "}
                          <span className="text-textSecondary font-semibold">{competitor.positioning_matrix.x_axis}</span>
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Y-Axis:</span>{" "}
                          <span className="text-textSecondary font-semibold">{competitor.positioning_matrix.y_axis}</span>
                        </div>
                      </div>
                      <p className="text-textSecondary font-medium leading-relaxed bg-card-secondary/40 border border-border p-3.5 rounded-xl flex items-center">
                        {competitor.positioning_matrix.description}
                      </p>
                    </div>
                  </div>
                )}
                <ListBlock title="Differentiation Opportunities" items={asArray(firstDefined(competitor.differentiation_opportunities, competitor.gaps, []))} />
              </WorkspacePanel>
            )}

            {activeTab === "business" && (
              <WorkspacePanel icon={BookOpen} title="Business Plan" description="Strategy, value proposition, segments, and operating plan.">
                <p className="rounded-xl border border-border bg-card-secondary/20 p-4 text-xs leading-relaxed text-textSecondary font-medium">
                  {firstDefined(planner.executive_summary, planner.strategy_summary, planner.business_model, "The business plan will appear after report generation completes.")}
                </p>
                <ListBlock title="Strategic Priorities" items={asArray(firstDefined(planner.strategic_priorities, planner.action_items, planner.swot?.strengths, []))} />
                {gtm && (gtm.primary_channels || gtm.launch_tactics || gtm.acquisition_timeline) && (
                  <div className="mt-8 space-y-6">
                    <div className="border-t border-border pt-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
                        <TrendingUp className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} /> Go-To-Market (GTM) Strategy
                      </h3>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="premium-card p-5 space-y-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent">Acquisition Channels & Launch Tactics</h4>
                          <ul className="space-y-2 text-xs text-textSecondary font-medium list-disc pl-4">
                            {asArray(gtm.primary_channels).map((c: string, idx: number) => (
                              <li key={idx}>{c}</li>
                            ))}
                            {asArray(gtm.launch_tactics).map((t: string, idx: number) => (
                              <li key={idx} className="italic">{t}</li>
                            ))}
                          </ul>
                          {asArray(gtm.primary_channels).length === 0 && asArray(gtm.launch_tactics).length === 0 && (
                            <p className="text-xs text-textSecondary font-medium">No primary channels or launch tactics generated yet.</p>
                          )}
                        </div>
                        {gtm.acquisition_timeline && (
                          <div className="premium-card p-5 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent">Launch Timeline</h4>
                            <div className="space-y-2.5 text-xs text-textSecondary font-medium">
                              {gtm.acquisition_timeline.month1_3 && (
                                <div>
                                  <span className="font-bold text-foreground">Months 1-3: </span>
                                  <span>{gtm.acquisition_timeline.month1_3}</span>
                                </div>
                              )}
                              {gtm.acquisition_timeline.month4_6 && (
                                <div>
                                  <span className="font-bold text-foreground">Months 4-6: </span>
                                  <span>{gtm.acquisition_timeline.month4_6}</span>
                                </div>
                              )}
                              {gtm.acquisition_timeline.month7_12 && (
                                <div>
                                  <span className="font-bold text-foreground">Months 7-12: </span>
                                  <span>{gtm.acquisition_timeline.month7_12}</span>
                                </div>
                              )}
                              {!gtm.acquisition_timeline.month1_3 && !gtm.acquisition_timeline.month4_6 && !gtm.acquisition_timeline.month7_12 && (
                                <p className="text-xs text-textSecondary">No timeline details generated yet.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </WorkspacePanel>
            )}

            {activeTab === "finance" && (
              <WorkspacePanel icon={LineChart} title="Financial Forecast" description="Revenue assumptions, cost drivers, break-even, and model highlights.">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ["Year 1 Revenue", formatVal(firstDefined(finance.year_1_revenue, finance.revenue_year_1, "Pending"))],
                    ["Break-even", formatVal(firstDefined(finance.break_even_point, finance.breakeven, "Pending"))],
                    ["Gross Margin", firstDefined(finance.gross_margin, finance.target_margin, "Pending")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-card-secondary/40 p-4">
                      <div className="metric-label">{label}</div>
                      <div className="mt-2 text-lg font-bold text-foreground tracking-tight">{value}</div>
                    </div>
                  ))}
                </div>
                <ListBlock title="Assumptions" items={asArray(firstDefined(finance.key_assumptions, finance.assumptions, []))} />
              </WorkspacePanel>
            )}

            {activeTab === "pitchdeck" && (
              <WorkspacePanel icon={Presentation} title="Pitch Deck & Investor Readiness" description="Investor narrative, slide sequence, funding eligibility criteria, and compiled materials.">
                {investor && (investor.readiness_level || investor.vc_investment_thesis || investor.positives || investor.red_flags) && (
                  <div className="grid gap-6 md:grid-cols-2 mb-8">
                    <div className="premium-card p-5 space-y-3">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent">Investment Thesis Position</h4>
                        <span className="bg-accent/10 border border-accent/15 text-accent text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide">{investor.readiness_level}</span>
                      </div>
                      <p className="text-xs text-textSecondary font-medium leading-relaxed">{investor.vc_investment_thesis}</p>
                    </div>
                    <div className="premium-card p-5 space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-b border-border pb-2">Venture Compliance Highlights</h4>
                      <div className="space-y-2 text-xs font-semibold">
                        {asArray(investor.positives).slice(0, 2).map((item: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-start text-success">
                            <span className="font-bold">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                        {asArray(investor.red_flags).slice(0, 2).map((item: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-start text-red-500">
                            <span className="font-bold">!</span>
                            <span>{item}</span>
                          </div>
                        ))}
                        {asArray(investor.positives).length === 0 && asArray(investor.red_flags).length === 0 && (
                          <p className="text-xs text-textSecondary font-medium">No assessment highlights compiled yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">Slide Deck Sequence</h3>
                <div className="grid gap-4">
                  {asArray(firstDefined(pitchdeck.slides, pitchdeck.deck_outline, [])).slice(0, 10).map((slide: any, index) => (
                    <div key={index} className="rounded-xl border border-border bg-card-secondary/25 p-4 flex flex-col gap-2">
                      <div className="metric-label">Slide {index + 1}</div>
                      <div className="text-sm font-bold text-foreground tracking-tight">{slide.title || slide.slide_title || `Slide ${index + 1}`}</div>
                      <p className="text-xs leading-relaxed text-textSecondary font-medium">{slide.content || slide.body || slide.narrative || "Slide details pending."}</p>
                    </div>
                  ))}
                </div>
              </WorkspacePanel>
            )}

            {activeTab === "brand" && (
              <WorkspacePanel icon={Palette} title="Brand Strategy" description="Visual identity, tone guidelines, core values, and slogans.">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Brand Slogans</h3>
                    <div className="space-y-2">
                      {asArray(branding.brand_slogans).map((slogan: string, idx: number) => (
                        <div key={idx} className="rounded-xl border border-border bg-card-secondary/25 p-3.5 text-xs font-bold italic text-center text-textSecondary">
                          "{slogan}"
                        </div>
                      ))}
                      {!branding.brand_slogans && <p className="text-xs text-textSecondary font-medium">No slogans compiled yet.</p>}
                    </div>
                  </div>

                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Brand Voice Tone</h3>
                    <p className="text-xs leading-relaxed text-textSecondary font-medium bg-card-secondary/20 border border-border p-3.5 rounded-xl">
                      {branding.tone_of_voice || "Tone details pending execution."}
                    </p>
                  </div>
                </div>

                <div className="premium-card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Core Brand Values</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {asArray(branding.brand_values).map((value: string, idx: number) => {
                      const [title, desc] = value.split(" - ");
                      return (
                        <div key={idx} className="rounded-xl border border-border bg-card-secondary/20 p-4 text-xs font-medium text-textSecondary">
                          <div className="font-bold text-accent mb-1.5 uppercase tracking-wider text-[10px]">{title}</div>
                          <div className="leading-normal">{desc || ""}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="premium-card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Visual Color Palette</h3>
                  <div className="grid gap-4 sm:grid-cols-4">
                    {asArray(branding.color_palette).map((color: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-border bg-card-secondary/20 p-4 flex flex-col items-center gap-3 transition">
                        <div className="w-12 h-12 rounded-xl shadow-md border border-border/50" style={{ backgroundColor: color.hex_code }} />
                        <div className="text-center">
                          <div className="font-bold text-xs text-foreground">{color.color_name}</div>
                          <code className="text-[10px] text-accent font-bold tracking-wide mt-1 block">{color.hex_code}</code>
                          <div className="text-[9px] text-textSecondary font-medium mt-1">{color.usage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </WorkspacePanel>
            )}

            {activeTab === "technical" && (
              <WorkspacePanel icon={Cpu} title="Technical Architecture" description="Tech stack components, database layout, system topology, and development timeline.">
                <div className="premium-card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">MVP Stack Architecture</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {Object.entries(technical.tech_stack || {}).map(([key, value]: any) => (
                      <div key={key} className="rounded-xl border border-border bg-card-secondary/25 p-3.5 text-xs font-medium">
                        <div className="font-bold uppercase text-accent text-[9px] tracking-wider mb-1.5">{key}</div>
                        <div className="font-bold text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">System Topology Graph</h3>
                    <pre className="max-h-[300px] overflow-auto rounded-xl border border-border bg-card-secondary/40 p-4 text-[10px] font-mono leading-relaxed text-textSecondary">
                      {technical.system_architecture_diagram || "Diagram pending."}
                    </pre>
                  </div>

                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Database Schema</h3>
                    <p className="text-xs leading-relaxed text-textSecondary font-medium bg-card-secondary/40 border border-border p-3.5 rounded-xl">
                      {technical.database_design_summary || "DB design pending."}
                    </p>
                  </div>
                </div>

                <div className="premium-card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">MVP Roadmap</h3>
                  <div className="space-y-2">
                    {asArray(technical.mvp_roadmap).map((phase: string, idx: number) => (
                      <div key={idx} className="flex gap-3.5 items-start rounded-xl border border-border bg-card-secondary/20 p-3.5 text-xs text-textSecondary font-medium">
                        <div className="w-5 h-5 rounded-lg bg-accent text-white dark:text-[#0b1832] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</div>
                        <p className="leading-relaxed">{phase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </WorkspacePanel>
            )}

            {activeTab === "website" && (
              <WorkspacePanel icon={Globe2} title="Website Architecture & Copywriting" description="Targeted landing page structure, high-conversion section copy, and SEO meta tags.">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b border-border pb-2">Hero Section Copy</h3>
                    {website.hero_section ? (
                      <div className="space-y-3 bg-card-secondary/20 border border-border p-4 rounded-xl font-medium text-xs">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-textSecondary">Headline</div>
                          <div className="text-sm font-bold mt-1 text-foreground leading-normal">{website.hero_section.headline}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-textSecondary mt-2">Subheadline</div>
                          <p className="text-textSecondary leading-relaxed mt-1">{website.hero_section.subheadline}</p>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-textSecondary mt-2">CTA Button</div>
                          <div className="inline-block mt-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white dark:text-[#0b1832] uppercase">{website.hero_section.cta_button_text || "Get Started"}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-textSecondary font-medium">Hero copy pending execution.</p>
                    )}
                  </div>

                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b border-border pb-2">SEO Meta Data</h3>
                    {website.seo_meta ? (
                      <div className="space-y-3 bg-card-secondary/20 border border-border p-4 rounded-xl text-xs font-medium text-textSecondary">
                        <div>
                          <span className="font-bold text-foreground">Title Tag: </span>
                          <span>{website.seo_meta.title_tag}</span>
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Meta Description: </span>
                          <p className="mt-1 leading-relaxed">{website.seo_meta.meta_description}</p>
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Keywords: </span>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {asArray(website.seo_meta.keywords).map((kw: string, idx: number) => (
                              <span key={idx} className="bg-card border border-border px-2 py-0.5 rounded-lg text-[9px] font-bold text-textSecondary uppercase">{kw}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-textSecondary font-medium">SEO meta tags pending execution.</p>
                    )}
                  </div>
                </div>

                <div className="premium-card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Conversion-Focused Sections</h3>
                  <div className="space-y-4">
                    {asArray(website.page_sections).map((section: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-border bg-card-secondary/20 p-4 text-xs font-medium">
                        <div className="flex items-center gap-2.5 mb-2.5 border-b border-border/40 pb-2">
                          <span className="w-5 h-5 rounded-lg bg-accent text-white dark:text-[#0b1832] flex items-center justify-center font-bold text-[10px]">{section.placement_order || idx + 1}</span>
                          <h4 className="font-bold text-foreground">{section.title}</h4>
                        </div>
                        <p className="text-textSecondary leading-relaxed pl-7">{section.content_body}</p>
                      </div>
                    ))}
                    {asArray(website.page_sections).length === 0 && (
                      <p className="text-xs text-textSecondary text-center py-4 font-medium">No section copy compiled yet.</p>
                    )}
                  </div>
                </div>
              </WorkspacePanel>
            )}

            {activeTab === "reports" && (
              <WorkspacePanel icon={FileText} title="Reports & Telemetry logs" description="Compiled outputs and coordination agent audit history logs.">
                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Compiled Plans</h3>
                    <div className="premium-card p-5 space-y-4">
                      {reports.length === 0 ? (
                        <p className="text-xs text-textSecondary">No report records found.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {reports.map((report) => (
                            <div key={report.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3 text-xs">
                              <div>
                                <div className="font-bold text-foreground">{report.report_type || "Venture analysis"}</div>
                                <div className="text-[10px] text-textSecondary font-medium mt-1">Generated {report.created_at ? new Date(report.created_at).toLocaleString() : "Recently"}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold capitalize tracking-wider ${statusClass(report.status)}`}>{report.status}</span>
                                {report.status === "completed" && ["pdf", "pptx", "docx"].map((fmt) => (
                                  <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => triggerExport(fmt)}
                                    className="bg-accent/10 border border-accent/15 text-accent font-bold uppercase text-[9px] px-2 py-1 rounded-lg hover:bg-accent hover:text-white dark:hover:text-[#0b1832] transition"
                                  >
                                    {fmt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Node Execution History</h3>
                    <div className="premium-card p-5 max-h-[400px] overflow-y-auto space-y-3">
                      {executions.map((run) => (
                        <div key={run.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-foreground">{run.agent_role || "Venture"} Node</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${statusClass(run.status)}`}>{run.status}</span>
                          </div>
                          <p className="text-[10px] text-textSecondary mt-1.5 leading-relaxed font-medium">{run.logs || "Node executed."}</p>
                          <div className="text-[9px] text-textSecondary mt-2 flex gap-3 font-mono font-bold">
                            <span>{run.execution_time ? `${Number(run.execution_time).toFixed(1)}s` : "Pending"}</span>
                            <span>{run.token_consumption ? `${run.token_consumption} tokens` : ""}</span>
                          </div>
                        </div>
                      ))}
                      {executions.length === 0 && <p className="text-xs text-textSecondary text-center py-6">No executions history yet.</p>}
                    </div>
                  </div>
                </div>
              </WorkspacePanel>
            )}

            {activeTab === "cofounder" && (
              <WorkspacePanel icon={MessageSquare} title="AI Co-FounderDialogue" description="Stress-test, critique, and evaluate business model risks and advantages.">
                <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                  <aside className="space-y-4">
                    <div className="premium-card p-5 space-y-5">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-textSecondary border-b border-border pb-2">Venture Audit Metrics</h3>
                      {cfAnalysis ? (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs font-medium mb-1">
                              <span className="text-textSecondary">Opportunity Rating</span>
                              <span className="font-bold text-accent">{cfAnalysis.opportunity_score}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-card-secondary border border-border overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${cfAnalysis.opportunity_score}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-medium mb-1">
                              <span className="text-textSecondary">Competition Risk</span>
                              <span className="font-bold text-accent">{cfAnalysis.competition_score}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-card-secondary border border-border overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${cfAnalysis.competition_score}%` }} />
                            </div>
                          </div>

                          <div className="text-[10px] bg-card-secondary/35 border border-border/50 p-2.5 rounded-xl leading-relaxed text-textSecondary font-semibold">
                            <strong>Market Status:</strong> {cfAnalysis.market_saturation}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-textSecondary font-medium">Evaluate narrative to populate VC metrics.</p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={loadingCf}
                      onClick={runCofounderAudit}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-bold text-white dark:text-[#0b1832] hover:bg-accent-hover transition disabled:opacity-50"
                    >
                      {loadingCf && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {loadingCf ? "Compiling Analysis..." : "Execute Venture Audit"}
                    </button>
                  </aside>

                  <div className="premium-card flex flex-col justify-between min-h-[460px] overflow-hidden">
                    <header className="border-b border-border bg-card/40 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-accent" strokeWidth={2} />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">AI Co-Founder Auditor</h4>
                          <span className="text-[9px] text-success font-bold flex items-center gap-1 uppercase tracking-wider"><span className="w-1.5 h-1.5 bg-success rounded-full animate-ping" /> Online</span>
                        </div>
                      </div>
                    </header>

                    <div className="flex-1 bg-card-secondary/10 p-5 overflow-y-auto space-y-4 max-h-[340px] scrollbar-thin">
                      {cofounderChat.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-textSecondary font-medium">
                          <MessageSquare className="w-8 h-8 text-border mb-3 opacity-60" strokeWidth={1.5} />
                          <p className="font-bold text-foreground">Awaiting dialogue instructions.</p>
                          <p className="mt-1 text-textMuted">Initiate the evaluation audit to trigger stress-testing dialogs.</p>
                        </div>
                      ) : (
                        cofounderChat.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-md rounded-xl p-3.5 text-xs leading-relaxed whitespace-pre-line font-medium ${msg.sender === "user" ? "bg-accent text-white dark:text-[#0b1832]" : "bg-card border border-border text-foreground shadow-sm"}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      {loadingCf && (
                        <div className="flex justify-start">
                          <div className="bg-card border border-border rounded-xl p-3.5 text-xs flex items-center gap-2 text-textSecondary font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" /> Analyzing model metrics...
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendCfMessage} className="border-t border-border p-3 flex gap-2 bg-card/20">
                      <input
                        value={cfQuestion}
                        onChange={(e) => setCfQuestion(e.target.value)}
                        placeholder="Ask about 'risks', 'advantages', 'moats', or 'pivots'..."
                        className="flex-1 px-4 text-xs"
                        disabled={loadingCf || cofounderChat.length === 0}
                      />
                      <button
                        type="submit"
                        className="bg-accent text-white dark:text-[#0b1832] rounded-xl p-3 hover:opacity-90 disabled:opacity-40 transition"
                        disabled={loadingCf || !cfQuestion.trim() || cofounderChat.length === 0}
                        aria-label="Send message"
                      >
                        <Send className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </form>
                  </div>
                </div>
              </WorkspacePanel>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function WorkspacePanel({ icon: Icon, title, description, children }: any) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4 transition-colors">
        <h2 className="flex items-center gap-2 text-md font-bold text-foreground uppercase tracking-wider"><Icon className="h-5 w-5 text-accent animate-pulse" strokeWidth={1.5} /> {title}</h2>
        <p className="mt-1.5 text-xs text-textSecondary font-medium">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card-secondary/20 p-8 text-center text-xs text-textSecondary font-medium">
        {title} will appear here when the relevant agent telemetry becomes available.
      </div>
    );
  }

  return (
    <div className="premium-card p-5">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground mb-4"><Sparkles className="h-4.5 w-4.5 text-accent" strokeWidth={1.5} /> {title}</h3>
      <div className="mt-4 grid gap-3">
        {items.slice(0, 8).map((item, index) => (
          <div key={index} className="flex gap-3.5 rounded-xl border border-border bg-card-secondary/20 p-3.5 text-xs leading-relaxed text-textSecondary font-medium">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} />
            <span>{typeof item === "string" ? item : item.description || item.title || JSON.stringify(item)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
