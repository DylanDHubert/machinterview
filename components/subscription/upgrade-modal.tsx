"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Crown, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getStripe } from '@/lib/stripe'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { user, dbUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!user || !dbUser) {
      setError('Please sign in to upgrade')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Attempting to create checkout session for user:', dbUser.id)
      
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: dbUser.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { name: 'Unlimited interview sessions', included: true },
    { name: 'Priority customer support', included: true },
    { name: 'Advanced interview analytics', included: true },
    { name: 'Custom interview scenarios', included: true },
    { name: 'Export interview transcripts', included: true },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing */}
          <div className="text-center">
            <div className="text-3xl font-bold">$9.99<span className="text-lg font-normal text-muted-foreground">/month</span></div>
            <p className="text-sm text-muted-foreground mt-1">Billed monthly, cancel anytime</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold">What's included:</h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                {feature.included ? (
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                <span className="text-sm">{feature.name}</span>
              </div>
            ))}
          </div>

          {/* Current vs Pro comparison */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
            <div className="text-sm">
              <div className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Current: Free Plan
              </div>
              {/* <div className="text-amber-700 dark:text-amber-300">
                • 2 interview sessions remaining
                • Basic features only
              </div> */}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment processed by Stripe. Cancel anytime from your account settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 