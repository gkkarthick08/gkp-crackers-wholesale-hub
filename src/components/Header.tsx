import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut, Settings, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Quick Order", href: "/quick-order" },
  { name: "Products", href: "/products" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-card">
      <nav className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logo} 
            alt="GKP Crackers" 
            className="h-12 w-12 rounded-lg object-contain group-hover:scale-110 transition-transform"
          />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gradient-hero">GKP CRACKERS</h1>
            <p className="text-xs text-muted-foreground">Best Quality at Best Price</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {item.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                location.pathname.startsWith("/admin")
                  ? "gradient-dealer text-white"
                  : "text-dealer hover:bg-dealer/10"
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
              0
            </span>
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="hero" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {profile?.full_name || "My Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{profile?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                    <span className={`text-xs mt-1 px-2 py-0.5 rounded-full w-fit ${
                      profile?.user_type === "dealer" 
                        ? "bg-dealer/10 text-dealer" 
                        : "bg-primary/10 text-primary"
                    }`}>
                      {profile?.user_type === "dealer" ? "Dealer" : "Retail"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallet" className="cursor-pointer">
                    <Wallet className="h-4 w-4 mr-2" />
                    Wallet & Referrals
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="hero" size="sm" className="hidden sm:flex gap-2">
                <User className="h-4 w-4" />
                Login / Signup
              </Button>
              <Button variant="hero" size="icon" className="sm:hidden">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border animate-fade-in">
          <div className="container mx-auto py-4 px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-lg font-medium gradient-dealer text-white"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
