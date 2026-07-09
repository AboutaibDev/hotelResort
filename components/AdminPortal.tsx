"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseImages, stringifyImages } from "@/lib/images";
import {
  Users, Compass, Calendar, Ticket, Plus, Trash2,
  ChevronRight, TrendingUp, CircleDollarSign, AlertCircle, AlertTriangle,
  X, Check, HelpCircle, Loader2, Search,
  Utensils, ClipboardList, Music, ChevronLeft
} from "lucide-react";
import ModalOverlay from "@/components/ModalOverlay";

// Reusable Pagination
const ADMIN_PAGE_SIZE = 8;

// Helper to format time from HH:MM to 12h format (e.g., "11:15 AM")
function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  
  // If already in 12h format, return as is
  if (/AM|PM/i.test(timeStr)) return timeStr;
  
  // Parse from HH:MM format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = hours >= 12 ? "PM" : "AM";
    
    hours = hours % 12;
    if (hours === 0) hours = 12;
    
    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  
  return timeStr;
}

function AdminPagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / ADMIN_PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`h-7 w-7 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
            p === page ? "bg-primary text-slate-950" : "border border-slate-200 text-slate-500 hover:bg-stone-50"
          }`}>{p}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface UserItem {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: "customer" | "admin" | any;
}

interface RoomItem {
  id: number;
  title: string | null;
  description: string | null;
  price_per_night: number;
  capacity: number | null;
  status: "available" | "booked" | "maintenance" | any;
  image: string | null;
}

interface ActivityItem {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number;
  capacity: number | null;
  duration: number | null;
  status: "available" | "unavailable" | any;
  image: string | null;
}

interface ReservationItem {
  id: number;
  user_id: number | null;
  room_id: number | null;
  check_in_date: string | Date | null;
  check_out_date: string | Date | null;
  guests_count: number | null;
  total_price: number;
  status: "confirmed" | "cancelled" | any;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
  rooms: { title: string | null } | null;
}

interface ActivityBookingItem {
  id: number;
  user_id: number | null;
  activity_id: number | null;
  booking_date: string | Date | null;
  participants_count: number | null;
  total_price: number;
  status: "confirmed" | "cancelled" | any;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
  activities: { title: string | null } | null;
}

interface SupportTicketItem {
  id: number;
  user_id: number | null;
  subject: string | null;
  message: string | null;
  admin_answer: string | null;
  status: "open" | "in_progress" | "closed" | any;
  priority: "low" | "medium" | "high" | any;
  created_at: string | Date;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

interface ScheduleItem {
  id: number;
  date: string | Date;
  activity: string;
  time: string;
  description: string | null;
  registration: string | null;
}

interface MenuItemRow {
  id: number;
  date: string | Date;
  meal: string;
  title: string;
  time: string;
  description: string | null;
}

interface RequestItem {
  id: number;
  guest_id: number | null;
  date: string | Date;
  request_type: string;
  status: string;
}

interface PaymentItem {
  id: number;
  user_id: number | null;
  reservation_id: number | null;
  activity_booking_id: number | null;
  amount: number;
  method: string | null;
  status: "success" | "failed" | "pending" | any;
  transaction_ref: string | null;
  created_at: string | Date;
  users: { first_name: string | null; last_name: string | null; email: string | null } | null;
  reservations: { rooms: { title: string | null } | null } | null;
  activity_bookings: { activities: { title: string | null } | null } | null;
}

interface AdminPortalProps {
  users: UserItem[];
  rooms: RoomItem[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  activityBookings: ActivityBookingItem[];
  tickets: SupportTicketItem[];
  payments: PaymentItem[];
  scheduleRows: ScheduleItem[];
  menuRows: MenuItemRow[];
  requestRows: RequestItem[];
}

export default function AdminPortal({
  users,
  rooms,
  activities,
  reservations,
  activityBookings,
  tickets,
  payments,
  scheduleRows: initialSchedule,
  menuRows: initialMenu,
  requestRows: initialRequests,
}: AdminPortalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "content" | "reservations" | "payments" | "tickets" | "users" | "schedule" | "menu" | "requests"
  >("overview");

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
  const [imageList, setImageList] = useState<string[]>([""]);

  // State for ticket responses
  const [ticketToClose, setTicketToClose] = useState<SupportTicketItem | null>(null);
  const [closeReply, setCloseReply] = useState("");

  // Search & Filters (Reservations Tab)
  const [resSearch, setResSearch] = useState("");
  const [resTypeFilter, setResTypeFilter] = useState<"all" | "room" | "activity">("all");
  const [resStatusFilter, setResStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");

  // Ticket Filters
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<"all" | "open" | "in_progress" | "closed">("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");

  // Google Sheet tables (client-side CRUD state)
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(initialSchedule);
  const [menuList, setMenuList] = useState<MenuItemRow[]>(initialMenu);
  const [requestList, setRequestList] = useState<RequestItem[]>(initialRequests);

  // Generic row edit modals for the 3 new tables
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; item: ScheduleItem | null }>({ open: false, item: null });
  const [menuModal, setMenuModal] = useState<{ open: boolean; item: MenuItemRow | null }>({ open: false, item: null });
  const [requestModal, setRequestModal] = useState<{ open: boolean; item: RequestItem | null }>({ open: false, item: null });

  const emptyScheduleForm = { date: "", activity: "", time: "", description: "", registration: "No" };
  const emptyMenuForm = { date: "", meal: "Breakfast", title: "", time: "", description: "" };
  const emptyRequestForm = { guest_id: "", date: "", request_type: "", status: "Pending" };

  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);

