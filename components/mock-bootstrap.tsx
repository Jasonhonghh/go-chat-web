"use client"

import { useEffect } from "react"

export default function MockBootstrap() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_API_MOCK === "1") {
      import("@/lib/mock").then(({ enableApiMock }) => enableApiMock())
    }
  }, [])
  return null
}