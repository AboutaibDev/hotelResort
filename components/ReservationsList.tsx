"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar, Users, XCircle, AlertTriangle, X, Clock, Search,
  ArrowUpDown, BedDouble, Compass, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import ModalOverlay from "@/components/ModalOverlay";
import { parseImages } from "@/lib/images";

interface Room { id: number; title: string | null; image: string | null; }
interface Reservation {
  id: number; check_in_date: Date | null; check_out_date: Date | null;
  guests_count: number | null; total_price: number; status: string; rooms: Room | null;
}
interface Activity { id: number; title: string | null; image: string | null; }
interface ActivityBooking {
  id: number; booking_date: Date | null; participants_count: number | null;
  total_price: number; status: string; activities: Activity | null;
}
interface ReservationsListProps {
  initialReservations: Reservation[];
  initialActivityBookings: ActivityBooking[];
}
interface CancelTarget { type: "room" | "activity"; id: number; label: string; checkInDate?: Date | null; }

function isWithin12Hours(date: Date | null | undefined): boolean {
  if (!date) return false;
  const diffHours = (new Date(date).getTime() - Date.now()) / 3600000;
  return diffHours <= 12;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
  cancelled:  "bg-rose-500/10 border-rose-500/20 text-rose-500",
  pending:    "bg-amber-500/10 border-amber-500/20 text-amber-600",
};

