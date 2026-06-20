import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Calendar, Bell, Ticket, Compass, User, MessageSquare, Plus, ArrowRight } from "lucide-react";

export const revalidate = 0;

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?redirect=/dashboard");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/login?redirect=/dashboard");
  }

  // Fetch user profile
  const user = await db.users.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // Fetch counts and data
  const reservationsCount = await db.reservations.count({
    where: { user_id: user.id },
  });

  const activityBookingsCount = await db.activity_bookings.count({
    where: { user_id: user.id },
  });

  const openTicketsCount = await db.support_tickets.count({
    where: {
      user_id: user.id,
      status: "open",
    },
  });

  const notifications = await db.notifications.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    take: 5,
  });

  const unreadNotificationsCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="bg-stone-50 min-h-screen py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8 animate-fade-in-up">
        {/* Welcome Banner */}
        <div className="bg-white text-slate-900 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden border border-slate-200/80 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-primary font-bold uppercase tracking-wider text-xs">Customer Account</span>
              <h1 className="text-3xl md:text-4xl font-serif text-slate-950">
                Welcome back, {user.first_name || "Guest"}!
              </h1>
              <p className="text-slate-600 text-sm font-light max-w-lg mt-1">
                Manage your resort check-ins, scheduled guided tours, contact your virtual AI assistant, or view system messages.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/chat"
                className="bg-primary text-slate-950 font-bold px-6 py-3 rounded-full hover:bg-amber-400 transition-all text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <MessageSquare className="h-4.5 w-4.5" />
                <span>AI Support Chat</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Active Stays</span>
            <span className="text-2xl font-bold text-slate-900">{reservationsCount}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Activities Booked</span>
            <span className="text-2xl font-bold text-slate-900">{activityBookingsCount}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Ticket className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Open Support Tickets</span>
            <span className="text-2xl font-bold text-slate-900">{openTicketsCount}</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Bell className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Unread Notifications</span>
            <span className="text-2xl font-bold text-slate-900">{unreadNotificationsCount}</span>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Notifications and messages */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Recent System Notifications</span>
              </h3>
              {notifications.length > 0 && (
                <button className="text-xs text-primary font-bold hover:underline cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {notifications.length === 0 ? (
                <p className="text-slate-500 text-sm italic">You have no system notifications yet.</p>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all text-xs md:text-sm ${
                      notif.is_read
                        ? "bg-stone-50 border-slate-200 text-slate-500"
                        : "bg-primary/5 border-primary/20 text-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold">{notif.title}</h4>
                        <p className="text-xs text-slate-650 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick links & Profile Widget */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <h3 className="text-lg font-serif font-bold text-slate-900 pb-2 border-b border-slate-200">
                Resort Portals
              </h3>

              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard/reservations"
                  className="flex justify-between items-center p-4 bg-stone-50 border border-slate-200/60 rounded-2xl hover:border-primary transition-colors text-slate-800 font-semibold text-sm group"
                >
                  <span>My Reservations</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/profile"
                  className="flex justify-between items-center p-4 bg-stone-50 border border-slate-200/60 rounded-2xl hover:border-primary transition-colors text-slate-800 font-semibold text-sm group"
                >
                  <span>Edit Profile</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/contact"
                  className="flex justify-between items-center p-4 bg-stone-50 border border-slate-200/60 rounded-2xl hover:border-primary transition-colors text-slate-800 font-semibold text-sm group"
                >
                  <span>File Support Ticket</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
