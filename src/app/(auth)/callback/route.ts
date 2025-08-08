import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectUrl = searchParams.get('redirectUrl')
  const shouldCheckout = searchParams.get('checkout')
  const selectedPlan = searchParams.get('plan')
  const selectedInterval = searchParams.get('interval')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Build redirect URL based on parameters
      let finalRedirect = `${origin}/dashboard`
      
      if (shouldCheckout && selectedPlan && selectedInterval) {
        // Redirect to billing with checkout parameters
        const params = new URLSearchParams({
          checkout: 'true',
          plan: selectedPlan,
          interval: selectedInterval
        })
        finalRedirect = `${origin}/dashboard/billing?${params.toString()}`
      } else if (redirectUrl) {
        // Redirect to scan page with URL parameter
        finalRedirect = `${origin}/dashboard/scan?url=${encodeURIComponent(redirectUrl)}`
      }
      
      return NextResponse.redirect(finalRedirect)
    } else {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed&message=${encodeURIComponent(error?.message || 'Authentication failed')}`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/sign-in?error=no_auth_code&message=${encodeURIComponent('Missing authentication code')}`)
}