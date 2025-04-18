import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";

interface PauseButtonProps {
  isPaused: boolean
  onClick: () => void
  disabled?: boolean
}

export function PauseButton({ isPaused, onClick, disabled = false }: PauseButtonProps) {
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        disabled={disabled}
        className={`w-full py-4 font-medium flex items-center justify-center gap-2 rounded-lg shadow-md transition-all duration-300 hover:translate-y-[-2px] ${
          isPaused 
            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/50 hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20" 
            : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800/50 hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20"
        }`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          {isPaused ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Play className="h-5 w-5" />
                <motion.div 
                  className="absolute -inset-1.5 rounded-full bg-amber-200 dark:bg-amber-700/30 -z-10"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 0.3, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span className="font-medium">
                Resume Interview
              </span>
              <Badge 
                variant="outline" 
                className="ml-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800/50 py-0 px-2 h-5"
              >
                PAUSED
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Pause className="h-5 w-5" />
                <motion.div 
                  className="absolute -inset-1.5 rounded-full bg-blue-200 dark:bg-blue-700/30 -z-10 opacity-70"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 0.3, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span className="font-medium">
                Pause Interview
              </span>
            </div>
          )}
        </div>
      </Button>
    </motion.div>
  )
} 