  // Customer search state for request modal
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const filteredCustomers = users.filter((u) => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.id.toString().includes(q)
    );
  });

  // Sync state with props on server updates
  useEffect(() => {
    setScheduleList(initialSchedule);
  }, [initialSchedule]);

  useEffect(() => {
    setMenuList(initialMenu);
  }, [initialMenu]);

  useEffect(() => {
    setRequestList(initialRequests);
  }, [initialRequests]);

  // Pagination state per tab
  const [usersPage, setUsersPage] = useState(1);
  const [resPage, setResPage] = useState(1);
  const [actPage, setActPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [menuPage, setMenuPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);

  // Reset pages on tab switch
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setUsersPage(1); setResPage(1); setActPage(1); setPaymentsPage(1);
    setTicketsPage(1); setSchedulePage(1); setMenuPage(1); setRequestsPage(1);
  };

  // Loading states
  const [loading, setLoading] = useState(false);

  // Custom Alert / Confirm Modals
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false, title: "", message: "",
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: (() => void) | null;
  }>({ isOpen: false, title: "", message: "", onConfirm: null });

  const showAlert = (message: string, title = "System Notification") =>
    setAlertModal({ isOpen: true, title, message });

  const showConfirm = (message: string, onConfirm: () => void, title = "Confirm Action") =>
    setConfirmModal({ isOpen: true, title, message, onConfirm });

  // Calculations
  const totalRevenue = payments
    .filter((p) => p.status === "success")
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingTicketsCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  // Handle Editing Rooms / Activities
  const handleOpenEdit = (type: "room" | "activity", item: any | null) => {
    setEditingItem({ type, item });
    if (item) {
      const imgs = parseImages(item.image, type);
      setImageList(imgs);
      setContentForm({
        title: item.title || "",
        description: item.description || "",
        price: (item.price_per_night || item.price || 0).toString(),
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
      const serializedImages = stringifyImages(imageList.filter(img => img.trim() !== ""));
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
      if (res.ok) {
        setEditingItem(null);
        router.refresh();
        showAlert("Content saved successfully!", "Success");
      } else {
        const data = await res.json();
        showAlert(data.error || "Save operation failed.", "Error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error saving item.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = (type: "room" | "activity", id: number) => {
    showConfirm(
      `Are you sure you want to permanently delete this ${type}? This action cannot be undone.`,
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/content?type=${type}&id=${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            router.refresh();
            showAlert(`${type.toUpperCase()} deleted successfully.`, "Success");
          } else {
            const data = await res.json();
            showAlert(data.error || "Failed to delete content.", "Error");
          }
        } catch (err) {
          console.error(err);
          showAlert("Error deleting content.", "Error");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // State for editing user details
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userEditForm, setUserEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Save Edited User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          ...userEditForm,
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        router.refresh();
        showAlert("Customer account updated successfully.", "Success");
      } else {
        const data = await res.json();
        showAlert(data.error || "Failed to update customer.", "Error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error updating customer.", "Error");
    } finally {
      setLoading(false);
    }
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (ticketId: number, newStatus: "open" | "in_progress") => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
        showAlert(`Ticket status changed to ${newStatus.toUpperCase()}.`, "Success");
      } else {
        const data = await res.json();
        showAlert(data.error || "Failed to update ticket status.", "Error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error updating ticket.", "Error");
    } finally {
      setLoading(false);
    }
  };

  // Close ticket with mandatory response message
  const handleCloseTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToClose) return;
    if (!closeReply.trim()) {
      showAlert("You must provide an answer to close this ticket.", "Required Field");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticketToClose.id,
          status: "closed",
          reply: closeReply.trim(),
        }),
      });
      if (res.ok) {
        setTicketToClose(null);
        setCloseReply("");
        router.refresh();
        showAlert("Ticket closed and customer notified.", "Success");
      } else {
        const data = await res.json();
        showAlert(data.error || "Failed to close ticket.", "Error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error closing ticket.", "Error");
    } finally {
      setLoading(false);
    }
  };

  // Filters for Reservations Tab (combined Room and Activity bookings)
  const filteredReservations = reservations.filter((res) => {
    const userName = `${res.users?.first_name || ""} ${res.users?.last_name || ""}`.toLowerCase();
    const userEmail = (res.users?.email || "").toLowerCase();
    const query = resSearch.toLowerCase();
    const matchesQuery = userName.includes(query) || userEmail.includes(query);
    const matchesType = resTypeFilter === "all" || resTypeFilter === "room";
    const matchesStatus = resStatusFilter === "all" || res.status === resStatusFilter;
    return matchesQuery && matchesType && matchesStatus;
  });

  const filteredActivityBookings = activityBookings.filter((bk) => {
    const userName = `${bk.users?.first_name || ""} ${bk.users?.last_name || ""}`.toLowerCase();
    const userEmail = (bk.users?.email || "").toLowerCase();
    const query = resSearch.toLowerCase();
    const matchesQuery = userName.includes(query) || userEmail.includes(query);
    const matchesType = resTypeFilter === "all" || resTypeFilter === "activity";
    const matchesStatus = resStatusFilter === "all" || bk.status === resStatusFilter;
    return matchesQuery && matchesType && matchesStatus;
  });

  // Ticket filter logic
  const filteredTickets = tickets.filter((t) => {
    const name = `${t.users?.first_name || ""} ${t.users?.last_name || ""}`.toLowerCase();
    const subject = (t.subject || "").toLowerCase();
    const query = ticketSearch.toLowerCase();
    const matchesSearch = !query || name.includes(query) || subject.includes(query);
    const matchesStatus = ticketStatusFilter === "all" || t.status === ticketStatusFilter;
    const matchesPriority = ticketPriorityFilter === "all" || t.priority === ticketPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // CRUD handlers for 3 new tables
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isNew = !scheduleModal.item;
      const method = isNew ? "POST" : "PUT";
      const body = isNew ? scheduleForm : { id: scheduleModal.item!.id, ...scheduleForm };
      const res = await fetch("/api/admin/schedule", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setScheduleModal({ open: false, item: null }); router.refresh(); showAlert("Schedule entry saved!", "Success"); }
      else { const d = await res.json(); showAlert(d.error || "Save failed.", "Error"); }
    } catch { showAlert("Error saving.", "Error"); } finally { setLoading(false); }
  };

  const handleDeleteSchedule = (id: number) => {
    showConfirm("Delete this schedule entry?", async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/schedule?id=${id}`, { method: "DELETE" });
        if (res.ok) { router.refresh(); showAlert("Deleted.", "Success"); }
        else { const d = await res.json(); showAlert(d.error || "Delete failed.", "Error"); }
      } catch { showAlert("Error deleting.", "Error"); } finally { setLoading(false); }
    });
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isNew = !menuModal.item;
      const method = isNew ? "POST" : "PUT";
      const body = isNew ? menuForm : { id: menuModal.item!.id, ...menuForm };
      const res = await fetch("/api/admin/menu", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setMenuModal({ open: false, item: null }); router.refresh(); showAlert("Menu entry saved!", "Success"); }
      else { const d = await res.json(); showAlert(d.error || "Save failed.", "Error"); }
    } catch { showAlert("Error saving.", "Error"); } finally { setLoading(false); }
  };

  const handleDeleteMenu = (id: number) => {
    showConfirm("Delete this menu entry?", async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
        if (res.ok) { router.refresh(); showAlert("Deleted.", "Success"); }
        else { const d = await res.json(); showAlert(d.error || "Delete failed.", "Error"); }
      } catch { showAlert("Error deleting.", "Error"); } finally { setLoading(false); }
    });
  };

  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModal.item) {
      // Creating a new request
      setLoading(true);
      try {
        const res = await fetch("/api/admin/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestForm) });
        if (res.ok) { setRequestModal({ open: false, item: null }); router.refresh(); showAlert("Request saved!", "Success"); }
        else { const d = await res.json(); showAlert(d.error || "Save failed.", "Error"); }
      } catch { showAlert("Error saving.", "Error"); } finally { setLoading(false); }
      return;
    }

    // Editing an existing request
    const wasPending = requestModal.item.status.toLowerCase() !== "confirmed";
    const isNowConfirmed = requestForm.status.toLowerCase() === "confirmed";

    if (wasPending && isNowConfirmed) {
      // Show confirmation that the user will be notified
      showConfirm(
        `This request will be marked as "Confirmed" and the customer (Guest ID: ${requestForm.guest_id || "N/A"}) will be notified. Continue?`,
        async () => {
          setLoading(true);
          try {
            const body = { id: requestModal.item!.id, ...requestForm, notifyUser: true };
            const res = await fetch("/api/admin/requests", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (res.ok) { setRequestModal({ open: false, item: null }); router.refresh(); showAlert("Request confirmed and customer has been notified.", "Success"); }
            else { const d = await res.json(); showAlert(d.error || "Save failed.", "Error"); }
          } catch { showAlert("Error saving.", "Error"); } finally { setLoading(false); }
        },
        "Confirm Request"
      );
    } else {
      setLoading(true);
      try {
        const body = { id: requestModal.item!.id, ...requestForm };
        const res = await fetch("/api/admin/requests", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) { setRequestModal({ open: false, item: null }); router.refresh(); showAlert("Request saved!", "Success"); }
        else { const d = await res.json(); showAlert(d.error || "Save failed.", "Error"); }
      } catch { showAlert("Error saving.", "Error"); } finally { setLoading(false); }
    }
  };

  const handleDeleteRequest = (id: number) => {
    showConfirm("Delete this special request?", async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/requests?id=${id}`, { method: "DELETE" });
        if (res.ok) { router.refresh(); showAlert("Deleted.", "Success"); }
        else { const d = await res.json(); showAlert(d.error || "Delete failed.", "Error"); }
      } catch { showAlert("Error deleting.", "Error"); } finally { setLoading(false); }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2 shrink-0">
        <span className="text-[10px] uppercase font-bold text-slate-400 px-4 mb-2 tracking-wider">Navigation</span>
        
        <button
          onClick={() => handleTabChange("overview")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "overview" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("content")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "content" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Compass className="h-4 w-4" />
            <span>Stays & Activities</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("reservations")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "reservations" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4" />
            <span>Reservations</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("payments")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "payments" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CircleDollarSign className="h-4 w-4" />
            <span>Payments Log</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("tickets")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "tickets" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Ticket className="h-4 w-4" />
            <span>Support Tickets</span>
            {pendingTicketsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                {pendingTicketsCount}
              </span>
            )}
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("users")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "users" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4" />
            <span>User Accounts</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <div className="h-px bg-slate-100 my-2" />
        <span className="text-[10px] uppercase font-bold text-slate-400 px-4 mb-1 tracking-wider">Resort Data</span>

        <button
          onClick={() => handleTabChange("schedule")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "schedule" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Music className="h-4 w-4" />
            <span>Entertainment</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("menu")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "menu" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Utensils className="h-4 w-4" />
            <span>Restaurant Menu</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>

        <button
          onClick={() => handleTabChange("requests")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "requests" ? "bg-primary text-slate-950 shadow-md shadow-primary/10" : "text-slate-600 hover:bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ClipboardList className="h-4 w-4" />
            <span>Special Requests</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col gap-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 w-full">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Total Revenue</span>
                <span className="text-2xl font-bold text-slate-900 font-serif">{totalRevenue.toLocaleString()} DH</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Active Reservations</span>
                <span className="text-2xl font-bold text-slate-900 font-serif">{reservations.length + activityBookings.length}</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary self-start">
                  <Ticket className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">Active Support Tickets</span>
                <span className="text-2xl font-bold text-slate-900 font-serif">{pendingTicketsCount}</span>
              </div>
            </div>

            {/* Quick Activity Roster */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-serif font-bold text-slate-900 pb-3 border-b border-slate-200">
                Recent Bookings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-650 min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                      <th className="py-3 px-2">Customer</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Item</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, 5).map((res) => (
                      <tr key={`res-${res.id}`} className="border-b border-slate-100 last:border-0 hover:bg-stone-50/40">
                        <td className="py-4 px-2 font-medium text-slate-800">
                          {res.users?.first_name} {res.users?.last_name}
                        </td>
                        <td className="py-4 px-2 text-xs text-slate-400 font-bold uppercase">Room</td>
                        <td className="py-4 px-2 text-slate-800">{res.rooms?.title}</td>
                        <td className="py-4 px-2">
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                            res.status === "confirmed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-bold text-slate-900">{res.total_price} DH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTENT MANAGEMENT */}
        {activeTab === "content" && (
          <div className="flex flex-col gap-8 w-full">
            {/* Rooms Management Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-serif font-bold text-slate-900">Manage Rooms</h3>
              <button
                onClick={() => handleOpenEdit("room", null)}
                className="bg-primary hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                <Plus className="h-4 w-4" />
                <span>Add Room</span>
              </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms
                  .slice()
                  .sort((a, b) => {
                    const aAvailable = a.status === "available" ? 0 : 1;
                    const bAvailable = b.status === "available" ? 0 : 1;
                    return aAvailable - bAvailable;
                  })
                  .map((room) => (
                  <div key={room.id} className={`flex gap-4 p-4 border rounded-2xl transition-colors ${room.status === "available" ? "border-slate-200/60 hover:border-slate-300" : "border-rose-200/60 bg-rose-50/30"}`}>
                    <div className="h-24 w-32 bg-stone-100 rounded-xl overflow-hidden shrink-0 relative">
                      {room.image && (
                        <img src={parseImages(room.image, "room")[0]} alt={room.title || ""} className="object-cover h-full w-full" />
                      )}
                      {room.status !== "available" && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="text-[10px] uppercase font-bold text-white bg-rose-600 px-2 py-1 rounded-full">Unavailable</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{room.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {room.price_per_night} DH / night • Capacity: {room.capacity}
                        </p>
                        {room.status !== "available" && (
                          <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full mt-1 inline-block">Unavailable</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleOpenEdit("room", room)}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteContent("room", room.id)}
                          className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities Management Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-serif font-bold text-slate-900">Manage Activities</h3>
              <button
                onClick={() => handleOpenEdit("activity", null)}
                className="bg-primary hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                <Plus className="h-4 w-4" />
                <span>Add Activity</span>
              </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activities
                  .slice()
                  .sort((a, b) => {
                    const aAvailable = a.status === "available" ? 0 : 1;
                    const bAvailable = b.status === "available" ? 0 : 1;
                    return aAvailable - bAvailable;
                  })
                  .map((act) => (
                  <div key={act.id} className={`flex gap-4 p-4 border rounded-2xl transition-colors ${act.status === "available" ? "border-slate-200/60 hover:border-slate-300" : "border-rose-200/60 bg-rose-50/30"}`}>
                    <div className="h-24 w-32 bg-stone-100 rounded-xl overflow-hidden shrink-0 relative">
                      {act.image && (
                        <img src={parseImages(act.image, "activity")[0]} alt={act.title || ""} className="object-cover h-full w-full" />
                      )}
                      {act.status !== "available" && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="text-[10px] uppercase font-bold text-white bg-rose-600 px-2 py-1 rounded-full">Unavailable</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{act.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {act.price} DH / person • {act.category}
                        </p>
                        {act.status !== "available" && (
                          <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full mt-1 inline-block">Unavailable</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleOpenEdit("activity", act)}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteContent("activity", act.id)}
                          className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESERVATIONS LIST & SEARCH */}
        {activeTab === "reservations" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <h3 className="text-lg font-serif font-bold text-slate-900">Guest Reservations</h3>
              
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    placeholder="Search by guest name..."
                    className="pl-9 pr-4 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={resTypeFilter}
                  onChange={(e) => setResTypeFilter(e.target.value as any)}
                  className="px-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="room">Room Stays</option>
                  <option value="activity">Activities</option>
                </select>

                <select
                  value={resStatusFilter}
                  onChange={(e) => setResStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650 min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Reservation Type</th>
                    <th className="py-3 px-2">Item reserved</th>
                    <th className="py-3 px-2">Schedule Dates</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length === 0 && filteredActivityBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-450 italic">
                        No reservations match your filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Paginated room reservations */}
                      {filteredReservations.slice((resPage - 1) * ADMIN_PAGE_SIZE, resPage * ADMIN_PAGE_SIZE).map((res) => (
                        <tr key={`res-tab-${res.id}`} className="border-b border-slate-100 hover:bg-stone-50/40">
                          <td className="py-4 px-2 font-medium text-slate-800">
                            <div>{res.users?.first_name} {res.users?.last_name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{res.users?.email}</div>
                          </td>
                          <td className="py-4 px-2 text-xs text-slate-500 font-semibold uppercase">Room Stay</td>
                          <td className="py-4 px-2 text-slate-800 font-medium">{res.rooms?.title}</td>
                          <td className="py-4 px-2 text-xs text-slate-500">
                            {res.check_in_date ? new Date(res.check_in_date).toLocaleDateString() : ""} →{" "}
                            {res.check_out_date ? new Date(res.check_out_date).toLocaleDateString() : ""}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                              res.status === "confirmed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 font-bold text-slate-900">{res.total_price} DH</td>
                        </tr>
                      ))}

                      {/* Paginated activity bookings */}
                      {filteredActivityBookings.slice((actPage - 1) * ADMIN_PAGE_SIZE, actPage * ADMIN_PAGE_SIZE).map((bk) => (
                        <tr key={`act-tab-${bk.id}`} className="border-b border-slate-100 hover:bg-stone-50/40">
                          <td className="py-4 px-2 font-medium text-slate-800">
                            <div>{bk.users?.first_name} {bk.users?.last_name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{bk.users?.email}</div>
                          </td>
                          <td className="py-4 px-2 text-xs text-slate-500 font-semibold uppercase">Activity</td>
                          <td className="py-4 px-2 text-slate-800 font-medium">{bk.activities?.title}</td>
                          <td className="py-4 px-2 text-xs text-slate-500">
                            {bk.booking_date ? new Date(bk.booking_date).toLocaleDateString() : ""}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                              bk.status === "confirmed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                            }`}>
                              {bk.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 font-bold text-slate-900">{bk.total_price} DH</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-8 justify-center">
              <div className="flex flex-col items-center gap-1">
                {filteredReservations.length > 0 && <span className="text-[10px] text-slate-400 font-medium">Room Stays ({filteredReservations.length})</span>}
                <AdminPagination page={resPage} total={filteredReservations.length} onChange={setResPage} />
              </div>
              <div className="flex flex-col items-center gap-1">
                {filteredActivityBookings.length > 0 && <span className="text-[10px] text-slate-400 font-medium">Activities ({filteredActivityBookings.length})</span>}
                <AdminPagination page={actPage} total={filteredActivityBookings.length} onChange={setActPage} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS LOG */}
        {activeTab === "payments" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="pb-4 border-b border-slate-200">
              <h3 className="text-lg font-serif font-bold text-slate-900">Transaction Payments Log</h3>
              <p className="text-xs text-slate-400 mt-1">Review references, status, and amounts for all room and activity payments.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650 min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                    <th className="py-3 px-2">Reference</th>
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Item</th>
                    <th className="py-3 px-2">Method</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Paid Date</th>
                    <th className="py-3 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-450 italic">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    payments.slice((paymentsPage - 1) * ADMIN_PAGE_SIZE, paymentsPage * ADMIN_PAGE_SIZE).map((pay) => {
                      const itemTitle = pay.reservations?.rooms?.title || pay.activity_bookings?.activities?.title || "Resort booking";
                      const itemType = pay.reservations ? "Room Stay" : "Activity";
                      return (
                        <tr key={pay.id} className="border-b border-slate-100 hover:bg-stone-50/40">
                          <td className="py-4 px-2 font-mono text-xs font-bold text-primary">{pay.transaction_ref}</td>
                          <td className="py-4 px-2">
                            <div className="font-semibold text-slate-800">{pay.users?.first_name} {pay.users?.last_name}</div>
                            <div className="text-[10px] text-slate-400">{pay.users?.email}</div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="font-medium text-slate-850">{itemTitle}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{itemType}</div>
                          </td>
                          <td className="py-4 px-2 text-xs capitalize text-slate-500">{pay.method}</td>
                          <td className="py-4 px-2">
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                              pay.status === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                : pay.status === "pending"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-xs text-slate-400">
                            {new Date(pay.created_at).toLocaleString()}
                          </td>
                          <td className="py-4 px-2 font-bold text-slate-900">{pay.amount} DH</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination page={paymentsPage} total={payments.length} onChange={setPaymentsPage} />
          </div>
        )}

        {/* TAB 5: SUPPORT TICKETS */}
        {activeTab === "tickets" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Customer Support Inquiries</h3>
                <p className="text-xs text-slate-400 mt-1">Manage ticket progression. Closed status requires an answer message.</p>
              </div>
              {/* Ticket Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search by name or subject..."
                    className="pl-9 pr-4 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value as any)}
                  className="px-3 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary text-slate-700 cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {filteredTickets.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400 italic">
                  {tickets.length === 0 ? "No support tickets currently filed." : "No tickets match your filters."}
                </p>
              ) : (
                (() => {
                  const getDateStr = (d: string | Date): string => {
                    const date = new Date(d);
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${y}-${m}-${day}`;
                  };

                  // Separate into active (open/in_progress) and closed
                  const active = filteredTickets.filter((t) => t.status !== "closed");
                  const closed = filteredTickets.filter((t) => t.status === "closed");

                  // Sort active: open first, then in_progress, then by closest date ascending
                  active.sort((a, b) => {
                    const aOpen = a.status === "open" ? 0 : 1;
                    const bOpen = b.status === "open" ? 0 : 1;
                    if (aOpen !== bOpen) return aOpen - bOpen;
                    return getDateStr(a.created_at).localeCompare(getDateStr(b.created_at));
                  });

                  // Sort closed: by date descending (most recent closed first)
                  closed.sort((a, b) => getDateStr(b.created_at).localeCompare(getDateStr(a.created_at)));

                  const sortedTickets = [...active, ...closed];
                  const paginated = sortedTickets.slice((ticketsPage - 1) * ADMIN_PAGE_SIZE, ticketsPage * ADMIN_PAGE_SIZE);

                  return paginated.map((t) => {
                    return (
                      <div key={t.id} className="p-5 rounded-2xl border border-slate-200/80 bg-stone-50/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              t.status === "open"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                : t.status === "in_progress"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-600"
                                : "bg-slate-500/10 border-slate-500/20 text-slate-550"
                            }`}>
                              {t.status}
                            </span>
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                              t.priority === "high" ? "bg-rose-50 text-rose-650" : t.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              {t.priority} Priority
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-slate-900 text-sm">{t.subject}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-normal whitespace-pre-wrap">{t.message}</p>
                          
                          {t.admin_answer && (
                            <div className="mt-2 bg-white p-3 rounded-xl border border-primary/20 text-xs text-slate-700">
                              <span className="font-bold text-primary">Your Reply: </span>
                              {t.admin_answer}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 font-medium mt-1">
                            From: {t.users?.first_name} {t.users?.last_name} ({t.users?.email})
                          </div>
                        </div>

                        <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0 w-full md:w-36">
                          {t.status !== "open" && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, "open")}
                              className="bg-white hover:bg-stone-100 border border-slate-200/80 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Mark Open
                            </button>
                          )}
                          
                          {t.status !== "in_progress" && (
                            <button
                              onClick={() => handleUpdateTicketStatus(t.id, "in_progress")}
                              className="bg-white hover:bg-stone-100 border border-slate-200/80 text-slate-700 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Mark In Progress
                            </button>
                          )}

                          {t.status !== "closed" && (
                            <button
                              onClick={() => {
                                setTicketToClose(t);
                                setCloseReply(t.admin_answer || "");
                              }}
                              className="bg-primary hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer text-center shadow-sm"
                            >
                              Close & Reply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
              <AdminPagination page={ticketsPage} total={filteredTickets.length} onChange={setTicketsPage} />
            </div>
          </div>
        )}

        {/* TAB 6: USERS LIST */}
        {activeTab === "users" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="pb-4 border-b border-slate-200">
              <h3 className="text-lg font-serif font-bold text-slate-900">Customer Accounts</h3>
              <p className="text-xs text-slate-400 mt-1">View and manage customer account details.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-650 min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                    <th className="py-3 px-2">Customer Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400 italic">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    users.slice((usersPage - 1) * ADMIN_PAGE_SIZE, usersPage * ADMIN_PAGE_SIZE).map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-stone-50/40">
                        <td className="py-4 px-2 font-medium text-slate-800">
                          {u.first_name} {u.last_name}
                        </td>
                        <td className="py-4 px-2 text-xs text-slate-600">{u.email}</td>
                        <td className="py-4 px-2 text-xs text-slate-600">{u.phone || "—"}</td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => {
                              setUserEditForm({
                                first_name: u.first_name || "",
                                last_name: u.last_name || "",
                                email: u.email || "",
                                phone: u.phone || "",
                              });
                              setEditingUser(u);
                            }}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Edit Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination page={usersPage} total={users.length} onChange={setUsersPage} />
          </div>
        )}

        {/* TAB 7: ENTERTAINMENT SCHEDULE */}
        {activeTab === "schedule" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Entertainment Schedule</h3>
                <p className="text-xs text-slate-400 mt-1">Manage nightly events and resort activities schedule.</p>
              </div>
              <button
                onClick={() => { setScheduleForm(emptyScheduleForm); setScheduleModal({ open: true, item: null }); }}
                className="bg-primary hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                <Plus className="h-4 w-4" /><span>Add Event</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Activity</th>
                    <th className="py-3 px-2">Time</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2">Registration</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleList.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">No events scheduled yet.</td></tr>
                  ) : (
                    (() => {
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                      
                      const getDateTime = (row: ScheduleItem) => {
                        const date = new Date(row.date);
                        const timeParts = row.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (timeParts) {
                          let hours = parseInt(timeParts[1]);
                          const minutes = parseInt(timeParts[2]);
                          const period = timeParts[3]?.toUpperCase();
                          if (period === "PM" && hours < 12) hours += 12;
                          if (period === "AM" && hours === 12) hours = 0;
                          date.setHours(hours, minutes, 0, 0);
                        }
                        return date;
                      };

                      const upcoming = scheduleList.filter(row => {
                        const dt = getDateTime(row);
                        return dt >= now;
                      }).sort((a, b) => getDateTime(a).getTime() - getDateTime(b).getTime());

                      const past = scheduleList.filter(row => {
                        const dt = getDateTime(row);
                        return dt < now;
                      }).sort((a, b) => getDateTime(b).getTime() - getDateTime(a).getTime());

                      const sorted = [...upcoming, ...past];
                      const paginated = sorted.slice((schedulePage - 1) * ADMIN_PAGE_SIZE, schedulePage * ADMIN_PAGE_SIZE);

                      return paginated.map((row) => {
                        const isPast = getDateTime(row) < now;
                        return (
                          <tr key={row.id} className={`border-b border-slate-100 transition-colors ${isPast ? "opacity-50 bg-slate-50" : "hover:bg-stone-50/40"}`}>
                            <td className="py-3 px-2 text-xs text-slate-600">
                              {new Date(row.date).toLocaleDateString()}
                              {isPast && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">Past</span>}
                            </td>
                            <td className="py-3 px-2 font-semibold text-slate-800">{row.activity}</td>
                            <td className="py-3 px-2 text-xs text-slate-500">{formatTime12h(row.time)}</td>
                            <td className="py-3 px-2 text-xs text-slate-500 max-w-[200px] truncate">{row.description}</td>
                            <td className="py-3 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                row.registration && row.registration !== "No"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-700"
                                  : "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>{row.registration || "No"}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => {
                                  const d = new Date(row.date);
                                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                  setScheduleForm({ 
                                    date: dateStr, 
                                    activity: row.activity, 
                                    time: row.time, 
                                    description: row.description || "", 
                                    registration: row.registration || "No" 
                                  });
                                  setScheduleModal({ open: true, item: row });
                                }} className="text-xs font-bold text-primary hover:underline cursor-pointer">Edit</button>
                                <button onClick={() => handleDeleteSchedule(row.id)} className="text-xs font-bold text-rose-500 hover:underline cursor-pointer">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination page={schedulePage} total={scheduleList.length} onChange={setSchedulePage} />
          </div>
        )}

        {/* TAB 8: RESTAURANT MENU */}
        {activeTab === "menu" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Restaurant Menu Schedule</h3>
                <p className="text-xs text-slate-400 mt-1">Manage daily dining offerings and special food nights.</p>
              </div>
              <button
                onClick={() => { setMenuForm(emptyMenuForm); setMenuModal({ open: true, item: null }); }}
                className="bg-primary hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                <Plus className="h-4 w-4" /><span>Add Menu Item</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Meal</th>
                    <th className="py-3 px-2">Title</th>
                    <th className="py-3 px-2">Time</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuList.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">No menu items yet.</td></tr>
                  ) : (
                    (() => {
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                      
                      const getDateTime = (row: MenuItemRow) => {
                        const date = new Date(row.date);
                        const timeParts = row.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (timeParts) {
                          let hours = parseInt(timeParts[1]);
                          const minutes = parseInt(timeParts[2]);
                          const period = timeParts[3]?.toUpperCase();
                          if (period === "PM" && hours < 12) hours += 12;
                          if (period === "AM" && hours === 12) hours = 0;
                          date.setHours(hours, minutes, 0, 0);
                        }
                        return date;
                      };

                      const upcoming = menuList.filter(row => {
                        const dt = getDateTime(row);
                        return dt >= now;
                      }).sort((a, b) => getDateTime(a).getTime() - getDateTime(b).getTime());

                      const past = menuList.filter(row => {
                        const dt = getDateTime(row);
                        return dt < now;
                      }).sort((a, b) => getDateTime(b).getTime() - getDateTime(a).getTime());

                      const sorted = [...upcoming, ...past];
                      const paginated = sorted.slice((menuPage - 1) * ADMIN_PAGE_SIZE, menuPage * ADMIN_PAGE_SIZE);

                      const getMealColorClasses = (meal: string) => {
                        switch(meal.toLowerCase()) {
                          case 'breakfast': return 'bg-orange-500/10 border-orange-500/20 text-orange-700';
                          case 'lunch': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700';
                          case 'dinner': return 'bg-purple-500/10 border-purple-500/20 text-purple-700';
                          default: return 'bg-primary/10 border-primary/20 text-primary';
                        }
                      };

                      return paginated.map((row) => {
                        const isPast = getDateTime(row) < now;
                        return (
                          <tr key={row.id} className={`border-b border-slate-100 transition-colors ${isPast ? "opacity-50 bg-slate-50" : "hover:bg-stone-50/40"}`}>
                            <td className="py-3 px-2 text-xs text-slate-600">
                              {new Date(row.date).toLocaleDateString()}
                              {isPast && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">Past</span>}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMealColorClasses(row.meal)}`}>{row.meal}</span>
                            </td>
                            <td className="py-3 px-2 font-semibold text-slate-800">{row.title}</td>
                            <td className="py-3 px-2 text-xs text-slate-500">{formatTime12h(row.time)}</td>
                            <td className="py-3 px-2 text-xs text-slate-500 max-w-[200px] truncate">{row.description}</td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => {
                                  const d = new Date(row.date);
                                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                  setMenuForm({ 
                                    date: dateStr, 
                                    meal: row.meal, 
                                    title: row.title, 
                                    time: row.time, 
                                    description: row.description || "" 
                                  });
                                  setMenuModal({ open: true, item: row });
                                }} className="text-xs font-bold text-primary hover:underline cursor-pointer">Edit</button>
                                <button onClick={() => handleDeleteMenu(row.id)} className="text-xs font-bold text-rose-500 hover:underline cursor-pointer">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination page={menuPage} total={menuList.length} onChange={setMenuPage} />
          </div>
        )}

        {/* TAB 9: SPECIAL REQUESTS */}
        {activeTab === "requests" && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Guest Special Requests</h3>
                <p className="text-xs text-slate-400 mt-1">Track and manage all custom guest requests and their fulfillment status.</p>
              </div>
              <button
                onClick={() => { setRequestForm(emptyRequestForm); setRequestModal({ open: true, item: null }); }}
                className="bg-primary hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              >
                <Plus className="h-4 w-4" /><span>Add Request</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200/80 text-xs uppercase font-bold text-slate-400">
                    <th className="py-3 px-2">Guest ID</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Request Type</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestList.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-400 italic">No special requests recorded.</td></tr>
                  ) : (
                    (() => {
                      // Get today's date components in local time
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

                      // Helper: get a comparable YYYY-MM-DD string from row.date
                      const getDateStr = (d: string | Date): string => {
                        const date = new Date(d);
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        return `${y}-${m}-${day}`;
                      };

                      // Separate into upcoming (today or future) and past
                      const upcoming = requestList.filter((r) => {
                        return getDateStr(r.date) >= todayStr;
                      });
                      const past = requestList.filter((r) => {
                        return getDateStr(r.date) < todayStr;
                      });

                      // Sort upcoming: pending first, then by closest date ascending
                      upcoming.sort((a, b) => {
                        const aPending = a.status.toLowerCase() === "pending" ? 0 : 1;
                        const bPending = b.status.toLowerCase() === "pending" ? 0 : 1;
                        if (aPending !== bPending) return aPending - bPending;
                        return getDateStr(a.date).localeCompare(getDateStr(b.date));
                      });

                      // Sort past: by date descending (most recent past first)
                      past.sort((a, b) => getDateStr(b.date).localeCompare(getDateStr(a.date)));

                      const sortedRequests = [...upcoming, ...past];
                      const paginated = sortedRequests.slice((requestsPage - 1) * ADMIN_PAGE_SIZE, requestsPage * ADMIN_PAGE_SIZE);

                      return paginated.map((row) => {
                        const isPast = getDateStr(row.date) < todayStr;

                        return (
                          <tr key={row.id} className={`border-b border-slate-100 transition-colors ${isPast ? "opacity-40 bg-slate-50" : "hover:bg-stone-50/40"}`}>
                            <td className="py-3 px-2 text-xs text-slate-500 font-mono">{row.guest_id ?? "—"}</td>
                            <td className="py-3 px-2 text-xs text-slate-600">
                              {new Date(row.date).toLocaleDateString()}
                              {isPast && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">Past</span>}
                            </td>
                            <td className="py-3 px-2 font-semibold text-slate-800">{row.request_type}</td>
                            <td className="py-3 px-2">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                row.status.toLowerCase() === "confirmed"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-700"
                              }`}>{row.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => { setRequestForm({ guest_id: row.guest_id?.toString() || "", date: new Date(row.date).toISOString().split("T")[0], request_type: row.request_type, status: row.status }); setRequestModal({ open: true, item: row }); }} className="text-xs font-bold text-primary hover:underline cursor-pointer">Edit</button>
                                <button onClick={() => handleDeleteRequest(row.id)} className="text-xs font-bold text-rose-500 hover:underline cursor-pointer">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination page={requestsPage} total={requestList.length} onChange={setRequestsPage} />
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
      <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Customer Account</span>
                <h4 className="text-lg font-serif font-bold text-slate-900">Edit Account Details</h4>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input
                    type="text"
                    value={userEditForm.first_name}
                    onChange={(e) => setUserEditForm({ ...userEditForm, first_name: e.target.value })}
                    placeholder="e.g. Mohammed"
                    required
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input
                    type="text"
                    value={userEditForm.last_name}
                    onChange={(e) => setUserEditForm({ ...userEditForm, last_name: e.target.value })}
                    placeholder="e.g. Farah"
                    required
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                <input
                  type="email"
                  value={userEditForm.email}
                  onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })}
                  placeholder="e.g. mohammed.farah@example.com"
                  required
                  className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone (Optional)</label>
                <input
                  type="text"
                  value={userEditForm.phone}
                  onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })}
                  placeholder="e.g. +212 6XX XXX XXX"
                  className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
      </ModalOverlay>
      )}

      {/* Close Ticket Response Modal */}
      {ticketToClose && (
      <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Inquiry Resolution</span>
                <h4 className="text-lg font-serif font-bold text-slate-900">Close Ticket & Submit Response</h4>
              </div>
              <button
                onClick={() => setTicketToClose(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Inquiry Subject:</span> {ticketToClose.subject}
            </div>

            <form onSubmit={handleCloseTicketSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Admin Response Message</label>
                <textarea
                  rows={5}
                  value={closeReply}
                  onChange={(e) => setCloseReply(e.target.value)}
                  placeholder="Enter the official response message. This will be shown to the customer."
                  className="w-full p-4 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketToClose(null)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Submit & Close Ticket</span>
                </button>
              </div>
            </form>
          </div>
      </ModalOverlay>
      )}

      {/* Schedule Edit Modal */}
      {scheduleModal.open && (
        <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-serif font-bold text-slate-900">{scheduleModal.item ? "Edit" : "Add"} Event</h4>
              <button onClick={() => setScheduleModal({ open: false, item: null })} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduleForm.date} 
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} 
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Time</label>
                  <input 
                    type="time" 
                    required 
                    value={scheduleForm.time} 
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })} 
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Activity Name</label>
                <input type="text" required value={scheduleForm.activity} onChange={(e) => setScheduleForm({ ...scheduleForm, activity: e.target.value })} className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea rows={3} value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })} className="w-full p-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration</label>
                <select value={scheduleForm.registration} onChange={(e) => setScheduleForm({ ...scheduleForm, registration: e.target.value })} className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 cursor-pointer">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setScheduleModal({ open: false, item: null })} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow flex items-center gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Save</button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Menu Edit Modal */}
      {menuModal.open && (
        <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-serif font-bold text-slate-900">{menuModal.item ? "Edit" : "Add"} Menu Item</h4>
              <button onClick={() => setMenuModal({ open: false, item: null })} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveMenu} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    value={menuForm.date} 
                    onChange={(e) => setMenuForm({ ...menuForm, date: e.target.value })} 
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Meal Type</label>
                  <select value={menuForm.meal} onChange={(e) => setMenuForm({ ...menuForm, meal: e.target.value })} className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 cursor-pointer">
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>All day</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                  <input type="text" required value={menuForm.title} onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })} className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Time</label>
                  <input 
                    type="time" 
                    required 
                    value={menuForm.time} 
                    onChange={(e) => setMenuForm({ ...menuForm, time: e.target.value })} 
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea rows={3} value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="w-full p-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMenuModal({ open: false, item: null })} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow flex items-center gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Save</button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Request Edit Modal */}
      {requestModal.open && (
        <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-serif font-bold text-slate-900">{requestModal.item ? "Edit" : "Add"} Special Request</h4>
              <button onClick={() => setRequestModal({ open: false, item: null })} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    value={requestForm.date} 
                    onChange={(e) => setRequestForm({ ...requestForm, date: e.target.value })} 
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" 
                  />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer</label>
                  {requestModal.item ? (
                    <div className="px-4 py-2.5 bg-stone-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono">
                      {requestForm.guest_id || "—"}
                    </div>
                  ) : (
                    <>
                      {/* Customer search dropdown */}
                      <div className="relative">
                        <input
                          type="text"
                          value={customerSearchQuery}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Search by name, email or phone..."
                          className="w-full px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                        />
                        <Search className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {showCustomerDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">No customers found</div>
                          ) : (
                            filteredCustomers.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setRequestForm({ ...requestForm, guest_id: c.id.toString() });
                                  setCustomerSearchQuery(`${c.first_name || ""} ${c.last_name || ""} (${c.email || c.phone || c.id})`);
                                  setShowCustomerDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-primary/10 hover:text-slate-900 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                              >
                                <span className="font-semibold">{c.first_name} {c.last_name}</span>
                                <span className="text-slate-400 ml-2">{c.email}</span>
                                {c.phone && <span className="text-slate-400 ml-1">• {c.phone}</span>}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Request Type</label>
                <input type="text" required value={requestForm.request_type} onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value })} placeholder="e.g. Watching football game" className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
                <select value={requestForm.status} onChange={(e) => setRequestForm({ ...requestForm, status: e.target.value })} className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 cursor-pointer">
                  <option>Pending</option>
                  <option>confirmed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRequestModal({ open: false, item: null })} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow flex items-center gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Save</button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Editing Content Drawer / Modal */}
      {editingItem && (
      <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Content Editor</span>
                <h4 className="text-lg font-serif font-bold text-slate-900">
                  {editingItem.item ? "Edit" : "Create"} {editingItem.type.toUpperCase()}
                </h4>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                  <input
                    type="text"
                    value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    required
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Price (DH)</label>
                  <input
                    type="number"
                    value={contentForm.price}
                    onChange={(e) => setContentForm({ ...contentForm, price: e.target.value })}
                    required
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Capacity</label>
                  <input
                    type="number"
                    value={contentForm.capacity}
                    onChange={(e) => setContentForm({ ...contentForm, capacity: e.target.value })}
                    required
                    className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                  />
                </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
                <select
                  value={contentForm.status}
                  onChange={(e) => setContentForm({ ...contentForm, status: e.target.value })}
                  className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 cursor-pointer"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              </div>

              {editingItem.type === "activity" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                    <select
                      value={contentForm.category}
                      onChange={(e) => setContentForm({ ...contentForm, category: e.target.value })}
                      className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 cursor-pointer"
                    >
                      <option value="Wellness">Wellness</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Nature">Nature</option>
                      <option value="Gastronomy">Gastronomy</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Duration (hrs)</label>
                    <input
                      type="number"
                      value={contentForm.duration}
                      onChange={(e) => setContentForm({ ...contentForm, duration: e.target.value })}
                      className="px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  rows={4}
                  value={contentForm.description}
                  onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                  required
                  className="w-full p-4 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-slate-850"
                />
              </div>

              {/* Images list */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Image URLs</label>
                {imageList.map((img, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={img}
                      onChange={(e) => {
                        const next = [...imageList];
                        next[idx] = e.target.value;
                        setImageList(next);
                      }}
                      placeholder={`https://images.unsplash.com/...`}
                      className="flex-1 px-4 py-2 bg-stone-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary transition-colors text-slate-850"
                    />
                    {imageList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setImageList(imageList.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setImageList([...imageList, ""])}
                  className="text-xs font-bold text-primary hover:underline self-start mt-1 cursor-pointer"
                >
                  + Add Another Image URL
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Content</span>
                </button>
              </div>
            </form>
          </div>
      </ModalOverlay>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
      <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-8 flex flex-col gap-4 text-center items-center animate-fade-in-up">
            <div className="p-3 bg-primary/10 rounded-full text-primary border border-primary/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="font-serif font-bold text-slate-900 text-lg leading-tight">{alertModal.title}</h4>
            <p className="text-slate-500 text-xs leading-relaxed">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-colors text-xs mt-2"
            >
              Close
            </button>
          </div>
      </ModalOverlay>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
      <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-8 flex flex-col gap-4 text-center items-center animate-fade-in-up">
            <div className="p-3 bg-rose-500/10 rounded-full text-rose-500 border border-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="font-serif font-bold text-slate-900 text-lg leading-tight">{confirmModal.title}</h4>
            <p className="text-slate-500 text-xs leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-colors text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
      </ModalOverlay>
      )}

    </div>
  );
}
