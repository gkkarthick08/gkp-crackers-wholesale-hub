import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";

const trustBadges = [
  { icon: ShieldCheck, text: "100% Original", subtext: "Sivakasi Products" },
  { icon: Truck, text: "Pan India", subtext: "Delivery Available" },
  { icon: Star, text: "25+ Years", subtext: "Trusted Business" },
  { icon: Sparkles, text: "Best Prices", subtext: "Wholesale Rates" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Diwali Celebration"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Sivakasi's Trusted Wholesaler</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl lg:text-6xl font-bold text-card mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Premium Quality{" "}
            <span className="text-gradient-gold">Crackers</span>{" "}
            at Wholesale Prices
          </h1>

          {/* Description */}
          <p className="text-lg text-card/80 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Get the best quality firecrackers from Sivakasi with special wholesale pricing for dealers and retail customers. 
            Estimate your order and we'll deliver joy to your doorstep!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/quick-order">
              <Button variant="hero" size="xl" className="gap-2">
                Start Quick Order
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="gold" size="xl">
                Dealer Login
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {trustBadges.map((badge, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 bg-card/10 backdrop-blur-sm rounded-xl p-4 border border-card/20"
              >
                <div className="p-2 rounded-lg gradient-gold">
                  <badge.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-card text-sm">{badge.text}</p>
                  <p className="text-xs text-card/70">{badge.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-20 h-20 rounded-full bg-secondary/30 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-40 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
    </section>
  );
}
