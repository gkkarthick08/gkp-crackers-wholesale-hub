import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import OfferTimer from "@/components/OfferTimer";
import LoginOptions from "@/components/LoginOptions";
import WhyChooseUs from "@/components/WhyChooseUs";
import StoreLocation from "@/components/StoreLocation";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import AnnouncementPopup from "@/components/AnnouncementPopup";
export default function Index() {
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
