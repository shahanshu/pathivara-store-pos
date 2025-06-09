// ----- File: app/components/landing/CallToActionSection.jsx -----
'use client';
import Link from 'next/link';
import AnimatedSection from '../AnimatedSection';
import { FiMapPin, FiGift } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CallToActionSection = () => {
  return (
    <AnimatedSection className="bg-primary text-gray-800 py-16 sm:py-24" direction="left"> {/* CHANGED to text-gray-800 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl mb-6" // Darker text for heading
        >
          Discover More In-Store
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-gray-700 mb-10 max-w-2xl mx-auto" // Darker gray for paragraph
        >
          Visit us today to explore our wide selection, discover new arrivals, and enjoy a personal shopping experience with our friendly team!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6"
        >
          <Link
            href="/#about-us"
            // Button 1: Now needs a background that contrasts with dark text, or keep bg-white and ensure text-primary (blue) is fine
            // If text-primary (blue) on white is good, this button is fine.
            // If you want a dark button: bg-gray-800 text-white
            className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-primary 
                       font-semibold py-3 px-8 rounded-lg text-md shadow-md 
                       transition-colors duration-300 w-full sm:w-auto"
          >
            <FiMapPin className="mr-2 h-5 w-5" /> Get Directions
          </Link>
          <Link
            href="/contact"
            // Button 2: Now needs a border and text color that contrasts with the blue background.
            // Using secondary color for border and text could work.
            className="inline-flex items-center justify-center border-2 border-secondary hover:bg-secondary/10 text-secondary 
                       font-semibold py-3 px-8 rounded-lg text-md shadow-md 
                       transition-colors duration-300 w-full sm:w-auto"
            // OR if you want it to look like a "ghost button" against the blue:
            // className="inline-flex items-center justify-center border-2 border-gray-700 hover:bg-gray-700/10 text-gray-700
            //            font-semibold py-3 px-8 rounded-lg text-md shadow-md
            //            transition-colors duration-300 w-full sm:w-auto"
          >
            <FiGift className="mr-2 h-5 w-5" /> View Our Specials
          </Link>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default CallToActionSection;