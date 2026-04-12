import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section
      className="relative h-[350px] overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/hero-bg.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 to-[hsl(130,100%,28%)]/60" />
      <div className="relative container-box h-full flex flex-col justify-center items-start text-left gap-4">
        <h1 className="text-[30px] md:text-[30px] font-bold leading-tight text-black">
          বাংলাদেশের সেরা <br />
          অনলাইন শপিং প্ল্যাটফর্ম
        </h1>
        <p className="text-black text-lg max-w-md">
          আমরা নিয়ে এসেছি ট্রেন্ডি গ্যাজেট, স্মার্টওয়াচ ও প্রয়োজনীয় পণ্যের সেরা সংগ্রহ—সঠিক দামে, দ্রুত ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধাসহ। নিরাপদ শপিং, নিশ্চিন্ত কেনাকাটা।
        </p>
        <Link to="/shop">
          <Button size="lg" className="gap-2 rounded-full text-base px-8">
            শপিং করুন
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
