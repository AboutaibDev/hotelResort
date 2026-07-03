"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { clearCredentials } from "@/lib/redux/authSlice";
import { setNotifications, addNotification, markAllAsRead } from "@/lib/redux/notificationsSlice";
import { Menu, X, User, LogOut, Shield, Bell, Check, Calendar, ChevronDown } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { recentNotifications, unreadCount } = useSelector((state: RootState) => state.notifications);

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifLimit, setNotifLimit] = useState(5);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Scroll handler for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Fetch initial notifications on mount and establish WebSocket connection
  const fetchNavbarNotifications = React.useCallback(async (limit: number) => {
    if (!isAuthenticated) return;
    setNotifLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=1&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        dispatch(setNotifications({
          notifications: data.notifications,
          unreadCount: data.unreadCount
        }));
        setNotifTotal(data.total ?? data.notifications.length);
      }
    } catch (err) {
      console.error("Error fetching navbar notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  const loadMoreNotifications = () => {
    const newLimit = notifLimit + 5;
    setNotifLimit(newLimit);
    fetchNavbarNotifications(newLimit);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNavbarNotifications(notifLimit);

    // Establish WebSocket connection.
    // The JWT cookie is HttpOnly so we can't read it via document.cookie.
    // Instead, fetch it from the server-side ws-token endpoint.
    // We use a `cancelled` flag to avoid zombie WebSocket connections
    // when the component unmounts while connectWS is mid-await.
    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = async () => {
      if (cancelled) return;
      try {
        const tokenRes = await fetch("/api/auth/ws-token");
        if (cancelled) return; // Unmounted while fetching token
        if (!tokenRes.ok) return;
        const { token } = await tokenRes.json();
        if (!token || cancelled) return;

        ws = new WebSocket(`ws://localhost:3002?token=${token}`);

        ws.onopen = () => {
          console.log("Navbar connected to WebSocket server.");
        };

        ws.onmessage = (event) => {
          try {
            const newNotif = JSON.parse(event.data);
            dispatch(addNotification(newNotif));
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          // Only reconnect if we're still mounted and the close wasn't intentional
          if (!cancelled) {
            console.log("Navbar WebSocket disconnected. Reconnecting in 5 seconds...");
            reconnectTimeout = setTimeout(connectWS, 5000);
          }
        };

        ws.onerror = () => {
          // onerror always fires before onclose; onclose will handle reconnect
          if (ws) ws.close();
        };
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to initialize WebSocket:", e);
        }
      }
    };

    connectWS();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent the reconnect from triggering on intentional close
        ws.close();
        ws = null;
      }
    };
  }, [isAuthenticated, dispatch]);


  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        dispatch(clearCredentials());
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        dispatch(markAllAsRead());
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Rooms", href: "/rooms" },
    { name: "Activities", href: "/activities" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? "bg-white/95 text-slate-900 backdrop-blur-md border-b border-slate-200/80 shadow-md py-3"
          : "bg-transparent text-slate-800 py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex flex-col">
            <span className="text-xl font-bold tracking-widest text-primary font-serif leading-none">
              AMANORA
            </span>
            <span className="block h-[2px] w-full bg-primary/40 rounded-full mt-0.5 group-hover:w-3/4 transition-all duration-300" />
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 hover:text-primary ${
                  isActive ? "text-primary border-b border-primary/50 pb-1" : "opacity-80"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* User Actions & Notifications */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 text-slate-600 hover:text-primary transition-colors focus:outline-none cursor-pointer"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center tabular-nums leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-serif font-bold text-slate-900 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-primary hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {recentNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">
                          No recent notifications
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-stone-50 transition-colors ${
                              !notif.is_read ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="font-semibold text-xs text-slate-800">{notif.title}</h5>
                              <span className="text-[9px] text-slate-400 shrink-0">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                      {recentNotifications.length > 0 && recentNotifications.length < notifTotal && (
                        <button
                          onClick={loadMoreNotifications}
                          disabled={notifLoading}
                          className="w-full py-2.5 text-[11px] font-semibold text-primary hover:text-amber-600 border-t border-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {notifLoading ? "Loading…" : `Load more (${notifTotal - recentNotifications.length} remaining)`}
                        </button>
                      )}
                    </div>

                    <div className="px-4 py-1.5 border-t border-slate-100 text-center">
                      <Link
                        href="/dashboard"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors"
                      >
                        View all in Dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 px-4 py-2 rounded-full transition-all duration-200 focus:outline-none cursor-pointer"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {user.first_name ? user.first_name[0].toUpperCase() : "U"}
                  </div>
                  <span>{user.first_name || "Account"}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.first_name} {user.last_name}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      <span>My Dashboard</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition-colors flex items-center gap-2 font-semibold text-primary"
                      >
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium bg-primary text-slate-900 px-6 py-2.5 rounded-full hover:bg-amber-400 hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-3">
          {isAuthenticated && user && (
            <Link
              href="/dashboard"
              className="p-2 text-slate-600 relative"
              aria-label="Dashboard"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-current focus:outline-none cursor-pointer"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[56px] bg-white/98 backdrop-blur-lg z-40 transition-transform duration-300 md:hidden overflow-y-auto">
          <div className="flex flex-col p-8 gap-6 text-slate-800">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium tracking-wide ${
                    isActive ? "text-primary font-bold" : "opacity-85"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <hr className="border-slate-100 my-2" />
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400">Account</p>
                  <p className="font-bold text-slate-800">{user.first_name} {user.last_name}</p>
                </div>
                
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 bg-slate-100 border border-slate-200/80 py-3 rounded-xl hover:bg-slate-200/80 text-slate-800"
                >
                  <User className="h-5 w-5" />
                  <span>My Dashboard</span>
                </Link>
                
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 bg-primary text-slate-950 py-3 rounded-xl font-semibold"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 text-rose-500 border border-rose-500/20 py-3 rounded-xl hover:bg-rose-500/10 cursor-pointer w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center bg-primary text-slate-900 py-3 rounded-xl font-bold"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
