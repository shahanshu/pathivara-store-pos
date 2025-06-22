'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthContext';


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const turnstileWidgetRef = useRef(null); // Stores the ID of the rendered widget
  const turnstileContainerRef = useRef(null); // Ref for the container div
  const [turnstileReady, setTurnstileReady] = useState(false); // Is the Turnstile script loaded?

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/select-role');
    }
  }, [user, authLoading, router]);

  const renderTurnstile = useCallback(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      console.error("Turnstile: Site key is missing! Ensure NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.");
      setError("CAPTCHA configuration error. Please contact support.");
      return;
    }

    if (typeof window === 'undefined' || !window.turnstile || !turnstileContainerRef.current) {
      console.log("Turnstile: Render conditions not met", {
        hasWindow: typeof window !== 'undefined',
        hasTurnstile: !!window?.turnstile,
        hasContainer: !!turnstileContainerRef.current,
        isScriptReady: turnstileReady,
      });
      return;
    }

    // Remove existing widget if any
    if (turnstileWidgetRef.current && window.turnstile && typeof window.turnstile.remove === 'function') {
      try {
        console.log("Turnstile: Removing existing widget:", turnstileWidgetRef.current);
        window.turnstile.remove(turnstileWidgetRef.current);
      } catch (e) {
        console.warn("Turnstile: Error removing existing widget (might be benign if already removed):", e);
      }
      turnstileWidgetRef.current = null;
    }

    const isMobile = window.innerWidth < 768;
    const turnstileSize = isMobile ? 'compact' : 'normal';
    console.log(`Turnstile: Attempting to render. isMobile: ${isMobile}, size: ${turnstileSize}, window.innerWidth: ${window.innerWidth}`);

    try {
      turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: siteKey,
        size: turnstileSize,
        callback: function(token) {
          console.log("Turnstile: Token received:", token);
          setTurnstileToken(token);
          setError('');
        },
        'expired-callback': function() {
          console.log("Turnstile: Token expired");
          setTurnstileToken('');
          // Optionally, auto-reset the widget or prompt user
          if (turnstileWidgetRef.current && window.turnstile && typeof window.turnstile.reset === 'function') {
            window.turnstile.reset(turnstileWidgetRef.current);
          }
        },
        'error-callback': function() {
          console.error("Turnstile: Error callback triggered from widget");
          setError('CAPTCHA challenge failed. Please try again.');
          setTurnstileToken('');
        }
      });
      console.log("Turnstile: Widget rendered successfully with ID:", turnstileWidgetRef.current);
    } catch (renderError) {
      console.error("Turnstile: Error during window.turnstile.render call:", renderError);
      setError('Failed to render CAPTCHA. Please refresh the page.');
    }
  }, [setError, setTurnstileToken, turnstileReady]); // turnstileReady ensures it re-evaluates if script becomes ready later but initial check failed

  // Effect to load the Turnstile script
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("Turnstile: Site key is missing! Cannot load script.");
      setError("CAPTCHA configuration error. Please contact support.");
      setTurnstileReady(false); // Explicitly set to false
      return;
    }

    if (typeof window.turnstile !== 'undefined') {
      console.log("Turnstile: Script already loaded.");
      setTurnstileReady(true);
      return;
    }

    if (document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile"]')) {
      console.log("Turnstile: Script tag already exists, awaiting load or already loaded.");
      // If script tag exists, but turnstile is not yet on window, rely on the global callback or check if it's loaded
      if (typeof window.onloadTurnstileCallback !== 'function' && typeof window.turnstile === 'undefined') {
          window.onloadTurnstileCallback = () => {
          console.log("Turnstile: onloadTurnstileCallback triggered (script tag was pre-existing).");
          setTurnstileReady(true);
        };
      } else if (typeof window.turnstile !== 'undefined') { // It might have loaded between the querySelector and this check
          setTurnstileReady(true);
      }
      return;
    }
    
    console.log("Turnstile: Loading script...");
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
    script.async = true;
    script.defer = true;
    
    window.onloadTurnstileCallback = () => {
      console.log("Turnstile: onloadTurnstileCallback triggered (new script).");
      setTurnstileReady(true);
    };
    
    document.head.appendChild(script);

    return () => {
      console.log("Turnstile: Cleanup script loader effect.");
      // Clean up widget if component unmounts
      if (turnstileWidgetRef.current && window.turnstile && typeof window.turnstile.remove === 'function') {
        try {
          window.turnstile.remove(turnstileWidgetRef.current);
        } catch (e) {
          console.warn("Turnstile cleanup error on unmount (widget removal):", e);
        }
        turnstileWidgetRef.current = null;
      }
      // Clean up the global callback to prevent memory leaks if component unmounts before script loads
      if (typeof window !== 'undefined' && window.onloadTurnstileCallback) {
        delete window.onloadTurnstileCallback;
        console.log("Turnstile: Deleted global onloadTurnstileCallback.");
      }
    };
  }, [setError]); // Added setError as a dependency because it's used in the site key check

  // Effect to render Turnstile once script is ready and container is available
  useEffect(() => {
    if (turnstileReady && turnstileContainerRef.current) {
      console.log("Turnstile: Script ready and container available. Calling renderTurnstile.");
      renderTurnstile();
    } else {
      console.log("Turnstile: Conditions for initial render not met.", { turnstileReady, hasContainer: !!turnstileContainerRef.current });
    }
  }, [turnstileReady, renderTurnstile]); // renderTurnstile is memoized

  // Effect to handle window resize and re-render Turnstile if necessary
  useEffect(() => {
    const handleResize = () => {
      // Only act if script is ready and container exists
      if (turnstileReady && turnstileContainerRef.current) {
        console.log("Turnstile: Window resized. Re-evaluating and re-rendering Turnstile.");
        renderTurnstile(); // This will determine new size and re-render
      }
    };

    window.addEventListener('resize', handleResize);
    console.log("Turnstile: Added resize listener.");

    return () => {
      window.removeEventListener('resize', handleResize);
      console.log("Turnstile: Removed resize listener.");
    };
  }, [turnstileReady, renderTurnstile]); // renderTurnstile is memoized

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA challenge.');
      // Optionally reset the widget if user tries to submit without token
      if (turnstileWidgetRef.current && window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset(turnstileWidgetRef.current);
      }
      return;
    }
    setLoading(true);

    try {
      console.log("Turnstile: Verifying token server-side:", turnstileToken);
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

      await signInWithEmailAndPassword(auth, email, password);
      // On successful login, AuthContext will update `user`, leading to redirect via the first useEffect
    } catch (firebaseError) {
      console.error("Login error:", firebaseError);
      setError(firebaseError.message || 'Failed to login. Please check your credentials.');
      if (turnstileWidgetRef.current && window.turnstile) window.turnstile.reset(turnstileWidgetRef.current);
      setTurnstileToken(''); // Reset token on error
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* <Head><title>Login</title></Head> */} {/* Example if you need page-specific head tags */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
          <div className="text-center">
            <img 
              className="mx-auto h-24 w-auto" 
              src="/images/sathimart_logo.png" 
              alt="Sathimart Department Store" 
            />
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {/* ... Email and Password inputs ... */}
             <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>


            {/* Turnstile Widget Container */}
            <div 
              id="turnstile-widget-container" 
              ref={turnstileContainerRef}
              className="my-6 flex justify-center items-center" // Added items-center
              style={{
                minHeight: '120px', // Accommodate compact widget (130w x 120h)
                width: '100%'      // Ensure it takes full available width for centering
              }}
            >
              {/* Placeholder while script is loading or if widget fails to render initially */}
              {(!turnstileReady || (turnstileReady && !turnstileWidgetRef.current && !error.includes("CAPTCHA"))) && (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg p-3 text-center">
                  <span className="text-sm text-gray-500">Loading security challenge...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 ${
                  loading || !turnstileToken ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {/* ... Loading spinner SVG ... */}
                 {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;