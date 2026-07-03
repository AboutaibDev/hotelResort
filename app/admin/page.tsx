import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminPortal from "@/components/AdminPortal";
import { readSheetRows, TAB_NAMES } from "@/lib/google-sheets";

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

  const [
    users,
    dbRooms,
    dbActivities,
    dbReservations,
    dbActivityBookings,
    tickets,
    dbPayments,
    scheduleRows,
    menuRows,
    requestRows,
  ] = await Promise.all([
    db.users.findMany({ orderBy: { created_at: "desc" } }),
    db.rooms.findMany({ orderBy: { created_at: "desc" } }),
    db.activities.findMany({ orderBy: { created_at: "desc" } }),
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
      include: { users: { select: { first_name: true, last_name: true, email: true } } },
      orderBy: { created_at: "desc" },
    }),
    db.payments.findMany({
      include: {
        users: { select: { first_name: true, last_name: true, email: true } },
        reservations: { include: { rooms: { select: { title: true } } } },
        activity_bookings: { include: { activities: { select: { title: true } } } },
      },
      orderBy: { created_at: "desc" },
    }),
    readSheetRows(TAB_NAMES.entertainment),
    readSheetRows(TAB_NAMES.menu),
    readSheetRows(TAB_NAMES.requests),
  ]);

  // Convert all Prisma objects to plain JS objects to avoid Decimal serialization issues
  const rooms = dbRooms.map((r) => JSON.parse(JSON.stringify({ ...r, price_per_night: Number(r.price_per_night || 0) })));
  const activities = dbActivities.map((a) => JSON.parse(JSON.stringify({ ...a, price: Number(a.price || 0) })));
  const reservations = dbReservations.map((r) => JSON.parse(JSON.stringify({ ...r, total_price: Number(r.total_price || 0) })));
  const activityBookings = dbActivityBookings.map((b) => JSON.parse(JSON.stringify({ ...b, total_price: Number(b.total_price || 0) })));
  const payments = dbPayments.map((p) => JSON.parse(JSON.stringify({ ...p, amount: Number(p.amount || 0) })));

  return (
    <div className="bg-stone-50 min-h-screen pt-24 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10 animate-fade-in-up">
        <AdminPortal
          users={users}
          rooms={rooms}
          activities={activities}
          reservations={reservations}
          activityBookings={activityBookings}
          tickets={tickets}
          payments={payments}
          scheduleRows={scheduleRows}
          menuRows={menuRows}
          requestRows={requestRows}
        />
      </div>
    </div>
  );
}
