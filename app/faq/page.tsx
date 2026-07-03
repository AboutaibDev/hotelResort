import React from "react";
import FaqAccordion from "@/components/FaqAccordion";

export default function FaqPage() {
  return (
    <div className="bg-stone-50 transition-colors py-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-16">
        
        {/* Header Block */}
        <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Support</span>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-950 leading-tight">
            Frequently Asked Questions
          </h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
          <p className="text-slate-500 font-light text-sm md:text-base">
            Find immediate answers about rooms, activities, booking checkouts, support tickets, and how our virtual AI concierge can help you.
          </p>
        </div>

        {/* Faq Accordion Component */}
        <FaqAccordion />

      </div>
    </div>
  );
}
