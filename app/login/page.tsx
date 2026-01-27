"use client"

import { Suspense } from "react"
import { AuthContainer } from "./auth-container"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Carregando...</p>
          </div>
        </div>
      }
    >
      <AuthContainer initialMode="login" />
    </Suspense>
  )
}
