"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { Mail, Phone, MapPin, Send, MessageSquare, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please fill out both Subject and Message fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Endpoint to submit ticket
      const endpoint = isAuthenticated ? "/api/tickets" : "/api/contact-message";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          priority,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setSubject("");
        setMessage("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 transition-colors py-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-16">
        
        {/* Header Block */}
        <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Get in Touch</span>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-950 leading-tight">
            Contact Resort Support
          </h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
          <p className="text-slate-500 font-light text-sm md:text-base">
            Have a question about standard room bookings, resort events, or need assistance? Send us a message and our employees will get back to you shortly.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Contact Details */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-8 lg:col-span-1">
            <h3 className="text-xl font-serif font-bold text-slate-950">Resort Contacts</h3>
            
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase text-slate-400">Resort Address</h5>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    100 Resort Lane, Amanora Valley, Pune, India
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase text-slate-400">Phone Directory</h5>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    +1 (800) 123-4567
                  </p>
                  <p className="text-xs text-slate-400">Front Desk: 24/7 Hours</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase text-slate-400">Email Address</h5>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    reservations@amanoraresort.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-serif font-bold text-slate-950">
                {isAuthenticated ? "Submit a Support Ticket" : "Send an Inquiry"}
              </h3>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-500/20">
                <AlertCircle className="h-4 w-4" />
                <span>You are logged in. This message will be saved as an active support ticket in your dashboard.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-500/20">
                <AlertCircle className="h-4 w-4" />
                <span>Sign in to save this message as a tracked ticket in your dashboard. Unregistered messages are simulated.</span>
              </div>
            )}

            {success ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-4">
                <h4 className="font-serif font-bold text-emerald-700 text-lg">Thank You!</h4>
                <p className="text-sm text-slate-600">
                  {isAuthenticated
                    ? "Your support ticket was created successfully. You can monitor its status and read employee responses under your Customer Dashboard."
                    : "Your simulated message was sent successfully. We will follow up shortly."}
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold mt-2 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Form fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your request..."
                    className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
                  />
                </div>

                {isAuthenticated && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
                    >
                      <option value="low">Low - General Inquiries</option>
                      <option value="medium">Medium - Reservation Changes</option>
                      <option value="high">High - Billing/Check-in Issues</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message details</label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain your reservation details or questions in depth..."
                    className="w-full p-4 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
                  />
                </div>

                {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? "Submitting Request..." : "Send Request"}</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
