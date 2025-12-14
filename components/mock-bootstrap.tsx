"use client"

import { useEffect } from "react"

export default function MockBootstrap() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
      import("@/lib/mock").then(({ enableApiMock }) => enableApiMock())
    }
  }, [])
  return null
}