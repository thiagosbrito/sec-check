import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/stripe/webhooks';

export async function POST(request: NextRequest) {
  try {
    // Process the webhook
    const result = await webhookService.processWebhook(request);

    if (result.success) {
      return NextResponse.json({ received: true });
    } else {
      console.error('Webhook processing failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook endpoint error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}