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

export default clerkMiddleware(async (auth, req) => {
  // Skip API routes completely - they handle their own authentication if needed
  if (req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Only protect matching routes
  if (protectedRoute(req)) {
    // Use protect() which will automatically redirect if not authenticated
    // This will throw if user is not authenticated, which Clerk handles internally
    await auth().protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Also skip API routes from middleware entirely
    '/((?!_next|api|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
