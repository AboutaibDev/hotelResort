import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ActivityBookingPanel from "@/components/ActivityBookingPanel";
import ActivityReviews from "@/components/ActivityReviews";
import { parseImages } from "@/lib/images";
import { Clock, Users, Compass, ShieldAlert, Sparkles, MapPin, Camera } from "lucide-react";

export const revalidate = 0;

interface ActivityDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailsPage({ params }: ActivityDetailsPageProps) {
  const { id } = await params;
  const activityId = parseInt(id, 10);

  if (isNaN(activityId)) {
    return notFound();
  }

  const activity = await db.activities.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    return notFound();
  }

  // Fetch reviews
  const reviews = await db.reviews.findMany({
    where: { activity_id: activityId },
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

  // Parse images from DB
  const galleryImages = parseImages(activity.image, "activity");
  const heroImage = galleryImages[0];
  const extraImages = galleryImages.slice(1);

  return (
    <div className="bg-stone-50 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10">
        
        {/* Large Hero Banner */}
        <div className="relative h-[55vh] md:h-[65vh] w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200/80">
          <Image
            src={heroImage}
            alt={activity.title || "Activity Detail"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white flex flex-col gap-2">
            <span className="text-primary font-bold uppercase tracking-wider text-xs bg-primary/10 self-start px-3 py-1 rounded-full border border-primary/20 backdrop-blur-sm">
              {activity.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-amber-50">
              {activity.title}
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
                  Experience Description
                </h2>
                <p className="text-slate-650 text-sm md:text-base leading-relaxed">
                  {activity.description}
                </p>
              </div>

              <hr className="border-slate-200" />

              {/* Activity specs */}
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="flex flex-col gap-1 items-center p-4 bg-stone-50 rounded-2xl border border-slate-200/80">
                  <Clock className="h-6 w-6 text-primary" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Duration</span>
                  <p className="text-sm font-bold text-slate-900">{activity.duration} Minutes</p>
                </div>
                <div className="flex flex-col gap-1 items-center p-4 bg-stone-50 rounded-2xl border border-slate-200/80">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Group Size</span>
                  <p className="text-sm font-bold text-slate-900">Up to {activity.capacity} Guests</p>
                </div>
                <div className="flex flex-col gap-1 items-center p-4 bg-stone-50 rounded-2xl border border-slate-200/80">
                  <Compass className="h-6 w-6 text-primary" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Instructor</span>
                  <p className="text-sm font-bold text-slate-900">Expert-led</p>
                </div>
              </div>
            </div>

            {/* Photo Gallery — only shown when extra images exist */}
            {extraImages.length > 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
                <h3 className="text-lg font-serif font-bold text-slate-950 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  <span>Photo Gallery</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {extraImages.map((src, i) => (
                    <div key={i} className="relative h-40 rounded-2xl overflow-hidden border border-slate-200/80 group">
                      <Image
                        src={src}
                        alt={`${activity.title} gallery ${i + 2}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety & Guidelines */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-serif font-bold text-slate-950 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <span>Guidelines &amp; What to bring</span>
              </h3>
              <ul className="text-sm text-slate-600 flex flex-col gap-2 list-disc pl-5 leading-relaxed">
                <li>Please arrive at the resort reception desk 15 minutes before the scheduled time.</li>
                <li>Comfortable clothing and athletic footwear are highly recommended.</li>
                <li>All safety equipment, refreshments, and guiding materials are provided by the resort.</li>
                <li>Cancellations are fully refunded up to 24 hours prior to the experience.</li>
              </ul>
            </div>

            {/* Review Section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
              <ActivityReviews activityId={activity.id} initialReviews={reviews} />
            </div>
          </div>

          {/* Booking Side Panel */}
          <div className="flex flex-col">
            <ActivityBookingPanel activity={activity} />
          </div>
        </div>

      </div>
    </div>
  );
}
