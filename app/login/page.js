// app/login/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthContext';
import Head from 'next/head';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const turnstileWidgetRef = useRef(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/select-role');
    }
  }, [user, authLoading, router]);

  const renderTurnstile = () => {
    if (typeof window === 'undefined' || !window.turnstile || !document.getElementById('turnstile-widget-container')) {
      return;
    }

    const isMobile = window.innerWidth < 768; // Changed to 768px breakpoint for better mobile detection
    const turnstileSize = isMobile ? 'compact' : 'normal';

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
      size: turnstileSize,
      callback: function(token) {
        setTurnstileToken(token);
        setError('');
      },
      'expired-callback': function() {
        setTurnstileToken('');
        if (turnstileWidgetRef.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetRef.current);
        }
      },
      'error-callback': function() {
        setError('CAPTCHA challenge failed. Please refresh and try again.');
        setTurnstileToken('');
      }
    });
  };
  
  useEffect(() => {
    const loadAndRenderTurnstile = () => {
      if (typeof window.turnstile !== 'undefined') {
        setTurnstileReady(true);
        return;
      }

      if (document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile"]')) {
        if (typeof window.onloadTurnstileCallback !== 'function' && typeof window.turnstile === 'undefined') {
          window.onloadTurnstileCallback = () => {
            setTurnstileReady(true);
          };
        } else if (typeof window.turnstile !== 'undefined') {
          setTurnstileReady(true);
        }
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

    if (typeof window !== 'undefined') {
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
      if (typeof window !== 'undefined' && window.onloadTurnstileCallback) {
        delete window.onloadTurnstileCallback;
      }
    };
  }, []);

  useEffect(() => {
    if (turnstileReady) {
      renderTurnstile();
    }
  }, [turnstileReady]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA challenge.');
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetRef.current);
      }
      return;
    }
    setLoading(true);

    try {
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
    } catch (firebaseError) {
      setError(firebaseError.message || 'Failed to login. Please check your credentials.');
      if (turnstileWidgetRef.current && window.turnstile) window.turnstile.reset(turnstileWidgetRef.current);
      setTurnstileToken('');
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

            {/* Turnstile Widget Container with responsive styling */}
            <div 
              id="turnstile-widget-container" 
              className="my-6 flex justify-center"
              style={{
                minHeight: '65px', // Ensures consistent height for both compact and normal modes
                width: '100%'
              }}
            >
              {!turnstileReady && (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-500">Loading security check...</span>
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