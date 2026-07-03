"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Compass, DollarSign, Calendar } from "lucide-react";
import { parseImages } from "@/lib/images";

export interface Activity {
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

interface ActivitiesCatalogProps {
  initialActivities: Activity[];
}

export default function ActivitiesCatalog({ initialActivities }: ActivitiesCatalogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filteredActivities = useMemo(() => {
    let result = [...initialActivities];

    // Filter by search
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (act) =>
          act.title?.toLowerCase().includes(q) ||
          act.description?.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category !== "all") {
      result = result.filter((act) => act.category === category);
    }

    return result;
  }, [initialActivities, search, category]);

  const categories = ["all", "Wellness", "Adventure", "Leisure", "Gastronomy"];

  return (
    <div className="flex flex-col gap-10">
      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search resort experiences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 shadow-sm transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                category === cat
                  ? "bg-primary text-slate-950 shadow-md shadow-primary/20"
                  : "bg-white text-slate-600 hover:bg-stone-50 border border-slate-200"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid listing */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200/80">
          <p className="text-slate-500">No activities found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredActivities.map((activity) => {
            const thumbnail = parseImages(activity.image, "activity")[0];
            return (
            <div
              key={activity.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/80 flex flex-col group"
            >
              <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={thumbnail}
                  alt={activity.title || "Activity Image"}
                  fill
                  sizes="100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-primary font-bold text-sm px-4 py-1.5 rounded-full border border-slate-200/80 shadow-md">
                  {Number(activity.price).toFixed(0)} DH / Person
                </div>
                <div className="absolute bottom-4 left-4 bg-slate-950/75 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/10">
                  {activity.category}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1 gap-3 justify-between">
                <div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
                    <span>Duration: {activity.duration} mins</span>
                    <span>•</span>
                    <span>Capacity: {activity.capacity} max</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-950 group-hover:text-primary transition-colors">
                    {activity.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2 line-clamp-3">
                    {activity.description}
                  </p>
                </div>
                <Link
                  href={`/activities/${activity.id}`}
                  className="mt-6 w-full text-center bg-stone-100 hover:bg-primary hover:text-slate-950 text-slate-800 font-medium py-3 rounded-xl transition-all duration-200 border border-slate-200/60"
                >
                  View Activity Details
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
