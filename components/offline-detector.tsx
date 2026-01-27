"use client"

import { useState, useEffect } from "react"
import { OfflineScreen } from "./offline-screen"

export function OfflineDetector({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Verifica status inicial
    setIsOffline(!window.navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOffline) {
    return <OfflineScreen />
  }

  return <>{children}</>
}
