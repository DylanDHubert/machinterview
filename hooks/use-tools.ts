"use client"

import { useTranslations } from "@/components/translations-context"

export const useToolsFunctions = () => {
  const { t } = useTranslations();

  const timeFunction = () => {
    const now = new Date()
    return {
      success: true,
      time: now.toLocaleTimeString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      message: "The current time is " + now.toLocaleTimeString() + " in " + Intl.DateTimeFormat().resolvedOptions().timeZone + " timezone."
    }
  }

  return {
    timeFunction
  }
}