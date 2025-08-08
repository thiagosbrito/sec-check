import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, getPlanPrice, type PlanType } from '@/lib/stripe/client';
import { db } from '@/lib/db/connection';
import { subscriptions, billingHistory, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice); // Same logic as payment_succeeded
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerUpdated(customer);
        break;
      }

      case 'product.updated': {
        const product = event.data.object as Stripe.Product;
        await handleProductUpdated(product);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.subscription) return;

  console.log('Checkout completed for customer:', session.customer, 'subscription:', session.subscription);
  
  try {
    // Retrieve the full subscription object from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Process the subscription the same way as subscription.created
    await handleSubscriptionCreated(subscription);
    
    console.log('Checkout processed successfully');
  } catch (error) {
    console.error('Error processing checkout completion:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  if (!subscription.customer) return;

  console.log('Subscription created:', subscription.id);

  try {
    // Find the user by Stripe customer ID
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, subscription.customer as string))
      .limit(1);

    const priceId = subscription.items.data[0]?.price?.id;
    const plan = getPlanFromPriceId(priceId);
    const billingInterval = subscription.items.data[0]?.price?.recurring?.interval === 'month' ? 'month' : 'year';

    if (existingSubscription.length === 0) {
      console.error('No subscription record found for customer:', subscription.customer);
      return;
    }

    // Update existing subscription record
    const firstItem = subscription.items.data[0];
    await db
      .update(subscriptions)
      .set({
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status as 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid',
        plan,
        billingInterval,
        currentPeriodStart: firstItem?.current_period_start 
          ? new Date(firstItem.current_period_start * 1000) 
          : null,
        currentPeriodEnd: firstItem?.current_period_end 
          ? new Date(firstItem.current_period_end * 1000) 
          : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));

    // Note: Stripe foreign tables are read-only for querying Stripe data
    // All subscription data is properly stored in our local subscriptions table above

    // Update user plan
    await db
      .update(users)
      .set({
        plan,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingSubscription[0].userId));

    console.log('Subscription created successfully for customer:', subscription.customer);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!subscription.customer) return;

  console.log('Subscription updated:', subscription.id);

  try {
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = getPlanFromPriceId(priceId);
    const billingInterval = subscription.items.data[0]?.price?.recurring?.interval === 'month' ? 'month' : 'year';
    
    console.log(`Plan change detected: ${plan} (${billingInterval}) - Price ID: ${priceId}`);

    // Calculate price per month based on plan and interval
    const billingIntervalType = billingInterval === 'month' ? 'monthly' : 'yearly';
    const pricePerMonth = plan !== 'free' ? getPlanPrice(plan as PlanType, billingIntervalType) : 0;
    
    console.log(`Price calculation: ${plan} ${billingIntervalType} = ${pricePerMonth} cents`);

    // Update subscription
    const firstItem = subscription.items.data[0];
    const updatedSubs = await db
      .update(subscriptions)
      .set({
        stripePriceId: priceId,
        status: subscription.status as 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid',
        plan,
        billingInterval,
        pricePerMonth,
        currency: subscription.currency || 'usd',
        currentPeriodStart: firstItem?.current_period_start 
          ? new Date(firstItem.current_period_start * 1000) 
          : null,
        currentPeriodEnd: firstItem?.current_period_end 
          ? new Date(firstItem.current_period_end * 1000) 
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .returning();

    if (updatedSubs.length > 0) {
      // Update user plan
      await db
        .update(users)
        .set({
          plan,
          updatedAt: new Date(),
        })
        .where(eq(users.id, updatedSubs[0].userId));
    }

    console.log('Subscription updated successfully:', subscription.id);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  try {
    // Update subscription status
    const deletedSubs = await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .returning();

    if (deletedSubs.length > 0) {
      // Downgrade user to free plan
      await db
        .update(users)
        .set({
          plan: 'free',
          updatedAt: new Date(),
        })
        .where(eq(users.id, deletedSubs[0].userId));
    }

    console.log('Subscription deleted successfully:', subscription.id);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  console.log('Payment succeeded for invoice:', invoice.id);

  try {
    // Find subscription
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, invoice.customer as string))
      .limit(1);

    if (sub.length === 0) return;

    // Check for duplicate billing history first (prevents invoice.payment_succeeded + invoice.paid duplicates)
    if (!invoice.id) return;
    
    const existingRecord = await db
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.stripeInvoiceId, invoice.id))
      .limit(1);

    if (existingRecord.length > 0) {
      console.log('Billing history already exists for invoice:', invoice.id);
      return;
    }

    // Record billing history
    await db.insert(billingHistory).values({
      userId: sub[0].userId,
      subscriptionId: sub[0].id,
      stripeInvoiceId: invoice.id,
      stripeChargeId: null, // Not available on current Stripe.Invoice type
      stripePaymentIntentId: null, // Not available on current Stripe.Invoice type
      eventType: 'invoice.payment_succeeded',
      status: 'succeeded',
      amount: invoice.amount_paid,
      currency: invoice.currency,
      description: invoice.description || `Payment for ${sub[0].plan} plan`,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      metadata: invoice.metadata,
      processedAt: new Date(),
    });

    console.log('Payment succeeded recorded for user:', sub[0].userId);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;

  console.log('Payment failed for invoice:', invoice.id);

  try {
    // Find subscription
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, invoice.customer as string))
      .limit(1);

    if (sub.length === 0) return;

    // Record billing history
    await db.insert(billingHistory).values({
      userId: sub[0].userId,
      subscriptionId: sub[0].id,
      stripeInvoiceId: invoice.id,
      eventType: 'invoice.payment_failed',
      status: 'failed',
      amount: invoice.amount_due,
      currency: invoice.currency,
      description: invoice.description || `Failed payment for ${sub[0].plan} plan`,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      failureCode: invoice.last_finalization_error?.code,
      failureMessage: invoice.last_finalization_error?.message,
      metadata: invoice.metadata,
      processedAt: new Date(),
    });

    console.log('Payment failed recorded for user:', sub[0].userId);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id);
  // Customer creation is typically handled during checkout/subscription creation
  // This is mainly for logging purposes
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id);
  // Handle customer updates if needed (email changes, etc.)
}

async function handleProductUpdated(product: Stripe.Product) {
  console.log('Product updated:', product.id, 'Name:', product.name);
  // Log product updates - typically no database changes needed
  // Product details are managed in Stripe Dashboard
}

function getPlanFromPriceId(priceId?: string): 'free' | 'developer' | 'team' {
  if (!priceId) return 'free';
  
  // Map price IDs to plan types
  const priceIdToPlan: Record<string, 'developer' | 'team'> = {
    'price_1RtGajL3QQzQQqldqhd0EeIC': 'developer', // monthly
    'price_1RtGocL3QQzQQqldDMmWqRY2': 'developer', // yearly
    'price_1RtGbKL3QQzQQqldSTCokYBA': 'team',      // monthly
    'price_1RtGpNL3QQzQQqld9AuiPSZJ': 'team',      // yearly
  };

  return priceIdToPlan[priceId] || 'free';
}