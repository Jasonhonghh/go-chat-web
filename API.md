# 🔌 Go Chat Web - 前后端 API 接口规范 v1.0

**文档版本**: 1.0  
**最后更新**: 2025-12-12  
**技术栈**: Next.js (前) + Go (后) + WebSocket  
**认证方式**: JWT Token-based  

---

## 📋 目录

1. [基础约定](#基础约定)
2. [认证接口](#认证接口)
3. [用户管理接口](#用户管理接口)
4. [聊天接口](#聊天接口)
5. [消息接口](#消息接口)
6. [群聊管理接口](#群聊管理接口)
7. [文件上传接口](#文件上传接口)
8. [WebSocket 协议](#websocket-协议)
9. [错误处理](#错误处理)
10. [数据类型定义](#数据类型定义)

---

## 基础约定

### 请求头

所有 API 请求必须包含以下请求头：

```
Content-Type: application/json
Authorization: Bearer <jwt_token>  (除登录和注册外的所有请求)
X-Request-ID: <uuid>               (可选，用于链路追踪)
```

### 响应格式

所有 API 响应遵循统一格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 实际数据
  },
  "timestamp": 1702360800
}
```

### 分页参数

支持分页的接口使用以下参数：

```
page: 页码，从 1 开始 (默认: 1)
limit: 每页数量 (默认: 20, 最大: 100)
sort: 排序字段，格式: field:asc 或 field:desc (可选)
```

### 时间格式

所有时间戳使用 Unix timestamp (秒)，前端可选择转为 ISO 8601 格式。

### 环境配置

```env
# .env.local (前端)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_USE_MOCK=false  # 切换到真实后端

# 后端 (Go)
SERVER_ADDR=:8080
DB_URL=postgres://user:password@localhost:5432/chat_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

---

## 认证接口

### 1. 用户注册

**请求**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "avatar_url": "https://example.com/avatar.jpg"  (可选)
}
```

**响应** (201 Created)
```json
{
  "code": 201,
  "message": "User registered successfully",
  "data": {
    "user_id": "usr_123456",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

**错误响应**
```json
{
  "code": 400,
  "message": "Email already exists"
}
```

---

### 2. 用户登录

**请求**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 86400,
    "user": {
      "user_id": "usr_123456",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg",
      "status": "online",
      "created_at": 1702360800
    }
  }
}
```

**错误响应**
```json
{
  "code": 401,
  "message": "Invalid email or password"
}
```

---

### 3. 刷新 Token

**请求**
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Token refreshed",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 86400
  }
}
```

---

### 4. 用户登出

**请求**
```
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Logged out successfully"
}
```

---

## 用户管理接口

### 1. 获取个人档案

**请求**
```
GET /api/users/profile
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_id": "usr_123456",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "status": "online",
    "last_seen": 1702360800,
    "bio": "Hello, I'm John",
    "created_at": 1702360800
  }
}
```

---

### 2. 更新个人档案

**请求**
```
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "bio": "Hello, I'm John Updated"
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Profile updated successfully",
  "data": {
    "user_id": "usr_123456",
    "email": "john@example.com",
    "name": "John Doe Updated",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "bio": "Hello, I'm John Updated"
  }
}
```

---

### 3. 获取用户信息（通过 ID）

**请求**
```
GET /api/users/{user_id}
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_id": "usr_123456",
    "name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "status": "online",
    "last_seen": 1702360800,
    "bio": "Hello, I'm John"
  }
}
```

---

### 4. 搜索用户

**请求**
```
GET /api/users/search?query=john&page=1&limit=20
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": [
      {
        "user_id": "usr_123456",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "status": "online"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

---

### 5. 更新用户状态

**请求**
```
PUT /api/users/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "online"  // online | offline | away | dnd (勿扰)
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Status updated successfully",
  "data": {
    "status": "online",
    "last_seen": 1702360800
  }
}
```

---

## 聊天接口

### 1. 获取聊天列表

**请求**
```
GET /api/chats?page=1&limit=20&sort=updated_at:desc
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "chats": [
      {
        "chat_id": "chat_123456",
        "type": "private",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "participants": [
          {
            "user_id": "usr_123456",
            "name": "John Doe",
            "avatar_url": "https://example.com/avatar.jpg",
            "status": "online"
          }
        ],
        "last_message": {
          "message_id": "msg_123456",
          "content": "Hey, how are you?",
          "sender_id": "usr_123456",
          "created_at": 1702360800
        },
        "unread_count": 2,
        "updated_at": 1702360800,
        "created_at": 1702360000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

### 2. 获取聊天详情

**请求**
```
GET /api/chats/{chat_id}
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "chat_id": "chat_123456",
    "type": "private",
    "name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "participants": [
      {
        "user_id": "usr_123456",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "status": "online"
      }
    ],
    "created_at": 1702360000,
    "updated_at": 1702360800
  }
}
```

---

### 3. 创建私聊

**请求**
```
POST /api/chats/private
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "participant_id": "usr_789012"
}
```

**响应** (201 Created)
```json
{
  "code": 201,
  "message": "Chat created successfully",
  "data": {
    "chat_id": "chat_123456",
    "type": "private",
    "name": "John Doe",
    "participants": [
      {
        "user_id": "usr_123456",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "status": "online"
      }
    ]
  }
}
```

**错误响应**
```json
{
  "code": 409,
  "message": "Chat already exists with this user"
}
```

---

## 消息接口

### 1. 获取聊天历史消息

**请求**
```
GET /api/chats/{chat_id}/messages?page=1&limit=50&sort=created_at:desc
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "messages": [
      {
        "message_id": "msg_123456",
        "chat_id": "chat_123456",
        "sender_id": "usr_123456",
        "sender_name": "John Doe",
        "sender_avatar": "https://example.com/avatar.jpg",
        "content": "Hey, how are you?",
        "type": "text",  // text | image | file | audio | video
        "status": "delivered",  // sending | sent | delivered | read
        "edited_at": null,
        "created_at": 1702360800
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100
    }
  }
}
```

---

### 2. 发送消息

**请求**
```
POST /api/chats/{chat_id}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Hey, how are you?",
  "type": "text",
  "reply_to": "msg_111111"  (可选，用于回复消息)
}
```

**响应** (201 Created)
```json
{
  "code": 201,
  "message": "Message sent successfully",
  "data": {
    "message_id": "msg_123456",
    "chat_id": "chat_123456",
    "sender_id": "usr_123456",
    "sender_name": "John Doe",
    "sender_avatar": "https://example.com/avatar.jpg",
    "content": "Hey, how are you?",
    "type": "text",
    "status": "sent",
    "created_at": 1702360800
  }
}
```

---

### 3. 编辑消息

**请求**
```
PUT /api/messages/{message_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Hey, how are you? (edited)"
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Message updated successfully",
  "data": {
    "message_id": "msg_123456",
    "content": "Hey, how are you? (edited)",
    "edited_at": 1702360900,
    "status": "edited"
  }
}
```

**错误响应**
```json
{
  "code": 403,
  "message": "You can only edit your own messages"
}
```

---

### 4. 删除消息

**请求**
```
DELETE /api/messages/{message_id}
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Message deleted successfully"
}
```

---

### 5. 标记消息已读

**请求**
```
PUT /api/chats/{chat_id}/mark-read
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message_id": "msg_123456"  (可选，为空则标记聊天的所有消息为已读)
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Messages marked as read"
}
```

---

### 6. 搜索消息

**请求**
```
GET /api/chats/{chat_id}/messages/search?query=hello&page=1&limit=20
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "messages": [
      {
        "message_id": "msg_123456",
        "content": "Hello there!",
        "sender_id": "usr_123456",
        "sender_name": "John Doe",
        "created_at": 1702360800
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

## 群聊管理接口

### 1. 创建群聊

**请求**
```
POST /api/groups
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Project Team",
  "description": "Discuss project progress",
  "avatar_url": "https://example.com/group.jpg",
  "member_ids": ["usr_123456", "usr_789012", "usr_345678"]
}
```

**响应** (201 Created)
```json
{
  "code": 201,
  "message": "Group created successfully",
  "data": {
    "group_id": "grp_123456",
    "chat_id": "chat_123456",
    "name": "Project Team",
    "description": "Discuss project progress",
    "avatar_url": "https://example.com/group.jpg",
    "owner_id": "usr_current",
    "members": [
      {
        "user_id": "usr_123456",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "member"  // owner | admin | member
      }
    ],
    "created_at": 1702360800
  }
}
```

---

### 2. 获取群聊信息

**请求**
```
GET /api/groups/{group_id}
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "group_id": "grp_123456",
    "chat_id": "chat_123456",
    "name": "Project Team",
    "description": "Discuss project progress",
    "avatar_url": "https://example.com/group.jpg",
    "owner_id": "usr_current",
    "members": [
      {
        "user_id": "usr_123456",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "member",
        "joined_at": 1702360800
      }
    ],
    "member_count": 3,
    "created_at": 1702360800,
    "updated_at": 1702360800
  }
}
```

---

### 3. 更新群聊信息

**请求**
```
PUT /api/groups/{group_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Project Team Updated",
  "description": "Updated description",
  "avatar_url": "https://example.com/new-group.jpg"
}
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Group updated successfully",
  "data": {
    "group_id": "grp_123456",
    "name": "Project Team Updated",
    "description": "Updated description",
    "avatar_url": "https://example.com/new-group.jpg"
  }
}
```

---

### 4. 添加群成员

**请求**
```
POST /api/groups/{group_id}/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "member_ids": ["usr_111111", "usr_222222"]
}
```

**响应** (201 Created)
```json
{
  "code": 201,
  "message": "Members added successfully",
  "data": {
    "group_id": "grp_123456",
    "added_members": [
      {
        "user_id": "usr_111111",
        "name": "Alice Johnson",
        "avatar_url": "https://example.com/alice.jpg"
      }
    ]
  }
}
```

---

### 5. 移除群成员

**请求**
```
DELETE /api/groups/{group_id}/members/{member_id}
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Member removed successfully"
}
```

---

### 6. 退出群聊

**请求**
```
POST /api/groups/{group_id}/leave
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Left group successfully"
}
```

---

### 7. 删除群聊

**请求**
```
DELETE /api/groups/{group_id}
Authorization: Bearer <access_token>
```

**响应** (200 OK)
```json
{
  "code": 200,
  "message": "Group deleted successfully"
}
```

---

## 文件上传接口

### 1. 上传文件

**请求**
```
POST /api/uploads
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary_file>
purpose: "avatar" | "message" | "group"  (用途)
```

**响应** (201 Created)
```json
{
  "code": 201,
  "message": "File uploaded successfully",
  "data": {
    "file_id": "file_123456",
    "url": "https://cdn.example.com/uploads/file_123456",
    "filename": "avatar.jpg",
    "size": 102400,
    "mime_type": "image/jpeg",
    "created_at": 1702360800
  }
}
```

---

## WebSocket 协议

### 连接

**客户端连接**
```
ws://localhost:8080/ws?token=<jwt_token>
```

**连接成功响应**
```json
{
  "type": "connected",
  "data": {
    "user_id": "usr_123456",
    "timestamp": 1702360800
  }
}
```

---

### 事件：发送消息

**客户端 → 服务器**
```json
{
  "type": "send_message",
  "data": {
    "chat_id": "chat_123456",
    "content": "Hey, how are you?",
    "type": "text"
  }
}
```

**服务器 → 所有聊天参与者**
```json
{
  "type": "new_message",
  "data": {
    "message_id": "msg_123456",
    "chat_id": "chat_123456",
    "sender_id": "usr_123456",
    "sender_name": "John Doe",
    "sender_avatar": "https://example.com/avatar.jpg",
    "content": "Hey, how are you?",
    "type": "text",
    "status": "sent",
    "created_at": 1702360800
  }
}
```

---

### 事件：消息状态更新

**服务器 → 发送者**
```json
{
  "type": "message_status",
  "data": {
    "message_id": "msg_123456",
    "status": "delivered",  // sent | delivered | read
    "timestamp": 1702360800
  }
}
```

---

### 事件：用户状态变化

**客户端 → 服务器**
```json
{
  "type": "user_status",
  "data": {
    "status": "online"  // online | offline | away | dnd
  }
}
```

**服务器 → 其他用户**
```json
{
  "type": "user_status",
  "data": {
    "user_id": "usr_123456",
    "status": "online",
    "last_seen": 1702360800
  }
}
```

---

### 事件：输入状态

**客户端 → 服务器**
```json
{
  "type": "typing_start",
  "data": {
    "chat_id": "chat_123456"
  }
}
```

**服务器 → 其他用户**
```json
{
  "type": "typing_start",
  "data": {
    "chat_id": "chat_123456",
    "user_id": "usr_123456",
    "user_name": "John Doe"
  }
}
```

**客户端 → 服务器**
```json
{
  "type": "typing_stop",
  "data": {
    "chat_id": "chat_123456"
  }
}
```

---

### 事件：消息编辑

**服务器 → 聊天参与者**
```json
{
  "type": "message_edited",
  "data": {
    "message_id": "msg_123456",
    "chat_id": "chat_123456",
    "content": "Hey, how are you? (edited)",
    "edited_at": 1702360900
  }
}
```

---

### 事件：消息删除

**服务器 → 聊天参与者**
```json
{
  "type": "message_deleted",
  "data": {
    "message_id": "msg_123456",
    "chat_id": "chat_123456",
    "deleted_at": 1702360900
  }
}
```

---

## 错误处理

### 错误代码表

| 代码 | 说明 | HTTP Status |
|------|------|-----------|
| 200 | 成功 | 200 OK |
| 201 | 创建成功 | 201 Created |
| 400 | 请求参数错误 | 400 Bad Request |
| 401 | 未认证（Token 无效或过期） | 401 Unauthorized |
| 403 | 禁止访问（无权限） | 403 Forbidden |
| 404 | 资源不存在 | 404 Not Found |
| 409 | 冲突（如邮箱已存在） | 409 Conflict |
| 422 | 验证失败 | 422 Unprocessable Entity |
| 429 | 请求过于频繁 | 429 Too Many Requests |
| 500 | 服务器错误 | 500 Internal Server Error |

### 错误响应示例

```json
{
  "code": 401,
  "message": "Token expired",
  "data": {
    "error": "auth_token_expired",
    "details": "Please refresh your token"
  }
}
```

---

## 数据类型定义

### User (用户)

```typescript
interface User {
  user_id: string;           // 用户 ID
  email: string;             // 邮箱
  name: string;              // 昵称
  avatar_url?: string;       // 头像 URL
  status: 'online' | 'offline' | 'away' | 'dnd';  // 在线状态
  bio?: string;              // 个人简介
  last_seen: number;         // 最后在线时间戳
  created_at: number;        // 创建时间戳
  updated_at: number;        // 更新时间戳
}
```

### Chat (聊天)

```typescript
interface Chat {
  chat_id: string;           // 聊天 ID
  type: 'private' | 'group'; // 聊天类型
  name: string;              // 聊天名称
  avatar_url?: string;       // 头像 URL
  description?: string;      // 描述
  participants: User[];      // 参与者列表
  last_message?: Message;    // 最新消息
  unread_count: number;      // 未读消息计数
  created_at: number;        // 创建时间戳
  updated_at: number;        // 更新时间戳
}
```

### Message (消息)

```typescript
interface Message {
  message_id: string;        // 消息 ID
  chat_id: string;           // 聊天 ID
  sender_id: string;         // 发送者 ID
  sender_name: string;       // 发送者名称
  sender_avatar?: string;    // 发送者头像
  content: string;           // 消息内容
  type: 'text' | 'image' | 'file' | 'audio' | 'video';  // 消息类型
  status: 'sending' | 'sent' | 'delivered' | 'read';    // 消息状态
  reply_to?: string;         // 回复的消息 ID
  edited_at?: number;        // 编辑时间戳
  created_at: number;        // 创建时间戳
}
```

### Group (群聊)

```typescript
interface Group {
  group_id: string;          // 群聊 ID
  chat_id: string;           // 关联的聊天 ID
  name: string;              // 群名称
  description?: string;      // 群描述
  avatar_url?: string;       // 群头像 URL
  owner_id: string;          // 群主 ID
  members: GroupMember[];    // 成员列表
  member_count: number;      // 成员数量
  created_at: number;        // 创建时间戳
  updated_at: number;        // 更新时间戳
}

interface GroupMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';  // 角色
  joined_at: number;
}
```

---

## 集成检查清单

- [ ] 所有端点实现都返回正确的 HTTP 状态码
- [ ] 所有 POST/PUT 端点都验证请求参数
- [ ] 所有受保护端点都验证 JWT Token
- [ ] WebSocket 连接使用 JWT 认证
- [ ] 错误消息清晰，包含足够信息供调试
- [ ] API 速率限制已实现（可选）
- [ ] 敏感信息（密码等）不包含在响应中
- [ ] 所有时间戳都使用 Unix 秒格式
- [ ] 聊天和消息数据支持分页
- [ ] 用户状态实时推送给其他用户

