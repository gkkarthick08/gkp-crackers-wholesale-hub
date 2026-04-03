import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import OfferTimer from "@/components/OfferTimer";
import LoginOptions from "@/components/LoginOptions";
import WhyChooseUs from "@/components/WhyChooseUs";
import StoreLocation from "@/components/StoreLocation";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Index() {
  usePageMeta({
    title: "GKP Crackers — Best Crackers at Wholesale & Retail Prices",
    description: "Buy crackers online from GKP Crackers Sivakasi. Best prices on Diwali crackers, wholesale and retail. Fast delivery across Tamil Nadu."
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <OfferTimer />
        <LoginOptions />
        <WhyChooseUs />
        <StoreLocation />
      </main>
      <Footer />
      <FloatingButtons />
      <AnnouncementPopup />
    </div>
  );
}
