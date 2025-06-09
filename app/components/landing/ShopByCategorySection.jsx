// ----- File: app/components/landing/ShopByCategorySection.jsx -----
// app/components/landing/ShopByCategorySection.jsx
'use client';
import AnimatedSection from '../AnimatedSection';
import Link from 'next/link';
import { FiBox, FiSmartphone, FiHome, FiWatch } from 'react-icons/fi';

const categories = [
  { name: 'Fashion & Apparel', href: '/shop/fashion', icon: <FiBox className="h-12 w-12 text-pink-500" />, color: 'bg-pink-100' },
  { name: 'Electronics & Gadgets', href: '/shop/electronics', icon: <FiSmartphone className="h-12 w-12 text-blue-500" />, color: 'bg-blue-100' },
  { name: 'Home & Living', href: '/shop/home', icon: <FiHome className="h-12 w-12 text-green-500" />, color: 'bg-green-100' },
  { name: 'Accessories', href: '/shop/accessories', icon: <FiWatch className="h-12 w-12 text-yellow-500" />, color: 'bg-yellow-100' },
];

const ShopByCategorySection = () => {
  return (
    <AnimatedSection 
      id="shop-by-category" // Added ID for navbar link
      className="py-16 sm:py-24 bg-white" 
      direction="up"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Shop By Category
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Find exactly what you're looking for by browsing our top categories.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href} // These links go to actual category pages
              className={`group flex flex-col items-center justify-center p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${category.color} hover:brightness-95`}
            >
              <div className="mb-4 p-4 rounded-full bg-white/50 shadow-md">
                {category.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ShopByCategorySection;
// ----- End of File: app/components/landing/ShopByCategorySection.jsx -----