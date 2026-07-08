"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../../components/providers";
import ThemeToggle from "../../components/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/v1/auth/register", {
        full_name: fullName,
        email,
        password,
      });
      const loginRes = await axios.post("/api/v1/auth/login", { email, password });
      await login(loginRes.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        if (status === 400) {
          setError(err.response.data?.detail || "Registration failed. This email may already be registered.");
        } else if (status === 401) {
          setError("Incorrect email or password.");
        } else if (status === 500) {
          setError("Internal server error.");
        } else if (status === 404) {
          setError("API endpoint not found.");
        } else {
          setError(err.response.data?.detail || "Registration failed. Please try again.");
        }
      } else {
        setError("Backend server is unavailable.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background px-6 text-foreground transition-colors duration-300">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card-secondary border border-border text-sm font-bold text-foreground shadow-sm">S</div>
          <span className="text-sm font-bold tracking-tight">StartupForge</span>
        </Link>
        <ThemeToggle compact />
      </header>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="premium-card w-full max-w-md p-8 bg-card shadow-2xl relative">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-xs text-textSecondary font-semibold">Start architecting a venture workspace in minutes.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs text-error font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="metric-label mb-1.5 block">Full Name</span>
              <span className="relative block">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-textSecondary" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-10"
                />
              </span>
            </label>

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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-bold text-white dark:text-background hover:bg-accent-hover disabled:opacity-50 transition shadow-md shadow-accent/5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Provisioning workspace..." : "Sign up"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-textSecondary font-semibold">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-[10px] text-textSecondary font-semibold">(c) 2026 StartupForge AI. All rights reserved.</footer>
    </div>
  );
}
