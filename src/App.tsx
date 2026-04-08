import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy load all page components
const Index = lazy(() => import("./pages/Index"));
const QuickOrder = lazy(() => import("./pages/QuickOrder"));
const Products = lazy(() => import("./pages/Products"));
const WholesaleCatalog = lazy(() => import("./pages/WholesaleCatalog"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Cart = lazy(() => import("./pages/Cart"));
const Admin = lazy(() => import("./pages/Admin"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const POS = lazy(() => import("./pages/POS"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

/* ===============================
   AUTH GUARD - requires login
================================ */
const AuthGuard = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<LoadingScreen />}>
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
