import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminPortal from "@/components/AdminPortal";
import { Shield } from "lucide-react";

export const revalidate = 0;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?redirect=/admin");
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all data for the admin portal
  const [users, rooms, activities, reservations, activityBookings, tickets] =
    await Promise.all([
      db.users.findMany({
        orderBy: { created_at: "desc" },
      }),
      db.rooms.findMany({
        orderBy: { created_at: "desc" },
      }),
      db.activities.findMany({
        orderBy: { created_at: "desc" },
      }),
      db.reservations.findMany({
        include: {
          users: { select: { first_name: true, last_name: true, email: true } },
          rooms: { select: { title: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      db.activity_bookings.findMany({
        include: {
          users: { select: { first_name: true, last_name: true, email: true } },
          activities: { select: { title: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      db.support_tickets.findMany({
        include: {
          users: { select: { first_name: true, last_name: true, email: true } },
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

  return (
    <div className="bg-stone-50 min-h-screen py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8 animate-fade-in-up">
        {/* Header */}
        <div className="bg-white text-slate-900 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden border border-slate-200/80 shadow-sm">
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-primary font-bold uppercase tracking-wider text-xs">System Administrator</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-slate-950">
              Admin Control Panel
            </h1>
            <p className="text-slate-650 text-sm font-light max-w-lg mt-1">
              Full access to platform data — manage users, edit room & activity content, review reservations, and respond to open customer support tickets.
            </p>
          </div>
        </div>

        {/* Admin Portal Component */}
        <AdminPortal
          users={users}
          rooms={rooms}
          activities={activities}
          reservations={reservations}
          activityBookings={activityBookings}
          tickets={tickets}
        />
      </div>
    </div>
  );
}
