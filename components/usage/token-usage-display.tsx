"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { Crown, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { UpgradeModal } from '@/components/subscription/upgrade-modal'

interface TokenUsageDisplayProps {
  onUpgrade?: () => void
}

export function TokenUsageDisplay({ onUpgrade }: TokenUsageDisplayProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { dbUser, getRemainingInterviews } = useAuth()

  if (!dbUser) return null

  const remainingInterviews = getRemainingInterviews()
  const isPro = dbUser.plan === 'pro'
  const hasUsedSome = dbUser.token_count > 0

  const getStatusColor = () => {
    if (isPro) return 'bg-gradient-to-r from-purple-500 to-purple-600'
    if (remainingInterviews === 0) return 'bg-gradient-to-r from-red-500 to-red-600'
    if (remainingInterviews <= 1) return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    return 'bg-gradient-to-r from-green-500 to-green-600'
  }

  const getStatusIcon = () => {
    if (isPro) return <Crown className="h-4 w-4" />
    if (remainingInterviews === 0) return <AlertTriangle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isPro) return 'Unlimited interviews and features'
    if (remainingInterviews === 0) return 'Free trial used up - upgrade for unlimited access'
    if (remainingInterviews === 1) return 'Almost done with free trial - consider upgrading'
    return 'Enjoying your free trial'
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
                      <Badge 
            variant="outline" 
            className={`${getStatusColor()} text-white border-none`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
          </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Interview Status */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">
              {isPro ? '∞' : remainingInterviews}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isPro ? 'Unlimited interviews' : `interview${remainingInterviews !== 1 ? 's' : ''} remaining`}
            </div>
            {isPro && (
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                🎉 Pro Member
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mb-3">{getStatusText()}</p>
            
            {!isPro && (
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                variant={remainingInterviews <= 1 ? "default" : "outline"}
                size="sm"
                className={`w-full ${
                  remainingInterviews <= 1
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' 
                    : ''
                }`}
              >
                <Crown className="h-4 w-4 mr-2" />
                {remainingInterviews <= 1 ? 'Upgrade Now' : 'Upgrade to Pro'}
              </Button>
            )}

            {isPro && (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Unlimited Access</span>
              </div>
            )}
          </div>

          {/* Feature comparison */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Interview practice</span>
                <span>{isPro ? 'Unlimited' : `${remainingInterviews} left`}</span>
              </div>
              <div className="flex justify-between">
                <span>Resume analysis</span>
                <span>{isPro ? 'Unlimited' : (hasUsedSome ? 'Used' : 'Included')}</span>
              </div>
              <div className="flex justify-between">
                <span>Priority support</span>
                <span>{isPro ? '✓' : '✗'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </>
  )
} 