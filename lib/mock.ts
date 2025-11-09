import MockAdapter from "axios-mock-adapter"
import { api } from "./api"
import { User, Chat, Message } from "./types"

let started = false

// Mock data
const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Current User",
    email: "user@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
    status: "online",
  },
  {
    id: "user-2",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    status: "online",
  },
  {
    id: "user-3",
    name: "Bob Smith",
    email: "bob@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    status: "offline",
    lastSeen: Date.now() - 3600000,
  },
  {
    id: "user-4",
    name: "Carol White",
    email: "carol@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    status: "online",
  },
  {
    id: "user-5",
    name: "David Brown",
    email: "david@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    status: "offline",
    lastSeen: Date.now() - 7200000,
  },
];

const mockChats: Chat[] = [
  {
    id: "chat-1",
    type: "private",
    name: "Alice Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: {
      id: "msg-1-3",
      chatId: "chat-1",
      senderId: "user-2",
      senderName: "Alice Johnson",
      content: "Sounds great! Talk to you later.",
      timestamp: Date.now() - 300000,
      status: "read",
    },
    unreadCount: 0,
    updatedAt: Date.now() - 300000,
  },
  {
    id: "chat-2",
    type: "private",
    name: "Bob Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    participants: [mockUsers[0], mockUsers[2]],
    lastMessage: {
      id: "msg-2-2",
      chatId: "chat-2",
      senderId: "user-3",
      senderName: "Bob Smith",
      content: "Let me know when you're available",
      timestamp: Date.now() - 3600000,
      status: "delivered",
    },
    unreadCount: 2,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: "chat-3",
    type: "group",
    name: "Project Team",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=project",
    participants: [mockUsers[0], mockUsers[1], mockUsers[3]],
    lastMessage: {
      id: "msg-3-5",
      chatId: "chat-3",
      senderId: "user-4",
      senderName: "Carol White",
      content: "I'll prepare the presentation",
      timestamp: Date.now() - 1800000,
      status: "read",
    },
    unreadCount: 0,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: "chat-4",
    type: "group",
    name: "Design Discussion",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=design",
    participants: [mockUsers[0], mockUsers[2], mockUsers[3], mockUsers[4]],
    lastMessage: {
      id: "msg-4-3",
      chatId: "chat-4",
      senderId: "user-5",
      senderName: "David Brown",
      content: "The mockups look fantastic!",
      timestamp: Date.now() - 7200000,
      status: "read",
    },
    unreadCount: 5,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: "chat-5",
    type: "private",
    name: "Carol White",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    participants: [mockUsers[0], mockUsers[3]],
    lastMessage: {
      id: "msg-5-1",
      chatId: "chat-5",
      senderId: "user-1",
      senderName: "Current User",
      content: "Thanks for the update!",
      timestamp: Date.now() - 86400000,
      status: "read",
    },
    unreadCount: 0,
    updatedAt: Date.now() - 86400000,
  },
];

const mockMessages: Record<string, Message[]> = {
  "chat-1": [
    {
      id: "msg-1-1",
      chatId: "chat-1",
      senderId: "user-1",
      senderName: "Current User",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Hey Alice! How's the project going?",
      timestamp: Date.now() - 900000,
      status: "read",
    },
    {
      id: "msg-1-2",
      chatId: "chat-1",
      senderId: "user-2",
      senderName: "Alice Johnson",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      content: "Hi! It's going well. Just finished the design phase.",
      timestamp: Date.now() - 600000,
      status: "read",
    },
    {
      id: "msg-1-3",
      chatId: "chat-1",
      senderId: "user-2",
      senderName: "Alice Johnson",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      content: "Sounds great! Talk to you later.",
      timestamp: Date.now() - 300000,
      status: "read",
    },
  ],
  "chat-2": [
    {
      id: "msg-2-1",
      chatId: "chat-2",
      senderId: "user-1",
      senderName: "Current User",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Bob, did you review the documents?",
      timestamp: Date.now() - 7200000,
      status: "read",
    },
    {
      id: "msg-2-2",
      chatId: "chat-2",
      senderId: "user-3",
      senderName: "Bob Smith",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      content: "Let me know when you're available",
      timestamp: Date.now() - 3600000,
      status: "delivered",
    },
  ],
  "chat-3": [
    {
      id: "msg-3-1",
      chatId: "chat-3",
      senderId: "user-1",
      senderName: "Current User",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Team, let's schedule a meeting for next week",
      timestamp: Date.now() - 5400000,
      status: "read",
    },
    {
      id: "msg-3-2",
      chatId: "chat-3",
      senderId: "user-2",
      senderName: "Alice Johnson",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      content: "I'm available Monday and Wednesday",
      timestamp: Date.now() - 3600000,
      status: "read",
    },
    {
      id: "msg-3-3",
      chatId: "chat-3",
      senderId: "user-4",
      senderName: "Carol White",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
      content: "Wednesday works for me too",
      timestamp: Date.now() - 2700000,
      status: "read",
    },
    {
      id: "msg-3-4",
      chatId: "chat-3",
      senderId: "user-1",
      senderName: "Current User",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Great! Wednesday at 2 PM then?",
      timestamp: Date.now() - 2400000,
      status: "read",
    },
    {
      id: "msg-3-5",
      chatId: "chat-3",
      senderId: "user-4",
      senderName: "Carol White",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
      content: "I'll prepare the presentation",
      timestamp: Date.now() - 1800000,
      status: "read",
    },
  ],
  "chat-4": [
    {
      id: "msg-4-1",
      chatId: "chat-4",
      senderId: "user-3",
      senderName: "Bob Smith",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      content: "I've updated the design mockups",
      timestamp: Date.now() - 10800000,
      status: "read",
    },
    {
      id: "msg-4-2",
      chatId: "chat-4",
      senderId: "user-4",
      senderName: "Carol White",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
      content: "Let me take a look",
      timestamp: Date.now() - 9000000,
      status: "read",
    },
    {
      id: "msg-4-3",
      chatId: "chat-4",
      senderId: "user-5",
      senderName: "David Brown",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      content: "The mockups look fantastic!",
      timestamp: Date.now() - 7200000,
      status: "read",
    },
  ],
  "chat-5": [
    {
      id: "msg-5-1",
      chatId: "chat-5",
      senderId: "user-1",
      senderName: "Current User",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Thanks for the update!",
      timestamp: Date.now() - 86400000,
      status: "read",
    },
  ],
};

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

  // Get user profile
  mock.onGet("/user/profile").reply(() => {
    return [200, mockUsers[0]]
  })

  // Get chats list
  mock.onGet("/chats").reply(() => {
    return [200, mockChats]
  })

  // Get messages for a specific chat
  mock.onGet(/\/messages\/chat-\d+/).reply((config) => {
    const chatId = config.url?.split("/").pop()
    const messages = chatId ? mockMessages[chatId] || [] : []
    return [200, messages]
  })
}