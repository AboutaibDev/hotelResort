"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Calendar, Users, XCircle, AlertTriangle, X, Clock } from "lucide-react";

interface Room {
  id: number;
  title: string | null;
  image: string | null;
}

interface Reservation {
  id: number;
  check_in_date: Date | null;
  check_out_date: Date | null;
  guests_count: number | null;
  total_price: number;
  status: string;
  rooms: Room | null;
}

interface Activity {
  id: number;
  title: string | null;
  image: string | null;
}

interface ActivityBooking {
  id: number;
  booking_date: Date | null;
  participants_count: number | null;
  total_price: number;
  status: string;
  activities: Activity | null;
}

interface ReservationsListProps {
  initialReservations: Reservation[];
  initialActivityBookings: ActivityBooking[];
}

interface CancelTarget {
  type: "room" | "activity";
  id: number;
  label: string;
  checkInDate?: Date | null;
}

/** Returns true if check-in is within the next 12 hours */
function isWithin12Hours(checkInDate: Date | null | undefined): boolean {
  if (!checkInDate) return false;
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const diffMs = checkIn.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 12;
}

export default function ReservationsList({
  initialReservations,
  initialActivityBookings,
}: ReservationsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const openCancelModal = (target: CancelTarget) => {
    setErrorMsg(null);
    setCancelTarget(target);
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setErrorMsg(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;

    setLoadingId(`${cancelTarget.type}-${cancelTarget.id}`);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: cancelTarget.type, id: cancelTarget.id }),
      });

      if (res.ok) {
        closeCancelModal();
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to cancel booking. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error contacting server. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-12">
        {/* Rooms Reservations */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-serif font-bold text-slate-950">
            Suite Accommodations
          </h3>

          {initialReservations.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-500 text-xs italic">
              You have no room reservations yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initialReservations.map((res) => {
                const tooLateToCancel = isWithin12Hours(res.check_in_date);
                const canCancel = res.status !== "cancelled" && !tooLateToCancel;
                const showLockMessage = res.status !== "cancelled" && tooLateToCancel;

                return (
                  <div
                    key={res.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-primary">Booking ID: #{res.id}</span>
                          <h4 className="font-bold text-slate-900 text-base mt-1">
                            {res.rooms?.title || "Suite"}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${
                            res.status === "confirmed"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : res.status === "cancelled"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-xs text-slate-500 mt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            {res.check_in_date ? new Date(res.check_in_date).toLocaleDateString() : ""} to{" "}
                            {res.check_out_date ? new Date(res.check_out_date).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary shrink-0" />
                          <span>{res.guests_count} Guests</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-50 px-6 py-4 border-t border-slate-200/85 flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-900 text-sm">
                        ${Number(res.total_price).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        {showLockMessage && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                            <Clock className="h-3 w-3" />
                            Check-in within 12 hrs
                          </span>
                        )}
                        {canCancel && (
                          <button
                            onClick={() =>
                              openCancelModal({
                                type: "room",
                                id: res.id,
                                label: res.rooms?.title || "Suite",
                                checkInDate: res.check_in_date,
                              })
                            }
                            disabled={loadingId === `room-${res.id}`}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{loadingId === `room-${res.id}` ? "Cancelling..." : "Cancel"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Bookings */}
        <div className="flex flex-col gap-6">
          <h3 className="text-xl font-serif font-bold text-slate-950">
            Resort Activity Schedules
          </h3>

          {initialActivityBookings.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-500 text-xs italic">
              You have no activity bookings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initialActivityBookings.map((bk) => {
                const tooLateToCancel = isWithin12Hours(bk.booking_date);
                const canCancel = bk.status !== "cancelled" && !tooLateToCancel;
                const showLockMessage = bk.status !== "cancelled" && tooLateToCancel;

                return (
                  <div
                    key={bk.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-primary">Booking ID: #{bk.id}</span>
                          <h4 className="font-bold text-slate-900 text-base mt-1">
                            {bk.activities?.title || "Activity"}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border ${
                            bk.status === "confirmed"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : bk.status === "cancelled"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          }`}
                        >
                          {bk.status}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-xs text-slate-500 mt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            Scheduled: {bk.booking_date ? new Date(bk.booking_date).toLocaleDateString() : "Today"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary shrink-0" />
                          <span>{bk.participants_count} Participants</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-50 px-6 py-4 border-t border-slate-200/85 flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-900 text-sm">
                        ${Number(bk.total_price).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        {showLockMessage && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                            <Clock className="h-3 w-3" />
                            Activity within 12 hrs
                          </span>
                        )}
                        {canCancel && (
                          <button
                            onClick={() =>
                              openCancelModal({
                                type: "activity",
                                id: bk.id,
                                label: bk.activities?.title || "Activity",
                                checkInDate: bk.booking_date,
                              })
                            }
                            disabled={loadingId === `activity-${bk.id}`}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{loadingId === `activity-${bk.id}` ? "Cancelling..." : "Cancel"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirmation Modal (portalled to body so it overlays Navbar + Footer) ── */}
      {mounted && cancelTarget && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
          onClick={closeCancelModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 flex flex-col gap-6 animate-[fade-in-up_0.25s_ease_forwards]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg font-serif">Cancel Booking</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={closeCancelModal}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer mt-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="bg-stone-50 rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-1.5">
              <p className="text-sm text-slate-600 leading-relaxed">
                You are about to cancel your reservation for:
              </p>
              <p className="font-bold text-slate-900 text-base">{cancelTarget.label}</p>
              {cancelTarget.checkInDate && (
                <p className="text-xs text-slate-500">
                  {cancelTarget.type === "room" ? "Check-in" : "Scheduled"}:{" "}
                  <span className="font-semibold">
                    {new Date(cancelTarget.checkInDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>

            <p className="text-sm text-slate-500">
              Once cancelled, your booking will be marked as{" "}
              <span className="font-semibold text-rose-500">cancelled</span> and a notification
              will be sent to your account.
            </p>

            {/* Error message */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closeCancelModal}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-stone-50 font-medium text-sm transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancel}
                disabled={!!loadingId}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingId ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Cancelling…</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Yes, Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
