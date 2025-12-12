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
 * 用户数据模型
 */
export interface User {
  user_id: string;           // 用户 ID
  email: string;             // 邮箱
  name: string;              // 昵称
  avatar_url?: string;       // 头像 URL
  status: UserStatus;        // 在线状态
  bio?: string;              // 个人简介
  last_seen?: number;        // 最后在线时间戳
  created_at?: number;       // 创建时间戳
  updated_at?: number;       // 更新时间戳
}

// ============================================================================
// 聊天类型 (Chat)
// ============================================================================

/**
 * 聊天类型：私聊或群聊
 */
export type ChatType = 'private' | 'group';

/**
 * 聊天数据模型
 */
export interface Chat {
  chat_id: string;           // 聊天 ID
  type: ChatType;            // 聊天类型
  name: string;              // 聊天名称
  avatar_url?: string;       // 头像 URL
  description?: string;      // 描述（仅群聊）
  participants: User[];      // 参与者列表
  last_message?: Message;    // 最新消息
  unread_count: number;      // 未读消息计数
  created_at?: number;       // 创建时间戳
  updated_at?: number;       // 更新时间戳
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
 * 消息数据模型
 */
export interface Message {
  message_id: string;        // 消息 ID
  chat_id: string;           // 聊天 ID
  sender_id: string;         // 发送者 ID
  sender_name: string;       // 发送者名称
  sender_avatar?: string;    // 发送者头像
  content: string;           // 消息内容
  type: MessageType;         // 消息类型
  status: MessageStatus;     // 消息状态
  reply_to?: string;         // 回复的消息 ID（用于线程化消息）
  edited_at?: number;        // 编辑时间戳
  created_at: number;        // 创建时间戳
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
  user_id: string;
  name: string;
  avatar_url?: string;
  role: GroupMemberRole;
  joined_at?: number;
}

/**
 * 群聊数据模型
 */
export interface Group {
  group_id: string;          // 群聊 ID
  chat_id: string;           // 关联的聊天 ID
  name: string;              // 群名称
  description?: string;      // 群描述
  avatar_url?: string;       // 群头像 URL
  owner_id: string;          // 群主 ID
  members: GroupMember[];    // 成员列表
  member_count: number;      // 成员数量
  created_at?: number;       // 创建时间戳
  updated_at?: number;       // 更新时间戳
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
export interface LoginResponse extends TokenData {
  user: User;
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
export interface ChatListResponse extends PaginatedResponse<Chat> {}

/**
 * 消息列表响应
 */
export interface MessageListResponse extends PaginatedResponse<Message> {}

/**
 * 用户搜索响应
 */
export interface UserSearchResponse extends PaginatedResponse<User> {}

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
  };
}

/**
 * 新消息事件 (服务器 → 客户端)
 */
export interface NewMessageEvent {
  type: 'new_message';
  data: Message;
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
