import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="gradient-dark py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={logo} alt="GKP Crackers" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gradient-gold">GKP CRACKERS</h3>
                <p className="text-xs sm:text-sm text-white/70">Best Quality at Best Price</p>
              </div>
            </Link>
            <p className="text-sm sm:text-base text-white/70 mb-4 max-w-md">
              Your trusted partner for premium quality crackers from Sivakasi. 
              Serving customers across India with the best products and prices for over 25 years.
            </p>
            <p className="text-xs sm:text-sm text-white/50">GST: 33GKPPK8032R</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-secondary" />
              Quick Links
            </h4>
            <ul className="space-y-3 text-white/70">
              <li>
                <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/quick-order" className="hover:text-secondary transition-colors">Quick Order</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-secondary transition-colors">Products</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-secondary transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-secondary" />
              Contact Us
            </h4>
            <ul className="space-y-3 text-white/70">
              <li>📍 Sivakasi, Tamil Nadu</li>
              <li>
                <a href="tel:+918610153961" className="hover:text-secondary transition-colors">
                  📞 +91 8610153961
                </a>
              </li>
              <li>
                <a href="https://wa.me/918610153961" className="hover:text-secondary transition-colors">
                  💬 WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/50 text-sm mb-2">
            ⚠️ This website is for estimation purposes only. No online sale or payment.
          </p>
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} GKP Crackers. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}