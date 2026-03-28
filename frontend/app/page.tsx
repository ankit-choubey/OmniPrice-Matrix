import Link from "next/link";
import { ArrowRight, BrainCircuit, CircleDollarSign, ShoppingBag, UtensilsCrossed } from "lucide-react";

const verticals = [
  {
    title: "Electronics",
    description: "Track gadget drops across marketplaces with long-term trend memory.",
    query: "Sony WH-1000XM5",
    icon: ShoppingBag,
  },
  {
    title: "Food & Grocery (Showcase)",
    description: "Use the same engine for food combos and pantry items to model future expansion.",
    query: "pizza combo",
    icon: UtensilsCrossed,
  },
  {
    title: "Lifestyle",
    description: "Monitor personal-care and fashion products with personalized recommendations.",
    query: "cetaphil cleanser",
    icon: CircleDollarSign,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(163,230,53,0.16),rgba(8,8,8,0)_45%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),rgba(8,8,8,0)_45%),#080808] text-white">
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-10 md:pb-14">
        <div className="inline-flex items-center gap-2 text-xs border border-borderline rounded-full px-3 py-1 text-gray-300 mb-6">
          <BrainCircuit size={13} className="text-matrixGreen" />
          One place for price intelligence + personal prediction
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl">
          Buylo turns daily shopping into a living personal market assistant.
        </h1>

        <p className="text-gray-300 mt-5 max-w-2xl text-base md:text-lg leading-relaxed">
          Track across stores, compare in real time, learn over months and years, and get AI-guided buy timing based on your own history.
          Launch with electronics today, showcase food and essentials now, and scale categories as the platform grows.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-matrixGreen text-black font-bold px-5 py-3 rounded-full hover:bg-white transition"
          >
            Open Live Dashboard
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard?q=Sony%20WH-1000XM5"
            className="inline-flex items-center gap-2 border border-borderline px-5 py-3 rounded-full text-gray-200 hover:text-white hover:border-matrixGreen transition"
          >
            Run Demo Search
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {verticals.map((vertical) => {
            const Icon = vertical.icon;
            return (
              <div
                key={vertical.title}
                className="rounded-2xl border border-borderline bg-[#121212]/90 p-6 hover:border-matrixGreen/70 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-matrixGreenDim flex items-center justify-center mb-4">
                  <Icon size={18} className="text-matrixGreen" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">{vertical.title}</h2>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">{vertical.description}</p>
                <Link
                  href={`/dashboard?q=${encodeURIComponent(vertical.query)}`}
                  className="inline-flex items-center gap-2 text-sm text-matrixGreen mt-5"
                >
                  Explore with this category
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}