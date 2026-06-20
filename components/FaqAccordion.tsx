"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion() {
  const faqs: FaqItem[] = [
    {
      q: "What is the check-in and check-out time at Amanora Resort?",
      a: "Standard check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in or late check-out can be requested through your account dashboard or by messaging our AI Support Assistant, subject to suite availability.",
    },
    {
      q: "How does the simulated payment system work?",
      a: "Our website uses a simulated payment gateway. When you check out, you will enter mock billing information to complete your reservation. No real money will be charged, allowing you to test the room and activity reservation flows fully.",
    },
    {
      q: "Can I book resort activities without booking a room?",
      a: "Yes! Visitors and customers can book resort experiences (trekking, spa treatments, chef culinary classes) as standalone activities. You do not need an active hotel room reservation to reserve our activities.",
    },
    {
      q: "What is the role of the AI support chatbot?",
      a: "The Amanora AI Assistant is designed to assist you 24/7. It can answer questions about resort amenities, suggest activities based on your preferences, check room availability, and automatically create a support ticket for employee review if you need direct human assistance.",
    },
    {
      q: "How can I check the status of my support ticket?",
      a: "Once our AI assistant creates a ticket or you submit one, it will be listed in your Customer Dashboard under Support. Resort employees review and respond to tickets, and you will see their replies directly there.",
    },
    {
      q: "What is your cancellation policy?",
      a: "Room reservations and activity bookings can be cancelled free of charge up to 24 hours prior to the scheduled date. Cancellations can be processed through the 'My Reservations' tab in your Customer Dashboard.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:border-primary/30"
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                <span className="font-bold text-slate-900 text-sm md:text-base">
                  {faq.q}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pt-3 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
