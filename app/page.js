import LandingPageClient from './components/landing/LandingPageClient';

export async function generateMetadata() {
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathivarastore.com.np';

  return {
    title: 'Sathimart',
    description: 'The best place to find amazing products online. Explore our curated collections for fashion, electronics, home goods, and more. Shop now for exclusive deals and fast shipping!',
    openGraph: {
      title: 'Sathimart Department Store',
      description: 'Developed By Anshu',
      url: `${siteBaseUrl}/`,
      images: [
        {
     
          url: '/images/sathimart_logo.png', 
          width: 1200,
          height: 630,
          alt: 'Sathimart Department Store Logo',
        },
      ],
    },

    alternates: {
      canonical: `${siteBaseUrl}/`,
    },
  };
}

export default function HomePage() {
  return <LandingPageClient />;
}