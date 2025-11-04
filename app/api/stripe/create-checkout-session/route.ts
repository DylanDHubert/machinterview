import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

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
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Looking for user with ID:', userId)

    // Get user from database using admin client (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin()
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('Database query result:', { user, userError })

    let finalUser = user

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist in database, create them
      console.log('User not found in database, creating new user record...')
      
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: '', // We'll get this from auth if needed
          plan: 'free',
          token_count: 0
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user record:', insertError)
        return NextResponse.json({ 
          error: `Failed to create user record: ${insertError.message}`,
          details: insertError 
        }, { status: 500 })
      }

      console.log('New user created successfully:', newUser)
      finalUser = newUser
    } else if (userError) {
      console.error('Database error:', userError)
      return NextResponse.json({ 
        error: `Database error: ${userError.message}`,
        details: userError 
      }, { status: 500 })
    }

    if (!finalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = finalUser.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: finalUser.email || `user_${finalUser.id}@example.com`, // Fallback email
        metadata: {
          userId: finalUser.id,
        },
      })
      
      customerId = customer.id

      // Update user with Stripe customer ID
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    console.log('Creating checkout session with config:', {
      customerId,
      priceId: STRIPE_CONFIG.PRICE_ID,
      successUrl: STRIPE_CONFIG.SUCCESS_URL,
      cancelUrl: STRIPE_CONFIG.CANCEL_URL
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: STRIPE_CONFIG.CANCEL_URL,
      metadata: {
        userId: userId,
      },
    })

    console.log('Checkout session created successfully:', session.id)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 