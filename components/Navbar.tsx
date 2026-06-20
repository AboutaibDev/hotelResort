"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { clearCredentials } from "@/lib/redux/authSlice";
import { Menu, X, User, LogOut, Shield, Briefcase } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        scrolled
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

        {/* User Auth Buttons / Dashboard */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-sm font-medium bg-slate-100 border border-slate-200/80 text-slate-800 hover:bg-slate-200/80 px-4 py-2 rounded-full transition-all duration-200"
              >
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 text-sm font-medium bg-primary text-slate-950 px-4 py-2 rounded-full hover:bg-amber-400 transition-all duration-200 shadow-sm font-semibold"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-current focus:outline-none cursor-pointer"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 top-[60px] bg-white/98 backdrop-blur-lg z-40 transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
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
                className="flex items-center justify-center gap-2 text-rose-500 border border-rose-500/20 py-3 rounded-xl hover:bg-rose-500/10 cursor-pointer"
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
    </nav>
  );
}
