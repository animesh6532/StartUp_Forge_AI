"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/providers";
import { 
  Shield, Users, Layers, Activity, Cpu, 
  Loader2, ToggleLeft, ToggleRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [executions, setExecutions] = useState<any[]>([]);

  // Route security checks
  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push("/login");
      } else if (user?.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [loading, token, user, router]);

  const loadAdminMetrics = async () => {
    try {
      // Fetch administrative metrics mock payload
      setUsersList([
        { id: "1", full_name: "Jane Doe", email: "jane@domain.com", role: "premium_user", is_active: true, created_at: "2026-05-15" },
        { id: "2", full_name: "John Smith", email: "john@startup.co", role: "user", is_active: true, created_at: "2026-05-20" },
        { id: "3", full_name: "Admin Master", email: "admin@startupforge.ai", role: "admin", is_active: true, created_at: "2026-05-01" }
      ]);

      setExecutions([
        { id: "e1", startup_name: "HealthFlow AI", agent_role: "Planner", status: "completed", timestamp: "10 mins ago" },
        { id: "e2", startup_name: "HealthFlow AI", agent_role: "Market Analyst", status: "completed", timestamp: "8 mins ago" },
        { id: "e3", startup_name: "HealthFlow AI", agent_role: "CFO spreadsheet", status: "completed", timestamp: "5 mins ago" },
        { id: "e4", startup_name: "AgriDrone Venture", agent_role: "Planner", status: "running", timestamp: "Just now" }
      ]);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "admin") {
      loadAdminMetrics();
    }
  }, [token, user]);

  const toggleUserRole = (userId: string) => {
    setUsersList(usersList.map((usr) => {
      if (usr.id === userId) {
        const nextRole = usr.role === "premium_user" ? "user" : "premium_user";
        alert(`Successfully adjusted ${usr.full_name}'s privilege to ${nextRole.toUpperCase()}.`);
        return { ...usr, role: nextRole };
      }
      return usr;
    }));
  };

  if (loading || !user || user.role !== "admin" || !token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300">
      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 lg:p-10 flex flex-col gap-8">
        
        {/* HEADERBAR */}
        <div className="border-b border-border pb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent" strokeWidth={1.5} /> Admin Control Center
          </h2>
          <p className="text-xs text-textSecondary mt-1">System-wide monitoring, user accounts configuration, and multi-agent workflow auditing.</p>
        </div>

        {/* OVERVIEW PANEL */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["Total Users", "1,024", Users, "text-textSecondary/20"],
            ["Active Concepts", "3,450", Layers, "text-textSecondary/20"],
            ["Swarm Runs", "28,950", Cpu, "text-textSecondary/20"],
            ["Platform Uptime", "99.98%", Activity, "text-success/20"]
          ].map(([label, value, Icon, colorClass]: any) => (
            <div key={label} className="premium-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">{label}</span>
                <div className="text-2xl font-extrabold text-foreground mt-1 tracking-tight">{value}</div>
              </div>
              <Icon className={`w-8 h-8 ${colorClass} shrink-0`} strokeWidth={1.25} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* USER ROLES ADJUSTER PANEL */}
          <div className="premium-card p-6 md:col-span-2 space-y-6">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-accent" strokeWidth={1.5} /> User Role Management
            </h3>

            {loadingAdmin ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-3">
                {usersList.map((usr) => (
                  <div key={usr.id} className="bg-card-secondary/20 border border-border p-4 rounded-xl flex items-center justify-between hover-row cursor-default">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{usr.full_name}</h4>
                      <p className="text-[10px] text-textSecondary font-semibold mt-0.5">{usr.email}</p>
                      <span className="text-[8px] text-textSecondary font-bold block mt-1">Registered {usr.created_at}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        usr.role === "admin" ? "bg-success/15 text-success" :
                        usr.role === "premium_user" ? "bg-accent/15 text-accent" :
                        "bg-card text-textSecondary border border-border"
                      }`}>
                        {usr.role.replace("_", " ")}
                      </span>
                      
                      {usr.role !== "admin" && (
                        <button 
                          onClick={() => toggleUserRole(usr.id)}
                          className="text-textSecondary hover:text-accent transition-colors"
                          title="Toggle Premium Role"
                        >
                          {usr.role === "premium_user" ? (
                            <ToggleRight className="w-7 h-7 text-accent" strokeWidth={1.5} />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-textSecondary" strokeWidth={1.5} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE GRAPH WORKFLOW MONITOR PANEL */}
          <div className="premium-card p-6 space-y-6">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-accent" strokeWidth={1.5} /> Swarm Workflow Monitor
            </h3>

            {loadingAdmin ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((exe) => (
                  <div key={exe.id} className="bg-card-secondary/20 border border-border p-3.5 rounded-xl flex items-center justify-between hover-row cursor-default">
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-foreground truncate max-w-full">{exe.startup_name}</h4>
                      <p className="text-[9px] text-textSecondary font-semibold mt-0.5">{exe.agent_role} Node</p>
                      <span className="text-[8px] text-textSecondary font-semibold block mt-1">{exe.timestamp}</span>
                    </div>

                    <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase shrink-0 tracking-wider ${
                      exe.status === "completed" ? "bg-success/10 text-success border border-success/15" : "bg-accent/10 text-accent border border-accent/15 animate-pulse"
                    }`}>
                      {exe.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
