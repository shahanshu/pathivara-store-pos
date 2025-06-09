// ----- File: app/components/landing/LandingPageClient.jsx -----
// app/components/landing/LandingPageClient.jsx
'use client';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ShopOurPicksSection from './ShopOurPicksSection';
// import TrendingProductsSection from './TrendingProductsSection'; // Remove this
import AboutUsSection from './AboutUsSection'; // Import the new section
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
        {/* <TrendingProductsSection /> */} {/* Remove or comment out */}
        <AboutUsSection /> {/* Add the new section here */}
        <ShopByCategorySection />
        <CallToActionSection />
      </main>
      <Footer />
    </>
  );
}
// ----- End of File: app/components/landing/LandingPageClient.jsx -----