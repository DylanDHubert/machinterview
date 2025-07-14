"use client";

import Link from "next/link";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { useTranslations } from "@/components/translations-context";
import { useState } from "react";
import { Button } from "./ui/button";
import { RefreshCw, Lock, Unlock, User, LogOut, Crown } from "lucide-react";
import { handleGlobalReset } from "@/lib/reset-utils";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { t } = useTranslations();
  const { 
    user, 
    dbUser, 
    loading, 
    signOut,
    getRemainingInterviews
  } = useAuth()
  const [unlocked, setUnlocked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const handleResetClick = () => {
    if (!unlocked) {
      setUnlocked(true);
      // Auto-lock after 5 seconds of inactivity
      setTimeout(() => setUnlocked(false), 5000);
    } else {
      setUnlocked(false);
      // Call the global reset function
      handleGlobalReset();
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const remainingInterviews = getRemainingInterviews();
  
  // Don't show interview count if user is authenticated but dbUser is still loading
  const showInterviewCount = user && dbUser;
  
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full sticky top-0 z-50 border-b bg-background"
    >
      <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-2">
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center"
        >
          <Link href="/" className="flex gap-3 items-center">
            <motion.h1 
              className="text-lg font-medium tracking-tighter flex gap-1 items-center relative"
            >
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
                Mach Interview
              </span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Badge variant="outline" className="text-normal">
                {t('header.beta')}
              </Badge>
            </motion.div>
          </Link>
        </motion.nav>
        
        <div className="flex items-center gap-4">
                    {/* Plan status for authenticated users */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:flex items-center gap-2"
            >
              {!dbUser ? (
                <Badge variant="outline" className="text-gray-500 border-gray-300">
                  Loading...
                </Badge>
              ) : dbUser.plan === 'pro' ? (
                <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro Plan
                </Badge>
              ) : (
                <Badge variant="outline" className={`${
                  remainingInterviews <= 1 ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'
                }`}>
                  {remainingInterviews <= 1 ? 'Free Trial (Almost Used)' : 'Free Plan'}
                </Badge>
              )}
            </motion.div>
          )}

          {/* Upgrade button for free users */}
          {user && dbUser && dbUser.plan === 'free' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="hidden sm:flex"
            >
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => setShowUpgradeModal(true)}
                className="text-xs px-3 py-1 h-auto bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 text-purple-700 hover:text-purple-800 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
              >
                <Crown className="h-3 w-3 mr-1.5" />
                Upgrade to Pro
              </Button>
            </motion.div>
          )}

          {/* Authentication controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                    <User className="h-3 w-3 mr-1.5" />
                    {user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{dbUser?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs">
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span className="font-medium">{dbUser?.plan === 'pro' ? 'Pro' : 'Free Trial'}</span>
                      </div>
                      {dbUser?.plan !== 'pro' && (
                        <div className="flex justify-between mt-1">
                          <span>Interviews:</span>
                          <span className="font-medium">
                            {!dbUser ? 'Loading...' : `${remainingInterviews} left`}
                          </span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {dbUser?.plan === 'free' && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => setShowUpgradeModal(true)}
                        className="text-xs"
                      >
                        <Crown className="h-3 w-3 mr-2" />
                        Upgrade to Pro
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    disabled={isSigningOut}
                    className="text-xs"
                  >
                    <LogOut className="h-3 w-3 mr-2" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
                className="text-xs px-2 py-1 h-auto"
              >
                <User className="h-3 w-3 mr-1.5" />
                Sign In
              </Button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetClick}
              className={`text-xs px-2 py-1 h-auto transition-colors duration-300 ${
                unlocked 
                  ? "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400" 
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span className="mr-1.5">
                {unlocked ? (
                  <Unlock className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </span>
              <span>
                {unlocked ? "Confirm Reset" : "Reset Interview"}
              </span>
              {unlocked && (
                <span className="ml-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin-slow" />
                </span>
              )}
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-gray-500 dark:text-gray-400 italic hidden md:block"
          >
            by Dylan Hubert & Luke Heitman
          </motion.div>
        </div>

        {/* Auth Modal */}
        <AuthModal 
          open={showAuthModal} 
          onOpenChange={setShowAuthModal} 
        />

        {/* Upgrade Modal */}
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal} 
        />
      </div>
    </motion.header>
  );
}
