// ----- File: app/components/landing/AboutUsSection.jsx -----
// app/components/landing/AboutUsSection.jsx
'use client';
import { motion } from 'framer-motion';
import Image from 'next/image'; // Make sure Image is imported
import AnimatedSection from '../AnimatedSection';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';

const AboutUsSection = () => {
  const contactDetails = [
    {
      icon: <FiMapPin className="w-6 h-6 text-primary" />,
      label: 'Visit Us',
      text: 'Dharan -08, Sunsari, Nepal',
      href: 'https://maps.google.com/?q=123+Main+Street,+Your+City',
    },
    {
      icon: <FiPhone className="w-6 h-6 text-primary" />,
      label: 'Call Us',
      text: '9745245005',
      href: 'tel:+15551234567',
    },
    {
      icon: <FiMail className="w-6 h-6 text-primary" />,
      label: 'Email Us',
      text: 'milanshrestha9801@gmail.com',
      href: 'mailto:info@sathimart.com',
    },
    {
      icon: <FiClock className="w-6 h-6 text-primary" />,
      label: 'Opening Hours',
      text: '7 Days : 07:30 AM - 09:30 PM',
    },
  ];

  return (
    <AnimatedSection
      id="about-us"
      className="py-16 sm:py-24 bg-white"
      direction="left"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-20">
          {/* Left Column: Image */}
          <motion.div
            className="w-full lg:w-5/12"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative aspect-[4/5] sm:aspect-square rounded-xl shadow-2xl overflow-hidden group">
              <Image
                src="/images/sathimart.jpg"
                alt="Sathi Mart store front"
                fill // MODIFIED: Replaced layout="fill" with fill
                // objectFit="cover" // REMOVED: objectFit prop is legacy
                // MODIFIED: Apply object-fit via className
                className="transition-transform duration-500 group-hover:scale-105 object-cover"
                sizes="(max-width: 1023px) 90vw, 40vw" // Keep the sizes prop, adjust as needed
              />
            </div>
          </motion.div>

          {/* Right Column: Text and Contact Info */}
          <motion.div
            className="w-full lg:w-7/12"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay:0.2, ease: "easeOut" }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Welcome to <span className="text-primary">Sathi Mart</span>
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              At Sathi Mart, we are committed to providing our community with a wide selection of quality products at
              affordable prices. From fresh groceries and household essentials to the latest cosmetics and local favorites, we
              strive to be your trusted one-stop shop. Our friendly staff is always here to help you find what you need.
            </p>
            <p className="text-lg text-gray-700 mb-10 leading-relaxed">
              We believe in quality, variety, and a shopping experience that feels like home. Come visit us and discover
              the Sathi Mart difference!
            </p>

            {/* Enhanced Contact Info Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Get In Touch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {contactDetails.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm">
                    <div className="flex-shrink-0 text-primary bg-primary/10 p-3 rounded-full">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-800">{item.label}</h4>
                      {item.href? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? undefined : "noopener noreferrer"}
                          className="text-sm text-gray-600 hover:text-primary hover:underline"
                        >
                          {item.text}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600">{item.text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default AboutUsSection;
// ----- End of File: app/components/landing/AboutUsSection.jsx -----