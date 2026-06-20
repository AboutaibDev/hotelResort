"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { resetBooking } from "@/lib/redux/bookingSlice";
import { CreditCard, Calendar, Users, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { room, checkInDate, checkOutDate, guestsCount, activities } = useSelector(
    (state: RootState) => state.booking
  );

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txRef, setTxRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  // Calculate prices
  const roomPrice = room ? Number(room.pricePerNight) : 0;
  const nights = checkInDate && checkOutDate
    ? Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1;
  const roomSubtotal = roomPrice * nights;

  const activitiesSubtotal = activities.reduce(
    (acc, act) => acc + Number(act.price) * act.participantsCount,
    0
  );

  const total = roomSubtotal + activitiesSubtotal;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room && activities.length === 0) {
      setError("Your booking cart is empty.");
      return;
    }

    if (!cardName || !cardNumber || !expiry || !cvv) {
      setError("Please fill out all simulated payment card details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room,
          checkInDate,
          checkOutDate,
          guestsCount,
          activities,
          paymentMethod: "Visa Simulated",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTxRef(data.transactionRef);
        setSuccess(true);
        dispatch(resetBooking());
      } else {
        const data = await res.json();
        setError(data.error || "Simulated payment transaction failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Could not complete transaction.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 flex items-center justify-center transition-colors">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center flex flex-col items-center gap-6 animate-fade-in-up">
          <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Reservation Confirmed!
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you for booking with Amanora Resort. Your simulated payment transaction has completed successfully.
          </p>
          <div className="bg-stone-50 p-4 rounded-xl border border-slate-200 w-full flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Transaction Reference</span>
            <span className="font-mono text-sm font-bold text-primary">{txRef}</span>
          </div>
          <Link
            href="/dashboard"
            className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md"
          >
            Go to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16 transition-colors">
      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-950">
          Booking Checkout
        </h1>

        {total === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/85 shadow-sm flex flex-col items-center gap-4">
            <p className="text-slate-500">Your reservation cart is currently empty.</p>
            <Link
              href="/rooms"
              className="bg-primary text-slate-950 px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-amber-400 transition-colors"
            >
              Browse Stays
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Cart summary */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
                <h3 className="text-lg font-serif font-bold text-slate-900 pb-2 border-b border-slate-200">
                  Cart Review
                </h3>

                {/* Selected Room */}
                {room && (
                  <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 pb-6 items-start">
                    <div className="relative h-24 w-36 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <img
                        src={room.image || ""}
                        alt={room.title}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="text-[10px] uppercase font-bold text-primary">Luxury Suite</span>
                      <h4 className="font-bold text-slate-900 text-base">{room.title}</h4>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{checkInDate} to {checkOutDate} ({nights} {nights === 1 ? "night" : "nights"})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{guestsCount} Guests</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right sm:self-center shrink-0">
                      <span className="font-bold text-slate-900 text-base">${roomSubtotal}</span>
                    </div>
                  </div>
                )}

                {/* Selected Activities */}
                {activities.length > 0 && (
                  <div className="flex flex-col gap-6">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 pb-6 items-start"
                      >
                        <div className="relative h-24 w-36 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={act.image || ""}
                            alt={act.title}
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <span className="text-[10px] uppercase font-bold text-primary">Resort Activity</span>
                          <h4 className="font-bold text-slate-900 text-base">{act.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{act.participantsCount} {act.participantsCount === 1 ? "participant" : "participants"}</span>
                          </div>
                        </div>
                        <div className="text-right sm:self-center shrink-0">
                          <span className="font-bold text-slate-900 text-base">
                            ${Number(act.price) * act.participantsCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center font-serif font-bold text-lg text-slate-900 pt-2">
                  <span>Grand Total</span>
                  <span className="text-primary text-xl">${total}</span>
                </div>
              </div>
            </div>

            {/* Payment Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-serif font-bold text-slate-900">
                    Simulated Payment
                  </h3>
                </div>

                <div className="bg-amber-500/10 text-primary border border-primary/20 p-4 rounded-2xl text-[11px] leading-relaxed">
                  <strong>Simulated Mode:</strong> Do not enter real credit card numbers. Fill in mock card values below to authorize this reservation.
                </div>

                {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

                <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Expiration</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-amber-400/30 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? "Processing..." : `Pay $${total}`}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
