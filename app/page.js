// ----- File: app/page.js -----
'use client'; // Required for useState and client-side interactions

import Image from "next/image";
import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';

export default function Home() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    // This check is important for DX.
    // You could render a more user-friendly message or log this error.
    console.error("Error: NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.");
    return <div className="flex items-center justify-center min-h-screen"><p>Configuration error: Turnstile site key is missing. Check .env.local and ensure it's rebuilt if necessary.</p></div>;
  }

  const handleVerifyCaptcha = async () => {
    if (!turnstileToken) {
      setVerificationStatus("Please complete the CAPTCHA first.");
      return;
    }
    setVerificationStatus("Verifying...");
    try {
      const response = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const data = await response.json();
      if (data.success) {
        setVerificationStatus("CAPTCHA verified successfully!");
        // Proceed with form submission or other action
      } else {
        setVerificationStatus(`CAPTCHA verification failed: ${data['error-codes']?.join(', ') || data.message}`);
      }
    } catch (error) {
      console.error("CAPTCHA verification request failed:", error);
      setVerificationStatus("Failed to verify CAPTCHA. Check console.");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-mono">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-mono font-semibold">
              app/page.js
            </code>
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        {/* Cloudflare Turnstile Integration */}
        <div className="flex flex-col items-center gap-4 w-full sm:w-auto my-8 p-6 border rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">CAPTCHA Challenge</h2>
          <Turnstile
            siteKey={siteKey}
            onSuccess={(token) => {
              setTurnstileToken(token);
              setVerificationStatus("CAPTCHA completed. Click verify.");
            }}
            onError={() => {
              setTurnstileToken("");
              setVerificationStatus("CAPTCHA challenge failed. Please try again.");
            }}
            onExpire={() => {
              setTurnstileToken("");
              setVerificationStatus("CAPTCHA challenge expired. Please complete it again.");
            }}
            options={{
              theme: 'light', // 'light', 'dark', or 'auto'
              // You can add other options here
            }}
          />
          <button
            onClick={handleVerifyCaptcha}
            disabled={!turnstileToken || verificationStatus === "Verifying..."}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {verificationStatus === "Verifying..." ? "Verifying..." : "Verify CAPTCHA"}
          </button>
          {verificationStatus && (
            <p className={`mt-2 text-sm ${verificationStatus.includes("failed") || verificationStatus.includes("Error") ? "text-red-500" : "text-green-500"}`}>
              {verificationStatus}
            </p>
          )}
        </div>
        {/* End Cloudflare Turnstile Integration */}

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org!
        </a>
      </footer>
    </div>
  );
}
// ----- End of File: app/page.js -----