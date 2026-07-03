import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-100 text-slate-600 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex flex-col">
              <span className="text-xl font-bold tracking-widest text-primary font-serif leading-none">
                AMANORA
              </span>
              <span className="block h-[2px] w-full bg-primary/40 rounded-full mt-0.5" />
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed">
            A sanctuary of luxury, wellness, and adventure. Nestled in a premium retreat destination, we offer world-class rooms and experiences tailored for unforgettable memories.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a href="#" className="hover:text-primary transition-colors" aria-label="Website">
              <Globe className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-primary transition-colors" aria-label="LinkedIn">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-primary transition-colors" aria-label="GitHub">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold tracking-widest text-slate-800 uppercase">Quick Links</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li><Link href="/rooms" className="hover:text-primary transition-colors">Our Rooms</Link></li>
            <li><Link href="/activities" className="hover:text-primary transition-colors">Resort Activities</Link></li>
            <li><Link href="/about" className="hover:text-primary transition-colors">About the Resort</Link></li>
            <li><Link href="/faq" className="hover:text-primary transition-colors">Frequently Asked Questions</Link></li>
          </ul>
        </div>

        {/* Operations */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold tracking-widest text-slate-800 uppercase">Services</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Reservations</Link></li>
            <li><Link href="/dashboard/chat" className="hover:text-primary transition-colors">AI Support Assistant</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors">Help & Support</Link></li>
            <li><Link href="/login" className="hover:text-primary transition-colors">Portal Access</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold tracking-widest text-slate-800 uppercase">Contact Us</h3>
          <ul className="flex flex-col gap-3.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-400">Avenue Mohammed V, Agdal, Rabat 10080, Morocco</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-400">+212 537 77 88 99</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-400">reservations@amanoraresort.com</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="bg-stone-200/40 py-6 border-t border-slate-200/60 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Amanora Resort & Spa. All rights reserved. Designed for ultimate premium leisure.
      </div>
    </footer>
  );
}
