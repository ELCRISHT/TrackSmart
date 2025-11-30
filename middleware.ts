import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const protectedRoute = createRouteMatcher([
  '/',
  '/upcoming',
  '/meeting(.*)',
  '/previous',
  '/recordings',
  '/personal-room',
]);

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

export default clerkMiddleware(async (auth, req) => {
  // Skip API routes completely - they handle their own authentication if needed
  if (req.nextUrl.pathname.startsWith('/api')) {
    return;
  }

  // If Clerk is not configured, skip protection (allows deployment without env vars)
  if (!isClerkConfigured()) {
    // In development, you might want to log a warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('Clerk environment variables not set. Skipping authentication.');
    }
    return;
  }

  // Only protect matching routes
  if (protectedRoute(req)) {
    try {
      await auth().protect();
    } catch (error) {
      // Log error but don't break the request
      console.error('Clerk protection error:', error);
      // Return a response to prevent middleware from hanging
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Also skip API routes from middleware entirely
    '/((?!_next|api|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
