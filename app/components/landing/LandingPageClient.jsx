// app/components/landing/LandingPageClient.jsx
'use client';

import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TrendingProductsSection from './TrendingProductsSection'; // New
import ShopByCategorySection from './ShopByCategorySection'; // New
import CallToActionSection from './CallToActionSection';
import Footer from './Footer';

export default function LandingPageClient() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TrendingProductsSection /> {/* Add new section */}
        <ShopByCategorySection />   {/* Add new section */}
        {/* You could add a Testimonials section here too */}
        <CallToActionSection />
      </main>
      <Footer />
    </>
  );
}