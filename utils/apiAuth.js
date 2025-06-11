import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export function withAdminAuth(handler) {
  return async (request, context) => {
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      if (decodedToken.admin !== true) {
        return NextResponse.json({ success: false, message: 'Forbidden: User is not an admin' }, { status: 403 });
      }

      const newContext = { ...context, user: decodedToken };
      
      return handler(request, newContext);

    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
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