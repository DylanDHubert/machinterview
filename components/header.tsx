"use client";

import Link from "next/link";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { useTranslations } from "@/components/translations-context";

export function Header() {
  const { t } = useTranslations()
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
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-gray-500 dark:text-gray-400 italic"
        >
          by Dylan Hubert & Luke Heitman
        </motion.div>
      </div>
    </motion.header>
  );
}
