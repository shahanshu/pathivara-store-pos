// app/layout.js
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css"; // Imports Tailwind base, components, utilities, and any custom global styles

// Default metadata for the entire application.
// This is used if a specific page or nested layout doesn't define its own metadata.
export const metadata = {
  // Provides a default title and a template for how page-specific titles should be formed.
  // Example: If a page has title "Products", it will render as "Products | My Awesome Department Store"
  title: {
    default: "My Awesome Department Store", // Default title if no specific title is set by a page
    template: "%s | My Awesome Department Store", // %s will be replaced by the page's specific title
  },
  description: "Discover a wide range of products at My Awesome Department Store. Quality, variety, and unbeatable prices on fashion, electronics, home goods, and more.",
  keywords: ["ecommerce", "department store", "online shopping", "fashion", "electronics", "home goods", "best deals"],
  // It's good practice to set up Open Graph and Twitter Card defaults here.
  // These can be overridden by specific pages.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.your-actual-domain.com', // **IMPORTANT: Replace with your actual domain**
    siteName: 'My Awesome Department Store',
    title: 'My Awesome Department Store', // Default OG title
    description: 'Discover a wide range of products at My Awesome Department Store.', // Default OG description
    // images: [ // Add a default OG image for sharing if a page doesn't specify one
    //   {
    //     url: 'https://www.your-actual-domain.com/default-og-image.jpg',
    //     width: 1200,
    //     height: 630,
    //     alt: 'My Awesome Department Store',
    //   },
    // ],
  },
  // twitter: { // Basic Twitter card setup
  //   card: 'summary_large_image', // or 'summary'
  //   site: '@yourTwitterHandle', // If you have one
  //   title: 'My Awesome Department Store',
  //   description: 'Discover a wide range of products...',
  //   // images: ['https://www.your-actual-domain.com/default-twitter-image.jpg'],
  // },
  // Add other global metadata like theme-color, viewport (Next.js handles viewport well by default)
  // manifest: '/manifest.json', // If you have a PWA manifest
  // icons: { // Favicon setup
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },
};

export default function RootLayout({ children }) {
  return (
    // The `suppressHydrationWarning` can be useful if you have minor, unavoidable mismatches
    // between server and client rendering for things like timestamps, but use sparingly.
    // Not strictly needed here.
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} scroll-smooth`}>
      <body className="font-sans bg-gray-50 text-gray-800 antialiased">
        {/*
          The `children` prop here will render the content of your `app/page.js`
          (or any other route's page.js/layout.js that matches the current URL).
          If you had a global Navbar/Footer that should appear on EVERY single page,
          you could place them here, outside or inside the main content area.
          e.g.,
          <GlobalHeader />
          <main>{children}</main>
          <GlobalFooter />
          But for now, our Navbar/Footer are specific to the LandingPageClient.
        */}
        {children}
      </body>
    </html>
  );
}