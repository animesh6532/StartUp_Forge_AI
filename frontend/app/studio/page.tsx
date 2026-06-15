"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Cpu,
  GitBranch,
  Loader2,
  Play,
  Route,
  WalletCards,
  ChevronRight,
  Database,
  Terminal,
  RefreshCw,
  FolderOpen,
  ArrowUpRight,
  Check
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../components/providers";

// 11 sequential agents in the LangGraph workflow
const sequentialAgents = [
  { key: "validator", name: "Validator Agent", desc: "Viability, risk, and pivot analysis" },
  { key: "research", name: "Research Agent", desc: "Market sizing and segment intelligence" },
  { key: "competitor", name: "Competitor Agent", desc: "Competitive map and differentiation" },
  { key: "finance", name: "Finance Agent", desc: "Forecasts, ARR models, and pricing" },
  { key: "branding", name: "Branding Agent", desc: "Slogans, values, and color palettes" },
  { key: "gtm", name: "GTM Agent", desc: "Channels, sequencing, and growth loops" },
  { key: "technical", name: "Architecture Agent", desc: "Product stack and database layout" },
  { key: "website", name: "Website Agent", desc: "Landing page copywriting structures" },
  { key: "investor", name: "Investor Agent", desc: "Readiness scoring and VC thesis" },
  { key: "pitchdeck", name: "Pitch Agent", desc: "Investor story and slide points" },
  { key: "reviewer", name: "Reviewer Agent", desc: "QA validation and synthetic compilation" }
];

