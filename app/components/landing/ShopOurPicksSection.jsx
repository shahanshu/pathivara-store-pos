// ----- File: app/components/landing/ShopOurPicksSection.jsx -----
'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AnimatedSection from '../AnimatedSection';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper modules
import { Autoplay, Pagination, A11y } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';

// Updated categoriesData to include the new "General Items" category
const categoriesData = [
  {
    name: 'Groceries',
    imageUrl: '/images/saathimart_groceries.jpg',
    altText: 'Aisle of various grocery items on shelves',
    href: '/shop/groceries',
  },
  {
    name: 'Cosmetics',
    imageUrl: '/images/saathimart_cosmetics.jpg',
    altText: 'Shelves stocked with a variety of cosmetic products',
    href: '/shop/cosmetics',
  },
  {
    name: 'Rice & Grains',
    imageUrl: '/images/saathimart_rice_bags.jpg',
    altText: 'Stack of large rice bags and other grains',
    href: '/shop/rice-grains',
  },
  {
    name: 'Spices',
    imageUrl: '/images/saathimart_spices.jpg',
    altText: 'Collection of colorful spices in containers',
    href: '/shop/spices',
  },
  {
    name: 'Beverages & Alcohol',
    imageUrl: '/images/saathimart_alcohol.jpg',
    altText: 'Selection of beverages and alcoholic drinks',
    href: '/shop/beverages-alcohol',
  },
  { // New category added here
    name: 'General Items',
    imageUrl: '/images/sathimart_general.jpg',
    altText: 'Various general merchandise and household items',
    href: '/shop/general', // Example link, adjust as needed
  },
];

const ShopOurPicksSection = () => {
  return (
    <AnimatedSection
      id="shop-our-picks" // Added ID for navbar link
      className="py-16 sm:py-24 bg-gray-50 overflow-hidden"
      direction="up"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Shop Our Popular Categories
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our curated selection.
          </p>
        </div>
        <Swiper
          modules={[Autoplay, Pagination, A11y]}
          spaceBetween={24}
          slidesPerView={1}
          centeredSlides={false}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            768: { slidesPerView: 3, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 24 }, // Now with 6 items, 3 might still be good for lg
                                                          // Or you could increase this to 4 if you want more visible
            1280: { slidesPerView: 4, spaceBetween: 30 }, // XL can comfortably show 4
            // Consider a 5th breakpoint for even wider screens if needed
            // 1536: { slidesPerView: 5, spaceBetween: 30 }, // Example for 2xl screens
          }}
          className="pb-12"
        >
          {categoriesData.map((category) => ( // No index needed for key if names are unique
            <SwiperSlide key={category.name} className="h-auto pb-1">
              <div
                className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full"
              >
                <Link href={category.href} className="block flex flex-col flex-grow">
                  <div className="relative w-full h-48 sm:h-56 md:h-60 overflow-hidden">
                    <img
                      src={category.imageUrl}
                      alt={category.altText}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </div>
                    <span className="mt-2 text-sm text-primary font-medium group-hover:underline self-start">
                      Shop Now!
                    </span>
                  </div>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </AnimatedSection>
  );
};

export default ShopOurPicksSection;
// ----- End of File: app/components/landing/ShopOurPicksSection.jsx -----