// File: app/api/verify-turnstile/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { token } = await request.json();
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!token) {
    return NextResponse.json({ success: false, message: 'CAPTCHA token not provided.' }, { status: 400 });
  }
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not set. Please check your .env.local file.');
    return NextResponse.json({ success: false, message: 'Server configuration error.' }, { status: 500 });
  }

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);

  // Optional: include the user's IP address
  // Recommended by Cloudflare for better security.
  const ip = request.ip || request.headers.get('x-forwarded-for');
  if (ip) {
    formData.append('remoteip', ip);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      // Token is valid
      return NextResponse.json({ success: true, message: 'CAPTCHA verified successfully.' });
    } else {
      // Token is invalid
      console.log('Turnstile verification failed:', data);
      return NextResponse.json({ 
        success: false, 
        message: 'CAPTCHA verification failed.', 
        'error-codes': data['error-codes'] || ['unknown-error'] 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return NextResponse.json({ success: false, message: 'Error verifying CAPTCHA token.' }, { status: 500 });
  }
}