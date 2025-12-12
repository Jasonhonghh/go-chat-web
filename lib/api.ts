/**
 * ============================================================================
 * API 客户端 v2.0 - 所有后端 API 接口的 TypeScript 封装
 * ============================================================================
 * 本文件提供类型安全的 API 调用方法，支持认证、用户、聊天、消息、群聊、文件上传等功能
 * 
 * 使用示例：
 * ```typescript
 * // 登录
 * const response = await api.auth.login({ email: 'user@example.com', password: '123456' })
 * 
 * // 获取聊天列表
 * const chats = await api.chat.getChats({ page: 1, limit: 20 })
 * 
 * // 发送消息
 * const message = await api.message.sendMessage('chat_123', { content: 'Hello' })
 * 
 * // 创建群聊
 * const group = await api.group.createGroup({ name: 'Team', member_ids: [...] })
 * ```
 */

import axios, { AxiosInstance } from 'axios';
import {
  User,
  Chat,
  Message,
  Group,
  GroupMember,
  TokenData,
  LoginResponse,
  APIResponse,
  PaginatedResponse,
  ChatListResponse,
  MessageListResponse,
  UserSearchResponse,
  UploadedFile,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  UpdateUserStatusRequest,
} from './types';

// ============================================================================
// API 客户端初始化
// ============================================================================

/**
 * 创建 Axios 实例
 * - 自动添加 Authorization 请求头
 * - 处理 Token 过期和刷新
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 请求拦截器：自动附加 JWT Token
 */
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * 响应拦截器：处理 Token 过期和错误
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // 如果是 401 错误且还没有重试过
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;

      try {
        // 尝试刷新 Token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, expires_in } = response.data.data;
          localStorage.setItem('authToken', access_token);

          // 重新发送原始请求
          config.headers.Authorization = `Bearer ${access_token}`;
          return axiosInstance(config);
        }
      } catch (refreshError) {
        // 刷新失败，清除 Token 并重定向到登录
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API 方法分组
// ============================================================================

/**
 * 认证 API
 */
const authAPI = {
  /**
   * 用户注册
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await axiosInstance.post<APIResponse<User>>('/auth/register', data);
    return response.data.data!;
  },

  /**
   * 用户登录
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<APIResponse<LoginResponse>>('/auth/login', data);
    const loginData = response.data.data!;

    // 保存 Token
    localStorage.setItem('authToken', loginData.access_token);
    localStorage.setItem('refreshToken', loginData.refresh_token);

    return loginData;
  },

  /**
   * 刷新 Token
   */
  refreshToken: async (refreshToken: string): Promise<TokenData> => {
    const response = await axiosInstance.post<APIResponse<TokenData>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data.data!;
  },

  /**
   * 用户登出
   */
  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },
};

/**
 * 用户 API
 */
const userAPI = {
  /**
   * 获取当前用户档案
   */
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<APIResponse<User>>('/users/profile');
    return response.data.data!;
  },

  /**
   * 更新当前用户档案
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await axiosInstance.put<APIResponse<User>>('/users/profile', data);
    return response.data.data!;
  },

  /**
   * 获取指定用户信息
   */
  getUser: async (userId: string): Promise<User> => {
    const response = await axiosInstance.get<APIResponse<User>>(`/users/${userId}`);
    return response.data.data!;
  },

  /**
   * 搜索用户
   */
  searchUsers: async (query: string, page: number = 1, limit: number = 20): Promise<UserSearchResponse> => {
    const response = await axiosInstance.get<APIResponse<UserSearchResponse>>('/users/search', {
      params: { query, page, limit },
    });
    return response.data.data!;
  },

  /**
   * 更新用户在线状态
   */
  updateStatus: async (data: UpdateUserStatusRequest): Promise<{ status: string; last_seen: number }> => {
    const response = await axiosInstance.put<APIResponse<{ status: string; last_seen: number }>>(
      '/users/status',
      data
    );
    return response.data.data!;
  },
};

/**
 * 聊天 API
 */
const chatAPI = {
  /**
   * 获取聊天列表
   */
  getChats: async (params?: { page?: number; limit?: number; sort?: string }): Promise<ChatListResponse> => {
    const response = await axiosInstance.get<APIResponse<ChatListResponse>>('/chats', { params });
    return response.data.data!;
  },

  /**
   * 获取聊天详情
   */
  getChat: async (chatId: string): Promise<Chat> => {
    const response = await axiosInstance.get<APIResponse<Chat>>(`/chats/${chatId}`);
    return response.data.data!;
  },

  /**
   * 创建私聊
   */
  createPrivateChat: async (participantId: string): Promise<Chat> => {
    const response = await axiosInstance.post<APIResponse<Chat>>('/chats/private', {
      participant_id: participantId,
    });
    return response.data.data!;
  },

  /**
   * 标记聊天消息为已读
   */
  markAsRead: async (chatId: string, messageId?: string): Promise<void> => {
    await axiosInstance.put(`/chats/${chatId}/mark-read`, {
      message_id: messageId,
    });
  },
};

