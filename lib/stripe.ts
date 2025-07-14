import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance - only initialize on server
export const stripe = typeof window === 'undefined' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  : null

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable')
      return null
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

// Stripe configuration - only access server env vars on server
export const STRIPE_CONFIG = {
  PRICE_ID: typeof window === 'undefined' ? process.env.STRIPE_PRICE_ID! : '',
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
} 