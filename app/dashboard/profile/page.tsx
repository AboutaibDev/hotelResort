"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { setCredentials, setLoading } from "@/lib/redux/authSlice";
import { User, Mail, Phone, ShieldCheck, ShieldAlert } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/profile");
    } else if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      setError("First and Last Name are required.");
      return;
    }

    setSuccess(false);
    setError(null);
    dispatch(setLoading(true));

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update credentials in Redux
        const token = sessionStorage.getItem("token") || ""; // We don't necessarily need token from session since cookie holds it, but setCredentials takes user & token
        dispatch(setCredentials({ user: data.user, token }));
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during updating.");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-10 transition-colors">
      <div className="max-w-3xl mx-auto px-6 flex flex-col gap-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Customer Dashboard
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-slate-950">
            My Account Profile
          </h1>
          <p className="text-slate-600 text-sm font-light leading-relaxed">
            Update your personal contact details below. Fields marked with an asterisk are required.
          </p>
        </div>

        {/* Profile Form card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl flex items-center gap-2 text-xs">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl flex items-center gap-2 text-xs">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>First Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-850 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Last Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-850 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>Email Address (Read-only)</span>
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-3 bg-stone-100 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-850 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 self-start px-8"
            >
              <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
