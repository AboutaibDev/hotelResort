import React from "react";
import { db } from "@/lib/db";
import { seedIfNeeded } from "@/lib/seed";
import ActivitiesCatalog from "@/components/ActivitiesCatalog";

export const revalidate = 0;

export default async function ActivitiesPage() {
  await seedIfNeeded();

  const activities = await db.activities.findMany({
    orderBy: { category: "asc" },
  });

  return (
    <div className="py-16 bg-stone-50 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Curated Experiences
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-950 leading-tight">
            Resort Activities & Adventures
          </h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
          <p className="text-slate-500 font-light text-sm md:text-base leading-relaxed">
            Enhance your stay with our signature experiences. From therapeutic wellness rituals to guided mountain treks and culinary lessons, discover what Amanora has to offer.
          </p>
        </div>

        {/* Dynamic Catalog */}
        <ActivitiesCatalog initialActivities={activities} />
      </div>
    </div>
  );
}
