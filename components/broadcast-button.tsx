import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/components/translations-context";
import { Mic, RadioTower } from "lucide-react";
import { motion } from "framer-motion";

interface BroadcastButtonProps {
  isSessionActive: boolean
  onClick: () => void
}

export function BroadcastButton({ isSessionActive, onClick }: BroadcastButtonProps) {
  const { t } = useTranslations();
  
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        className={`w-full py-3 font-medium flex items-center justify-center gap-2 rounded-lg shadow-sm transition-all duration-300 ${
          isSessionActive 
            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 dark:border-red-800/50" 
            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800/50"
        }`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          {isSessionActive ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <RadioTower className="h-5 w-5" />
                <motion.div 
                  className="absolute -inset-1 rounded-full bg-red-200 dark:bg-red-700/30 -z-10"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0.3, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span className="text-sm">
                {t('broadcast.end')}
              </span>
              <Badge 
                variant="outline" 
                className="ml-1 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800/50 py-0 px-2 h-5"
              >
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                {t('broadcast.live')}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              <span className="text-sm">
                {t('broadcast.start')}
              </span>
            </div>
          )}
        </div>
      </Button>
    </motion.div>
  )
} 