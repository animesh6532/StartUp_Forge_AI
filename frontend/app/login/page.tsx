"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../../components/providers";
import ThemeToggle from "../../components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/v1/auth/login", { email, password });
      await login(response.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background px-6 text-foreground transition-colors duration-300">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-md shadow-accent/10">S</div>
          <span className="text-sm font-bold tracking-tight">StartupForge</span>
        </Link>
        <ThemeToggle compact />
      </header>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="premium-card w-full max-w-md p-8 bg-card shadow-2xl relative">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-xs text-textSecondary font-semibold">Access your autonomous venture workspace.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-500 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="metric-label mb-1.5 block">Email Address</span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-textSecondary" strokeWidth={1.5} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10"
                />
              </span>
            </label>

            <label className="block">
              <span className="metric-label mb-1.5 block">Password</span>
              <span className="relative block">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-textSecondary" strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="w-full pl-10"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-bold text-white dark:text-[#0b1832] hover:bg-accent-hover disabled:opacity-50 transition shadow-md shadow-accent/5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Verifying credentials..." : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-textSecondary font-semibold">
            Do not have an account?{" "}
            <Link href="/register" className="font-bold text-accent hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-[10px] text-textSecondary font-semibold">(c) 2026 StartupForge AI. All rights reserved.</footer>
    </div>
  );
}
