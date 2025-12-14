/**
 * ============================================================================
 * 数据类型定义 v2.0 - Go Chat Web 前端数据模型
 * ============================================================================
 * 本文件定义了所有与后端 API 相关的数据类型和接口
 * 支持完整的聊天功能：认证、用户管理、聊天、消息、群聊、文件上传
 */

// ============================================================================
// 用户类型 (User)
// ============================================================================

/**
 * 用户在线状态
 * - online: 在线
 * - offline: 离线
 * - away: 离开
 * - dnd: 勿扰
 */
export type UserStatus = 'online' | 'offline' | 'away' | 'dnd';

/**
 * 用户数据模型 (UI)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: UserStatus;
  bio?: string;
  lastSeen?: number;
}

/**
 * 用户数据模型 (API)
 */
export interface ApiUser {
  user_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  status: UserStatus;
  bio?: string;
  last_seen?: number;
  created_at?: number;
  updated_at?: number;
}

// ============================================================================
// 聊天类型 (Chat)
// ============================================================================

/**
 * 聊天类型：私聊或群聊
 */
export type ChatType = 'private' | 'group';

/**
 * 聊天数据模型 (UI)
 */
export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar?: string;
  description?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 聊天数据模型 (API)
 */
export interface ApiChat {
  chat_id: string;
  type: ChatType;
  name: string;
  avatar_url?: string;
  description?: string;
  participants: ApiUser[];
  last_message?: ApiMessage;
  unread_count: number;
  created_at?: number;
  updated_at?: number;
}

// ============================================================================
// 消息类型 (Message)
// ============================================================================

/**
 * 消息状态
 * - sending: 发送中
 * - sent: 已发送
 * - delivered: 已送达
 * - read: 已读
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

/**
 * 消息类型：纯文本、图片、文件等
 */
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video';

/**
 * 消息数据模型 (UI)
 */
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyTo?: string;
  editedAt?: number;
  createdAt: number;
}

/**
 * 消息数据模型 (API)
 */
export interface ApiMessage {
  message_id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  reply_to?: string;
  edited_at?: number;
  created_at: number;
}

// ============================================================================
// 群聊相关类型 (Group)
// ============================================================================

/**
 * 群成员角色
 */
export type GroupMemberRole = 'owner' | 'admin' | 'member';

/**
 * 群成员数据模型
 */
export interface GroupMember {
  userId: string;
  name: string;
  avatar?: string;
  role: GroupMemberRole;
  joinedAt?: number;
}

/**
 * 群成员数据模型 (API)
 */
export interface ApiGroupMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  role: GroupMemberRole;
  joined_at?: number;
}

/**
 * 群聊数据模型 (UI)
 */
export interface Group {
  id: string;
  chatId: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  members: GroupMember[];
  memberCount: number;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 群聊数据模型 (API)
 */
export interface ApiGroup {
  group_id: string;
  chat_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  owner_id: string;
  members: ApiGroupMember[];
  member_count: number;
  created_at?: number;
  updated_at?: number;
}

// ============================================================================
// 认证相关类型 (Auth)
// ============================================================================

/**
 * JWT Token 数据
 */
export interface TokenData {
  access_token: string;      // 访问令牌
  refresh_token: string;     // 刷新令牌
  expires_in: number;        // 过期时间（秒）
}

/**
 * 登录响应
 */
export interface ApiLoginResponse extends TokenData {
  user: ApiUser;
}

/**
 * 用户输入类型 (请求)
 */

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

// ============================================================================
// API 响应类型
// ============================================================================

/**
 * 通用 API 响应格式
 */
export interface APIResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp?: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * 聊天列表响应
 */
export interface ApiChatListResponse extends PaginatedResponse<ApiChat> {}

/**
 * 消息列表响应
 */
export interface ApiMessageListResponse extends PaginatedResponse<ApiMessage> {}

/**
 * 用户搜索响应
 */
export interface ApiUserSearchResponse extends PaginatedResponse<ApiUser> {}

// ============================================================================
// 文件上传类型
// ============================================================================

/**
 * 文件上传用途
 */
export type FileUploadPurpose = 'avatar' | 'message' | 'group';

/**
 * 上传的文件信息
 */
export interface UploadedFile {
  file_id: string;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  created_at: number;
}

// ============================================================================
// WebSocket 事件类型
// ============================================================================

/**
 * WebSocket 事件类型枚举
 */
export type WebSocketEventType =
  | 'connected'              // 连接成功
  | 'disconnect'             // 断开连接
  | 'send_message'           // 发送消息
  | 'new_message'            // 新消息到达
  | 'user_status'            // 用户状态变化
  | 'typing_start'           // 开始输入
  | 'typing_stop'            // 停止输入
  | 'message_status'         // 消息状态更新
  | 'message_edited'         // 消息编辑
  | 'message_deleted'        // 消息删除
  | 'error';                 // 错误

/**
 * 连接成功事件
 */
export interface ConnectedEvent {
  type: 'connected';
  data: {
    user_id: string;
    timestamp: number;
  };
}

/**
 * 发送消息事件 (客户端 → 服务器)
 */
export interface SendMessageEvent {
  type: 'send_message';
  data: {
    chat_id: string;
    content: string;
    type?: MessageType;        // 默认: text
    reply_to?: string;         // 可选：回复的消息 ID
    temp_id?: string;
  };
}

/**
 * 新消息事件 (服务器 → 客户端)
 */
export interface NewMessageEvent {
  type: 'new_message';
  data: ApiMessage;
}

/**
 * 用户状态事件
 */
export interface UserStatusEvent {
  type: 'user_status';
  data: {
    user_id: string;
    status: UserStatus;
    last_seen?: number;
  };
}

/**
 * 输入状态事件
 */
export interface TypingEvent {
  type: 'typing_start' | 'typing_stop';
  data: {
    chat_id: string;
    user_id: string;
    user_name: string;
  };
}

/**
 * 消息状态更新事件
 */
export interface MessageStatusEvent {
  type: 'message_status';
  data: {
    message_id: string;
    status: MessageStatus;
    timestamp: number;
  };
}

/**
 * 消息编辑事件
 */
export interface MessageEditedEvent {
  type: 'message_edited';
  data: {
    message_id: string;
    chat_id: string;
    content: string;
    edited_at: number;
  };
}

/**
 * 消息删除事件
 */
export interface MessageDeletedEvent {
  type: 'message_deleted';
  data: {
    message_id: string;
    chat_id: string;
    deleted_at: number;
  };
}

/**
 * 错误事件
 */
export interface ErrorEvent {
  type: 'error';
  data: {
    code: number;
    message: string;
  };
}

/**
 * 所有 WebSocket 事件的联合类型
 */
export type WebSocketEvent =
  | ConnectedEvent
  | SendMessageEvent
  | NewMessageEvent
  | UserStatusEvent
  | TypingEvent
  | MessageStatusEvent
  | MessageEditedEvent
  | MessageDeletedEvent
  | ErrorEvent;
