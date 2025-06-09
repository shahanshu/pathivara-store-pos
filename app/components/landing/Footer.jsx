// ----- File: app/components/landing/Footer.jsx -----
// app/components/landing/Footer.jsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <FaFacebookF />, href: '#', label: 'Facebook' },
    { icon: <FaTwitter />, href: '#', label: 'Twitter' },
    { icon: <FaInstagram />, href: '#', label: 'Instagram' },
    { icon: <FaLinkedinIn />, href: '#', label: 'LinkedIn' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8 }}
      className="bg-gray-900 text-gray-400 py-12"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            {/* Footer Logo */}
            <Link href="/" className="inline-block mb-4">
              <img
                src="/images/sathimart_logo.png"
                alt="Sathi Mart Logo"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm">Your one-stop shop for everything amazing. Quality products, great service.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              {socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-700 rounded-full"
                >
                  {link.icon}
                </a>
              ))}
            </div>
            <p className="mt-4 text-sm">Email: <a href="mailto:support@yourstore.com"
              className="hover:text-white">support@yourstore.com</a></p>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-sm">
          <p>© {currentYear} My Awesome Department Store. All Rights Reserved.</p>
          {/* Ensure the following line's text makes sense or remove if not applicable */}
          {/* Corrected line below */}
          <p>Designed with <span className="text-red-500">{ '<3' }</span> and Next.js</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
// ----- End of File: app/components/landing/Footer.jsx -----