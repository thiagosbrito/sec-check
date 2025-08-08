import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { billingService } from '@/lib/stripe/billing';
import { createClient } from '@/lib/supabase/server';

// Request validation schema
const portalRequestSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { returnUrl } = portalRequestSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Default return URL
    const origin = request.nextUrl.origin;
    const defaultReturnUrl = `${origin}/dashboard/billing`;

    // Create Stripe customer portal session
    const portalSession = await billingService.createCustomerPortal({
      userId: user.id,
      returnUrl: returnUrl || defaultReturnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Customer portal creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}