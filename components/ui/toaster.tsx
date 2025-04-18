"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "border-border bg-background text-foreground",
        duration: 5000,
        style: {
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
        },
      }}
    />
  )
}
