import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { billingService } from '@/lib/stripe/billing';
import { createClient } from '@/lib/supabase/server';

// Request validation schema
const checkoutRequestSchema = z.object({
  plan: z.enum(['developer', 'team']),
  interval: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { plan, interval, successUrl, cancelUrl } = checkoutRequestSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Default URLs
    const origin = request.nextUrl.origin;
    const defaultSuccessUrl = `${origin}/dashboard/billing?success=true`;
    const defaultCancelUrl = `${origin}/pricing?canceled=true`;

    // Create Stripe checkout session
    const session = await billingService.createCheckoutSession({
      userId: user.id,
      plan,
      interval,
      userEmail: user.email,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);

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