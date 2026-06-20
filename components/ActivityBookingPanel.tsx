"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addActivity } from "@/lib/redux/bookingSlice";
import { RootState } from "@/lib/redux/store";
import { Calendar, Users, ShoppingBag, Sparkles } from "lucide-react";

interface ActivityBookingPanelProps {
  activity: {
    id: number;
    title: string | null;
    price: any;
    capacity: number | null;
    image: string | null;
  };
}

export default function ActivityBookingPanel({ activity }: ActivityBookingPanelProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const [date, setDate] = useState(getTomorrowString());
  const [participants, setParticipants] = useState(1);

  const pricePerPerson = Number(activity.price);
  const totalPrice = pricePerPerson * participants;

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(`/activities/${activity.id}`));
      return;
    }

    dispatch(
      addActivity({
        id: activity.id,
        title: activity.title || "Resort Experience",
        price: pricePerPerson,
        image: activity.image,
        participantsCount: participants,
      })
    );

    // Let the user go to checkout to complete booking
    router.push("/checkout");
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80 flex flex-col gap-6 sticky top-24">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <span className="text-2xl font-bold font-serif text-slate-900">
            ${pricePerPerson}
          </span>
          <span className="text-xs text-slate-400 ml-1">/ Guest</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Sparkles className="h-3 w-3" />
          <span>Curated Guide</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Date selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Select Date</span>
          </label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
          />
        </div>

        {/* Participants count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Guests / Participants</span>
          </label>
          <select
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
          >
            {[...Array(activity.capacity || 5)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {i + 1 === 1 ? "Person" : "People"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost calculation */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">${pricePerPerson} x {participants} guests</span>
          <span className="font-medium text-slate-800">${totalPrice}</span>
        </div>
        <hr className="border-slate-200 my-1" />
        <div className="flex justify-between items-center text-base font-bold font-serif">
          <span className="text-slate-800">Total Cost</span>
          <span className="text-primary">${totalPrice}</span>
        </div>
      </div>

      <button
        onClick={handleBooking}
        className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-amber-400/30 flex items-center justify-center gap-2"
      >
        <ShoppingBag className="h-5 w-5" />
        <span>{isAuthenticated ? "Book Activity" : "Login to Book"}</span>
      </button>

      <p className="text-[10px] text-center text-slate-400">
        You can checkout this activity instantly, or choose to bundle it with standard suite bookings.
      </p>
    </div>
  );
}
