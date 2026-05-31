import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import ScrollToTop from "@/components/ScrollToTop";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import QuickOrder from "./pages/QuickOrder";
import Products from "./pages/Products";
import WholesaleCatalog from "./pages/WholesaleCatalog";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Wallet from "./pages/Wallet";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import About from "./pages/About";
import Contact from "./pages/Contact";
import POS from "./pages/POS";
import NotFound from "./pages/NotFound";

// Fix 3 — QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

/* ===============================
   AUTH GUARD - requires login
================================ */
// Fix 1 — React.ReactNode instead of JSX.Element
// Fix 2 — Show LoadingScreen instead of blank screen
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            {/* Fix 4 — AnnouncementPopup now shows on ALL pages */}
            <AnnouncementPopup />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quick-order" element={<QuickOrder />} />
              <Route path="/products" element={<Products />} />
              <Route path="/wholesale" element={<WholesaleCatalog />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wallet" element={<AuthGuard><Wallet /></AuthGuard>} />
              <Route path="/orders" element={<AuthGuard><Orders /></AuthGuard>} />
              <Route path="/account" element={<AuthGuard><Account /></AuthGuard>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pos" element={<POS />} />

              {/* ADMIN ROUTES */}
              <Route path="/admin/*" element={<Admin />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;