// app/components/AnimatedSection.jsx
'use client'; // Framer Motion components are client components

import { motion } from 'framer-motion';

const AnimatedSection = ({ children, className, delay = 0, direction = "up" }) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        delay: delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible" // Animate when the section scrolls into view
      viewport={{ once: true, amount: 0.2 }} // Trigger once, when 20% is visible
    >
      {children}
    </motion.section>
  );
};

export default AnimatedSection;