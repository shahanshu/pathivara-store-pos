// ----- File: app/components/landing/HeroSection.jsx -----
// app/components/landing/HeroSection.jsx
'use client';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section
      id="hero-section" // Added ID for navbar link
      className="min-h-screen flex flex-col md:flex-row items-stretch"
    >
      {/* Left Column - Image */}
      <div className="md:w-1/2 w-full min-h-[70vh] md:min-h-full relative overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Man holding rice bag in store"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>

      {/* Right Column - Text Content */}
      <div
        className="md:w-1/2 w-full flex flex-col items-center justify-center text-white p-8 sm:p-12 lg:p-16 text-center md:text-left"
        style={{ backgroundColor: '#a86f32' }}
      >
        <div className="max-w-md md:max-w-lg">
          <motion.h1
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight"
          >
            SathiMart <span className="text-yellow-300">Department</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="text-md sm:text-lg md:text-xl mb-10 font-light"
          >
            Exploreeeeeee a well defined collections of the Local as well as the initernationa household uetnsils & the finest products.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            className="flex justify-center md:justify-start"
          >
            <Link
              href="/#shop-our-picks" // MODIFIED: Navigates to ShopOurPicksSection
              className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 sm:py-4 sm:px-10 rounded-lg text-base sm:text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Shop Now <FiArrowRight className="ml-2 sm:ml-3 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
// ----- End of File: app/components/landing/HeroSection.jsx -----