import MockAdapter from "axios-mock-adapter"
import { api } from "./api"

let started = false

export function enableApiMock() {
  if (started) return
  started = true

  const mock = new MockAdapter(api, { delayResponse: 500 })

  // 拦截 POST {BASE_URL}/login
  mock.onPost("/login").reply((config) => {
    const { email, password } = JSON.parse(config.data || "{}")

    if (!email || !password) {
      return [400, { message: "Email and password are required." }]
    }
    // 简单规则：密码不为 password123 则失败
    if (password !== "password123") {
      return [401, { message: "Invalid credentials" }]
    }

    // 返回模拟 token
    return [200, { token: "mock-token-123" }]
  })
}