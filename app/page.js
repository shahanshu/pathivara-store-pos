// app/page.js
// This file is now a Server Component by default (no 'use client' directive)

import LandingPageClient from './components/landing/LandingPageClient';

// For SEO: Define metadata for this specific page
// This function runs on the server.
export async function generateMetadata() {
  // You could fetch data here if needed for dynamic metadata
  // const pageData = await fetchSomeDataForHomePage();

  return {
    title: 'Welcome to Our Store - My Awesome Department Store', // Specific title for the homepage
    description: 'The best place to find amazing products online. Explore our collections for fashion, electronics, home goods, and more. Shop now for exclusive deals!',
    // You can add more specific Open Graph or Twitter card metadata here
    openGraph: {
      title: 'Welcome to Our Store - My Awesome Department Store',
      description: 'The best place to find amazing products online. Explore our collections today!',
      url: 'https://www.yourstore.com', // Replace with your actual domain
      // images: [
      //   {
      //     url: 'https://www.yourstore.com/og-home.jpg', // URL of a specific OG image for home
      //     width: 1200,
      //     height: 630,
      //     alt: 'My Awesome Department Store Homepage',
      //   },
      // ],
    },
    // twitter: {
    //   card: 'summary_large_image',
    //   title: 'Welcome to Our Store - My Awesome Department Store',
    //   description: 'The best place to find amazing products online.',
    //   // images: ['https://www.yourstore.com/twitter-home.jpg'], // URL of a specific Twitter image
    // },
    // You can also add canonical URLs, etc.
    //alternates: {
    //  canonical: 'https://www.yourstore.com/',
    //},
  };
}

export default function HomePage() {
  // This component is now a Server Component.
  // It can perform server-side operations if needed (e.g., fetching initial data to pass to client components)
  // For this landing page, we're just rendering the client wrapper.
  return <LandingPageClient />;
}