/**
 * 消息 API
 */
const messageAPI = {
  /**
   * 获取聊天历史消息
   */
  getMessages: async (
    chatId: string,
    params?: { page?: number; limit?: number; sort?: string }
  ): Promise<MessageListResponse> => {
    const response = await axiosInstance.get<APIResponse<MessageListResponse>>(
      `/chats/${chatId}/messages`,
      { params }
    );
    return response.data.data!;
  },

  /**
   * 发送消息
   */
  sendMessage: async (
    chatId: string,
    data: { content: string; type?: string; reply_to?: string }
  ): Promise<Message> => {
    const response = await axiosInstance.post<APIResponse<Message>>(
      `/chats/${chatId}/messages`,
      data
    );
    return response.data.data!;
  },

  /**
   * 编辑消息
   */
  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await axiosInstance.put<APIResponse<Message>>(
      `/messages/${messageId}`,
      { content }
    );
    return response.data.data!;
  },

  /**
   * 删除消息
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    await axiosInstance.delete(`/messages/${messageId}`);
  },

  /**
   * 搜索消息
   */
  searchMessages: async (
    chatId: string,
    query: string,
    params?: { page?: number; limit?: number }
  ): Promise<MessageListResponse> => {
    const response = await axiosInstance.get<APIResponse<MessageListResponse>>(
      `/chats/${chatId}/messages/search`,
      { params: { query, ...params } }
    );
    return response.data.data!;
  },
};

/**
 * 群聊 API
 */
const groupAPI = {
  /**
   * 创建群聊
   */
  createGroup: async (data: {
    name: string;
    description?: string;
    avatar_url?: string;
    member_ids: string[];
  }): Promise<Group> => {
    const response = await axiosInstance.post<APIResponse<Group>>('/groups', data);
    return response.data.data!;
  },

  /**
   * 获取群聊详情
   */
  getGroup: async (groupId: string): Promise<Group> => {
    const response = await axiosInstance.get<APIResponse<Group>>(`/groups/${groupId}`);
    return response.data.data!;
  },

  /**
   * 更新群聊信息
   */
  updateGroup: async (
    groupId: string,
    data: { name?: string; description?: string; avatar_url?: string }
  ): Promise<Group> => {
    const response = await axiosInstance.put<APIResponse<Group>>(`/groups/${groupId}`, data);
    return response.data.data!;
  },

  /**
   * 添加群成员
   */
  addMembers: async (groupId: string, memberIds: string[]): Promise<{ group_id: string; added_members: GroupMember[] }> => {
    const response = await axiosInstance.post<
      APIResponse<{ group_id: string; added_members: GroupMember[] }>
    >(`/groups/${groupId}/members`, { member_ids: memberIds });
    return response.data.data!;
  },

  /**
   * 移除群成员
   */
  removeMember: async (groupId: string, memberId: string): Promise<void> => {
    await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
  },

  /**
   * 退出群聊
   */
  leaveGroup: async (groupId: string): Promise<void> => {
    await axiosInstance.post(`/groups/${groupId}/leave`);
  },

  /**
   * 删除群聊
   */
  deleteGroup: async (groupId: string): Promise<void> => {
    await axiosInstance.delete(`/groups/${groupId}`);
  },
};

/**
 * 文件上传 API
 */
const fileAPI = {
  /**
   * 上传文件
   */
  uploadFile: async (file: File, purpose: 'avatar' | 'message' | 'group'): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    const response = await axiosInstance.post<APIResponse<UploadedFile>>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },

  /**
   * 删除文件
   */
  deleteFile: async (fileId: string): Promise<void> => {
    await axiosInstance.delete(`/files/${fileId}`);
  },
};

// ============================================================================
// 导出 API 对象
// ============================================================================

/**
 * 完整的 API 客户端
 * 
 * 使用示例：
 * ```typescript
 * // 导入
 * import { api } from '@/lib/api'
 * 
 * // 认证
 * const user = await api.auth.login({ email: 'user@example.com', password: '123456' })
 * 
 * // 用户
 * const profile = await api.user.getProfile()
 * 
 * // 聊天
 * const chats = await api.chat.getChats()
 * 
 * // 消息
 * const messages = await api.message.getMessages('chat_123')
 * const newMsg = await api.message.sendMessage('chat_123', { content: 'Hi' })
 * 
 * // 群聊
 * const group = await api.group.createGroup({ name: 'Team', member_ids: [...] })
 * 
 * // 文件
 * const file = await api.file.uploadFile(fileInput, 'avatar')
 * ```
 */
export const api = {
  auth: authAPI,
  user: userAPI,
  chat: chatAPI,
  message: messageAPI,
  group: groupAPI,
  file: fileAPI,
};

/**
 * 导出原始 axios 实例（高级用途）
 */
export { axiosInstance };