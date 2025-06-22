
'use client';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ShopOurPicksSection from './ShopOurPicksSection';

import AboutUsSection from './AboutUsSection';
import ShopByCategorySection from './ShopByCategorySection';
import CallToActionSection from './CallToActionSection';
import Footer from './Footer';

export default function LandingPageClient() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ShopOurPicksSection />

        <AboutUsSection />
        <ShopByCategorySection />
        <CallToActionSection />
      </main>
      <Footer />
    </>
  );
}
