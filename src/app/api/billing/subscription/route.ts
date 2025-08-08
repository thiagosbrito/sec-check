import { NextRequest, NextResponse } from 'next/server';
import { billingService } from '@/lib/stripe/billing';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/connection';
import { planFeatures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await billingService.getUserSubscription(user.id);

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        plan: 'free',
        features: null,
      });
    }

    // Get plan features
    const features = await db
      .select()
      .from(planFeatures)
      .where(eq(planFeatures.plan, subscription.plan as 'developer' | 'team' | 'free'))
      .limit(1);

    return NextResponse.json({
      subscription: subscription.subscription,
      plan: subscription.plan,
      features: features[0] || subscription.features,
      stripeData: subscription.stripeData || null,
    });

  } catch (error) {
    console.error('Subscription fetch error:', error);

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

// Handle subscription cancellation
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Cancel subscription at period end
    await billingService.cancelSubscription(user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);

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

// Handle subscription resumption
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Resume subscription
    await billingService.resumeSubscription(user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription resumed successfully',
    });

  } catch (error) {
    console.error('Subscription resumption error:', error);

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