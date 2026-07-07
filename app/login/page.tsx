"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setLoading } from "@/lib/redux/authSlice";
import { RootState } from "@/lib/redux/store";
import { Hotel, Key, Mail, ShieldAlert, Sparkles } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    dispatch(setLoading(true));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(setCredentials({ user: data.user, token: data.token }));
        router.push(redirectUrl);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-20 px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-primary/10 rounded-full blur-[10rem] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-amber-100/20 rounded-full blur-[10rem] pointer-events-none" />

      {/* Glass card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-[2.5rem] shadow-xl relative z-10 flex flex-col gap-6 animate-fade-in-up">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-primary/10 rounded-full border border-primary/20 text-primary">
            <Hotel className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wider uppercase mt-2">
            Sign In
          </h2>
          <p className="text-xs text-slate-550">Access your Amanora Resort personal dashboard</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl flex items-center gap-2 text-xs">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. guest@example.com"
              className="w-full px-4 py-3 bg-stone-50 border border-slate-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-stone-50 border border-slate-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-amber-400/30 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Account"}</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link href={`/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="text-primary font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-slate-900 font-serif">
        Loading Sign In...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
