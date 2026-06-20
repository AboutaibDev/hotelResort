"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { parseImages, stringifyImages } from "@/lib/images";
import {
  Users,
  Compass,
  Calendar,
  Ticket,
  Plus,
  Save,
  MessageSquare,
  Trash2,
  Lock,
  ChevronRight,
  TrendingUp,
  CircleDollarSign,
  AlertCircle,
  AlertTriangle,
  X
} from "lucide-react";

interface UserItem {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: any;
}

interface RoomItem {
  id: number;
  title: string | null;
  description: string | null;
  price_per_night: any;
  capacity: number | null;
  status: any;
  image: string | null;
}

interface ActivityItem {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  price: any;
  capacity: number | null;
  duration: number | null;
  status: any;
  image: string | null;
}

interface ReservationItem {
  id: number;
  user_id: number | null;
  room_id: number | null;
  check_in_date: Date | null;
  check_out_date: Date | null;
  guests_count: number | null;
  total_price: any;
  status: any;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
  rooms: { title: string | null } | null;
}

interface ActivityBookingItem {
  id: number;
  user_id: number | null;
  activity_id: number | null;
  booking_date: Date | null;
  participants_count: number | null;
  total_price: any;
  status: any;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
  activities: { title: string | null } | null;
}

interface SupportTicketItem {
  id: number;
  user_id: number | null;
  subject: string | null;
  message: string | null;
  status: any;
  priority: any;
  created_at: Date;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

interface AdminPortalProps {
  users: UserItem[];
  rooms: RoomItem[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  activityBookings: ActivityBookingItem[];
  tickets: SupportTicketItem[];
}

export default function AdminPortal({
  users,
  rooms,
  activities,
  reservations,
  activityBookings,
  tickets,
}: AdminPortalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "tickets" | "users" | "bookings">("overview");

  // State for content management editing/creating
  const [editingItem, setEditingItem] = useState<{ type: "room" | "activity"; item: any | null } | null>(null);
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
    price: "",
    capacity: "",
    image: "",
    status: "available",
    category: "Wellness", // for activities
    duration: "", // for activities
  });
  // Separate list for multi-image editing
  const [imageList, setImageList] = useState<string[]>([""]);

