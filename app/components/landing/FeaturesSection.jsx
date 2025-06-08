// app/components/landing/FeaturesSection.jsx
'use client';
import { motion } from 'framer-motion';
import AnimatedSection from '../AnimatedSection'; // Use our reusable animation component
import { FiTruck, FiShield, FiGift, FiHeadphones } from 'react-icons/fi'; // Example icons

const features = [
  {
    icon: <FiTruck className="h-10 w-10 text-primary" />,
    title: 'Fast Shipping',
    description: 'Get your orders delivered swiftly to your doorstep, wherever you are.',
  },
  {
    icon: <FiShield className="h-10 w-10 text-accent" />,
    title: 'Secure Payments',
    description: 'Shop with confidence using our secure and encrypted payment gateways.',
  },
  {
    icon: <FiGift className="h-10 w-10 text-secondary" />,
    title: 'Exclusive Deals',
    description: 'Access member-only discounts and special offers on a wide range of products.',
  },
  {
    icon: <FiHeadphones className="h-10 w-10 text-red-500" />,
    title: '24/7 Support',
    description: 'Our dedicated support team is here to help you around the clock.',
  },
];

const FeaturesSection = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <AnimatedSection className="py-16 sm:py-24 bg-white" direction="up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Why Shop With Us?
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            We provide an unparalleled shopping experience with benefits you'll love.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              custom={index}
              variants={cardVariants}
              initial="hidden"       // Already handled by AnimatedSection's whileInView
              whileInView="visible"  // Or define here for per-card animation control
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="mb-5 p-4 bg-primary/10 rounded-full">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default FeaturesSection;