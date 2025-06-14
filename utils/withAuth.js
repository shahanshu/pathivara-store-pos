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
      
      // No admin-specific check here. 
      // We just ensure the token is valid and pass the decoded user info.
      // Specific permissions will be handled by the API route logic or Firebase Rules.

      const newContext = { ...context, user: decodedToken };
      // console.log('withAuth: Token verified, user context:', JSON.stringify(decodedToken, null, 2));
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