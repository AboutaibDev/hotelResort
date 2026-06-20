import React from "react";
import Image from "next/image";
import { Coffee, ShieldCheck, Compass, Heart } from "lucide-react";

export default function AboutPage() {
  const values = [
    { icon: Coffee, title: "Impeccable Hospitality", desc: "Our staff is committed to anticipating your every need, offering world-class assistance with high-touch personal service." },
    { icon: ShieldCheck, title: "Sanctuary of Privacy", desc: "Amanora offers completely private villas and penthouses, assuring a quiet, intimate retreat for you and your loved ones." },
    { icon: Compass, title: "Curated Adventure", desc: "We believe travel should inspire. Our guided valley walks, culinary workshops, and water experiences connect you deeply with our location." },
    { icon: Heart, title: "Wellness First", desc: "Our signature Himalayan hot stone spas, organic dining options, and yoga pavilions are designed to heal and revitalize." },
  ];

  return (
    <div className="bg-stone-50 transition-colors py-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-20">
        
        {/* Title Block */}
        <div className="flex flex-col gap-4 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">About Amanora</span>
          <h1 className="text-4xl md:text-5xl font-serif text-slate-950 leading-tight">
            Our Story & Legacy of Luxury
          </h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        {/* Narrative & Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-950">
              Where luxury meets untouched nature
            </h2>
            <p className="text-slate-650 text-sm md:text-base leading-relaxed">
              Founded in 2012, Amanora Resort was envisioned as an architectural tribute to the stunning mountain ranges surrounding our lake. Our goal was to create a sanctuary where modern design integrates seamlessly with the organic curves of the valley.
            </p>
            <p className="text-slate-650 text-sm md:text-base leading-relaxed">
              Over the last decade, we have hosted thousands of travellers seeking refuge from the rush of metropolitan life. With 4 exclusive suites, a luxury spa pavilion, guided activities led by local naturalists, and a custom 24/7 AI-driven support assistant, we combine traditional warm hospitality with state-of-the-art reservation comfort.
            </p>
          </div>
          <div className="relative h-[450px] w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200">
            <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"
              alt="Amanora Resort Pool Deck"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Values Block */}
        <div className="flex flex-col gap-12 bg-white p-8 md:p-16 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
          <div className="text-center flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Core Philosophy</span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-950">What defines the Amanora experience</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="flex gap-4">
                  <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 text-primary shrink-0 h-12 w-12 flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h4 className="font-bold text-slate-950 text-base">{val.title}</h4>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
