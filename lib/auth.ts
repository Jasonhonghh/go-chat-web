import { api } from "./api"

export async function login(email: string, password: string): Promise<string> {
  const response = await api.auth.login({ email, password })
  const token = response.access_token
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token)
    localStorage.setItem("refreshToken", response.refresh_token)
  }
  return token
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken")
  }
  return null
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
  }
}