  // State for support ticket reply
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketStatus, setTicketStatus] = useState("closed");

  // Loading indicator states
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Custom Alert Modal
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false, title: "", message: "",
  });

  // Custom Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: (() => void) | null;
  }>({ isOpen: false, title: "", message: "", onConfirm: null });

  const showAlert = (message: string, title = "Alert") =>
    setAlertModal({ isOpen: true, title, message });

  const showConfirm = (message: string, onConfirm: () => void, title = "Confirm Action") =>
    setConfirmModal({ isOpen: true, title, message, onConfirm });

  // Overview metrics calculation
  const totalRevenue = reservations
    .filter((r) => r.status === "confirmed")
    .reduce((acc, r) => acc + Number(r.total_price), 0) +
    activityBookings
      .filter((b) => b.status === "confirmed")
      .reduce((acc, b) => acc + Number(b.total_price), 0);

  const pendingTickets = tickets.filter((t) => t.status === "open").length;

  const handleOpenEdit = (type: "room" | "activity", item: any | null) => {
    setEditingItem({ type, item });
    if (item) {
      const imgs = parseImages(item.image, type);
      setImageList(imgs);
      setContentForm({
        title: item.title || "",
        description: item.description || "",
        price: Number(item.price_per_night || item.price).toString(),
        capacity: (item.capacity || "").toString(),
        image: item.image || "",
        status: item.status || "available",
        category: item.category || "Wellness",
        duration: (item.duration || "").toString(),
      });
    } else {
      setImageList([""]);
      setContentForm({
        title: "",
        description: "",
        price: "",
        capacity: "",
        image: "",
        status: "available",
        category: "Wellness",
        duration: "",
      });
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setLoading(true);
    try {
      const isNew = !editingItem.item;
      const serializedImages = stringifyImages(imageList);
      const payload = {
        type: editingItem.type,
        id: editingItem.item?.id,
        data: { ...contentForm, image: serializedImages },
      };
      const res = await fetch("/api/admin/content", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { setEditingItem(null); router.refresh(); }
      else { const data = await res.json(); showAlert(data.error || "Save operation failed.", "Save Error"); }
    } catch (err) { console.error(err); showAlert("Error saving item.", "Save Error"); }
    finally { setLoading(false); }
  };

  const handleSaveTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicket.id, reply: ticketReply, status: ticketStatus }),
      });
      if (res.ok) { setSelectedTicket(null); setTicketReply(""); router.refresh(); }
      else { const data = await res.json(); showAlert(data.error || "Failed to update ticket.", "Ticket Error"); }
    } catch (err) { console.error(err); showAlert("Error updating ticket.", "Ticket Error"); }
    finally { setLoading(false); }
  };

  const handleToggleUserRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    showConfirm(
      `Are you sure you want to change this user's role to "${newRole}"?`,
      async () => {
        try {
          const res = await fetch("/api/admin/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role: newRole }),
          });
          if (res.ok) { router.refresh(); }
          else { const data = await res.json(); showAlert(data.error || "Failed to update role.", "Role Error"); }
        } catch (err) { console.error(err); }
      },
      "Change User Role"
    );
  };

  const handleDeleteUser = (userId: number) => {
    showConfirm(
      "WARNING: Deleting a user will permanently clear all associated reservations, activity bookings, payments, and reviews. Proceed?",
      async () => {
        try {
          const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
          if (res.ok) { router.refresh(); }
          else { const data = await res.json(); showAlert(data.error || "Failed to delete user.", "Delete Error"); }
        } catch (err) { console.error(err); }
      },
      "Delete User Permanently"
    );
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      {/* Admin Sidebar Navigation */}
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-3">
          Dashboard Controls
        </h3>

        <button
          onClick={() => setActiveTab("overview")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-primary text-slate-950 shadow-md shadow-primary/10"
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5" />
            <span>Overview Metrics</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>

        <button
          onClick={() => setActiveTab("content")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "content"
              ? "bg-primary text-slate-950 shadow-md shadow-primary/10"
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass className="h-4.5 w-4.5" />
            <span>Content Manager</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "bookings"
              ? "bg-primary text-slate-950 shadow-md shadow-primary/10"
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5" />
            <span>Reservations List</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>

        <button
          onClick={() => setActiveTab("tickets")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "tickets"
              ? "bg-primary text-slate-950 shadow-md shadow-primary/10"
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Ticket className="h-4.5 w-4.5" />
            <span>Support Tickets</span>
          </div>
          {pendingTickets > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {pendingTickets}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-primary text-slate-950 shadow-md shadow-primary/10"
              : "hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4.5 w-4.5" />
            <span>Users Directory</span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>
      </div>

      {/* Admin Content Area */}
      <div className="lg:col-span-3 flex flex-col gap-8">
        
        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
                <CircleDollarSign className="h-8 w-8 text-primary" />
                <span className="text-xs text-slate-400 mt-2 font-bold uppercase">Estimated Revenue</span>
                <span className="text-3xl font-bold text-slate-900">${totalRevenue.toFixed(0)}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                <span className="text-xs text-slate-400 mt-2 font-bold uppercase">Room Bookings</span>
                <span className="text-3xl font-bold text-slate-900">{reservations.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col gap-2">
                <Ticket className="h-8 w-8 text-primary" />
                <span className="text-xs text-slate-400 mt-2 font-bold uppercase">Support Issues</span>
                <span className="text-3xl font-bold text-slate-900">{tickets.length}</span>
              </div>
            </div>

            {/* Quick overview table of active stays */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-serif font-bold text-slate-900 pb-2 border-b border-slate-200">
                Recent Guest Stays
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-2">Guest</th>
                      <th className="py-3 px-2">Suite Booked</th>
                      <th className="py-3 px-2">Check In</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, 5).map((res) => (
                      <tr key={res.id} className="border-b border-slate-200/60">
                        <td className="py-4 px-2 font-semibold">
                          {res.users?.first_name} {res.users?.last_name}
                        </td>
                        <td className="py-4 px-2">{res.rooms?.title}</td>
                        <td className="py-4 px-2">
                          {res.check_in_date ? new Date(res.check_in_date).toLocaleDateString() : ""}
                        </td>
                        <td className="py-4 px-2">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              res.status === "confirmed"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                : res.status === "cancelled"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-bold">${Number(res.total_price).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTENT MANAGER */}
        {activeTab === "content" && (
          <div className="flex flex-col gap-8 animate-fade-in-up">
            {/* Rooms Management */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="text-lg font-serif font-bold text-slate-950">
                  Manage Hotel Rooms ({rooms.length})
                </h3>
                <button
                  onClick={() => handleOpenEdit("room", null)}
                  className="bg-primary hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Room</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 bg-stone-50 rounded-2xl border border-slate-200 flex gap-4 items-center"
                  >
                    <img
                      src={room.image || ""}
                      alt={room.title || ""}
                      className="h-16 w-24 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{room.title}</h4>
                      <p className="text-xs text-slate-450 mt-1">${Number(room.price_per_night).toFixed(0)}/night • {room.capacity} cap</p>
                    </div>
                    <button
                      onClick={() => handleOpenEdit("room", room)}
                      className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities Management */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <h3 className="text-lg font-serif font-bold text-slate-955">
                  Manage Resort Activities ({activities.length})
                </h3>
                <button
                  onClick={() => handleOpenEdit("activity", null)}
                  className="bg-primary hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Activity</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 bg-stone-50 rounded-2xl border border-slate-200 flex gap-4 items-center"
                  >
                    <img
                      src={act.image || ""}
                      alt={act.title || ""}
                      className="h-16 w-24 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{act.title}</h4>
                      <p className="text-xs text-slate-450 mt-1">${Number(act.price).toFixed(0)}/person • {act.category}</p>
                    </div>
                    <button
                      onClick={() => handleOpenEdit("activity", act)}
                      className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Content Form Modal overlay — portalled over Navbar + Footer */}
            {mounted && editingItem && createPortal(
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[9999] flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-serif font-bold text-slate-950">
                      {editingItem.item ? "Edit" : "Create"} {editingItem.type === "room" ? "Room" : "Activity"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveContent} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Title</label>
                      <input
                        type="text"
                        required
                        value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                      <textarea
                        required
                        rows={4}
                        value={contentForm.description}
                        onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Price ($)</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={contentForm.price}
                          onChange={(e) => setContentForm({ ...contentForm, price: e.target.value })}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Max Capacity</label>
                        <input
                          type="number"
                          required
                          value={contentForm.capacity}
                          onChange={(e) => setContentForm({ ...contentForm, capacity: e.target.value })}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                        />
                      </div>
                    </div>

                    {editingItem.type === "activity" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Category</label>
                          <select
                            value={contentForm.category}
                            onChange={(e) => setContentForm({ ...contentForm, category: e.target.value })}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-800"
                          >
                            <option value="Wellness">Wellness</option>
                            <option value="Adventure">Adventure</option>
                            <option value="Leisure">Leisure</option>
                            <option value="Gastronomy">Gastronomy</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">Duration (mins)</label>
                          <input
                            type="number"
                            required
                            value={contentForm.duration}
                            onChange={(e) => setContentForm({ ...contentForm, duration: e.target.value })}
                            className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                        <select
                          value={contentForm.status}
                          onChange={(e) => setContentForm({ ...contentForm, status: e.target.value })}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-800"
                        >
                          <option value="available">Available / Active</option>
                          <option value="unavailable">Unavailable / Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Multi-image URL list */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Images (URLs)</label>
                        <button
                          type="button"
                          onClick={() => setImageList((prev) => [...prev, ""])}
                          className="text-[10px] font-bold text-primary hover:text-amber-500 uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add Image
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {imageList.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={`Image URL ${idx + 1}`}
                              value={url}
                              onChange={(e) => {
                                const next = [...imageList];
                                next[idx] = e.target.value;
                                setImageList(next);
                              }}
                              className="flex-1 px-4 py-2 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                            />
                            {imageList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setImageList((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                aria-label="Remove image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Preview strip */}
                      {imageList.some((u) => u.trim()) && (
                        <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                          {imageList.filter((u) => u.trim()).map((u, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={u}
                              alt={`preview ${i + 1}`}
                              className="h-16 w-24 object-cover rounded-lg border border-slate-200 shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary hover:bg-amber-400 text-slate-955 font-bold rounded-xl text-xs flex items-center gap-1"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? "Saving..." : "Save Content"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* TAB 3: BOOKINGS MANAGER */}
        {activeTab === "bookings" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 animate-fade-in-up">
            <h3 className="text-lg font-serif font-bold text-slate-950 pb-2 border-b border-slate-200">
              All Guest Bookings (Rooms & Activities)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Guest</th>
                    <th className="py-3 px-2">Booking Description</th>
                    <th className="py-3 px-2">Check In / Date</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={`room-${res.id}`} className="border-b border-slate-200/60">
                      <td className="py-4 px-2 font-bold text-primary">Suite</td>
                      <td className="py-4 px-2">{res.users?.first_name} {res.users?.last_name}</td>
                      <td className="py-4 px-2">{res.rooms?.title}</td>
                      <td className="py-4 px-2">{res.check_in_date ? new Date(res.check_in_date).toLocaleDateString() : ""}</td>
                      <td className="py-4 px-2">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${res.status === "confirmed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-bold">${Number(res.total_price).toFixed(0)}</td>
                    </tr>
                  ))}
                  {activityBookings.map((bk) => (
                    <tr key={`act-${bk.id}`} className="border-b border-slate-200/60">
                      <td className="py-4 px-2 font-bold text-indigo-650">Activity</td>
                      <td className="py-4 px-2">{bk.users?.first_name} {bk.users?.last_name}</td>
                      <td className="py-4 px-2">{bk.activities?.title}</td>
                      <td className="py-4 px-2">{bk.booking_date ? new Date(bk.booking_date).toLocaleDateString() : ""}</td>
                      <td className="py-4 px-2">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${bk.status === "confirmed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
                          {bk.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-bold">${Number(bk.total_price).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT TICKETS (EMPLOYEE) */}
        {activeTab === "tickets" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 animate-fade-in-up">
            <h3 className="text-lg font-serif font-bold text-slate-955 pb-2 border-b border-slate-200">
              Customer Support Tickets ({tickets.length})
            </h3>

            <div className="flex flex-col gap-4">
              {tickets.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-6">No support tickets have been filed yet.</p>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 bg-stone-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="min-w-0 flex-grow flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${t.status === "open" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : t.status === "in_progress" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-slate-500/10 border-slate-500/20 text-slate-500"}`}>
                          {t.status}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${t.priority === "high" ? "bg-rose-600/10 border-rose-600/20 text-rose-600" : t.priority === "medium" ? "bg-amber-600/10 border-amber-600/20 text-amber-600" : "bg-slate-500/10 border-slate-500/20 text-slate-500"}`}>
                          {t.priority} Priority
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{t.subject}</h4>
                      <p className="text-xs text-slate-500 truncate">Filed by: {t.users?.email} on {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTicket(t);
                        setTicketStatus(t.status || "closed");
                        setTicketReply("");
                      }}
                      className="bg-stone-850 text-white hover:bg-stone-750 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>View & Reply</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Ticket Reply Modal — portalled over Navbar + Footer */}
            {mounted && selectedTicket && createPortal(
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[9999] flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif font-bold text-slate-950">
                      Review Support Ticket
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Subject</span>
                      <p className="text-sm font-bold text-slate-900">{selectedTicket.subject}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Message History</span>
                      <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-line mt-1">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveTicketReply} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Response / Reply Text</label>
                      <textarea
                        required
                        rows={4}
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Type reply message to guest..."
                        className="w-full p-4 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Set Ticket Status</label>
                      <select
                        value={ticketStatus}
                        onChange={(e) => setTicketStatus(e.target.value)}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-800"
                      >
                        <option value="open">Open - Waiting for reply</option>
                        <option value="in_progress">In Progress - Working on it</option>
                        <option value="closed">Closed - Issue resolved</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                        className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? "Sending..." : "Submit Response"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* TAB 5: USER DIRECTORY */}
        {activeTab === "users" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 animate-fade-in-up">
            <h3 className="text-lg font-serif font-bold text-slate-955 pb-2 border-b border-slate-200">
              Registered Users Directory ({users.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">First Name</th>
                    <th className="py-3 px-2">Last Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200/60">
                      <td className="py-4 px-2 font-semibold text-slate-800">{item.first_name}</td>
                      <td className="py-4 px-2 text-slate-800">{item.last_name}</td>
                      <td className="py-4 px-2 text-slate-500">{item.email}</td>
                      <td className="py-4 px-2">
                        <span
                          onClick={() => handleToggleUserRole(item.id, item.role)}
                          className="bg-primary/10 border border-primary/25 text-primary text-[9px] uppercase font-bold px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary hover:text-slate-950 transition-colors"
                          title="Click to toggle role"
                        >
                          {item.role || "customer"}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => handleDeleteUser(item.id)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete user and all data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>

    {/* ── Custom Alert Modal ── portalled to body */}
    {mounted && alertModal.isOpen && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
        onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 flex flex-col gap-6 animate-[fade-in-up_0.25s_ease_forwards]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-slate-950 text-lg font-serif">{alertModal.title}</h3>
            </div>
            <button onClick={() => setAlertModal({ ...alertModal, isOpen: false })} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{alertModal.message}</p>
          <div className="flex justify-end">
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer shadow-md"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Custom Confirm Modal ── portalled to body */}
    {mounted && confirmModal.isOpen && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
        onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 flex flex-col gap-6 animate-[fade-in-up_0.25s_ease_forwards]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-lg font-serif">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Please confirm your action</p>
              </div>
            </div>
            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-stone-50 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmModal.onConfirm) confirmModal.onConfirm();
                setConfirmModal({ ...confirmModal, isOpen: false });
              }}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
