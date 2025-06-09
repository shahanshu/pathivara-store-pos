// app/login/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthContext'; // Corrected path
import Head from 'next/head'; // For Turnstile script

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const turnstileWidgetRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/select-role'); // Redirect if already logged in
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Dynamically load Turnstile script and render widget
    if (typeof window !== 'undefined' && window.turnstile) {
      renderTurnstile();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      window.onloadTurnstileCallback = renderTurnstile;
    }

    return () => {
      // Clean up widget if component unmounts
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current);
      }
      // Clean up callback
      delete window.onloadTurnstileCallback;
    };
  }, []);

  const renderTurnstile = () => {
    if (window.turnstile && document.getElementById('turnstile-widget-container')) {
        turnstileWidgetRef.current = window.turnstile.render('#turnstile-widget-container', {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, // Your site key from .env.local
        callback: function(token) {
          console.log("Turnstile token:", token);
          setTurnstileToken(token);
        },
        'expired-callback': function() {
            console.log("Turnstile token expired");
            setTurnstileToken('');
            if (turnstileWidgetRef.current) {
                window.turnstile.reset(turnstileWidgetRef.current);
            }
        },
        'error-callback': function() {
            console.error("Turnstile error");
            setError('CAPTCHA challenge failed. Please try again.');
        }
      });
    }
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA challenge.');
      setLoading(false);
      // Optionally reset Turnstile if it wasn't completed
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetRef.current);
      }
      return;
    }

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
      router.push('/select-role'); // Redirect to role selection page
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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      {/* Head tag for script loading is not ideal in App Router components,
          but necessary for global callback for Turnstile.
          Alternatively, manage script loading entirely within useEffect. */}
      <Head>
        {/* The script is loaded in useEffect to ensure window object is available */}
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div>
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
            <div id="turnstile-widget-container" className="my-4 flex justify-center"></div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
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