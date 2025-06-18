// app/components/landing/Navbar.jsx
'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { FiShoppingCart, FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call on mount to set initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Home', href: '/#hero-section' },
    { name: 'Shop', href: '/#shop-our-picks' },
    { name: 'Categories', href: '/#shop-by-category' },
    { name: 'About Us', href: '/#about-us' },
  ];

  const navClasses = `fixed w-full top-0 left-0 z-50 transition-all duration-300 ease-in-out ${
    scrolled || isOpen // Keep navbar background when menu is open for better visibility
      ? 'bg-white/90 backdrop-blur-md shadow-md'
      : 'bg-transparent'
  }`;

  const linkTextColorClass = scrolled || isOpen
    ? 'text-gray-700 hover:text-primary'
    : 'text-white hover:opacity-80';

  const mobileIconColorClass = isOpen // When menu is open, X is part of the main navbar, needs contrast
    ? 'text-gray-700 hover:text-primary' 
    : (scrolled ? 'text-gray-700 hover:text-primary' : 'text-white hover:opacity-80');

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

  const mobileMenuVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { 
      x: '100%',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Close menu when a link is clicked
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={navClasses}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <img
                src="/images/sathimart_logo.png"
                alt="Sathi Mart Logo"
                className="h-12 w-auto"
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
                aria-expanded={isOpen}
              >
                {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Panel and Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeMenu}
            />
            {/* Mobile Menu */}
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white shadow-xl z-40 flex flex-col p-6 space-y-4 md:hidden"
            >
              {/* Optional: Add a close button inside the panel if preferred */}
              {/* <button onClick={closeMenu} className="self-end p-2 text-gray-600 hover:text-primary">
                <FiX size={24} />
              </button> */}
              
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={closeMenu}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/cart"
                className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={closeMenu}
              >
                <div className="flex items-center">
                  <FiShoppingCart size={20} className="mr-2" /> Cart
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;