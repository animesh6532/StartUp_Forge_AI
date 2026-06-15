"use client";

import React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  Layers3,
  LineChart,
  Network,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Terminal,
  Loader2,
  Activity,
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { asArray, isValidDemoLog } from "../utils/array";
import { useCurrency, type CurrencyCode } from "../components/providers";

class DemoErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Demo simulation crash caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-error/20 bg-error/5 p-6 text-center text-xs text-error">
          <AlertCircle className="h-6 w-6 text-error mx-auto mb-2" />
          <p className="font-semibold">The simulation console encountered an unexpected rendering error.</p>
          <button 
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-3 py-1.5 bg-error text-white rounded-xl font-bold hover:opacity-90 transition"
          >
            Reset Simulation Console
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Framer Motion Animation Options
const sectionReveal = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
} as const;

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.06,
    },
  },
  viewport: { once: true, amount: 0.10 },
} as const;

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
  },
} as const;

const workflow = [
  ["Capture", "Structure the idea, founder constraints, market, budget, and audience."],
  ["Validate", "Score feasibility, pressure-test assumptions, and surface pivot paths."],
  ["Build Case", "Generate market research, business model, GTM, and financial logic."],
  ["Package", "Export investor-ready reports, decks, and technical architecture."],
];

const agents = [
  ["Validator Agent", "Scores viability and flags structural risk."],
  ["Research Agent", "Builds market maps, segments, and TAM/SAM/SOM context."],
  ["Planner Agent", "Turns the concept into a coherent operating model."],
  ["Finance Agent", "Models revenue, costs, assumptions, and break-even timing."],
  ["Pitch Agent", "Packages the story into investor-facing slides."],
  ["Architecture Agent", "Defines the product stack and implementation shape."],
];

