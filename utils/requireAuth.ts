import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from './auth';
import prisma from '@/lib/prisma';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Middleware to require authentication for API routes
 * @param handler The API handler function
 * @returns A function that processes the authenticated request
 */
export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Get token from authorization header
      const authHeader = request.headers.get('authorization');
      const token = getTokenFromHeader(authHeader);
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify token
      const tokenPayload = verifyToken(token);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: tokenPayload.userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      // Add user data to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: user.id,
        email: user.email,
      };

      // Call the original handler with the authenticated request
      return handler(authenticatedRequest);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
} 