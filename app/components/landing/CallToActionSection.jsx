// app/components/landing/CallToActionSection.jsx
'use client';
import Link from 'next/link';
import AnimatedSection from '../AnimatedSection';
import { FiMail, FiLogIn } from 'react-icons/fi';

const CallToActionSection = () => {
  return (
    <AnimatedSection className="bg-gray-800 text-white py-16 sm:py-24" direction="left">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
          Ready to Elevate Your Shopping?
        </h2>
        <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
          Sign up for our newsletter to get the latest updates, or create an account to start your journey.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/newsletter-signup" // Placeholder
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/80 text-white font-semibold py-3 px-8 rounded-lg text-md shadow-md transition-colors duration-300 w-full sm:w-auto"
          >
            <FiMail className="mr-2 h-5 w-5" /> Subscribe Now
          </Link>
          <Link
            href="/register" // Placeholder
            className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg text-md shadow-md transition-colors duration-300 w-full sm:w-auto"
          >
            <FiLogIn className="mr-2 h-5 w-5" /> Create Account
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default CallToActionSection;