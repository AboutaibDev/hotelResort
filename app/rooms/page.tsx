import React from "react";
import { db } from "@/lib/db";
import RoomsCatalog from "@/components/RoomsCatalog";

export const revalidate = 0;

export default async function RoomsPage() {
  
  const dbRooms = await db.rooms.findMany({
    orderBy: [
      { status: "asc" },
      { price_per_night: "asc" },
    ],
  });

  const rooms = dbRooms.map((r: any) => ({
    ...r,
    price_per_night: Number(r.price_per_night || 0),
    status: r.status || "available",
  }));

  return (
    <div className="py-16 bg-stone-50 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Luxury Stays
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-950 leading-tight">
            Our Premium Suites & Villas
          </h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
          <p className="text-slate-500 font-light text-sm md:text-base leading-relaxed">
            Find the perfect suite for your escape. From majestic penthouse suites with infinity pools to quiet, romantic garden villas, each room is a masterwork of design.
          </p>
        </div>

        {/* Dynamic Catalog */}
        <RoomsCatalog initialRooms={rooms} />
      </div>
    </div>
  );
}
