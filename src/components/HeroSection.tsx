import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    title: "স্পেশাল অফার",
    subtitle: "50% ছাড়",
    cta: "আজই কিনুন",
    gradient: "from-orange-500 via-amber-400 to-yellow-300",
  },
  {
    title: "নতুন কালেকশন",
    subtitle: "ট্রেন্ডি গ্যাজেট",
    cta: "শপিং করুন",
    gradient: "from-blue-600 via-indigo-500 to-purple-400",
  },
  {
    title: "ফ্রি ডেলিভারি",
    subtitle: "সারাদেশে",
    cta: "এখনই অর্ডার",
    gradient: "from-emerald-600 via-green-500 to-teal-400",
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden">
      <div
        className={`relative h-[220px] sm:h-[300px] md:h-[380px] bg-gradient-to-r ${slide.gradient} transition-all duration-700`}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-60px] left-[20%] w-[150px] h-[150px] rounded-full bg-white/10" />

        <div className="relative container-box h-full flex flex-col justify-center items-start gap-2 sm:gap-4 z-10">
          <p className="text-white/90 text-lg sm:text-xl font-semibold">{slide.title}</p>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-none drop-shadow-lg">
            {slide.subtitle}
          </h2>
          <Link to="/shop">
            <Button
              size="lg"
              className="mt-2 gap-2 rounded-md text-base px-8 bg-blue-700 hover:bg-blue-800 text-white shadow-lg"
            >
              {slide.cta} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 z-20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 z-20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 py-3 bg-gradient-to-b from-muted/50 to-transparent">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === current ? "bg-primary scale-110" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
