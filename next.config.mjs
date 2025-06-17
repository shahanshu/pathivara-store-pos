/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Allow ALL origins (replace * with specific domains if needed)
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

// Import the PWA plugin
import withPWA from 'next-pwa';

// PWA configuration
const pwaConfig = withPWA({
  dest: "public", // Destination directory for the PWA files
  register: true, // Register the PWA service worker
  skipWaiting: true, // Skip waiting for service worker to activate
  disable: process.env.NODE_ENV === "development", // Disable in development
  // runtimeCaching, // You can add runtime caching strategies here if needed
});

export default pwaConfig(nextConfig);