const features: Array<[LucideIcon, string, string]> = [
  [ClipboardCheck, "Idea Validation", "Viability scoring, risk analysis, and recommended pivots."],
  [LineChart, "Financial Forecasts", "Revenue, cost, and execution assumptions in a founder-readable model."],
  [Network, "Market Intelligence", "Segments, competitors, positioning, and opportunity signals."],
  [FileText, "Report Exports", "Business plans, research memos, and pitch material ready to share."],
  [GitBranch, "Agent Workflows", "Track dependency chains, execution history, token usage, and status."],
  [Layers3, "Startup Workspace", "One operating room for the entire lifecycle of each venture."],
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const { currency, setCurrency, formatVal } = useCurrency();

  // Parallax background offset
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 800], [0, 140]);

  // Demo state
  const [demoIdea, setDemoIdea] = React.useState("Airbnb for pets");
  const [demoProgress, setDemoProgress] = React.useState(0);
  const [demoRunning, setDemoRunning] = React.useState(false);
  const [demoLogs, setDemoLogs] = React.useState<any[]>([]);

  const startDemoSimulation = () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setDemoProgress(0);
    setDemoLogs([]);
    
    const steps = [
      { agent: "Validator Agent", status: "completed", log: "Analyzing idea feasibility & target market demand...", detail: "Opportunity Score: 84% - Viable" },
      { agent: "Research Agent", status: "completed", log: "Estimating market spend & sizing TAM/SAM/SOM...", detail: "TAM: $3.8 Billion (US Market)" },
      { agent: "Finance Agent", status: "completed", log: "Building revenue projections and cost structure assumptions...", detail: "Year 1 ARR Projection: $1.2 Million" },
      { agent: "Technical Agent", status: "completed", log: "Designing MVP architecture stack & container scheme...", detail: "Stack: Next.js + FastAPI + AWS Fargate" }
    ];

    let current = 0;
    const interval = setInterval(() => {
      setDemoLogs((prev) => [...prev, steps[current]]);
      setDemoProgress(current + 1);
      current += 1;
      if (current >= steps.length) {
        clearInterval(interval);
        setDemoRunning(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Scroll progress bar */}
      <motion.div className="fixed left-0 top-0 z-[60] h-0.5 bg-accent" style={{ width: progressWidth }} />

      {/* Header bar (Navbar branding text removed) */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md transition-all">
        <div className="section-shell flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="StartupForge AI home">
            
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-semibold text-textSecondary md:flex" aria-label="Primary">
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#agents" className="hover:text-foreground transition-colors">Agents</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-semibold text-textSecondary outline-none transition-all hover:text-foreground focus:border-accent"
              aria-label="Select currency"
            >
              <option value="USD">🇺🇸 USD ($)</option>
              <option value="INR">🇮🇳 INR (₹)</option>
              <option value="EUR">🇪🇺 EUR (€)</option>
              <option value="GBP">🇬🇧 GBP (£)</option>
              <option value="AED">🇦🇪 AED (د.إ)</option>
              <option value="SGD">🇸🇬 SGD (S$)</option>
            </select>

            <ThemeToggle compact />
            <Link href="/login" className="hidden rounded-xl px-4 py-2 text-xs font-bold text-textSecondary hover:text-foreground hover:bg-card-secondary/50 transition-all sm:inline-flex">
              Log in
            </Link>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-xs">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border py-16 lg:py-24 bg-gradient-to-b from-card-secondary/20 to-transparent">
          {/* Subtle Parallax background image */}
          <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 z-0 opacity-15 dark:opacity-22 pointer-events-none"
          >
            <img src="/hero-bg.png" alt="Strategic background grid" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          </motion.div>
          <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(180deg,transparent,rgba(11,24,50,0.08))]" />
          
          <div className="relative z-20 section-shell grid min-h-[calc(100vh-8rem)] items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div {...sectionReveal} className="max-w-2xl text-left">
              {/* Branding moved from Navbar to Hero Section badge */}
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-accent text-[10px] font-bold text-white">S</div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">StartupForge AI</span>
                  <span className="text-[4px] text-textSecondary">•</span>
                  <span className="text-[9px] uppercase tracking-widest text-textSecondary font-bold">Autonomous Venture Studio</span>
                </div>
              </div>

              {/* Responsive Hero Title: Desktop 56-64px, Tablet 40-48px, Mobile 28-36px */}
              <h1 className="text-[32px] sm:text-[44px] lg:text-[60px] font-bold tracking-tight text-foreground leading-[1.1] max-w-full">
                Build, validate, and scale investor-grade startups.
              </h1>
              
              <p className="mt-6 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-textSecondary font-medium">
                Coordinate strategy, market research, financial modeling, technical planning, and fundraising preparation in a single premium workspace designed for accelerators, operators, and venture teams.
              </p>
              
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold shadow-xl shadow-accent/15">
                  Launch a workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-8 py-4 text-sm font-semibold text-foreground transition duration-300 hover:bg-card-secondary/70">
                  View platform demo
                </Link>
              </div>
              <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 text-sm">
                {[
                  ["20+", "Workflow steps"],
                  ["8", "Venture agents"],
                  ["<15 min", "Full compiler"],
                ].map(([value, label]) => (
                  <div key={label} className="premium-card p-5">
                    <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
                    <div className="mt-1.5 text-[9px] uppercase tracking-[0.20em] font-bold text-textSecondary">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Premium right side preview elements (replaces all 3D content) */}
            <motion.div {...sectionReveal} transition={{ duration: 0.50, delay: 0.1, ease: "easeOut" }} className="space-y-6">
              {/* Startup Dashboard Preview Card */}
              <div className="premium-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 bg-card/65 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold shadow-sm">Q</div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground leading-none">QuantumScale AI</h3>
                      <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider block mt-1">Venture OS workspace</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-success/10 border border-success/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">Investor-Grade</span>
                </div>
                
                <div className="p-5 space-y-5">
                  {/* Investor Metrics Widget */}
                  <div>
                    <span className="metric-label">Key Investment Benchmarks</span>
                    <div className="mt-2.5 grid grid-cols-3 gap-3">
                      <div className="bg-card-secondary/40 border border-border/40 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-textSecondary uppercase tracking-wide">TAM Size</div>
                        <div className="mt-1 text-sm font-bold text-foreground">$4.2 Billion</div>
                      </div>
                      <div className="bg-card-secondary/40 border border-border/40 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-textSecondary uppercase tracking-wide">Gross Margin</div>
                        <div className="mt-1 text-sm font-bold text-foreground">84%</div>
                      </div>
                      <div className="bg-card-secondary/40 border border-border/40 rounded-xl p-3">
                        <div className="text-[9px] font-bold text-textSecondary uppercase tracking-wide">Runway</div>
                        <div className="mt-1 text-sm font-bold text-foreground">24 Months</div>
                      </div>
                    </div>
                  </div>

                  {/* Venture Score Widget */}
                  <div className="bg-card-secondary/35 border border-border/45 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">Venture Scorecard</span>
                        <div className="mt-1 text-lg font-bold text-foreground">94 / 100</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent uppercase tracking-wider border border-accent/15">A+ Class</span>
                      </div>
                    </div>
                    {/* Progress bars */}
                    <div className="mt-3.5 space-y-2 text-[10px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-textSecondary font-semibold">
                          <span>Market Feasibility</span>
                          <span>96%</span>
                        </div>
                        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: "96%" }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-textSecondary font-semibold">
                          <span>Financial Viability</span>
                          <span>92%</span>
                        </div>
                        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: "92%" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Insights Card */}
                  <div className="bg-card-secondary/35 border border-border/45 rounded-xl p-4 flex items-start gap-3">
                    <Activity className="h-5 w-5 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">Strategic Insight</span>
                      <p className="mt-1 text-xs leading-relaxed text-foreground font-medium">
                        Strong defensibility signals detected in pipeline: broker routing model creates proprietary database moats against static providers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accompanying info highlights */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Structured Deliverables", "Generate professional Word documents and PowerPoint slides automatically."],
                  ["Venture Intelligence", "11 coordination agent nodes audit and analyze financial risks and market opportunity."],
                ].map(([title, body]) => (
                  <div key={title} className="premium-card p-4">
                    <p className="text-xs font-bold text-foreground">{title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-textSecondary">{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="border-b border-border py-24 transition-colors">
          <motion.div {...sectionReveal} className="section-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="metric-label">The Challenge</div>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                Startup creation is fragmented before it is investable.
              </h2>
              <p className="mt-5 text-sm sm:text-base text-textSecondary leading-relaxed font-medium">
                Founders collect docs, spreadsheets, competitive links, and advisor comments across separate applications. StartupForge consolidates everything into a unified operating workspace with status logs, telemetry records, and compiling capabilities.
              </p>
            </div>
            
            {/* Staggered items inside problem grid */}
            <motion.div 
              variants={staggerContainer} 
              initial="initial" 
              whileInView="whileInView" 
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-4 md:grid-cols-3"
            >
              {[
                ["Weak market signals", "Venture concepts often lack a quantitative feasibility model before execution."],
                ["Asset fragmentation", "Financial projections, customer profiles, and GTM scopes drift apart."],
                ["No operating room", "Accelerators and general partners cannot see agent updates or deliverables."],
              ].map(([title, body]) => (
                <motion.div key={title} variants={staggerItem} className="premium-card p-5">
                  <ShieldCheck className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  <h3 className="mt-4 text-xs font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-textSecondary font-semibold">{body}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Workflow Section (Staggered reveal) */}
        <section id="workflow" className="border-b border-border bg-card-secondary/20 py-24">
          <motion.div {...sectionReveal} className="section-shell">
            <div className="max-w-2xl">
              <div className="metric-label">Venture Lifecycle</div>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                From raw concept to institutional capitalization.
              </h2>
            </div>
            
            <motion.div 
              variants={staggerContainer} 
              initial="initial" 
              whileInView="whileInView" 
              viewport={{ once: true, amount: 0.15 }}
              className="mt-12 grid gap-4 lg:grid-cols-4"
            >
              {workflow.map(([title, body], index) => (
                <motion.div key={title} variants={staggerItem} className="premium-card p-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/5 text-xs font-bold text-accent border border-accent/10">{index + 1}</div>
                  <h3 className="mt-5 text-xs font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-textSecondary font-semibold">{body}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Agents Ecosystem (Staggered reveal) */}
        <section id="agents" className="border-b border-border py-24">
          <motion.div {...sectionReveal} className="section-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="metric-label">Agent Network</div>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                Specialized agents collaborate in a single telemetry stream.
              </h2>
              <p className="mt-5 text-sm sm:text-base text-textSecondary leading-relaxed font-medium">
                Venture creation is broken into accountable sub-tasks. Each agent acts on inputs, tracks outputs, estimates costs, and posts compiled data back to the startup model.
              </p>
            </div>
            
            <motion.div 
              variants={staggerContainer} 
              initial="initial" 
              whileInView="whileInView" 
              viewport={{ once: true, amount: 0.15 }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {agents.map(([title, body]) => (
                <motion.div key={title} variants={staggerItem} className="premium-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <h3 className="text-xs font-bold text-foreground">{title}</h3>
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-textSecondary font-semibold">{body}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Stages Timeline */}
        <section className="border-b border-border bg-card-secondary/20 py-24">
          <motion.div {...sectionReveal} className="section-shell">
            <div className="max-w-2xl">
              <div className="metric-label">Maturity Timeline</div>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                Sequential execution checkpoints.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-5">
              {["Idea", "Validation", "Research", "Model", "Pitch"].map((item, index) => (
                <div key={item} className="relative premium-card p-5 text-left">
                  <div className="text-[10px] font-bold text-accent">0{index + 1}</div>
                  <div className="mt-6 text-xs font-bold text-foreground">{item}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features Grids (Staggered reveal) */}
        <section id="features" className="border-b border-border py-24">
          <motion.div {...sectionReveal} className="section-shell">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <div className="metric-label">Platform Features</div>
                <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                  An executive hub engineered for venture validation.
                </h2>
              </div>
              <Link href="/register" className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold hover:bg-card-secondary transition">
                Create workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <motion.div 
              variants={staggerContainer} 
              initial="initial" 
              whileInView="whileInView" 
              viewport={{ once: true, amount: 0.15 }}
              className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map(([Icon, title, body]) => (
                <motion.div key={title} variants={staggerItem} className="premium-card p-5">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-5 text-xs font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-textSecondary font-semibold">{body}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Pricing Matrix (Staggered reveal) */}
        <section id="pricing" className="border-b border-border py-24">
          <motion.div {...sectionReveal} className="section-shell">
            <div className="max-w-2xl">
              <div className="metric-label">Investment plans</div>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                Pricing designed for growth.
              </h2>
            </div>
            
            <motion.div 
              variants={staggerContainer} 
              initial="initial" 
              whileInView="whileInView" 
              viewport={{ once: true, amount: 0.15 }}
              className="mt-12 grid gap-4 lg:grid-cols-3"
            >
              {[
                ["Starter", formatVal(0), "Validate one concept and compile core workspace templates."],
                ["Studio", `${formatVal(29)}/mo`, "Unlimited startup workspaces, reports, forecasts, and deck compilation."],
                ["Enterprise", "Custom", "Accelerator workspace, custom agents, SLA guarantees, and team logs."],
              ].map(([name, price, body], index) => (
                <motion.div 
                  key={name} 
                  variants={staggerItem} 
                  className={`premium-card p-6 flex flex-col justify-between ${index === 1 ? "border-accent" : ""}`}
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">{name}</div>
                    <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{price}</div>
                    <p className="mt-3.5 text-xs leading-relaxed text-textSecondary font-semibold">{body}</p>
                  </div>
                  <Link href="/register" className={`mt-8 inline-flex w-full items-center justify-center rounded-xl py-3 text-xs font-semibold transition ${index === 1 ? "bg-accent text-white dark:text-[#0B1832] hover:bg-accent-hover" : "border border-border bg-card hover:bg-card-secondary"}`}>
                    Get started
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Interactive Demo Console */}
        <section id="demo" className="border-b border-border py-24 bg-card-secondary/10">
          <motion.div {...sectionReveal} className="section-shell max-w-4xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="metric-label">Sandbox Terminal</div>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                Verify the venture model live.
              </h2>
              <p className="mt-3.5 text-xs text-textSecondary">Provide a startup theme details below to watch the sequential agents validate the concept.</p>
            </div>
            <div className="premium-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={demoIdea}
                  onChange={(e) => setDemoIdea(e.target.value)}
                  disabled={demoRunning}
                  placeholder="e.g. Uber for luxury yachts"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={startDemoSimulation}
                  disabled={demoRunning || !demoIdea.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-white dark:text-[#0b1832] hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 shadow-md"
                >
                  {demoRunning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Simulating...
                    </>
                  ) : (
                    "Run Demo Workspace"
                  )}
                </button>
              </div>

              {demoRunning && (
                <div className="w-full bg-border/40 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-accent h-full transition-all duration-300" 
                    style={{ width: `${(demoProgress / 4) * 100}%` }} 
                  />
                </div>
              )}

              <DemoErrorBoundary>
                <div className="rounded-xl border border-border bg-card-secondary/40 p-4 min-h-[160px] max-h-[350px] overflow-y-auto flex flex-col justify-center">
                  {demoRunning && demoLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-textSecondary">
                      <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
                      <p className="text-[11px] font-semibold">Spawning pipeline telemetry instances...</p>
                    </div>
                  ) : asArray(demoLogs).filter(Boolean).length > 0 ? (
                        <div className="space-y-4 w-full text-left">
                          {asArray(demoLogs)
                            .filter(Boolean)
                            .map((rawLog, index) => {
                              const log = isValidDemoLog(rawLog) ? rawLog : { log: String(rawLog) };
                              if (!isValidDemoLog(log)) {
                                  return (
                                    <div key={index} className="text-error text-[10px] py-1">
                                      ⚠ Telemetry package parsing error.
                                    </div>
                                  );
                              }
                              return (
                                <div key={index} className="flex flex-col gap-1 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-accent">{log?.agent || "Unknown Agent"}</span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                      log?.status === "completed" ? "bg-success/10 text-success" : "bg-accent/10 text-accent animate-pulse"
                                    }`}>
                                      {log?.status || "processing"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-textSecondary mt-1 leading-5">{log?.log}</p>
                                  {log?.detail && (
                                    <span className="text-[9px] text-foreground font-mono bg-background border border-border px-2 py-0.5 rounded w-fit mt-1 shadow-sm">
                                      {log?.detail}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-textSecondary">
                      <Terminal className="h-6 w-6 text-textMuted mb-2 opacity-50" />
                      <p className="text-xs font-bold text-foreground">Awaiting sandbox instruction</p>
                      <p className="text-[10px] max-w-xs mt-1 text-textMuted">Provide a venture concept theme in the input and click launch simulation to inspect telemetry.</p>
                    </div>
                  )}
                </div>
              </DemoErrorBoundary>
            </div>
          </motion.div>
        </section>

        {/* Action Callout */}
        <section className="py-24 transition-colors">
          <motion.div {...sectionReveal} className="section-shell">
            <div className="premium-card p-8 md:p-12 bg-gradient-to-r from-card to-card-secondary/20">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="metric-label">Execution Hub</div>
                  <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-foreground mt-3 leading-[1.2]">
                    Build the workspace your startup concept deserves.
                  </h2>
                  <p className="mt-4 max-w-2xl text-xs leading-6 text-textSecondary font-semibold">
                    Forge a concept, configure multi-agent compilation, and generate full PowerPoint and Word materials from a professional operating terminal.
                  </p>
                </div>
                <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold shadow-lg">
                  Forge a startup <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border py-8 bg-card/40">
        <div className="section-shell flex flex-col justify-between gap-3 text-xs text-textSecondary sm:flex-row">
          <p>(c) 2026 StartupForge AI</p>
          <p>Autonomous venture operating system.</p>
        </div>
      </footer>
    </div>
  );
}
