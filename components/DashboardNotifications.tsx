"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { decrementUnread } from "@/lib/redux/notificationsSlice";
import { Bell, Calendar, X, Inbox, Eye, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import ModalOverlay from "@/components/ModalOverlay";

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

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
            setNotifications((prev) => {
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

  const fetchNotifications = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications.length < 5) {
          setHasMore(false);
        }
        setNotifications((prev) => {
          // Filter out duplicates
          const existingIds = new Set(prev.map((n) => n.id));
          const newNotifs = data.notifications.filter((n: NotificationItem) => !existingIds.has(n.id));
          return [...prev, ...newNotifs];
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page changes
  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  // Intersection Observer for scroll-to-load-more
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading]);

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
          // Update local state
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
          );
          // Decrement global Redux state
          dispatch(decrementUnread());
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
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
        {notifications.length > 0 && (
          <span className="text-xs font-medium text-slate-400">
            Showing {notifications.length} notification(s)
          </span>
        )}
      </div>

      {notifications.length === 0 && !loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center gap-3">
          <Inbox className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
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

          {/* Loading indicator */}
          {loading && (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
              <span>Loading notifications...</span>
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {hasMore && !loading && (
            <div ref={observerTarget} className="h-4 w-full"></div>
          )}

          {!hasMore && notifications.length > 0 && (
            <p className="text-center text-[11px] text-slate-400 mt-4 italic">
              You've reached the end of your notifications.
            </p>
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
