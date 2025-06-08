// app/layout.js
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Default metadata for the entire application
export const metadata = {
  title: {
    default: "My Awesome Department Store", // Default title
    template: "%s | My Awesome Department Store", // Title template for child pages
  },
  description: "Discover a wide range of products at My Awesome Department Store. Quality, variety, and unbeatable prices.",
  keywords: ["ecommerce", "department store", "online shopping", "fashion", "electronics", "home goods"],
  // Add other relevant meta tags like open graph, twitter cards later
  // openGraph: {
  //   title: 'My Awesome Department Store',
  //   description: 'Discover a wide range of products...',
  //   type: 'website',
  //   locale: 'en_US',
  //   url: 'https://www.yourstore.com', // Replace with your actual URL
  //   siteName: 'My Awesome Department Store',
  //   // images: [ { url: 'https://www.yourstore.com/og-image.jpg' } ], // Add an OG image URL
  // },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-800 antialiased">
        {/* Navbar and Footer could be part of the layout if they are on ALL pages */}
        {/* For this example, we'll put them in page.js to show component structure */}
        {children}
      </body>
    </html>
  );
}