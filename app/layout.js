import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from './contexts/AuthContext'; 

export const metadata = {
  title: {
    default: "Sathimart Department",
    template: "%s | sathimart Department Store",
  },
  description: "Discover a wide range of products at My Awesome Department Store. Quality, variety, and unbeatable prices on fashion, electronics, home goods, and more.",
  keywords: ["ecommerce", "department store", "online shopping", "fashion", "electronics", "home goods", "best deals","dharan","pathivara","pathivarastore","sathimart","sathi mart","sathi mart department store"],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.pathivarastore.com.np',
    siteName: 'Sathimart Department store',
    title: 'Sathimart Department store',
    description: 'Discover a wide range of products at Sathi Marth Department Store.',
    images: [
      {
        url: '/images/sathimart_logo.png', 
        width: 800,
        height: 600,
        alt: 'Sathimart Department Store Logo',
      },
    ],
  },
  manifest:'/manifest.json'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} scroll-smooth`}>
      <body className="font-sans bg-gray-50 text-gray-800 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}