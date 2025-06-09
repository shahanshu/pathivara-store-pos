import LandingPageClient from './components/landing/LandingPageClient';

export async function generateMetadata() {
  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.your-actual-domain.com';

  return {
    title: 'Welcome to Our Store',
    description: 'The best place to find amazing products online. Explore our curated collections for fashion, electronics, home goods, and more. Shop now for exclusive deals and fast shipping!',
    openGraph: {
      title: 'Welcome to Our Store - My Awesome Department Store',
      description: 'The best place to find amazing products online. Explore our curated collections for fashion, electronics, home goods, and more.',
      url: `${siteBaseUrl}/`,
    },
    alternates: {
      canonical: `${siteBaseUrl}/`,
    },
  };
}

export default function HomePage() {
  return <LandingPageClient />;
}
