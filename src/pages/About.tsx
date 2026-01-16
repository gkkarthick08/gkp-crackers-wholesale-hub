import { Link } from "react-router-dom";
import { Award, Users, Truck, Shield, Star, MapPin, Phone, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Award,
    title: "Premium Quality",
    description: "We source only the finest crackers from renowned manufacturers, ensuring safety and performance."
  },
  {
    icon: Users,
    title: "Family Business",
    description: "Serving families for over 15 years with trust, quality, and excellent customer service."
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick and reliable delivery across Tamil Nadu. Order today, celebrate tomorrow!"
  },
  {
    icon: Shield,
    title: "Safe & Certified",
    description: "All our products are certified safe and meet quality standards for your peace of mind."
  }
];

const stats = [
  { value: "15+", label: "Years Experience" },
  { value: "50K+", label: "Happy Customers" },
  { value: "500+", label: "Products" },
  { value: "100%", label: "Quality Assured" }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                About <span className="text-gradient-hero">GKP Crackers</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Your trusted partner for quality crackers since 2009. We believe in bringing joy 
                to every celebration with the finest fireworks at the best prices.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/quick-order">
                  <Button variant="hero" size="lg">
                    Shop Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-card text-center">
                  <CardContent className="pt-6">
                    <p className="text-3xl md:text-4xl font-bold text-gradient-hero">{stat.value}</p>
                    <p className="text-muted-foreground mt-2">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="mb-4">
                  GKP Crackers was founded in 2009 with a simple mission: to bring the joy of 
                  celebrations to every household with quality crackers at affordable prices. 
                  What started as a small family business in Sivakasi has grown into one of 
                  Tamil Nadu's most trusted cracker retailers.
                </p>
                <p className="mb-4">
                  Our founder, with over three decades of experience in the fireworks industry, 
                  established GKP Crackers with a vision to provide customers with a safe, 
                  reliable, and enjoyable shopping experience. We work directly with the best 
                  manufacturers in Sivakasi to bring you authentic, high-quality products.
                </p>
                <p>
                  Today, we serve thousands of happy customers across Tamil Nadu, from retail 
                  shoppers to wholesale dealers. Our commitment to quality, safety, and customer 
                  satisfaction remains unchanged as we continue to grow and evolve.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="shadow-card hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  name: "Rajesh Kumar",
                  location: "Chennai",
                  text: "Best quality crackers at affordable prices. Have been buying from GKP for 5 years now!"
                },
                {
                  name: "Priya Sharma",
                  location: "Coimbatore",
                  text: "Excellent service and fast delivery. The wholesale prices are unbeatable."
                },
                {
                  name: "Suresh Babu",
                  location: "Madurai",
                  text: "Trustworthy dealer with genuine products. Highly recommend for Diwali shopping."
                }
              ].map((testimonial, index) => (
                <Card key={index} className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Have Questions?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Our team is here to help you with any queries about products, pricing, or orders.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/contact">
                <Button variant="hero" size="lg" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Us
                </Button>
              </Link>
              <Link to="/quick-order">
                <Button variant="outline" size="lg" className="gap-2">
                  <Clock className="h-5 w-5" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  );
}