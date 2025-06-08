// app/page.js
// This file is a Server Component by default (no 'use client' directive at the top).

// Import the client-side wrapper component that handles all interactive UI for the landing page.
import LandingPageClient from './components/landing/LandingPageClient';

// For SEO: Define metadata specific to this homepage.
// This asynchronous function runs on the server during the request or at build time.
export async function generateMetadata() {
  // In a real application, you might fetch some data here to dynamically generate metadata.
  // For example:
  // const homePageContent = await fetchHomePageDataFromCMS();
  // const siteConfig = await fetchSiteConfiguration();

  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.your-actual-domain.com'; // Fallback

  return {
    title: 'Welcome to Our Store', // This will be used with the template from layout.js: "Welcome to Our Store | My Awesome Department Store"
    description: 'The best place to find amazing products online. Explore our curated collections for fashion, electronics, home goods, and more. Shop now for exclusive deals and fast shipping!',
    
    // Page-specific Open Graph tags that override or add to the defaults in layout.js
    openGraph: {
      title: 'Welcome to Our Store - My Awesome Department Store', // More specific OG title for this page
      description: 'The best place to find amazing products online. Explore our curated collections for fashion, electronics, home goods, and more.',
      url: `${siteBaseUrl}/`, // Canonical URL for the homepage
      // images: [ // It's good to define a specific, high-quality image for the homepage for sharing
      //   {
      //     url: `${siteBaseUrl}/og-image-home.jpg`, // Example: yourdomain.com/og-image-home.jpg
      //     width: 1200,
      //     height: 630,
      //     alt: 'My Awesome Department Store Homepage - Shop Now!',
      //   },
      // ],
      // type: 'website', // This can often be inherited from layout.js if not changing
    },

    // Page-specific Twitter Card tags
    // twitter: {
    //   card: 'summary_large_image',
    //   title: 'Welcome to Our Store - My Awesome Department Store',
    //   description: 'The best place to find amazing products online.',
    //   // images: [`${siteBaseUrl}/twitter-image-home.jpg`],
    //   // site: '@yourTwitterHandle', // Can be inherited or set specifically
    //   // creator: '@pageSpecificCreatorHandle', // If applicable
    // },

    // Canonical URL for SEO to prevent duplicate content issues
    alternates: {
      canonical: `${siteBaseUrl}/`,
    },
    
    // You can also add structured data (JSON-LD) here for rich snippets in search results
    // See: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
    // For an e-commerce store, 'Organization' and 'WebSite' schema are good starts.
    // Example (very basic):
    // "<script type=\"application/ld+json\">" +
    // JSON.stringify({
    //   "@context": "https://schema.org",
    //   "@type": "WebSite",
    //   "url": `${siteBaseUrl}/`,
    //   "name": "My Awesome Department Store",
    //   "potentialAction": {
    //     "@type": "SearchAction",
    //     "target": `${siteBaseUrl}/search?q={search_term_string}`,
    //     "query-input": "required name=search_term_string"
    //   }
    // }) +
    // "</script>"
    // Note: Injecting scripts directly in metadata might need careful handling.
    // Next.js might have better ways or future APIs for structured data.
    // For now, it's often placed in a <Script> tag in the component or via head manager if needed.
  };
}

// This is the default export for the page component.
// It's a Server Component.
export default function HomePage() {
  // This Server Component's main job here is to render the client-side UI.
  // It could also fetch server-side data and pass it as props to LandingPageClient if needed.
  // For example:
  // const initialTrendingProducts = await fetchTrendingProductsFromServer();
  // return <LandingPageClient initialProducts={initialTrendingProducts} />;

  return <LandingPageClient />;
}