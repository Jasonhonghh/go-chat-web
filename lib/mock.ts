import MockAdapter from "axios-mock-adapter"
import { axiosInstance } from "./api"
import { ApiUser, ApiChat, ApiMessage, APIResponse, ApiChatListResponse, ApiMessageListResponse } from "./types"

let started = false

// Mock data
const mockUsers: ApiUser[] = [
  {
    user_id: "user-1",
    name: "Current User",
    email: "user@example.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
    status: "online",
    last_seen: Math.floor(Date.now() / 1000),
  },
  {
    user_id: "user-2",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    status: "online",
    last_seen: Math.floor(Date.now() / 1000),
  },
  {
    user_id: "user-3",
    name: "Bob Smith",
    email: "bob@example.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    status: "offline",
    last_seen: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    user_id: "user-4",
    name: "Carol White",
    email: "carol@example.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    status: "online",
    last_seen: Math.floor(Date.now() / 1000),
  },
  {
    user_id: "user-5",
    name: "David Brown",
    email: "david@example.com",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    status: "offline",
    last_seen: Math.floor(Date.now() / 1000) - 7200,
  },
];

const mockChats: ApiChat[] = [
  {
    chat_id: "chat-1",
    type: "private",
    name: "Alice Johnson",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    participants: [mockUsers[0], mockUsers[1]],
    last_message: {
      message_id: "msg-1-3",
      chat_id: "chat-1",
      sender_id: "user-2",
      sender_name: "Alice Johnson",
      content: "Sounds great! Talk to you later.",
      type: "text",
      created_at: Date.now() - 300000,
      status: "read",
    },
    unread_count: 0,
    updated_at: Date.now() - 300000,
  },
  {
    chat_id: "chat-2",
    type: "private",
    name: "Bob Smith",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    participants: [mockUsers[0], mockUsers[2]],
    last_message: {
      message_id: "msg-2-2",
      chat_id: "chat-2",
      sender_id: "user-3",
      sender_name: "Bob Smith",
      content: "Let me know when you're available",
      type: "text",
      created_at: Date.now() - 3600000,
      status: "delivered",
    },
    unread_count: 2,
    updated_at: Date.now() - 3600000,
  },
  {
    chat_id: "chat-3",
    type: "group",
    name: "Project Team",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=project",
    participants: [mockUsers[0], mockUsers[1], mockUsers[3]],
    last_message: {
      message_id: "msg-3-5",
      chat_id: "chat-3",
      sender_id: "user-4",
      sender_name: "Carol White",
      content: "I'll prepare the presentation",
      type: "text",
      created_at: Date.now() - 1800000,
      status: "read",
    },
    unread_count: 0,
    updated_at: Date.now() - 1800000,
  },
];

const mockMessages: Record<string, ApiMessage[]> = {
  "chat-1": [
    {
      message_id: "msg-1-1",
      chat_id: "chat-1",
      sender_id: "user-1",
      sender_name: "Current User",
      sender_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Hey Alice! How's the project going?",
      type: "text",
      created_at: Date.now() - 900000,
      status: "read",
    },
    {
      message_id: "msg-1-2",
      chat_id: "chat-1",
      sender_id: "user-2",
      sender_name: "Alice Johnson",
      sender_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      content: "Hi! It's going well. Just finished the design phase.",
      type: "text",
      created_at: Date.now() - 600000,
      status: "read",
    },
    {
      message_id: "msg-1-3",
      chat_id: "chat-1",
      sender_id: "user-2",
      sender_name: "Alice Johnson",
      sender_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      content: "Sounds great! Talk to you later.",
      type: "text",
      created_at: Date.now() - 300000,
      status: "read",
    },
  ],
  "chat-2": [
    {
      message_id: "msg-2-1",
      chat_id: "chat-2",
      sender_id: "user-1",
      sender_name: "Current User",
      sender_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Bob, did you review the documents?",
      type: "text",
      created_at: Date.now() - 7200000,
      status: "read",
    },
    {
      message_id: "msg-2-2",
      chat_id: "chat-2",
      sender_id: "user-3",
      sender_name: "Bob Smith",
      sender_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      content: "Let me know when you're available",
      type: "text",
      created_at: Date.now() - 3600000,
      status: "delivered",
    },
  ],
  "chat-3": [
    {
      message_id: "msg-3-1",
      chat_id: "chat-3",
      sender_id: "user-1",
      sender_name: "Current User",
      sender_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
      content: "Team, let's schedule a meeting for next week",
      type: "text",
      created_at: Date.now() - 5400000,
      status: "read",
    },
  ],
};

function success<T>(data: T): [number, APIResponse<T>] {
  return [200, {
    code: 0,
    message: "success",
    data,
    timestamp: Date.now(),
  }];
}

export function enableApiMock() {
  if (started) return
  started = true

  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 })

  // Login
  mock.onPost("/auth/login").reply((config) => {
    const { email, password } = JSON.parse(config.data || "{}")

    if (!email || !password) {
      return [400, { code: 400, message: "Email and password are required." }]
    }
    if (password !== "password123") {
      return [401, { code: 401, message: "Invalid credentials" }]
    }

    return success({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
      user: mockUsers[0],
    })
  })

  // Get user profile
  mock.onGet("/users/profile").reply(() => {
    return success(mockUsers[0])
  })

  // Get chats list
  mock.onGet("/chats").reply((config) => {
    const response: ApiChatListResponse = {
      items: mockChats,
      pagination: {
        page: 1,
        limit: 20,
        total: mockChats.length,
      }
    };
    return success(response);
  })

  // Get messages for a specific chat
  // URL pattern: /chats/{chatId}/messages
  mock.onGet(/\/chats\/[\w-]+\/messages/).reply((config) => {
    // Extract chatId from URL
    const match = config.url?.match(/\/chats\/([\w-]+)\/messages/);
    const chatId = match ? match[1] : "";
    const messages = chatId ? mockMessages[chatId] || [] : [];
    
    const response: ApiMessageListResponse = {
      items: messages,
      pagination: {
        page: 1,
        limit: 100,
        total: messages.length,
      }
    };
    return success(response);
  })
  
  // Send message
  mock.onPost(/\/chats\/[\w-]+\/messages/).reply((config) => {
    const match = config.url?.match(/\/chats\/([\w-]+)\/messages/);
    const chatId = match ? match[1] : "";
    const data = JSON.parse(config.data || "{}");
    
    const newMessage: ApiMessage = {
      message_id: `msg-${Date.now()}`,
      chat_id: chatId,
      sender_id: mockUsers[0].user_id,
      sender_name: mockUsers[0].name,
      sender_avatar: mockUsers[0].avatar_url,
      content: data.content,
      type: "text",
      status: "sent",
      created_at: Date.now(),
    };
    
    return success(newMessage);
  });
}