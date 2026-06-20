import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { seedIfNeeded } from "@/lib/seed";
import { ArrowRight, Star, ShieldCheck, MapPin, Compass, Waves, Coffee } from "lucide-react";

export const revalidate = 0; // Disable caching to fetch live data from DB

export default async function HomePage() {
  // Trigger seeding if database is empty
  await seedIfNeeded();

  const rooms = (
    await db.rooms.findMany({
      where: { status: "available" },
      take: 3,
    })).map((room) => ({
    ...room,
    image: room.image
      ? JSON.parse(room.image)[0]
      : null,
  }));

  const activities = (
  await db.activities.findMany({
    where: { status: "available" },
    take: 3,
  })).map((activity) => ({
    ...activity,
    image: activity.image
      ? JSON.parse(activity.image)[0]
      : null,
  }));

  console.log(rooms[0].image)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center bg-stone-50 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1600"
            alt="Amanora Resort Hero"
            fill
            priority
            className="object-cover opacity-20 scale-105 animate-[pulse-slow_8s_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-100 via-stone-100/50 to-stone-100/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-slate-800 flex flex-col items-center gap-6 animate-fade-in-up">
          <span className="text-primary font-bold tracking-[0.25em] text-xs uppercase bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
            Welcome to Paradise
          </span>
          <h1 className="text-5xl md:text-7xl font-serif tracking-tight leading-none text-slate-900">
            A Sanctuary of <span className="text-primary italic font-light">Luxury</span> & natural splendor
          </h1>
          <p className="max-w-2xl text-slate-600 text-base md:text-lg font-light leading-relaxed">
            Nestled between whispering mountain peaks and tranquil waters, Amanora Resort offers a curated escape designed to rejuvenate your body, mind, and spirit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link
              href="/rooms"
              className="bg-primary text-slate-950 font-semibold px-8 py-3.5 rounded-full hover:bg-amber-400 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-amber-400/40"
            >
              <span>Explore Rooms</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/activities"
              className="bg-transparent border border-slate-300 text-slate-800 font-medium px-8 py-3.5 rounded-full hover:bg-slate-100 hover:border-slate-450 transition-all duration-300"
            >
              Book Experiences
            </Link>
          </div>
        </div>

        {/* Quick Features Bar */}
        <div className="absolute bottom-0 left-0 w-full z-20 py-8 bg-white/80 backdrop-blur-sm border-t border-slate-200/80 hidden md:block">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-4 gap-8 text-slate-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">All-Inclusive Luxury</h4>
                <p className="text-xs text-slate-500">Zero compromises on quality</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Compass className="h-6 w-6 text-primary" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Local Naturalists</h4>
                <p className="text-xs text-slate-500">Expert-led hiking trails</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Waves className="h-6 w-6 text-primary" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Infinity Spas</h4>
                <p className="text-xs text-slate-500">Heated thermal pools</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Coffee className="h-6 w-6 text-primary" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Michelin Dining</h4>
                <p className="text-xs text-slate-500">Fine culinary crafts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-24 bg-stone-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Accommodations</span>
              <h2 className="text-3xl md:text-4xl font-serif text-slate-950">Featured Hotel Rooms</h2>
            </div>
            <Link
              href="/rooms"
              className="text-sm font-semibold text-primary hover:text-amber-400 transition-colors flex items-center gap-1 group"
            >
              <span>View All Rooms</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/80 flex flex-col"
              >
                <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={room.image || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800"}
                    alt={room.title || "Room Image"}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-sm text-primary font-bold text-sm px-4 py-1.5 rounded-full border border-primary/20">
                    ${Number(room.price_per_night).toFixed(0)} / Night
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1 gap-3 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>Max Capacity: {room.capacity} Guests</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-primary">
                      {room.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-2 line-clamp-3">
                      {room.description}
                    </p>
                  </div>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="mt-6 w-full text-center bg-stone-100 hover:bg-primary hover:text-slate-950 text-slate-800 font-medium py-3 rounded-xl transition-all duration-200 border border-slate-200/60"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Experiences Section */}
      <section className="py-24 bg-white transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Discover</span>
              <h2 className="text-3xl md:text-4xl font-serif text-slate-950">Resort Activities</h2>
            </div>
            <Link
              href="/activities"
              className="text-sm font-semibold text-primary hover:text-amber-400 transition-colors flex items-center gap-1 group"
            >
              <span>Explore Activities</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-stone-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/80 flex flex-col"
              >

                <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={activity.image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800"}
                    alt={activity.title || "Activity Image"}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-sm text-primary font-bold text-sm px-4 py-1.5 rounded-full border border-primary/20">
                    ${Number(activity.price).toFixed(0)} / Person
                  </div>
                  <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/10">
                    {activity.category}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1 gap-3 justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
                      <span>Duration: {activity.duration} mins</span>
                      <span>•</span>
                      <span>Capacity: {activity.capacity} persons</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-900">
                      {activity.title}
                    </h3>
                    <p className="text-slate-650 text-sm leading-relaxed mt-2 line-clamp-3">
                      {activity.description}
                    </p>
                  </div>
                  <Link
                    href={`/activities/${activity.id}`}
                    className="mt-6 w-full text-center bg-stone-100 hover:bg-primary hover:text-slate-950 text-slate-800 font-medium py-3 rounded-xl transition-all duration-200 border border-slate-200/60"
                  >
                    Explore Experience
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-stone-50 transition-colors">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-serif text-slate-950">Guest Stories</h2>
          
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-center gap-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-lg md:text-xl font-serif italic text-slate-700 leading-relaxed max-w-2xl">
              &ldquo;Amanora Resort is a dream come true. The Presidential Penthouse was breathtaking, and the sunset yacht cruise was the highlight of our vacation. The attention to detail and AI butler support was impeccable.&rdquo;
            </p>
            <div>
              <h4 className="font-bold text-slate-900">Victoria Sterling</h4>
              <p className="text-xs text-primary font-medium tracking-wider uppercase mt-1">Guest from London, UK</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-100 relative overflow-hidden text-center text-slate-800 border-t border-slate-200/60">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200"
            alt="Amanora Resort Pool"
            fill
            className="object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-stone-100/90" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-serif text-slate-900">Ready for your luxury escape?</h2>
          <p className="text-slate-650 font-light leading-relaxed">
            Create an account to book hotel suites, reserve premium guided outdoor activities, manage reservations, and contact our custom 24/7 AI resort support system.
          </p>
          <Link
            href="/register"
            className="bg-primary text-slate-950 font-semibold px-8 py-3.5 rounded-full hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-amber-400/30"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}
