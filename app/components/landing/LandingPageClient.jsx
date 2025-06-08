// app/components/landing/LandingPageClient.jsx
'use client'; // This component and its children (Navbar, Hero, etc.) are client-side

import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import CallToActionSection from './CallToActionSection';
import Footer from './Footer';
// If you use Turnstile and it needs client-side state
// import { Turnstile } from '@marsidev/react-turnstile';
// import { useState } from 'react';

export default function LandingPageClient() {
  // ---- For Turnstile (Optional, uncomment if you want to include it) ----
  // const [turnstileToken, setTurnstileToken] = useState("");
  // const [verificationStatus, setVerificationStatus] = useState("");
  // const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  // const handleVerifyCaptcha = async () => { /* ... your verification logic ... */ };
  // if (process.env.NODE_ENV === 'development' && !siteKey) {
  //   console.warn("Turnstile site key not found. CAPTCHA will not render.");
  // }
  // ---- End Turnstile ----

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        {/* ---- Example of Turnstile integration (Optional) ---- */}
        {/* {siteKey && (
          <section className="py-12 bg-gray-100">
            <div className="container mx-auto px-4 max-w-md text-center">
              <h2 className="text-2xl font-semibold mb-4">Security Check</h2>
              <Turnstile
                siteKey={siteKey}
                onSuccess={setTurnstileToken}
                options={{ theme: 'light' }}
              />
              <button
                onClick={handleVerifyCaptcha}
                disabled={!turnstileToken}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
              >
                Verify Action
              </button>
              {verificationStatus && <p className="mt-2">{verificationStatus}</p>}
            </div>
          </section>
        )} */}
        {/* ---- End Turnstile Example ---- */}
        <CallToActionSection />
      </main>
      <Footer />
    </>
  );
}