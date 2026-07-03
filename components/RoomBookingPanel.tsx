"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectRoom } from "@/lib/redux/bookingSlice";
import { RootState } from "@/lib/redux/store";
import { Calendar, Users, Calculator, Sparkles, AlertCircle } from "lucide-react";

interface BookedRange {
  checkIn: string;
  checkOut: string;
}

interface RoomBookingPanelProps {
  room: {
    id: number;
    title: string | null;
    price_per_night: number;
    capacity: number | null;
    image: string | null;
  };
}


/** Returns the first overlapping BookedRange, or null if no conflict */
function getOverlappingRange(
  checkIn: string,
  checkOut: string,
  bookedRanges: BookedRange[]
): BookedRange | null {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  for (const range of bookedRanges) {
    const bookedStart = new Date(range.checkIn);
    const bookedEnd = new Date(range.checkOut);
    // Overlap: start < bookedEnd && end > bookedStart
    if (start < bookedEnd && end > bookedStart) return range;
  }
  return null;
}

export default function RoomBookingPanel({ room }: RoomBookingPanelProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getDayAfterTomorrowString = () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split("T")[0];
  };

  const [checkIn, setCheckIn] = useState(getTomorrowString());
  const [checkOut, setCheckOut] = useState(getDayAfterTomorrowString());
  const [guests, setGuests] = useState(1);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);

  // Fetch booked dates for this room
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const res = await fetch(`/api/rooms/${room.id}/booked-dates`);
        if (res.ok) {
          const data = await res.json();
          setBookedRanges(data.bookedRanges || []);
        }
      } catch (err) {
        console.error("Failed to fetch booked dates:", err);
      } finally {
        setLoadingDates(false);
      }
    };
    fetchBookedDates();
  }, [room.id]);


  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  const pricePerNight = Number(room.price_per_night);
  const totalPrice = pricePerNight * nights;

  const overlappingRange = useMemo(
    () => getOverlappingRange(checkIn, checkOut, bookedRanges),
    [checkIn, checkOut, bookedRanges]
  );
  const isOverlapping = overlappingRange !== null;

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    // If new checkIn is >= checkOut, push checkOut one day ahead
    if (val >= checkOut) {
      const next = new Date(val);
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split("T")[0]);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(`/rooms/${room.id}`));
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return;
    }

    if (isOverlapping) {
      return;
    }

    dispatch(
      selectRoom({
        room: {
          id: room.id,
          title: room.title || "Luxury Room",
          pricePerNight,
          image: room.image,
        },
        checkIn,
        checkOut,
        guests,
      })
    );

    router.push("/checkout");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200/80 flex flex-col gap-6 sticky top-24">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <span className="text-2xl font-bold font-serif text-slate-900">
            {pricePerNight} DH
          </span>
          <span className="text-xs text-slate-400 ml-1">/ Night</span>
        </div>
      </div>



      <div className="flex flex-col gap-4">
        {/* Check In */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Check In Date</span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
          />
        </div>

        {/* Check Out */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Check Out Date</span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
          />
        </div>

        {/* Overlap Warning */}
        {isOverlapping && overlappingRange && (
          <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              These dates overlap an existing reservation.
            </p>
            <p className="text-rose-600 pl-5">
              Conflict with:{" "}
              <span className="font-mono font-bold">
                {overlappingRange.checkIn} → {overlappingRange.checkOut}
              </span>
            </p>
            <p className="text-rose-500 pl-5">Please choose different dates.</p>
          </div>
        )}

        {/* Guest Count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Guests</span>
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
          >
            {[...Array(room.capacity || 2)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {i + 1 === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{pricePerNight} DH x {nights} {nights === 1 ? "night" : "nights"}</span>
          <span className="font-medium text-slate-800">{totalPrice} DH</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Resort service fee</span>
          <span className="font-medium text-emerald-500">Free</span>
        </div>
        <hr className="border-slate-200 my-1" />
        <div className="flex justify-between items-center text-base font-bold font-serif">
          <span className="text-slate-800">Total</span>
          <span className="text-primary">{totalPrice} DH</span>
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={isOverlapping || loadingDates}
        className="w-full bg-primary hover:opacity-90 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Calculator className="h-5 w-5" />
        <span>
          {loadingDates
            ? "Checking Availability..."
            : isAuthenticated
            ? "Book Luxury Suite"
            : "Login to Book"}
        </span>
      </button>

      <p className="text-[10px] text-center text-slate-400">
        You won&apos;t be charged yet. Your booking can be customized with resort activities next.
      </p>
    </div>
  );
}
