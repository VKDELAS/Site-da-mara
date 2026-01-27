"use client"

import { Suspense } from "react"
import { Header } from "./header"

interface HeaderProps {
  variant?: "default" | "simple"
}

function HeaderFallback({ variant = "default" }: HeaderProps) {
  if (variant === "simple") {
    return (
      <header className="w-full bg-white border-b py-6 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </header>
    )
  }
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white py-4 sm:py-6">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  )
}

export function HeaderWrapper(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback {...props} />}>
      <Header {...props} />
    </Suspense>
  )
}
