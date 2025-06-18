// app/login/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthContext'; // Corrected path
import Head from 'next/head'; // For Turnstile script (though script loaded in useEffect)

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // For login process
  const [turnstileToken, setTurnstileToken] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const turnstileWidgetRef = useRef(null);
  const [turnstileReady, setTurnstileReady] = useState(false); // New state

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/select-role'); // Redirect if already logged in
    }
  }, [user, authLoading, router]);

  const renderTurnstile = () => {
    if (typeof window === 'undefined' || !window.turnstile || !document.getElementById('turnstile-widget-container')) {
      return;
    }

    const turnstileDisplaySize = window.innerWidth < 400 ? 'compact' : 'normal';

    if (turnstileWidgetRef.current && window.turnstile) {
      try {
        window.turnstile.remove(turnstileWidgetRef.current);
      } catch (e) {
        console.warn("Error removing existing turnstile widget during re-render:", e);
      }
      turnstileWidgetRef.current = null; 
    }
    
    turnstileWidgetRef.current = window.turnstile.render('#turnstile-widget-container', {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      size: turnstileDisplaySize,
      callback: function(token) {
        // console.log("Turnstile token:", token);
        setTurnstileToken(token);
        setError(''); // Clear CAPTCHA error if user completes it
      },
      'expired-callback': function() {
        console.log("Turnstile token expired");
        setTurnstileToken('');
        // setError('CAPTCHA challenge expired. Please try again.'); // Optional: set error on expiry
        if (turnstileWidgetRef.current && window.turnstile) { // Attempt to reset if expired
            window.turnstile.reset(turnstileWidgetRef.current);
        }
      },
      'error-callback': function() {
        console.error("Turnstile error callback triggered.");
        setError('CAPTCHA challenge failed. Please refresh and try again.');
        setTurnstileToken('');
      }
    });
  };
  
  useEffect(() => {
    const loadAndRenderTurnstile = () => {
      if (typeof window.turnstile !== 'undefined') {
        setTurnstileReady(true); // Mark as ready and trigger render via separate useEffect
        return;
      }

      if (document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile"]')) {
        // Script tag exists, set up callback if not already set or turnstile object not yet available
        if (typeof window.onloadTurnstileCallback !== 'function' && typeof window.turnstile === 'undefined') {
          window.onloadTurnstileCallback = () => {
            setTurnstileReady(true);
          };
        } else if (typeof window.turnstile !== 'undefined') {
          // Script tag exists and turnstile object is available
          setTurnstileReady(true);
        }
        // If callback is already set, it will handle setting turnstileReady
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
      script.async = true;
      script.defer = true;
      
      window.onloadTurnstileCallback = () => {
        setTurnstileReady(true);
      };
      document.head.appendChild(script);
    };

    if (typeof window !== 'undefined') { // Ensure window object is available
        loadAndRenderTurnstile();
    }

    return () => {
      if (turnstileWidgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetRef.current);
        } catch (e) {
          console.warn("Turnstile cleanup error on unmount:", e);
        }
      }
      // Only delete the callback if this instance might have been the one that set it
      // and no other component relies on it. More complex scenarios might need better global state management for this.
      if (typeof window !== 'undefined' && window.onloadTurnstileCallback) {
        // A simple check; might need refinement if multiple Turnstile instances use this global cb
        delete window.onloadTurnstileCallback;
      }
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (turnstileReady) {
      renderTurnstile();
    }
  }, [turnstileReady]); // Re-render when Turnstile script is ready

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA challenge.');
      // Optionally reset Turnstile if it wasn't completed
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetRef.current);
      }
      return;
    }
    setLoading(true);

    try {
      // 1. Verify Turnstile token with your backend
      const captchaResponse = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const captchaData = await captchaResponse.json();

      if (!captchaData.success) {
        setError(`CAPTCHA verification failed: ${captchaData.message || 'Unknown error'}`);
        if (turnstileWidgetRef.current && window.turnstile) window.turnstile.reset(turnstileWidgetRef.current);
        setTurnstileToken('');
        setLoading(false);
        return;
      }

      // 2. If CAPTCHA is valid, proceed with Firebase login
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect is handled by the first useEffect monitoring 'user' state
      // router.push('/select-role'); // This line might be redundant
    } catch (firebaseError) {
      console.error("Firebase login error:", firebaseError);
      setError(firebaseError.message || 'Failed to login. Please check your credentials.');
      // Reset Turnstile on login failure as well
      if (turnstileWidgetRef.current && window.turnstile) window.turnstile.reset(turnstileWidgetRef.current);
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    // Show loading indicator while checking auth state or if user is already logged in (will be redirected)
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      {/* 
        Head tag for script loading is not ideal in App Router components here,
        as we are loading script dynamically in useEffect. 
        If you were to use the Head component for the script, 
        it would look like:
        <Head>
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" async defer></script>
        </Head>
        But we've opted for dynamic loading via useEffect for more control.
      */}
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div>
            <img 
                className="mx-auto h-20 w-auto" // Increased logo size
                src="/images/sathimart_logo.png" 
                alt="Sathimart Department Store" 
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Turnstile Widget Container */}
            <div id="turnstile-widget-container" className="my-4 flex justify-center">
              {/* Turnstile widget will be rendered here */}
              {/* Fallback loading state for Turnstile itself if needed, but usually it's quick */}
              {!turnstileReady && <div className="text-sm text-gray-500">Loading CAPTCHA...</div>}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading || !turnstileToken} // Disable if login in progress or CAPTCHA not completed
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;