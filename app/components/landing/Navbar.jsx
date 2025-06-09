// ----- File: app/components/landing/Navbar.jsx -----
// app/components/landing/Navbar.jsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

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

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50); // Change style after scrolling 50px
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [ 
    { name: 'Home', href: '/#hero-section' }, // Points to the HeroSection ID
    { name: 'Shop', href: '/#shop-our-picks' }, // Points to ShopOurPicksSection ID
    { name: 'Categories', href: '/#shop-by-category' }, // Points to ShopByCategorySection ID
    { name: 'About Us', href: '/#about-us' }, // Points to AboutUsSection ID
  ];

  // Determine navbar classes based on scroll state
  const navClasses = `fixed w-full top-0 left-0 z-50 transition-all duration-300 ease-in-out ${
    scrolled
      ? 'bg-white/90 backdrop-blur-md shadow-md'
      : 'bg-transparent' // Fully transparent initially
  }`;

  // Determine text color for links based on scroll state
  const linkTextColorClass = scrolled
    ? 'text-gray-700 hover:text-primary'
    : 'text-white hover:opacity-80';

  // Determine mobile menu icon color
  const mobileIconColorClass = isOpen
    ? 'text-gray-700 hover:text-primary' // When menu is open, icon is for closing (X), so gray
    : (scrolled ? 'text-gray-700 hover:text-primary' : 'text-white hover:opacity-80'); // Hamburger icon

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={navClasses}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/images/sathimart_logo.png"
              alt="Sathi Mart Logo"
              className="h-12 w-auto" // Adjusted height for potentially better fit
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.name}
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href={item.href}
                  className={`font-medium px-3 py-2 rounded-md text-sm transition-colors ${linkTextColorClass}`}
                  onClick={() => isOpen && setIsOpen(false)} // Close mobile menu if open
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
            <motion.div
              custom={menuItems.length}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href="/cart" className={`p-2 rounded-full transition-colors ${linkTextColorClass}`}>
                <FiShoppingCart size={24} />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`focus:outline-none p-2 transition-colors ${mobileIconColorClass}`}
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
          // Mobile menu always has a solid background for readability when open
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