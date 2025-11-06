import { api } from "./api"

export async function login(email: string, password: string): Promise<string> {
  const { data } = await api.post("/login", { email, password })
  const token = data?.token as string | undefined
  if (!token) throw new Error("No token in response")
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token)
  }
  return token
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken")
  }
}