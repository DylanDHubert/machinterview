import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/history'
]

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next()
  
  try {
    // Check if the request is for a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // Only perform auth check for protected routes
    if (isProtectedRoute) {
      // Create a Supabase client configured to use cookies
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name) => {
              const cookie = req.cookies.get(name)
              return cookie?.value
            },
            set: (name, value, options) => {
              // If the cookie is updated, update the cookies for the request and response
              req.cookies.set({
                name,
                value,
                ...options,
              })
              res.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove: (name, options) => {
              req.cookies.set({
                name,
                value: '',
                ...options,
              })
              res.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )
      
      // Check if we have a session
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      // Redirect to login if protected route is accessed without a session
      if (!session) {
        console.log('Protected route accessed without session, redirecting from:', req.nextUrl.pathname)
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      // If we get here, there is a valid session
      console.log('Valid session found for protected route:', req.nextUrl.pathname)
      
      // Set user info in headers
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-user-email', session.user.email || '')
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue the request even if auth check fails
    return res
  }
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all protected routes but exclude static files
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/history/:path*',
  ],
} 