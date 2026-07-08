"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useCurrency } from "../../components/providers";
import ThemeToggle from "../../components/ThemeToggle";
import { 
  User as UserIcon, Mail, Shield, Zap, 
  CreditCard, Loader2, LogOut, Settings
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [sub, setSub] = useState<any | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [updatingSub, setUpdatingSub] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.push("/login");
    }
  }, [loading, token, router]);

  const loadSubDetails = async () => {
    try {
      // Fetch user mock subscription settings
      setSub({
        plan_name: user?.role === "admin" ? "enterprise" : "free",
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        credit_limit: user?.role === "admin" ? 9999 : 10,
        credits_used: 2
      });
    } catch (err) {
      console.error("Error loading subscription details:", err);
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubDetails();
    }
  }, [user]);

  const upgradePlan = async (plan: string) => {
    setUpdatingSub(true);
    try {
      // Mock calling Stripe or payment updates
      setTimeout(() => {
        setSub((prev: any) => ({
          ...prev,
          plan_name: plan,
          credit_limit: plan === "premium" ? 100 : 9999,
        }));
        setUpdatingSub(false);
        alert(`Successfully upgraded to ${plan.toUpperCase()}.`);
      }, 1000);
    } catch (err) {
      setUpdatingSub(false);
    }
  };

  if (loading || !user || !token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-10 flex flex-col gap-8 animate-fade-in">
        
        {/* HEADERBAR */}
        <div className="border-b border-border pb-6">
          <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
          <p className="text-xs text-textSecondary mt-1">Manage your credentials, subscription credits, and API tiers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* USER INFO PANEL */}
          <div className="premium-card p-6 bg-card space-y-6">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2 uppercase tracking-wider">
              <UserIcon className="w-4 h-4 text-accent" strokeWidth={1.5} /> Account Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="flex items-center gap-3 text-xs text-foreground bg-card-secondary/20 border border-border p-3 rounded-xl font-semibold transition">
                  <UserIcon className="w-4 h-4 text-textSecondary" strokeWidth={1.5} />
                  <span>{user.full_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="flex items-center gap-3 text-xs text-foreground bg-card-secondary/20 border border-border p-3 rounded-xl font-semibold transition">
                  <Mail className="w-4 h-4 text-textSecondary" strokeWidth={1.5} />
                  <span>{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1.5">Role Permission</label>
                <div className="flex items-center gap-3 text-xs text-foreground bg-card-secondary/20 border border-border p-3 rounded-xl font-semibold capitalize transition">
                  <Shield className="w-4 h-4 text-success" strokeWidth={1.5} />
                  <span>{user.role} Privilege</span>
                </div>
              </div>
            </div>
          </div>

          {/* BILLING / CREDITS PANEL */}
          <div className="premium-card p-6 bg-card space-y-6">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-accent" strokeWidth={1.5} /> Subscription Tiers
            </h3>

            {loadingSub ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-1.5">Active Tier</label>
                  <div className="bg-card-secondary/20 border border-border px-4 py-3.5 rounded-xl flex items-center justify-between transition">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{sub.plan_name} plan</h4>
                      <p className="text-[9px] text-textSecondary mt-1 font-bold">Renews automatically on {sub.current_period_end}</p>
                    </div>
                    <Zap className="w-4 h-4 text-accent animate-pulse" strokeWidth={1.5} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-textSecondary uppercase tracking-widest mb-2">
                    <span>Credit consumption</span>
                    <span>{sub.credits_used} / {sub.credit_limit} credits</span>
                  </div>
                  {/* Credit Bar */}
                  <div className="w-full h-1.5 rounded-full bg-card-secondary border border-border overflow-hidden">
                    <div 
                      className="h-full bg-accent" 
                      style={{ width: `${Math.min(100, (sub.credits_used / sub.credit_limit) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SYSTEM PREFERENCES PANEL */}
          <div className="premium-card p-6 bg-card space-y-6 md:col-span-2">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-accent" strokeWidth={1.5} /> System Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Currency Selector */}
              <div className="bg-card-secondary/20 border border-border p-4 rounded-xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Localization Currency</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-normal">Select active currency for capital budget, calculations, and estimates.</p>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full mt-2"
                  aria-label="Select currency"
                >
                  <option value="USD">🇺🇸 USD ($)</option>
                  <option value="INR">🇮🇳 INR (₹)</option>
                  <option value="EUR">🇪🇺 EUR (€)</option>
                  <option value="GBP">🇬🇧 GBP (£)</option>
                  <option value="AED">🇦🇪 AED (د.إ)</option>
                  <option value="SGD">🇸🇬 SGD (S$)</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="bg-card-secondary/20 border border-border p-4 rounded-xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Appearance Theme</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-normal">Toggle light or dark styling color layouts on this workspace session.</p>
                </div>
                <div className="mt-2 w-fit">
                  <ThemeToggle compact />
                </div>
              </div>

              {/* Logout Action */}
              <div className="bg-card-secondary/20 border border-border p-4 rounded-xl flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Session Administration</h4>
                  <p className="text-[10px] text-text-muted mt-1 leading-normal">Log out from your active session. You will need credentials to sign back in.</p>
                </div>
                <button
                  onClick={logout}
                  type="button"
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" strokeWidth={2} />
                  <span>Log Out Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PLANS CARD SELECTOR */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Forge upgrades</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="premium-card p-5 bg-card flex flex-col justify-between gap-6">
              <div>
                <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-wider mb-1">Starter Free</h4>
                <div className="text-xl font-extrabold text-foreground mb-2">$0</div>
                <p className="text-xs text-textSecondary leading-relaxed font-semibold">Validate early concept hypotheses and compiled strategy metrics.</p>
              </div>
              <button 
                disabled={sub?.plan_name === "free"}
                onClick={() => upgradePlan("free")}
                className="w-full py-3 border border-border bg-card hover:bg-card-secondary/60 text-xs font-bold rounded-xl disabled:opacity-40 transition"
              >
                {sub?.plan_name === "free" ? "Active" : "Downgrade"}
              </button>
            </div>

            {/* Premium */}
            <div className="premium-card p-5 bg-card border-accent flex flex-col justify-between gap-6 relative">
              <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-accent text-white dark:text-background rounded-full text-[8px] font-bold uppercase tracking-wider border border-accent/10 shadow-sm">Popular</div>
              <div>
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Premium Studio</h4>
                <div className="text-xl font-extrabold text-foreground mb-2">$29</div>
                <p className="text-xs text-textSecondary leading-relaxed font-semibold font-medium">Coordinate multi-agent workflows and export slide presentations.</p>
              </div>
              <button 
                disabled={sub?.plan_name === "premium" || updatingSub}
                onClick={() => upgradePlan("premium")}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white dark:text-background text-xs font-bold rounded-xl disabled:opacity-40 transition shadow-md shadow-accent/5"
              >
                {updatingSub ? "Processing..." : sub?.plan_name === "premium" ? "Active" : "Upgrade"}
              </button>
            </div>

            {/* Enterprise */}
            <div className="premium-card p-5 bg-card flex flex-col justify-between gap-6">
              <div>
                <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-wider mb-1">Enterprise</h4>
                <div className="text-xl font-extrabold text-foreground mb-2">Custom</div>
                <p className="text-xs text-textSecondary leading-relaxed font-semibold">Integrate team dashboards, custom agent limits, and SLA response.</p>
              </div>
              <button 
                disabled={sub?.plan_name === "enterprise"}
                onClick={() => upgradePlan("enterprise")}
                className="w-full py-3 border border-border bg-card hover:bg-card-secondary/60 text-xs font-bold rounded-xl disabled:opacity-40 transition"
              >
                {sub?.plan_name === "enterprise" ? "Active" : "Upgrade"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
