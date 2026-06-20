"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setLoading } from "@/lib/redux/authSlice";
import { RootState } from "@/lib/redux/store";
import { Hotel, User, Mail, Key, Phone, ShieldAlert } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    setError(null);
    dispatch(setLoading(true));

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || undefined,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(setCredentials({ user: data.user, token: data.token }));
        router.push(redirectUrl);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed. Please try again.");
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
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-[2.5rem] shadow-xl relative z-10 flex flex-col gap-6 animate-fade-in-up">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-primary/10 rounded-full border border-primary/20 text-primary">
            <Hotel className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wider uppercase mt-2">
            Create Account
          </h2>
          <p className="text-xs text-slate-500">Join Amanora Resort loyalty reservation platform</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl flex items-center gap-2 text-xs">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>First Name</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 bg-stone-50 border border-slate-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Last Name</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-stone-50 border border-slate-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
              />
            </div>
          </div>

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
              placeholder="e.g. john@example.com"
              className="w-full px-4 py-3 bg-stone-50 border border-slate-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>Phone (Optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
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
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-3 bg-stone-50 border border-slate-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-amber-400/30 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-slate-900 font-serif">
        Loading Account Setup...
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
