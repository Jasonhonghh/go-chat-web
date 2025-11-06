"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.replace("/") // 未登录则回首页(登录页)
      return
    }
    setAllowed(true)
  }, [router])

  if (!allowed) return null // 或者返回一个加载骨架
  return <>{children}</>
}