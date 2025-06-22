// ----- File: app/components/landing/ShopByCategorySection.jsx -----
'use client';
import AnimatedSection from '../AnimatedSection';
import Link from 'next/link';
import Image from 'next/image';
import { FiShoppingBag, FiSmartphone, FiHome, FiHeart } from 'react-icons/fi'; // Changed FiWatch to FiHeart for Beauty & Health
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Regular, Medium, SemiBold, Bold
});

// Updated imageSrc paths to match your provided filenames
const categories = [
  {
    name: 'Fashion & Apparel',
    href: '/shop/fashion',
    icon: FiShoppingBag,
    imageSrc: '/images/fashion.jpg', // Updated path
    imageAlt: 'Stylish fashion apparel and accessories',
    iconColor: 'text-pink-600',
    iconBgColor: 'bg-pink-100',
  },
  {
    name: 'Electronics & Gadgets',
    href: '/shop/electronics',
    icon: FiSmartphone,
    imageSrc: '/images/electro.jpg', // Updated path
    imageAlt: 'Various electronic gadgets and devices',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
  },
  {
    name: 'Home & Living', // Kept this name, home-decor fits well
    href: '/shop/home-living',
    icon: FiHome,
    imageSrc: '/images/home-decor.webp', // Updated path
    imageAlt: 'Decorative items and essentials for home living',
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-100',
  },
  {
    name: 'Beauty & Health',
    href: '/shop/beauty-health',
    icon: FiHeart, // Changed to FiHeart for a better fit
    imageSrc: '/images/health.jpg', // Updated path
    imageAlt: 'Products for beauty, wellness, and health',
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
  },

];

const ShopByCategorySection = () => {
  return (
    <AnimatedSection
      id="shop-by-category"
      className={`${inter.className} py-16 sm:py-20 lg:py-24 bg-neutral-50`}
      direction="up"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900">
            Shop By Category
          </h2>
          <p className="mt-4 text-lg text-neutral-700 max-w-2xl mx-auto">
            Discover our curated collections. Find exactly what you're looking for by browsing our top categories.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
          {categories.map((category) => (
            <Link
              href={category.href}
              key={category.name}
              className="group block overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="relative w-full aspect-[4/3] sm:aspect-square">
                <Image
                  src={category.imageSrc}
                  alt={category.imageAlt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 22vw"
                  priority={categories.indexOf(category) < 2} 
                />
              </div>
              <div className="p-5 text-center">
                <div className={`mx-auto mb-3 inline-flex items-center justify-center p-3 rounded-full ${category.iconBgColor} shadow-sm`}>
                  <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 transition-colors">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ShopByCategorySection;
