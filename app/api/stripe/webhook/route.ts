import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Helper function to create service role client that bypasses RLS
// Initialize lazily to avoid build-time errors when env vars aren't available
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripeInstance = stripe! // Non-null assertion after null check

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripeInstance.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!stripe) {
    console.error('Stripe not configured in checkout session handler')
    return
  }

  const customerId = session.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted:', customerId)
    return
  }

  const subscription = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  })

  if (subscription.data.length > 0) {
    await updateUserSubscription(customer.metadata.userId, subscription.data[0])
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  if (!stripe) {
    console.error('Stripe not configured in subscription update handler')
    return
  }

  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted:', customerId)
    return
  }

  const userId = customer.metadata.userId
  if (userId) {
    await updateUserSubscription(userId, subscription)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!stripe) {
    console.error('Stripe not configured in subscription deletion handler')
    return
  }

  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted:', customerId)
    return
  }

  const userId = customer.metadata.userId
  if (userId) {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        plan: 'free',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
        subscription_current_period_end: null
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user on subscription deletion:', error)
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!stripe) {
    console.error('Stripe not configured in invoice payment succeeded handler')
    return
  }

  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted:', customerId)
    return
  }

  const userId = customer.metadata.userId
  const invoiceAny = invoice as any
  if (userId && invoiceAny.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoiceAny.subscription as string)
    await updateUserSubscription(userId, subscription)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!stripe) {
    console.error('Stripe not configured in invoice payment failed handler')
    return
  }

  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted:', customerId)
    return
  }

  const userId = customer.metadata.userId
  if (userId) {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        plan: 'free',
        subscription_status: 'unpaid'
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user on payment failure:', error)
    }
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const plan = subscription.status === 'active' ? 'pro' : 'free'
  
  console.log(`Updating user ${userId} to plan: ${plan}, status: ${subscription.status}`)
  
  // Safely convert the timestamp to ISO string
  let periodEndISO = null
  const subscriptionAny = subscription as any
  if (subscriptionAny.current_period_end) {
    try {
      const periodEndTimestamp = subscriptionAny.current_period_end * 1000
      const periodEndDate = new Date(periodEndTimestamp)
      
      // Check if the date is valid
      if (!isNaN(periodEndDate.getTime())) {
        periodEndISO = periodEndDate.toISOString()
      } else {
        console.warn('Invalid current_period_end timestamp:', subscriptionAny.current_period_end)
      }
    } catch (error) {
      console.error('Error converting current_period_end to ISO string:', error)
    }
  }
  
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      plan,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: periodEndISO,
    })
    .eq('id', userId)
    
  if (error) {
    console.error('Error updating user subscription:', error)
  } else {
    console.log(`Successfully updated user ${userId} to ${plan} plan`)
  }
} 