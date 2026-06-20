import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import RoomBookingPanel from "@/components/RoomBookingPanel";
import RoomReviews from "@/components/RoomReviews";
import RoomGallery from "@/components/RoomGallery";
import { parseImages } from "@/lib/images";
import { Compass, Users, Sparkles, ShowerHead, Wifi, Tv, Wind, Bath, Coffee, Dumbbell, Car } from "lucide-react";

export const revalidate = 0;

interface RoomDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailsPage({ params }: RoomDetailsPageProps) {
  const { id } = await params;
  const roomId = parseInt(id, 10);

  if (isNaN(roomId)) {
    return notFound();
  }

  const room = await db.rooms.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return notFound();
  }

  // Block direct access to unavailable rooms
  if (room.status !== "available") {
    return notFound();
  }

  // Fetch reviews
  const reviews = await db.reviews.findMany({
    where: { room_id: roomId },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const amenities = [
    { icon: ShowerHead, name: "Luxury Rain Shower" },
    { icon: Wifi, name: "High-speed Wi-Fi" },
    { icon: Tv, name: "4K Smart TV" },
    { icon: Wind, name: "Climate Control" },
    { icon: Bath, name: "Soaking Bathtub" },
    { icon: Coffee, name: "Nespresso Machine" },
    { icon: Dumbbell, name: "Gym Access" },
    { icon: Car, name: "Valet Parking" },
  ];

  // Parse images from DB — first image is hero, all images go to gallery
  const galleryImages = parseImages(room.image, "room");
  const heroImage = galleryImages[0];

  return (
    <div className="bg-stone-50 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10">
        
        {/* Large Hero Banner */}
        <div className="relative h-[55vh] md:h-[65vh] w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200/80">
          <Image
            src={heroImage}
            alt={room.title || "Room Detail"}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white flex flex-col gap-2">
            <span className="text-primary font-bold uppercase tracking-wider text-xs bg-white/10 self-start px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
              Featured Stay
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-amber-50">
              {room.title}
            </h1>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-serif font-bold text-slate-950">
                  About the Suite
                </h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  {room.description}
                </p>
              </div>

              <hr className="border-slate-200" />

              {/* Room specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Capacity</h5>
                    <p className="text-sm font-bold text-slate-900">{room.capacity} Guests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Bed Type</h5>
                    <p className="text-sm font-bold text-slate-900">King Size</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Room View</h5>
                    <p className="text-sm font-bold text-slate-900">Scenic Mountain</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-slate-400">Internet</h5>
                    <p className="text-sm font-bold text-slate-900">Complimentary</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <h3 className="text-lg font-serif font-bold text-slate-950">Photo Gallery</h3>
              <RoomGallery images={galleryImages} roomTitle={room.title || "Room"} />
            </div>

            {/* Room Amenities */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
              <h3 className="text-lg font-serif font-bold text-slate-950">In-Room Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {amenities.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex flex-col gap-2 items-center text-center p-4 bg-stone-50 rounded-2xl border border-slate-200/80">
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="text-xs font-medium text-slate-700">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <RoomReviews roomId={room.id} initialReviews={reviews} />
            </div>
          </div>

          {/* Booking Side Panel */}
          <div className="flex flex-col">
            <RoomBookingPanel
              room={{
                id: room.id,
                title: room.title,
                price_per_night: Number(room.price_per_night || 0),
                capacity: room.capacity,
                image: room.image,
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
