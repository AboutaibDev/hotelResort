import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import DashboardNotifications from "@/components/DashboardNotifications";
import { Calendar, Bell, Ticket, Compass, User, ArrowRight, Shield, Sparkles } from "lucide-react";

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

  const ticketsCount = await db.support_tickets.count({
    where: { user_id: user.id },
  });

  const unreadNotificationsCount = await db.notifications.count({
    where: { user_id: user.id, is_read: false },
  });

  return (
    <div className="bg-stone-50 min-h-screen pt-24 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10 animate-fade-in-up">
        



        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/dashboard/reservations"
            className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm hover:shadow-md hover:border-primary/45 transition-all flex flex-col gap-2 group text-left"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start group-hover:bg-primary group-hover:text-slate-950 transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Active Stays</span>
            <span className="text-3xl font-bold text-slate-900 font-serif">{reservationsCount}</span>
          </Link>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Activities Booked</span>
            <span className="text-3xl font-bold text-slate-900 font-serif">{activityBookingsCount}</span>
          </div>

          <Link
            href="/dashboard/tickets"
            className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm hover:shadow-md hover:border-primary/45 transition-all flex flex-col gap-2 group text-left"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start group-hover:bg-primary group-hover:text-slate-950 transition-colors">
              <Ticket className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Support Tickets</span>
            <span className="text-3xl font-bold text-slate-900 font-serif">{ticketsCount}</span>
          </Link>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
              <Bell className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Unread Messages</span>
            <span className="text-3xl font-bold text-slate-900 font-serif">{unreadNotificationsCount}</span>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Notifications and messages */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
            <DashboardNotifications />
          </div>

          {/* Resort Portals */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <h3 className="text-lg font-serif font-bold text-slate-900 pb-3 border-b border-slate-200">
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
                  href="/dashboard/tickets"
                  className="flex justify-between items-center p-4 bg-stone-50 border border-slate-200/60 rounded-2xl hover:border-primary transition-colors text-slate-800 font-semibold text-sm group"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Support Tickets</span>
                    {ticketsCount > 0 && (
                      <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {ticketsCount}
                      </span>
                    )}
                  </span>
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
                  <span>Open New Support Ticket</span>
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
