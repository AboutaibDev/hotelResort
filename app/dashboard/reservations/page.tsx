import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import ReservationsList from "@/components/ReservationsList";

export const revalidate = 0;

export default async function ReservationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?redirect=/dashboard/reservations");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/login?redirect=/dashboard/reservations");
  }

  const dbReservations = await db.reservations.findMany({
    where: { user_id: decoded.id },
    include: {
      rooms: {
        select: {
          id: true,
          title: true,
          image: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const reservations = dbReservations.map((r: any) => ({
    ...r,
    total_price: Number(r.total_price || 0),
    status: r.status || "pending",
  }));

  const dbActivityBookings = await db.activity_bookings.findMany({
    where: { user_id: decoded.id },
    include: {
      activities: {
        select: {
          id: true,
          title: true,
          image: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const activityBookings = dbActivityBookings.map((b: any) => ({
    ...b,
    total_price: Number(b.total_price || 0),
    status: b.status || "pending",
  }));

  return (
    <div className="bg-stone-50 min-h-screen py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Customer Dashboard
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-slate-950">
            My Reservations & Bookings
          </h1>
          <p className="text-slate-600 text-sm font-light leading-relaxed max-w-xl">
            Review your active hotel room stays, cancellation rules, and scheduled resort experiences.
          </p>
        </div>

        {/* Dynamic Reservations List Component */}
        <ReservationsList
          initialReservations={reservations}
          initialActivityBookings={activityBookings}
        />
      </div>
    </div>
  );
}
