// utils/withAuth.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export function withAuth(handler) {
  return async (request, context) => {
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('withAuth: Unauthorized - Missing or invalid token format.');
      return NextResponse.json({ success: false, message: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      


      const newContext = { ...context, user: decodedToken };
      return handler(request, newContext);

    } catch (error) {
      console.error('withAuth: Error verifying Firebase ID token:', error.code, error.message);
      let message = 'Unauthorized: Invalid token';
      if (error.code === 'auth/id-token-expired') {
        message = 'Unauthorized: Token expired';
      } else if (error.code === 'auth/argument-error') {
        message = 'Unauthorized: Token verification argument error.';
      }
      return NextResponse.json({ success: false, message }, { status: 401 });
    }
  };
}