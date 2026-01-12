import { Award, Truck, HeadphonesIcon, Clock, Sparkles, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Original Sivakasi Quality",
    description: "100% genuine products directly from Sivakasi manufacturers with quality assurance."
  },
  {
    icon: Truck,
    title: "Pan India Delivery",
    description: "Safe and secure delivery across India with proper packaging and handling."
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Round the clock customer support via WhatsApp for all your queries."
  },
  {
    icon: Clock,
    title: "25+ Years Experience",
    description: "Trusted by thousands of customers and dealers for over two decades."
  },
  {
    icon: Sparkles,
    title: "Best Prices Guaranteed",
    description: "Wholesale prices for dealers and competitive retail rates for customers."
  },
  {
    icon: ShieldCheck,
    title: "Licensed & Certified",
    description: "Fully licensed and government certified firecracker wholesale business."
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/20 text-secondary font-semibold text-sm mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            The <span className="text-gradient-hero">GKP Crackers</span> Advantage
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the best in quality, service, and pricing with Tamil Nadu's trusted firecracker wholesaler
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card"
            >
              <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
