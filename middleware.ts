import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    console.log(`🔒 Middleware check: ${pathname}, Token: ${token ? 'Present' : 'Missing'}`);

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || (token.role !== 'admin' && token.role !== 'super_admin')) {
        return NextResponse.redirect(new URL('/auth/login?message=admin_required', req.url));
      }
    }

    // Dashboard protection - require active subscription or admin role
    if (pathname.startsWith('/dashboard')) {
      console.log(`🚪 Dashboard access attempted: ${pathname}`);
      
      if (!token) {
        console.log(`❌ No token found, redirecting to login`);
        return NextResponse.redirect(new URL('/auth/login?message=login_required', req.url));
      }

      console.log(`👤 User token:`, { role: token.role, subscriptionStatus: token.subscriptionStatus, subscriptionTier: token.subscriptionTier });

      const isAdmin = token.role === 'admin' || token.role === 'super_admin';
      const hasActiveSubscription = token.subscriptionStatus === 'active' && token.subscriptionTier !== 'none';

      if (!isAdmin && !hasActiveSubscription) {
        console.log(`💳 Insufficient access - Admin: ${isAdmin}, Subscription: ${hasActiveSubscription}`);
        return NextResponse.redirect(new URL('/pricing?message=subscription_required', req.url));
      }
      
      console.log(`✅ Dashboard access granted`);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/features') ||
          pathname.startsWith('/pricing') ||
          pathname.startsWith('/about') ||
          pathname.startsWith('/contact') ||
          pathname.startsWith('/security') ||
          pathname.startsWith('/careers') ||
          pathname.startsWith('/access') ||
          pathname.startsWith('/legacy') ||
          pathname.startsWith('/stratus-engine') ||
          pathname.startsWith('/platform') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/images')
        ) {
          return true;
        }

        // Protected routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};