const PAGE_SIZE = 6;

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-8 w-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            p === page ? "bg-primary text-slate-950" : "border border-slate-200 text-slate-500 hover:bg-stone-100"
          }`}
        >{p}</button>
      ))}
      <button
        onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ReservationsList({ initialReservations, initialActivityBookings }: ReservationsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled" | "pending">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "room" | "activity">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "price_desc" | "price_asc">("date_desc");

  // Pagination
  const [roomPage, setRoomPage] = useState(1);
  const [actPage, setActPage] = useState(1);

  // Unified list for combined view
  type BookingItem = { _type: "room"; data: Reservation } | { _type: "activity"; data: ActivityBooking };

  const allItems = useMemo<BookingItem[]>(() => {
    const rooms = initialReservations.map(r => ({ _type: "room" as const, data: r }));
    const acts  = initialActivityBookings.map(b => ({ _type: "activity" as const, data: b }));
    return [...rooms, ...acts];
  }, [initialReservations, initialActivityBookings]);

  const getDate = (item: BookingItem) => {
    if (item._type === "room") return item.data.check_in_date ? new Date(item.data.check_in_date) : new Date(0);
    return item.data.booking_date ? new Date(item.data.booking_date) : new Date(0);
  };
  const getPrice = (item: BookingItem) => item.data.total_price;
  const getStatus = (item: BookingItem) => item.data.status;
  const getTitle = (item: BookingItem) =>
    item._type === "room" ? item.data.rooms?.title || "" : item.data.activities?.title || "";

  const filtered = useMemo(() => {
    return allItems
      .filter(item => {
        if (typeFilter !== "all" && item._type !== typeFilter) return false;
        if (statusFilter !== "all" && getStatus(item) !== statusFilter) return false;
        if (search && !getTitle(item).toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date_asc":   return getDate(a).getTime() - getDate(b).getTime();
          case "date_desc":  return getDate(b).getTime() - getDate(a).getTime();
          case "price_asc":  return getPrice(a) - getPrice(b);
          case "price_desc": return getPrice(b) - getPrice(a);
        }
      });
  }, [allItems, typeFilter, statusFilter, search, sortBy]);

  const filteredRooms = filtered.filter(i => i._type === "room").map(i => i.data as Reservation);
  const filteredActs  = filtered.filter(i => i._type === "activity").map(i => i.data as ActivityBooking);

  const paginatedRooms = filteredRooms.slice((roomPage - 1) * PAGE_SIZE, roomPage * PAGE_SIZE);
  const paginatedActs  = filteredActs.slice((actPage - 1) * PAGE_SIZE, actPage * PAGE_SIZE);

  const totalBookings = filteredRooms.length + filteredActs.length;

  const openCancelModal = (target: CancelTarget) => { setErrorMsg(null); setCancelTarget(target); };
  const closeCancelModal = () => { setCancelTarget(null); setErrorMsg(null); };

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
      if (res.ok) { closeCancelModal(); router.refresh(); }
      else { const d = await res.json(); setErrorMsg(d.error || "Failed to cancel. Please try again."); }
    } catch { setErrorMsg("Error contacting server. Please try again."); }
    finally { setLoadingId(null); }
  };

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-semibold text-slate-700">Filters</span>
          <span className="text-slate-400">·</span>
          <span className="text-primary font-bold">{totalBookings}</span>
          <span>result{totalBookings !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setRoomPage(1); setActPage(1); }}
              placeholder="Search by name..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-800 transition-colors"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          {/* Type */}
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value as any); setRoomPage(1); setActPage(1); }}
            className="px-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="room">Room Stays</option>
            <option value="activity">Activities</option>
          </select>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as any); setRoomPage(1); setActPage(1); }}
            className="px-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as any); setRoomPage(1); setActPage(1); }}
              className="pl-8 pr-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer appearance-none"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="price_asc">Price: Low → High</option>
            </select>
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {totalBookings === 0 && (search || statusFilter !== "all" || typeFilter !== "all") ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200/80 shadow-sm text-center text-slate-500 text-sm italic">
          No bookings match your filters.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Room Stays */}
          {(typeFilter === "all" || typeFilter === "room") && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <BedDouble className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-slate-900">Suite Accommodations</h3>
                <span className="text-xs font-bold text-slate-400 bg-stone-100 px-2.5 py-0.5 rounded-full">{filteredRooms.length}</span>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs italic">
                  No room reservations found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedRooms.map(res => {
                      const tooLate = isWithin12Hours(res.check_in_date);
                      const canCancel = res.status !== "cancelled" && !tooLate;
                      const thumbnail = res.rooms?.image
                        ? (() => { try { const p = JSON.parse(res.rooms.image!); return p[0] || ""; } catch { return res.rooms.image!; } })()
                        : "";
                      return (
                        <div key={res.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          {/* Image */}
                          {thumbnail ? (
                            <div className="relative h-40 w-full bg-slate-100 overflow-hidden shrink-0">
                              <Image src={thumbnail} alt={res.rooms?.title || "Room"} fill sizes="400px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                              <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${STATUS_COLORS[res.status] || STATUS_COLORS.pending}`}>{res.status}</span>
                            </div>
                          ) : (
                            <div className="h-40 bg-gradient-to-br from-stone-100 to-slate-100 flex items-center justify-center shrink-0">
                              <BedDouble className="h-10 w-10 text-slate-300" />
                            </div>
                          )}
                          {/* Content */}
                          <div className="p-5 flex flex-col flex-1 gap-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-primary">Booking #{res.id}</span>
                              <h4 className="font-bold text-slate-900 text-base mt-0.5 leading-tight">{res.rooms?.title || "Suite"}</h4>
                            </div>
                            <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>
                                  {res.check_in_date ? new Date(res.check_in_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                  {" → "}
                                  {res.check_out_date ? new Date(res.check_out_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{res.guests_count} Guest{(res.guests_count || 0) > 1 ? "s" : ""}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                              <span className="font-bold text-slate-900 text-sm">{Number(res.total_price).toLocaleString()} DH</span>
                              <div className="flex items-center gap-2">
                                {res.status !== "cancelled" && tooLate && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                    <Clock className="h-3 w-3" /> Within 12h
                                  </span>
                                )}
                                {canCancel && (
                                  <button
                                    onClick={() => openCancelModal({ type: "room", id: res.id, label: res.rooms?.title || "Suite", checkInDate: res.check_in_date })}
                                    disabled={loadingId === `room-${res.id}`}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {loadingId === `room-${res.id}` ? "Cancelling…" : "Cancel"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination page={roomPage} total={filteredRooms.length} pageSize={PAGE_SIZE} onChange={p => { setRoomPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                </>
              )}
            </div>
          )}

          {/* Activity Bookings */}
          {(typeFilter === "all" || typeFilter === "activity") && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-serif font-bold text-slate-900">Resort Experiences</h3>
                <span className="text-xs font-bold text-slate-400 bg-stone-100 px-2.5 py-0.5 rounded-full">{filteredActs.length}</span>
              </div>

              {filteredActs.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs italic">
                  No activity bookings found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedActs.map(bk => {
                      const tooLate = isWithin12Hours(bk.booking_date);
                      const canCancel = bk.status !== "cancelled" && !tooLate;
                      const thumbnail = bk.activities?.image
                        ? (() => { try { const p = JSON.parse(bk.activities.image!); return p[0] || ""; } catch { return bk.activities.image!; } })()
                        : "";
                      return (
                        <div key={bk.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          {thumbnail ? (
                            <div className="relative h-40 w-full bg-slate-100 overflow-hidden shrink-0">
                              <Image src={thumbnail} alt={bk.activities?.title || "Activity"} fill sizes="400px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                              <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${STATUS_COLORS[bk.status] || STATUS_COLORS.pending}`}>{bk.status}</span>
                            </div>
                          ) : (
                            <div className="h-40 bg-gradient-to-br from-stone-100 to-slate-100 flex items-center justify-center shrink-0">
                              <Compass className="h-10 w-10 text-slate-300" />
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-1 gap-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-primary">Booking #{bk.id}</span>
                              <h4 className="font-bold text-slate-900 text-base mt-0.5 leading-tight">{bk.activities?.title || "Activity"}</h4>
                            </div>
                            <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>Scheduled: {bk.booking_date ? new Date(bk.booking_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>{bk.participants_count} Participant{(bk.participants_count || 0) > 1 ? "s" : ""}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                              <span className="font-bold text-slate-900 text-sm">{Number(bk.total_price).toLocaleString()} DH</span>
                              <div className="flex items-center gap-2">
                                {bk.status !== "cancelled" && tooLate && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                    <Clock className="h-3 w-3" /> Within 12h
                                  </span>
                                )}
                                {canCancel && (
                                  <button
                                    onClick={() => openCancelModal({ type: "activity", id: bk.id, label: bk.activities?.title || "Activity", checkInDate: bk.booking_date })}
                                    disabled={loadingId === `activity-${bk.id}`}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {loadingId === `activity-${bk.id}` ? "Cancelling…" : "Cancel"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination page={actPage} total={filteredActs.length} pageSize={PAGE_SIZE} onChange={p => { setActPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <ModalOverlay open onClose={closeCancelModal}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 flex flex-col gap-6 animate-[fade-in-up_0.25s_ease_forwards]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100"><AlertTriangle className="h-6 w-6 text-rose-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg font-serif">Cancel Booking</h3>
                  <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={closeCancelModal} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer mt-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="bg-stone-50 rounded-2xl border border-slate-200/80 p-4 flex flex-col gap-1.5">
              <p className="text-sm text-slate-600">You are about to cancel your reservation for:</p>
              <p className="font-bold text-slate-900 text-base">{cancelTarget.label}</p>
              {cancelTarget.checkInDate && (
                <p className="text-xs text-slate-500">
                  {cancelTarget.type === "room" ? "Check-in" : "Scheduled"}:{" "}
                  <span className="font-semibold">{new Date(cancelTarget.checkInDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </p>
              )}
            </div>
            <p className="text-sm text-slate-500">Once cancelled, your booking will be marked as <span className="font-semibold text-rose-500">cancelled</span> and a notification will be sent to your account.</p>
            {errorMsg && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">{errorMsg}</div>}
            <div className="flex gap-3 pt-1">
              <button onClick={closeCancelModal} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-stone-50 font-medium text-sm transition-colors cursor-pointer">Keep Booking</button>
              <button onClick={confirmCancel} disabled={!!loadingId} className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
                {loadingId ? (<><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Cancelling…</span></>) : (<><XCircle className="h-4 w-4" /><span>Yes, Cancel</span></>)}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}
