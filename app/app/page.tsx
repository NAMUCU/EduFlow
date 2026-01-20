import LandingNav from '@/components/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FaqSection from '@/components/landing/FaqSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
