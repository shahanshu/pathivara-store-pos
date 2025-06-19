// ----- File: app/components/landing/Footer.jsx -----
'use client';
import { motion } from 'framer-motion';
import { Inter } from 'next/font/google'; // Changed from Ubuntu

// Initialize Inter font with weights common in iOS-style UI
const inter = Inter({
  weight: ['400', '500', '600'], // Regular, Medium, SemiBold
  subsets: ['latin'],
});

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: "easeOut" }} // Smooth fade-in
      // Apply Inter font, Apple-like light gray background, base text color, and responsive padding
      className={`${inter.className} bg-[#f5f5f7] text-neutral-600 pt-10 pb-8 sm:pt-12 sm:pb-10`}
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8"> {/* Responsive container padding */}
        <div className="flex flex-col items-center text-center">
          {/* Project Name - styled for modern, clear branding */}
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-800">
            SATHIMART
          </h3>

          {/* Developer & Inspiration section - concise and clear */}
          <div className="mt-3 sm:mt-4 space-y-1"> {/* Adjusted spacing for visual appeal */}
            <p className="text-sm text-neutral-700"> {/* Slightly more prominent text for developer info */}
              Developed by <span className="font-medium">Anshu Shah</span>
            </p>
            <p className="text-xs text-neutral-500"> {/* Subtle text for inspiration */}
              Inspired by Mokshada
            </p>
          </div>
        </div>

        {/* Divider and Copyright Section - common pattern in modern footers */}
        <div className="mt-8 sm:mt-10 border-t border-neutral-200 pt-6 sm:pt-8 text-center"> {/* Subtle divider, generous spacing */}
          <p className="text-xs text-neutral-500">
            Copyright © {currentYear} SATHIMART. All Rights Reserved.
            {/* Example of how Apple-style links could be added: */}
            {/* <span className="mx-1.5 hidden sm:inline">|</span>
            <a href="/privacy-policy" className="hover:text-neutral-700 transition-colors">Privacy Policy</a>
            <span className="mx-1.5 hidden sm:inline">|</span>
            <a href="/terms-of-service" className="hover:text-neutral-700 transition-colors">Terms of Service</a> */}
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
// ----- End of File: app/components/landing/Footer.jsx -----