export default function AgentStudioPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  
  // Startups lists and selection
  const [startups, setStartups] = useState<any[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>("new");
  
  // Standalone Agent selection
  const [standaloneAgentRole, setStandaloneAgentRole] = useState("planner");
  
  // Pipeline/Workflow Execution State
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [workflowExecTime, setWorkflowExecTime] = useState<number>(0);
  const [workflowTokens, setWorkflowTokens] = useState<number>(0);
  
  // Individual agent execution status map (keyed by agent key)
  const [agentExecutions, setAgentExecutions] = useState<Record<string, any>>({});
  
  // Standalone Execution Result
  const [standaloneResult, setStandaloneResult] = useState<any | null>(null);
  
  // UI & Debugger Navigation
  const [selectedDebuggerAgent, setSelectedDebuggerAgent] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<"pipeline" | "standalone">("pipeline");
  const [error, setError] = useState("");
  
  // Form Fields
  const [form, setForm] = useState({
    name: "QuantumScale AI",
    industry: "Enterprise Infrastructure",
    description: "An automated GPU resource broker that resells unused tensor units to developers dynamically.",
    budget: "$75,000",
    country: "Global",
    targetAudience: "ML startups and data science labs",
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const runStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up authentication redirect
  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [loading, token, router]);

  // Fetch existing startups on load
  const loadStartups = async () => {
    if (!token) return;
    try {
      const response = await axios.get("/api/v1/startups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStartups(response.data || []);
    } catch (err) {
      console.error("Failed to load startups list", err);
    }
  };

  useEffect(() => {
    loadStartups();
  }, [token]);

  // Handle Startup selection
  const handleStartupSelect = (id: string) => {
    setSelectedStartupId(id);
    if (id === "new") {
      setForm({
        name: "",
        industry: "",
        description: "",
        budget: "",
        country: "",
        targetAudience: "",
      });
    } else {
      const selected = startups.find((s) => s.id === id);
      if (selected) {
        setForm({
          name: selected.name || "",
          industry: selected.industry || "",
          description: selected.description || "",
          budget: selected.budget || "",
          country: selected.country || "",
          targetAudience: selected.target_audience || "",
        });
      }
    }
  };

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      stopTimer();
    };
  }, []);

  const startTimer = () => {
    stopTimer();
    runStartTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - runStartTimeRef.current) / 1000;
      setWorkflowExecTime(elapsed);
    }, 100);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startPolling = (runId: string) => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      pollExecutionStatus(runId);
    }, 1500);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Polling backend for state telemetry
  const pollExecutionStatus = async (runId: string) => {
    try {
      // 1. Fetch individual agent sub-executions
      const executionsRes = await axios.get(`/api/v1/dashboard/executions?workflow_run_id=${runId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const list = executionsRes.data || [];
      const mapping: Record<string, any> = {};
      let totalTokens = 0;
      let activeAgent: string | null = null;
      
      list.forEach((exec: any) => {
        mapping[exec.agent_role] = exec;
        totalTokens += exec.token_consumption || 0;
        if (exec.status === "running") {
          activeAgent = exec.agent_role;
        }
      });
      
      setAgentExecutions(mapping);
      setWorkflowTokens(totalTokens);
      
      // Auto-focus debugger on currently running agent
      if (activeAgent) {
        setSelectedDebuggerAgent(activeAgent);
      }

      // 2. Fetch overall run status from history
      const historyRes = await axios.get("/api/v1/workflows/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const matchingRun = (historyRes.data || []).find((r: any) => r.id === runId);
      if (matchingRun) {
        if (matchingRun.status === "completed") {
          setWorkflowStatus("completed");
          setWorkflowExecTime(matchingRun.execution_time);
          setWorkflowTokens(matchingRun.token_consumption || totalTokens);
          setExecuting(false);
          stopPolling();
          stopTimer();
          loadStartups(); // Refresh dropdown list since status has changed
          
          // Focus debugger on final reviewer QA
          setSelectedDebuggerAgent("reviewer");
        } else if (matchingRun.status === "failed") {
          setWorkflowStatus("failed");
          setExecuting(false);
          stopPolling();
          stopTimer();
        }
      }
    } catch (err) {
      console.error("Polling error", err);
    }
  };

  // Action: Trigger Complete Sequential Pipeline
  const runCompletePipeline = async (event: React.FormEvent) => {
    event.preventDefault();
    setExecutionMode("pipeline");
    setExecuting(true);
    setError("");
    setStandaloneResult(null);
    setWorkflowStatus("running");
    setWorkflowExecTime(0);
    setWorkflowTokens(0);
    setAgentExecutions({});
    setSelectedDebuggerAgent("validator"); // start focusing on validator

    let startupId = selectedStartupId;

    try {
      // Step 1: Create a startup concept first if it's a new layout
      if (startupId === "new") {
        const startupRes = await axios.post(
          "/api/v1/startups",
          {
            name: form.name,
            description: form.description,
            industry: form.industry,
            budget: form.budget,
            country: form.country,
            target_audience: form.targetAudience,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        startupId = startupRes.data.id;
        setSelectedStartupId(startupId);
      }

      // Step 2: Trigger async LangGraph workflow execution
      const runRes = await axios.post(
        "/api/v1/workflows/execute",
        { startup_id: startupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const runId = runRes.data.workflow_run_id;
      setWorkflowRunId(runId);
      
      // Step 3: Launch live timer & polling loop
      startTimer();
      startPolling(runId);

    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not launch workflow execution.");
      setWorkflowStatus("failed");
      setExecuting(false);
    }
  };

  // Action: Run Single Standalone Agent
  const runStandaloneAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    setExecutionMode("standalone");
    setExecuting(true);
    setError("");
    setStandaloneResult(null);

    try {
      const response = await axios.post(
        "/api/v1/agents/run",
        {
          agent_role: standaloneAgentRole,
          startup_info: {
            name: form.name,
            industry: form.industry,
            description: form.description,
            budget: form.budget,
            country: form.country,
            target_audience: form.targetAudience,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStandaloneResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Agent standalone run failed.");
    } finally {
      setExecuting(false);
    }
  };

  if (loading || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Helper to resolve agent item status styling
  const getAgentStatus = (key: string) => {
    if (executionMode === "standalone") return "idle";
    const exec = agentExecutions[key];
    if (!exec) {
      if (workflowStatus === "running") {
        // Simple sequential guess if not executed yet
        const activeIdx = sequentialAgents.findIndex((a) => agentExecutions[a.key]?.status === "running");
        const thisIdx = sequentialAgents.findIndex((a) => a.key === key);
        if (activeIdx !== -1 && thisIdx > activeIdx) return "queued";
        if (activeIdx === -1 && key === "validator") return "running"; // default start
        return "queued";
      }
      return "idle";
    }
    return exec.status; // running, completed, failed
  };

  const selectedDebuggerData = selectedDebuggerAgent ? agentExecutions[selectedDebuggerAgent] : null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-4 lg:p-7">
        
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
          <div>
            <div className="metric-label text-accent font-semibold tracking-wider">Venture Studio Studio</div>
            <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold tracking-tight">
              <Cpu className="h-6 w-6 text-accent animate-pulse" /> Agent Operations Center
            </h1>
            <p className="mt-1 text-sm text-textSecondary">
              Orchestrate the 11-step venture validator pipeline. Run agents sequentially, inspect real-time state payloads, and download compiled investor-ready assets.
            </p>
          </div>
          
          {/* Live Telemetry Bar */}
          <div className="grid grid-cols-3 gap-3 text-xs sm:w-auto">
            <div className="rounded-lg border border-border bg-card p-3 shadow-sm min-w-[110px]">
              <div className="metric-label">Pipeline Status</div>
              <div className="mt-1.5 flex items-center gap-2 font-bold">
                {workflowStatus === "running" ? (
                  <span className="flex items-center gap-1.5 text-accent animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Running
                  </span>
                ) : workflowStatus === "completed" ? (
                  <span className="text-success flex items-center gap-1">✓ Completed</span>
                ) : workflowStatus === "failed" ? (
                  <span className="text-red-500 flex items-center gap-1">⚠ Failed</span>
                ) : (
                  <span className="text-textSecondary">Idle</span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 shadow-sm min-w-[110px]">
              <div className="metric-label">Execution Time</div>
              <div className="mt-1.5 font-bold font-mono">
                {workflowExecTime ? `${workflowExecTime.toFixed(1)}s` : "0.0s"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 shadow-sm min-w-[110px]">
              <div className="metric-label">Token Cost</div>
              <div className="mt-1.5 font-bold font-mono text-accent">
                {workflowTokens ? workflowTokens.toLocaleString() : "0"}
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 transition-all">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="font-semibold">{error}</div>
          </div>
        )}

        {/* Main Double Pane Shell */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Pane - Configuration & Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="premium-card p-6 shadow-sm bg-gradient-to-b from-card to-card/95">
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-accent" /> Venture Configuration
              </h2>
              <p className="mt-1.5 text-xs text-textSecondary">
                Select an existing startup template to load inputs, or type a new operational narrative.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="metric-label mb-1.5 block">Select Concept</span>
                  <select
                    value={selectedStartupId}
                    onChange={(e) => handleStartupSelect(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent"
                  >
                    <option value="new">Create New Concept...</option>
                    {startups.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.industry || "General"})
                      </option>
                    ))}
                  </select>
                </label>

                {[
                  ["name", "Venture Name", "e.g., QuantumScale AI"],
                  ["industry", "Industry Domain", "e.g., Cloud Logistics / Dev Tools"],
                  ["country", "Target Country", "e.g., Germany / Global"],
                  ["budget", "Capital Budget Plan", "e.g., $50,000"],
                  ["targetAudience", "Primary Customer Persona", "e.g., Site Reliability Engineers"],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="block">
                    <span className="metric-label mb-1.5 block">{label}</span>
                    <input
                      required
                      placeholder={placeholder}
                      value={(form as any)[key]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [key]: event.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent"
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="metric-label mb-1.5 block">Value Loop Description</span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a detailed business value loop description..."
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm focus:border-accent"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-border space-y-3">
                <button
                  onClick={runCompletePipeline}
                  disabled={executing || !form.name || !form.description}
                  className="flex w-full items-center justify-center gap-2.5 rounded-md bg-accent py-3 text-xs font-bold text-white shadow-md transition hover:bg-accent/90 disabled:opacity-50"
                >
                  {executing && executionMode === "pipeline" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {executing && executionMode === "pipeline"
                    ? "Executing Venture Pipeline..."
                    : "Trigger Complete Venture Studio Pipeline"}
                </button>

                <div className="flex gap-2">
                  <select
                    value={standaloneAgentRole}
                    onChange={(e) => setStandaloneAgentRole(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs"
                  >
                    {sequentialAgents.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.name} Standalone
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={runStandaloneAgent}
                    disabled={executing || !form.name || !form.description}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-bold hover:bg-background transition disabled:opacity-50"
                  >
                    Run Standalone
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane - Workflow Execution & Live Debugger */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Sequential Timeline Viewer */}
            <div className="premium-card p-6 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-border mb-5">
                <div>
                  <h2 className="text-sm font-bold tracking-wide">Sequential Graph Pipeline</h2>
                  <p className="text-[11px] text-textSecondary mt-0.5">
                    Click any completed node to inspect telemetry data payloads.
                  </p>
                </div>
                <div className="badge-status bg-background text-[10px] text-textSecondary flex items-center gap-1 font-mono">
                  <GitBranch className="h-3 w-3 text-accent" /> 11-step sequential DAG
                </div>
              </div>

              {/* Steps Timeline Grid */}
              <div className="relative border-l border-border pl-5 ml-3 space-y-5">
                {sequentialAgents.map((agent, index) => {
                  const status = getAgentStatus(agent.key);
                  const isDebuggerFocused = selectedDebuggerAgent === agent.key;
                  
                  let dotColorClass = "bg-border";
                  let borderHighlight = "border-transparent";
                  let bgHover = "hover:bg-card/50";
                  
                  if (status === "running") {
                    dotColorClass = "bg-accent animate-ping";
                    borderHighlight = "border-accent/30 bg-accent/5";
                  } else if (status === "completed") {
                    dotColorClass = "bg-success";
                    if (isDebuggerFocused) {
                      borderHighlight = "border-success/40 bg-success/5";
                    }
                  } else if (status === "failed") {
                    dotColorClass = "bg-red-500";
                    borderHighlight = "border-red-500/30 bg-red-500/5";
                  }

                  return (
                    <div
                      key={agent.key}
                      onClick={() => {
                        if (status === "completed" || status === "failed" || agentExecutions[agent.key]) {
                          setSelectedDebuggerAgent(agent.key);
                        }
                      }}
                      className={`relative flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-card shadow-sm transition cursor-pointer ${bgHover} ${borderHighlight}`}
                    >
                      {/* Timeline Dot Connector */}
                      <span className="absolute -left-[26px] top-1/2 -translate-y-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background border border-border">
                        <span className={`h-2 w-2 rounded-full ${dotColorClass}`} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{agent.name}</span>
                          <span className="text-[10px] text-textSecondary font-mono uppercase bg-background px-1.5 py-0.5 rounded border border-border">
                            {agent.key}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-textSecondary truncate">{agent.desc}</p>
                      </div>

                      {/* Status indicator pill */}
                      <div className="flex items-center gap-3 shrink-0">
                        {status === "running" && (
                          <span className="badge-status border-accent/20 bg-accent/5 text-[10px] text-accent animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" /> Node running
                          </span>
                        )}
                        {status === "completed" && (
                          <span className="badge-status border-success/20 bg-success/5 text-[10px] text-success flex items-center gap-1">
                            <Check className="h-3 w-3" /> {agentExecutions[agent.key]?.execution_time?.toFixed(1) || "1.2"}s
                          </span>
                        )}
                        {status === "failed" && (
                          <span className="badge-status border-red-500/20 bg-red-500/5 text-[10px] text-red-500">
                            ⚠ Error
                          </span>
                        )}
                        {status === "queued" && (
                          <span className="text-[10px] text-textSecondary bg-background px-2 py-0.5 rounded border border-border">
                            Queued
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-textSecondary" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payloads Debugger Panel */}
            <div className="premium-card p-6 shadow-sm border-t-2 border-t-accent bg-gradient-to-b from-card to-card/98">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-accent" /> Payload Workflow Debugger
                </h3>
                {selectedDebuggerAgent && (
                  <span className="text-xs font-mono text-accent bg-accent/5 px-2 py-0.5 rounded border border-accent/15">
                    Viewing: {selectedDebuggerAgent}
                  </span>
                )}
              </div>

              {/* Standalone results or Debugger Focused Node */}
              {executionMode === "standalone" ? (
                standaloneResult ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-xs text-textSecondary">
                      <span>Standalone Output</span>
                      <span className="text-success font-semibold">Execution Completed</span>
                    </div>
                    <pre className="max-h-[380px] overflow-auto rounded-lg border border-border bg-background p-4 text-[11px] leading-5 text-textSecondary font-mono">
                      {JSON.stringify(standaloneResult, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="mt-12 text-center py-10">
                    <Database className="h-8 w-8 text-textSecondary mx-auto opacity-40 animate-pulse" />
                    <p className="mt-3 text-xs text-textSecondary">
                      Run a standalone agent to inspect its isolated API response.
                    </p>
                  </div>
                )
              ) : selectedDebuggerAgent && selectedDebuggerData ? (
                <div className="mt-4 space-y-4">
                  {/* Telemetry data header */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-background border border-border rounded-md p-2 text-center">
                      <div className="text-[10px] metric-label">Status</div>
                      <div className="text-xs font-bold capitalize text-success mt-0.5">
                        {selectedDebuggerData.status}
                      </div>
                    </div>
                    <div className="bg-background border border-border rounded-md p-2 text-center">
                      <div className="text-[10px] metric-label">Execution Time</div>
                      <div className="text-xs font-bold mt-0.5">
                        {selectedDebuggerData.execution_time?.toFixed(2) || "0"}s
                      </div>
                    </div>
                    <div className="bg-background border border-border rounded-md p-2 text-center">
                      <div className="text-[10px] metric-label">Tokens Consumed</div>
                      <div className="text-xs font-bold text-accent mt-0.5">
                        {selectedDebuggerData.token_consumption || "0"}
                      </div>
                    </div>
                    <div className="bg-background border border-border rounded-md p-2 text-center">
                      <div className="text-[10px] metric-label">Logs Record</div>
                      <div className="text-xs font-bold text-textSecondary truncate mt-0.5" title={selectedDebuggerData.logs}>
                        {selectedDebuggerData.logs || "None"}
                      </div>
                    </div>
                  </div>

                  {/* Input Payload Accordion */}
                  {selectedDebuggerData.input_data && (
                    <div>
                      <div className="text-xs font-bold text-foreground mb-1">State Input Payload</div>
                      <pre className="max-h-[160px] overflow-auto rounded-md border border-border bg-background p-3 text-[10px] leading-4 text-textSecondary font-mono">
                        {JSON.stringify(selectedDebuggerData.input_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Output Payload Accordion */}
                  {selectedDebuggerData.output_data && (
                    <div>
                      <div className="text-xs font-bold text-foreground mb-1">Generated Output State</div>
                      <pre className="max-h-[300px] overflow-auto rounded-md border border-border bg-background p-3 text-[10px] leading-4 text-textSecondary font-mono">
                        {JSON.stringify(selectedDebuggerData.output_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-12 text-center py-10">
                  <Database className="h-8 w-8 text-textSecondary mx-auto opacity-40 animate-pulse" />
                  <p className="mt-3 text-xs text-textSecondary">
                    Trigger a workflow run, then click any completed agent node in the pipeline timeline to inspect live data flows.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
