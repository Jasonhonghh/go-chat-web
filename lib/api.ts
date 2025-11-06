// filepath: \workspaces\go-chat-web\lib\api.ts
import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// 在每次请求时自动附加 Authorization: Bearer <token>
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})