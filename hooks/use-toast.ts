// Simplified wrapper around sonner toast library
import { toast as sonnerToast } from 'sonner'

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export const toast = ({ title, description, variant, duration }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration: duration || 5000,
    })
  }
  
  return sonnerToast(title, {
    description,
    duration: duration || 5000,
  })
} 