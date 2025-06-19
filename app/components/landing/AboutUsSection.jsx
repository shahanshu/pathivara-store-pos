// ----- File: app/components/landing/AboutUsSection.jsx -----
// app/components/landing/AboutUsSection.jsx
'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import AnimatedSection from '../AnimatedSection'; // Assuming this component exists and works
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { Inter } from 'next/font/google'; // Import Inter font

// Initialize Inter font with necessary weights
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Regular, Medium, SemiBold, Bold
});

const AboutUsSection = () => {
  const contactDetails = [
    {
      icon: <FiMapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />, // text-primary will determine the icon color
      label: 'Visit Us',
      text: 'Dharan -08, Sunsari, Nepal',
      href: 'https://maps.google.com/?q=Dharan-08,+Sunsari,+Nepal', // Updated link
    },
    {
      icon: <FiPhone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
      label: 'Call Us',
      text: '9745245005',
      href: 'tel:+9779745245005', // Assuming Nepal country code
    },
    {
      icon: <FiMail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
      label: 'Email Us',
      text: 'milanshrestha9801@gmail.com',
      href: 'mailto:milanshrestha9801@gmail.com', // Updated email
    },
    {
      icon: <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
      label: 'Opening Hours',
      text: '7 Days : 07:30 AM - 09:30 PM',
    },
  ];

  return (
    <AnimatedSection
      id="about-us"
      // Apply Inter font to the entire section
      className={`${inter.className} py-16 sm:py-20 lg:py-24 bg-white`}
      direction="left" // Animation direction for the whole section
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
            {/* Softer shadow and more rounded corners for an iOS feel */}
            <div className="relative aspect-[4/5] sm:aspect-square rounded-2xl shadow-xl shadow-neutral-900/10 overflow-hidden group">
              <Image
                src="/images/sathimart.jpg" // Ensure this image path is correct
                alt="Sathi Mart store front"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 35vw" // Refined sizes for better optimization
              />
            </div>
          </motion.div>

          {/* Right Column: Text and Contact Info */}
          <motion.div
            className="w-full lg:w-7/12"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            {/* Main heading: Bold and clear */}
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-6 sm:mb-8">
              About <span className="text-primary">Sathi Mart</span> {/* Assuming primary is a pleasant accent color */}
            </h2>
            {/* Paragraph text: Readable and clear */}
            <p className="text-base sm:text-lg text-neutral-700 mb-6 leading-relaxed">
              At Sathi Mart, we are committed to providing our community with a wide selection of quality products at
              affordable prices. From fresh groceries and household essentials to the latest cosmetics and local favorites, we
              strive to be your trusted one-stop shop. Our friendly staff is always here to help you find what you need.
            </p>
            <p className="text-base sm:text-lg text-neutral-700 mb-8 sm:mb-10 leading-relaxed">
              We believe in quality, variety, and a shopping experience that feels like home. Come visit us and discover
              the Sathi Mart difference!
            </p>

            {/* Enhanced Contact Info Section */}
            {/* Lighter border and more top margin for separation */}
            <div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-neutral-200/80">
              <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-800 mb-8">Get In Touch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-6">
                {contactDetails.map((item) => (
                  <div 
                    key={item.label} 
                    // Card styling: white background, rounded corners, soft shadow, subtle hover effect
                    className="flex items-start gap-4 p-5 rounded-xl bg-white shadow-lg shadow-neutral-900/10 hover:shadow-neutral-900/15 transition-shadow duration-300"
                  >
                    {/* Icon container: primary color icon on a tinted background */}
                    <div className="flex-shrink-0 text-primary bg-primary/10 p-2.5 sm:p-3 rounded-full">
                      {item.icon}
                    </div>
                    <div>
                      {/* Contact item label: Medium weight for clarity */}
                      <h4 className="text-base font-medium text-neutral-700 mb-0.5 sm:mb-1">{item.label}</h4>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? undefined : "noopener noreferrer"}
                          // Cleaner link: color change on hover, no underline
                          className="text-sm text-neutral-600 hover:text-primary transition-colors duration-200"
                        >
                          {item.text}
                        </a>
                      ) : (
                        <p className="text-sm text-neutral-600">{item.text}</p>
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