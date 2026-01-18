import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

import Index from "./pages/Index";
import QuickOrder from "./pages/QuickOrder";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* ===============================
   DEALER ACCESS GUARD
================================ */
const DealerGuard = ({ children }: { children: JSX.Element }) => {
  const {
    profile,
    isVerifiedDealer,
    isPendingDealer,
    isLoading,
  } = useAuth();

  if (isLoading) return null;

  // Dealer pending verification
  if (isPendingDealer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            Your dealer account is pending verification
          </h2>
          <p className="mt-2 text-muted-foreground">
            Please wait for admin approval.
          </p>
        </div>
      </div>
    );
  }

  // Dealer but NOT verified → block
  if (profile?.user_type === "dealer" && !isVerifiedDealer) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              {/* QUICK ORDER – PROTECTED */}
              <Route
                path="/quick-order"
                element={
                  <DealerGuard>
                    <QuickOrder />
                  </DealerGuard>
                }
              />

              <Route path="/products" element={<Navigate to="/quick-order" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/account" element={<Account />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

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
