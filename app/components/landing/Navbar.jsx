// ----- File: app/components/landing/Navbar.jsx -----
// app/components/landing/Navbar.jsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiMenu, FiX } from 'react-icons/fi'; // Example icons
import { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' }, // Placeholder links
    { name: 'Categories', href: '/categories' },
    { name: 'About Us', href: '/about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 left-0 z-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/images/sathimart_logo.png"
              alt="Sathi Mart Logo"
              className="h-10 w-auto" // Adjusted height, width will be auto
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item, index) => (
              <motion.div key={item.name} custom={index} variants={navItemVariants} initial="hidden" animate="visible">
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-primary transition-colors font-medium px-3 py-2 rounded-md text-sm"
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
            <motion.div custom={menuItems.length} variants={navItemVariants} initial="hidden" animate="visible">
              <Link href="/cart" className="text-gray-700 hover:text-primary transition-colors p-2 rounded-full">
                <FiShoppingCart size={24} />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white shadow-lg pb-4"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/cart"
              className="text-gray-700 hover:text-primary hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FiShoppingCart size={20} className="mr-2" /> Cart
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
// ----- End of File: app/components/landing/Navbar.jsx -----