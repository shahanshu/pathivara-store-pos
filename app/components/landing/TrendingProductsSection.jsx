// app/components/landing/TrendingProductsSection.jsx
'use client';
import AnimatedSection from '../AnimatedSection';
import { FiTrendingUp, FiShoppingCart } from 'react-icons/fi'; // Example icons

const trendingProducts = [
  { id: 1, name: 'Modern Abstract Lamp', category: 'Home Decor', price: '$79' },
  { id: 2, name: 'Wireless Ergonomic Mouse', category: 'Electronics', price: '$45' },
  { id: 3, name: 'Organic Cotton Tee', category: 'Apparel', price: '$29' },
  { id: 4, name: 'Smart Fitness Tracker', category: 'Gadgets', price: '$99' },
];

const TrendingProductsSection = () => {
  return (
    <AnimatedSection className="py-16 sm:py-24 bg-gray-100" direction="right">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl inline-flex items-center">
            <FiTrendingUp className="mr-3 h-10 w-10 text-primary" />
            Trending Now
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Check out what's popular among our shoppers this week.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          {trendingProducts.map((product, index) => (
            <div
              key={product.id}
              className="group relative flex flex-col bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 h-48 flex items-center justify-center">
                {/* Placeholder for product image - using category for now */}
                <span className="text-gray-400 text-sm">{product.category}</span>
              </div>
              <div className="mt-4 flex flex-col flex-grow">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    <a href="#" className="hover:underline"> {/* Replace with actual product link later */}
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </a>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="mt-auto pt-4">
                  <p className="text-xl font-bold text-gray-900">{product.price}</p>
                  <button className="mt-3 w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
                    <FiShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default TrendingProductsSection;