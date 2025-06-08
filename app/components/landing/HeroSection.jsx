// app/components/landing/HeroSection.jsx
'use client';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white min-h-[calc(100vh-80px)] pt-20 flex items-center justify-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight"
        >
          Discover Your Next <span className="text-yellow-300">Favorite</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="text-lg md:text-2xl mb-10 max-w-3xl mx-auto font-light"
        >
          Explore a curated collection of high-quality products, from the latest trends to timeless classics.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
          <Link
            href="/shop" // Link to your main shop page
            className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-4 px-10 rounded-lg text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Shop Now <FiArrowRight className="ml-3 h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;