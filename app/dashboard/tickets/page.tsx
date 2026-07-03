"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useRouter } from "next/navigation";
import {
  Ticket, Plus, Calendar, ChevronDown, ChevronUp, ArrowLeft, Loader2
} from "lucide-react";

interface TicketItem {
  id: number;
  subject: string | null;
  message: string | null;
  admin_answer: string | null;
  status: "open" | "in_progress" | "closed" | null;
  priority: "low" | "medium" | "high" | null;
  created_at: string;
}

export default function UserTicketsPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/tickets");
    }
  }, [isAuthenticated, router]);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/user/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const getStatusBadge = (status: TicketItem["status"]) => {
    switch (status) {
      case "open":
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600">
            Open
          </span>
        );
      case "in_progress":
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600">
            In Progress
          </span>
        );
      case "closed":
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: TicketItem["priority"]) => {
    switch (priority) {
      case "high":
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold">
            Billing & Urgent Issues
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
            Reservation & Activities
          </span>
        );
      case "low":
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
            General Inquiry
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-24 pb-16 transition-colors">
      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-8 animate-fade-in-up">
        
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            onClick={() => router.push("/contact")}
            className="bg-primary hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold text-xs flex items-center gap-2 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>New Support Ticket</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-serif font-bold text-slate-950">
            My Support Tickets
          </h1>
          <p className="text-slate-500 text-sm">
            Track progress and read answers to your inquiries.
          </p>
        </div>

        {/* Tickets List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-slate-400">Loading support tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center gap-4">
              <div className="p-4 bg-stone-50 rounded-full border border-slate-200">
                <Ticket className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base mb-1">No tickets found</h3>
                <p className="text-slate-500 text-xs">You have not submitted any support tickets yet.</p>
              </div>
              <button
                onClick={() => router.push("/contact")}
                className="bg-primary hover:bg-amber-400 text-slate-950 px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow"
              >
                Create Your First Ticket
              </button>
            </div>
          ) : (
            tickets.map((ticket) => {
              const isExpanded = expandedTicketId === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Header Summary */}
                  <div
                    onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {ticket.subject}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Conversation Body */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex flex-col gap-4 bg-stone-50/30">
                      {/* User Message */}
                      <div className="flex gap-3 items-start max-w-[85%] self-start">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 font-semibold text-xs text-slate-600">
                          Me
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-sm text-slate-700 shadow-sm whitespace-pre-wrap">
                          {ticket.message}
                        </div>
                      </div>

                      {/* Admin Answer */}
                      {ticket.admin_answer ? (
                        <div className="flex gap-3 items-start max-w-[85%] self-end flex-row-reverse">
                          <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                            A
                          </div>
                          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/25 text-sm text-slate-800 shadow-sm whitespace-pre-wrap text-right">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 text-left">
                              Admin Reply
                            </div>
                            {ticket.admin_answer}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400 italic">
                          Waiting for administrator response...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
