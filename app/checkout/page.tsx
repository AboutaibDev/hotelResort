"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { resetBooking } from "@/lib/redux/bookingSlice";
import {
  CreditCard, Calendar, Users, ShoppingBag, ShieldCheck,
  CheckCircle2, Loader2, AlertCircle, Lock, ArrowRight
} from "lucide-react";

type PaymentStep = "idle" | "validating" | "processing" | "confirming" | "success" | "error";

const STEP_CONFIG = [
  { key: "validating", label: "Validating card details", duration: 900 },
  { key: "processing", label: "Processing payment", duration: 1400 },
  { key: "confirming", label: "Confirming booking", duration: 600 },
];

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

  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [txRef, setTxRef] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router]);

  const roomPrice = room ? Number(room.pricePerNight) : 0;
  const nights =
    checkInDate && checkOutDate
      ? Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 1;
  const roomSubtotal = roomPrice * nights;
  const activitiesSubtotal = activities.reduce(
    (acc, act) => acc + Number(act.price) * act.participantsCount,
    0
  );
  const total = roomSubtotal + activitiesSubtotal;

  // Format card number with spaces
  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    return clean.replace(/(.{4})/g, "$1 ").trim();
  };

  // Format expiry MM/YY
  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  const runPaymentSteps = async (): Promise<{ ok: boolean; data: any }> => {
    for (let i = 0; i < STEP_CONFIG.length; i++) {
      setCurrentStepIndex(i);
      setPaymentStep(STEP_CONFIG[i].key as PaymentStep);
      await new Promise((r) => setTimeout(r, STEP_CONFIG[i].duration));
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room,
        checkInDate,
        checkOutDate,
        guestsCount,
        activities,
        paymentMethod: "card",
        cardName,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expiry,
        cvv,
      }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room && activities.length === 0) {
      setErrorMsg("Your booking cart is empty.");
      return;
    }
    if (!cardName || !cardNumber || !expiry || !cvv) {
      setErrorMsg("Please fill out all card details.");
      return;
    }

    setPaymentStep("validating");
    setCurrentStepIndex(0);
    setErrorMsg(null);

    try {
      const { ok, data } = await runPaymentSteps();
      if (ok) {
        setAmountPaid(total);
        setTxRef(data.transactionRef);
        setPaymentStep("success");
        dispatch(resetBooking());
      } else {
        setErrorMsg(data.error || "Payment failed. Please try again.");
        setPaymentStep("error");
      }
    } catch {
      setErrorMsg("Connection error. Could not complete transaction.");
      setPaymentStep("error");
    }
  };

  const isProcessing =
    paymentStep === "validating" ||
    paymentStep === "processing" ||
    paymentStep === "confirming";

  /* ────────────────── SUCCESS SCREEN ────────────────── */
  if (paymentStep === "success") {
    return (
      <div className="min-h-screen bg-stone-50 py-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-slate-200 shadow-xl text-center flex flex-col items-center gap-6">
          <div className="relative">
            <div className="p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
              Reservation Confirmed!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Thank you for choosing Amanora Resort. Your booking has been secured and a confirmation will appear in your dashboard.
            </p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-slate-200 w-full flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Transaction Reference
            </span>
            <span className="font-mono text-sm font-bold text-primary">{txRef}</span>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-slate-900">{amountPaid} DH</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2"
          >
            Go to My Dashboard <ArrowRight className="h-4 w-4" />
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

                {room && (
                  <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 pb-6 items-start">
                    <div className="relative h-24 w-36 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      {room.image && (
                        <img
                          src={room.image.startsWith("[") ? JSON.parse(room.image)[0] : room.image}
                          alt={room.title || "Room"}
                          className="object-cover h-full w-full"
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <span className="text-[10px] uppercase font-bold text-primary">Resort Room</span>
                      <h4 className="font-bold text-slate-900 text-base">{room.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {checkInDate} → {checkOutDate} ({nights} {nights === 1 ? "night" : "nights"})
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {guestsCount} Guests
                        </span>
                      </div>
                    </div>
                    <div className="text-right sm:self-center shrink-0">
                      <span className="font-bold text-slate-900 text-base">{roomSubtotal} DH</span>
                    </div>
                  </div>
                )}

                {activities.length > 0 && (
                  <div className="flex flex-col gap-6">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 pb-6 items-start"
                      >
                        <div className="relative h-24 w-36 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={act.image && act.image.startsWith("[") ? JSON.parse(act.image)[0] : (act.image || "")}
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
                            {Number(act.price) * act.participantsCount} DH
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center font-serif font-bold text-lg text-slate-900 pt-2">
                  <span>Grand Total</span>
                  <span className="text-primary text-xl">{total} DH</span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-serif font-bold text-slate-900">Secure Payment</h3>
                </div>

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="bg-stone-50 rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
                    <p className="text-sm font-semibold text-slate-700 text-center">Processing your payment…</p>
                    <div className="flex flex-col gap-3">
                      {STEP_CONFIG.map((step, idx) => {
                        const done = idx < currentStepIndex;
                        const active = idx === currentStepIndex;
                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? "bg-emerald-500" : active ? "bg-primary animate-pulse" : "bg-slate-200"}`}>
                              {done ? (
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              ) : active ? (
                                <Loader2 className="h-4 w-4 text-white animate-spin" />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                              )}
                            </div>
                            <span className={`text-sm font-medium ${done ? "text-emerald-600" : active ? "text-slate-900" : "text-slate-400"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {paymentStep === "error" && errorMsg && (
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Payment Failed</p>
                      <p className="text-xs text-rose-500 mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {!isProcessing && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Mohammed Farah"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800 pr-12"
                        />
                        <CreditCard className="h-4 w-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiry Date</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">CVV</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                        />
                      </div>
                    </div>

                    {paymentStep === "idle" && errorMsg && (
                      <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-amber-400/30 flex items-center justify-center gap-2 mt-2"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>Pay {total} DH</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="flex flex-col gap-4 sticky top-24">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
                <h3 className="font-serif font-bold text-slate-900 text-base border-b border-slate-200 pb-3">Order Summary</h3>
                {room && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{room.title} ({nights}n)</span>
                    <span className="font-medium text-slate-800">{roomSubtotal} DH</span>
                  </div>
                )}
                {activities.map((act) => (
                  <div key={act.id} className="flex justify-between text-sm">
                    <span className="text-slate-500">{act.title} ×{act.participantsCount}</span>
                    <span className="font-medium text-slate-800">{Number(act.price) * act.participantsCount} DH</span>
                  </div>
                ))}
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-primary text-lg">{total} DH</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>100% secure transaction</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
