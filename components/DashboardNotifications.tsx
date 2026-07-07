"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { decrementUnread } from "@/lib/redux/notificationsSlice";
import { Bell, Calendar, X, Inbox, Eye, ShieldAlert, CheckCircle, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import ModalOverlay from "@/components/ModalOverlay";

const NOTIFS_PER_PAGE = 6;

interface NotificationItem {
  id: number;
  title: string | null;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

export default function DashboardNotifications() {
  const dispatch = useDispatch();
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  // Real-time WebSocket listener
  useEffect(() => {
    const token = getCookie("token");
    if (!token) return;

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      try {
        ws = new WebSocket(`ws://localhost:3002?token=${token}`);

        ws.onmessage = (event) => {
          try {
            const newNotif = JSON.parse(event.data);
            setAllNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotif.id);
              if (exists) return prev;
              return [newNotif, ...prev];
            });
          } catch (err) {
            console.error("Error parsing WebSocket message in dashboard:", err);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWS, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        console.error("Failed to initialize dashboard WS:", e);
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    const fetchAllNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications?page=1&limit=100");
        if (res.ok) {
          const data = await res.json();
          setAllNotifications(data.notifications || []);
          setInitialFetchDone(true);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNotifications();
  }, []);

  // Paginated notifications for current page
  const totalPages = Math.max(1, Math.ceil(allNotifications.length / NOTIFS_PER_PAGE));
  const paginatedNotifications = allNotifications.slice(
    (page - 1) * NOTIFS_PER_PAGE,
    page * NOTIFS_PER_PAGE
  );

  const handleNotificationClick = async (notif: NotificationItem) => {
    setSelectedNotif(notif);

    // If it was unread, mark it as read
    if (!notif.is_read) {
      try {
        const res = await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        if (res.ok) {
          setAllNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
          );
          dispatch(decrementUnread());
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getIcon = (type: string | null) => {
    switch (type) {
      case "booking":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "ticket":
        return <HelpCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <span>Notifications Feed</span>
        </h3>
        {allNotifications.length > 0 && (
          <span className="text-xs font-medium text-slate-400">
            {allNotifications.length} notification(s)
          </span>
        )}
      </div>

      {loading && !initialFetchDone ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          <span>Loading notifications...</span>
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center gap-3">
          <Inbox className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 rounded-2xl border transition-all duration-200 text-left flex gap-4 cursor-pointer hover:shadow-md hover:border-slate-300 ${
                !notif.is_read
                  ? "bg-white border-primary/35 shadow-sm"
                  : "bg-white/70 border-slate-200/80"
              }`}
            >
              <div className={`p-3 rounded-xl h-11 w-11 flex items-center justify-center shrink-0 ${
                !notif.is_read ? "bg-primary/10" : "bg-slate-100"
              }`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className={`text-sm truncate ${!notif.is_read ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate leading-relaxed">
                  {notif.message}
                </p>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`h-7 w-7 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    p === page
                      ? "bg-primary text-slate-950"
                      : "border border-slate-200 text-slate-500 hover:bg-stone-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedNotif && (
        <ModalOverlay open>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-xl">
                  {getIcon(selectedNotif.type)}
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-primary tracking-wider">
                    {selectedNotif.type || "System"}
                  </span>
                  <h4 className="text-lg font-serif font-bold text-slate-900 leading-tight">
                    {selectedNotif.title}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-5 rounded-2xl border border-slate-200/85">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedNotif.message}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(selectedNotif.created_at).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-emerald-500 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <Eye className="h-3.5 w-3.5" />
                <span>Marked as Read</span>
              </span>
            </div>

            <button
              onClick={() => setSelectedNotif(null)}
              className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-md text-sm"
            >
              Dismiss
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}