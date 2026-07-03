"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import { parseImages } from "@/lib/images";

export interface Room {
  id: number;
  title: string | null;
  description: string | null;
  price_per_night: number;
  capacity: number | null;
  status: string;
  image: string | null;
}

interface RoomsCatalogProps {
  initialRooms: Room[];
}

export default function RoomsCatalog({ initialRooms }: RoomsCatalogProps) {
  const [search, setSearch] = useState("");
  const [capacity, setCapacity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  const filteredRooms = useMemo(() => {
    let result = [...initialRooms];

    // Filter by search query
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (room) =>
          room.title?.toLowerCase().includes(q) ||
          room.description?.toLowerCase().includes(q)
      );
    }

    // Filter by capacity
    if (capacity !== "all") {
      const capNum = parseInt(capacity, 10);
      result = result.filter((room) => room.capacity && room.capacity >= capNum);
    }

    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price_per_night) - Number(a.price_per_night));
    } else if (sortBy === "capacity") {
      result.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    }

    return result;
  }, [initialRooms, search, capacity, sortBy]);

  return (
    <div className="flex flex-col gap-10">
      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hotel rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <select
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900"
            >
              <option value="all">Any Capacity</option>
              <option value="2">2+ Guests</option>
              <option value="3">3+ Guests</option>
              <option value="4">4+ Guests</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary text-slate-900"
            >
              <option value="default">Default Sort</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="capacity">Guests Capacity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200/80">
          <p className="text-slate-500">No rooms match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredRooms.map((room) => {
            const isAvailable = room.status === "available";
            const thumbnail = parseImages(room.image, "room")[0];
            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 flex flex-col transition-all duration-300 ${
                  isAvailable
                    ? "hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
                    : "opacity-60 grayscale cursor-not-allowed select-none"
                }`}
              >
                <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={thumbnail}
                    alt={room.title || "Room Image"}
                    fill
                    sizes="100vw"
                    className={`object-cover transition-transform duration-500 ${isAvailable ? "group-hover:scale-105" : ""}`}
                  />
                  {/* Price badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-primary font-bold text-sm px-4 py-1.5 rounded-full border border-slate-200/80 shadow-md">
                    {Number(room.price_per_night).toFixed(0)} DH / Night
                  </div>
                  {/* Unavailable overlay */}
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <span className="bg-slate-900/90 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-slate-600 backdrop-blur-sm">
                        Currently Unavailable
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1 gap-3 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>Max Capacity: {room.capacity} Guests</span>
                    </div>
                    <h3 className={`text-xl font-serif font-bold text-slate-950 transition-colors ${isAvailable ? "group-hover:text-primary" : ""}`}>
                      {room.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-2 line-clamp-3">
                      {room.description}
                    </p>
                  </div>
                  {isAvailable ? (
                    <Link
                      href={`/rooms/${room.id}`}
                      className="mt-6 w-full text-center bg-stone-100 hover:bg-primary hover:text-slate-950 text-slate-800 font-medium py-3 rounded-xl transition-all duration-200 border border-slate-200/60"
                    >
                      View Room Details
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="mt-6 w-full text-center bg-slate-100 text-slate-400 font-medium py-3 rounded-xl border border-slate-200/60 cursor-not-allowed"
                    >
                      Not Available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
