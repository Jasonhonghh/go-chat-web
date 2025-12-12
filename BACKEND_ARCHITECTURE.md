# 🚀 Go Chat Backend - 项目架构与实现指南 v1.0

**目标**: 实现一个高性能、可扩展的聊天服务后端（Go）  
**技术栈**: Go 1.21+ | Gin Framework | PostgreSQL | Redis | Gorilla WebSocket  

---

## 目录

1. [项目结构](#项目结构)
2. [技术选型说明](#技术选型说明)
3. [数据库设计](#数据库设计)
4. [服务架构](#服务架构)
5. [实现模块清单](#实现模块清单)
6. [部署配置](#部署配置)

---

## 项目结构

```
go-chat-backend/
├── cmd/
│   └── main.go                 # 应用入口
├── config/
│   └── config.go              # 配置管理
├── internal/
│   ├── models/                # 数据模型
│   │   ├── user.go
│   │   ├── chat.go
│   │   ├── message.go
│   │   ├── group.go
│   │   └── types.go
│   ├── handlers/              # HTTP 处理器
│   │   ├── auth.go
│   │   ├── user.go
│   │   ├── chat.go
│   │   ├── message.go
│   │   ├── group.go
│   │   └── file.go
│   ├── services/              # 业务逻辑层
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── chat_service.go
│   │   ├── message_service.go
│   │   └── group_service.go
│   ├── repositories/          # 数据访问层
│   │   ├── user_repo.go
│   │   ├── chat_repo.go
│   │   ├── message_repo.go
│   │   └── group_repo.go
│   ├── websocket/             # WebSocket 管理
│   │   ├── hub.go             # WebSocket 消息中心
│   │   ├── client.go          # WebSocket 客户端连接
│   │   └── handlers.go        # WebSocket 事件处理
│   ├── middleware/            # 中间件
│   │   ├── auth.go            # JWT 认证中间件
│   │   ├── error.go           # 错误处理
│   │   └── cors.go            # CORS 中间件
│   ├── utils/                 # 工具函数
│   │   ├── jwt.go             # JWT 管理
│   │   ├── password.go        # 密码加密
│   │   ├── response.go        # 响应格式化
│   │   ├── validator.go       # 数据验证
│   │   └── logger.go          # 日志管理
│   ├── database/              # 数据库初始化
│   │   ├── db.go
│   │   ├── migrations/        # 数据库迁移
│   │   └── seed.go            # 测试数据生成
│   └── cache/                 # Redis 缓存
│       ├── cache.go
│       └── user_cache.go
├── migrations/                # 数据库迁移文件
├── go.mod                     # Go 模块定义
├── go.sum                     # 依赖版本锁定
├── .env                       # 环境变量
├── .env.example               # 环境变量示例
├── docker-compose.yml         # Docker 容器编排
├── Dockerfile                 # Docker 镜像定义
└── README.md                  # 项目文档
```

---

## 技术选型说明

### Web 框架: Gin

**为什么选择 Gin?**
- 性能卓越（HTTP 路由性能最快）
- 简洁的 API 设计
- 内置中间件系统
- 官方支持和活跃社区
- 完美的错误处理

**关键依赖**:
```go
import "github.com/gin-gonic/gin"
```

---

### 数据库: PostgreSQL

**为什么选择 PostgreSQL?**
- 支持 JSONB 类型（灵活存储）
- 完整的事务支持（ACID）
- 高效的全文搜索
- 可靠的复制和高可用性
- 成熟的 Go 驱动程序

**Go 驱动**:
```go
import "github.com/lib/pq"
import "gorm.io/driver/postgres"
import "gorm.io/gorm"
```

---

### ORM: GORM

**为什么选择 GORM?**
- 提供简洁的 Go 对象关系映射
- 自动迁移支持
- 钩子和生命周期管理
- 性能优化（查询缓存、预加载）
- 支持复杂查询

**示例**:
```go
import "gorm.io/gorm"

// 创建
user := &User{Email: "john@example.com", Name: "John"}
db.Create(user)

// 查询
var user User
db.First(&user, "email = ?", "john@example.com")

// 更新
db.Model(&user).Update("name", "John Updated")

// 删除
db.Delete(&user)
```

---

### 缓存: Redis

**为什么选择 Redis?**
- 超高速缓存（内存访问）
- 支持过期时间（TTL）
- 支持发布/订阅（用于 WebSocket 分布式）
- 支持列表、集合等数据结构
- 可用于会话存储和速率限制

**Go 驱动**:
```go
import "github.com/redis/go-redis/v9"
```

---

### WebSocket: Gorilla WebSocket

**为什么选择 Gorilla WebSocket?**
- 简洁高效的 WebSocket 实现
- 支持 RFC 6455 标准
- 性能优化的读写
- 广泛使用的库，文档齐全

**Go 驱动**:
```go
import "github.com/gorilla/websocket"
```

---

## 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'offline',  -- online, offline, away, dnd
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_status ON users(status);
```

### 聊天表 (chats)

```sql
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,  -- private, group
  name VARCHAR(255),
  avatar_url TEXT,
  description TEXT,
  created_by VARCHAR(50),     -- 创建人 ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_chat_id ON chats(chat_id);
CREATE INDEX idx_chats_type ON chats(type);
```

### 聊天参与者表 (chat_participants)

```sql
CREATE TABLE chat_participants (
  id SERIAL PRIMARY KEY,
  chat_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
  UNIQUE(chat_id, user_id)
);

CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
```

### 消息表 (messages)

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(50) UNIQUE NOT NULL,
  chat_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(50) NOT NULL,
  sender_name VARCHAR(255),
  sender_avatar TEXT,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',  -- text, image, file, etc
  status VARCHAR(20) DEFAULT 'sent',  -- sending, sent, delivered, read
  reply_to VARCHAR(50),  -- 回复的消息 ID
  edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id)
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);
```

### 群聊表 (groups)

```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(50) UNIQUE NOT NULL,
  chat_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id VARCHAR(50) NOT NULL,
  member_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

CREATE INDEX idx_groups_group_id ON groups(group_id);
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
```

### 群成员表 (group_members)

```sql
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',  -- owner, admin, member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

### 刷新令牌表 (refresh_tokens)

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user_id (user_id)
);
```

### 文件表 (files)

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  file_id VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50),
  filename VARCHAR(255),
  mime_type VARCHAR(100),
  size BIGINT,
  url TEXT NOT NULL,
  purpose VARCHAR(50),  -- avatar, message, group
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_files_file_id ON files(file_id);
CREATE INDEX idx_files_user_id ON files(user_id);
```

---

## 服务架构

### 分层设计

```
┌─────────────────────────────────────┐
│         HTTP Clients                │
│    (Web、Mobile、Desktop)           │
└────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│      Gin HTTP Router & Handlers      │
│   (API 端点、请求处理)               │
└─────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│      Middleware Layer                │
│   (认证、日志、错误处理)             │
└─────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│      Services Layer                  │
│   (业务逻辑、验证、事务)             │
└─────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│      Repository Layer                │
│   (数据访问、查询构建)               │
└─────────────────┬────────────────────┘
                 │
┌─────────────────▼────────────────────┐
│      Database & Cache                │
│   (PostgreSQL、Redis)                │
└─────────────────────────────────────┘
```

### WebSocket 消息流

```
┌──────────────┐                    ┌──────────────┐
│   Client 1   │                    │   Client 2   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ send_message                      │
       │──────────────┐                    │
       │              │                    │
       │     ┌────────▼────────┐           │
       │     │   WebSocket     │           │
       │     │      Hub        │           │
       │     │  (broadcast)    │           │
       │     └────────┬────────┘           │
       │              │                    │
       │ new_message  │  new_message       │
       │◄─────────────┴──────────────►     │
```

### 缓存策略

**用户缓存 (Redis Key: `user:{user_id}`)**:
```
- 字段: user_id, email, name, avatar_url, status, last_seen
- TTL: 3600 秒 (1 小时)
- 更新: 用户状态变化时更新
```

**聊天列表缓存 (Redis Key: `chat_list:{user_id}`)**:
```
- 存储: 用户的所有聊天 ID 列表
- TTL: 1800 秒 (30 分钟)
- 更新: 创建新聊天或消息到达时清除
```

**消息队列 (Redis List: `message_queue:{chat_id}`)**:
```
- 存储: 最近 100 条消息 ID
- TTL: 永久
- 用途: 快速获取最新消息
```

---

## 实现模块清单

### 模块 1: 认证系统 (auth)

**文件**:
- `internal/handlers/auth.go` - HTTP 处理器
- `internal/services/auth_service.go` - 业务逻辑
- `internal/utils/jwt.go` - JWT 管理

**功能**:
- ✅ 注册 (POST /api/auth/register)
- ✅ 登录 (POST /api/auth/login)
- ✅ 刷新 Token (POST /api/auth/refresh)
- ✅ 登出 (POST /api/auth/logout)

**核心代码示例**:

```go
// cmd/main.go - 启动 HTTP 服务器
package main

import (
  "github.com/gin-gonic/gin"
  "your-module/internal/handlers"
  "your-module/internal/middleware"
  "your-module/internal/database"
)

func main() {
  // 初始化数据库
  db := database.Init()
  defer db.Close()

  // 创建 Gin 路由
  r := gin.Default()

  // 应用中间件
  r.Use(middleware.CORSMiddleware())
  r.Use(middleware.LoggerMiddleware())

  // 认证路由（无需 Token）
  authHandler := handlers.NewAuthHandler(db)
  r.POST("/api/auth/register", authHandler.Register)
  r.POST("/api/auth/login", authHandler.Login)
  r.POST("/api/auth/refresh", authHandler.Refresh)

  // 保护的路由
  protected := r.Group("/api")
  protected.Use(middleware.AuthMiddleware())
  {
    protected.POST("/auth/logout", authHandler.Logout)
  }

  // 启动服务器
  r.Run(":8080")
}
```

```go
// internal/handlers/auth.go - 认证处理器
package handlers

import (
  "github.com/gin-gonic/gin"
  "your-module/internal/models"
  "your-module/internal/services"
  "your-module/internal/utils"
)

type AuthHandler struct {
  authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
  return &AuthHandler{authService: authService}
}

// 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
  var req struct {
    Name      string `json:"name" binding:"required"`
    Email     string `json:"email" binding:"required,email"`
    Password  string `json:"password" binding:"required,min=6"`
    AvatarURL string `json:"avatar_url"`
  }

  if err := c.ShouldBindJSON(&req); err != nil {
    utils.ErrorResponse(c, 400, "Invalid request", nil)
    return
  }

  user, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Password, req.AvatarURL)
  if err != nil {
    utils.ErrorResponse(c, 400, err.Error(), nil)
    return
  }

  utils.SuccessResponse(c, 201, "User registered successfully", gin.H{
    "user_id":    user.UserID,
    "email":      user.Email,
    "name":       user.Name,
    "avatar_url": user.AvatarURL,
  })
}

// 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
  var req struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
  }

  if err := c.ShouldBindJSON(&req); err != nil {
    utils.ErrorResponse(c, 400, "Invalid request", nil)
    return
  }

  token, user, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
  if err != nil {
    utils.ErrorResponse(c, 401, "Invalid email or password", nil)
    return
  }

  utils.SuccessResponse(c, 200, "Login successful", gin.H{
    "access_token":  token.AccessToken,
    "refresh_token": token.RefreshToken,
    "expires_in":    token.ExpiresIn,
    "user": gin.H{
      "user_id":    user.UserID,
      "email":      user.Email,
      "name":       user.Name,
      "avatar_url": user.AvatarURL,
      "status":     user.Status,
      "created_at": user.CreatedAt,
    },
  })
}
```

---

### 模块 2: 用户管理 (user)

**文件**:
- `internal/handlers/user.go`
- `internal/services/user_service.go`
- `internal/repositories/user_repo.go`

**功能**:
- ✅ 获取个人档案 (GET /api/users/profile)
- ✅ 更新档案 (PUT /api/users/profile)
- ✅ 获取用户信息 (GET /api/users/{user_id})
- ✅ 搜索用户 (GET /api/users/search)
- ✅ 更新用户状态 (PUT /api/users/status)

---

### 模块 3: 聊天管理 (chat)

**文件**:
- `internal/handlers/chat.go`
- `internal/services/chat_service.go`
- `internal/repositories/chat_repo.go`

**功能**:
- ✅ 获取聊天列表 (GET /api/chats)
- ✅ 获取聊天详情 (GET /api/chats/{chat_id})
- ✅ 创建私聊 (POST /api/chats/private)
- ✅ 标记已读 (PUT /api/chats/{chat_id}/mark-read)

---

### 模块 4: 消息管理 (message)

**文件**:
- `internal/handlers/message.go`
- `internal/services/message_service.go`
- `internal/repositories/message_repo.go`

**功能**:
- ✅ 获取历史消息 (GET /api/chats/{chat_id}/messages)
- ✅ 发送消息 (POST /api/chats/{chat_id}/messages)
- ✅ 编辑消息 (PUT /api/messages/{message_id})
- ✅ 删除消息 (DELETE /api/messages/{message_id})
- ✅ 搜索消息 (GET /api/chats/{chat_id}/messages/search)

---

### 模块 5: 群聊管理 (group)

**文件**:
- `internal/handlers/group.go`
- `internal/services/group_service.go`
- `internal/repositories/group_repo.go`

**功能**:
- ✅ 创建群聊 (POST /api/groups)
- ✅ 获取群聊信息 (GET /api/groups/{group_id})
- ✅ 更新群聊 (PUT /api/groups/{group_id})
- ✅ 添加成员 (POST /api/groups/{group_id}/members)
- ✅ 移除成员 (DELETE /api/groups/{group_id}/members/{member_id})
- ✅ 退出群聊 (POST /api/groups/{group_id}/leave)
- ✅ 删除群聊 (DELETE /api/groups/{group_id})

---

### 模块 6: WebSocket 管理 (websocket)

**文件**:
- `internal/websocket/hub.go` - 消息中心
- `internal/websocket/client.go` - 客户端连接
- `internal/websocket/handlers.go` - 事件处理

**功能**:
- ✅ WebSocket 连接管理
- ✅ 消息广播 (new_message)
- ✅ 用户状态推送 (user_status)
- ✅ 输入状态指示 (typing_start/typing_stop)
- ✅ 消息编辑通知 (message_edited)
- ✅ 消息删除通知 (message_deleted)
- ✅ 自动重连支持

**核心代码示例**:

```go
// internal/websocket/hub.go - WebSocket 消息中心
package websocket

import (
  "sync"
)

// Hub 维护活跃的 WebSocket 连接
type Hub struct {
  // 注册的客户端
  clients map[*Client]bool

  // 来自客户端的消息
  broadcast chan []byte

  // 注册请求
  register chan *Client

  // 注销请求
  unregister chan *Client

  // 保护 clients map 的互斥锁
  mu sync.RWMutex
}

func NewHub() *Hub {
  return &Hub{
    broadcast:  make(chan []byte, 256),
    register:   make(chan *Client),
    unregister: make(chan *Client),
    clients:    make(map[*Client]bool),
  }
}

// Run 启动 Hub 的主事件循环
func (h *Hub) Run() {
  for {
    select {
    case client := <-h.register:
      h.mu.Lock()
      h.clients[client] = true
      h.mu.Unlock()
      // 通知其他用户用户已上线
      h.BroadcastUserStatus(client.UserID, "online")

    case client := <-h.unregister:
      h.mu.Lock()
      if _, ok := h.clients[client]; ok {
        delete(h.clients, client)
        close(client.send)
      }
      h.mu.Unlock()
      // 通知其他用户用户已离线
      h.BroadcastUserStatus(client.UserID, "offline")

    case message := <-h.broadcast:
      h.mu.RLock()
      for client := range h.clients {
        select {
        case client.send <- message:
        default:
          // 如果客户端的发送通道已满，关闭它
          go func(c *Client) {
            h.unregister <- c
          }(client)
        }
      }
      h.mu.RUnlock()
    }
  }
}

// BroadcastUserStatus 广播用户状态变化
func (h *Hub) BroadcastUserStatus(userID, status string) {
  message := gin.H{
    "type": "user_status",
    "data": gin.H{
      "user_id": userID,
      "status":  status,
    },
  }
  // 编码为 JSON 并广播
  data, _ := json.Marshal(message)
  h.broadcast <- data
}

// BroadcastMessage 广播新消息
func (h *Hub) BroadcastMessage(msg interface{}) {
  data, _ := json.Marshal(msg)
  h.broadcast <- data
}
```

```go
// internal/websocket/client.go - WebSocket 客户端连接
package websocket

import (
  "github.com/gorilla/websocket"
)

type Client struct {
  Hub    *Hub
  Conn   *websocket.Conn
  Send   chan []byte
  UserID string
  ChatID string
}

// ReadPump 从 WebSocket 连接读取消息
func (c *Client) ReadPump(handler *MessageHandler) {
  defer func() {
    c.Hub.unregister <- c
    c.Conn.Close()
  }()

  c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
  c.Conn.SetPongHandler(func(string) error {
    c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    return nil
  })

  for {
    _, message, err := c.Conn.ReadMessage()
    if err != nil {
      break
    }

    // 处理消息
    handler.HandleMessage(c, message)
  }
}

// WritePump 向 WebSocket 连接写入消息
func (c *Client) WritePump() {
  ticker := time.NewTicker(54 * time.Second)
  defer func() {
    ticker.Stop()
    c.Conn.Close()
  }()

  for {
    select {
    case message, ok := <-c.Send:
      c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
      if !ok {
        c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
        return
      }

      if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
        return
      }

    case <-ticker.C:
      c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
      if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
        return
      }
    }
  }
}
```

---

### 模块 7: 文件上传 (file)

**文件**:
- `internal/handlers/file.go`
- `internal/services/file_service.go`

**功能**:
- ✅ 上传文件 (POST /api/uploads)
- ✅ 删除文件 (DELETE /api/files/{file_id})

---

### 模块 8: 中间件 (middleware)

**认证中间件**:
```go
// internal/middleware/auth.go
package middleware

import (
  "github.com/gin-gonic/gin"
  "your-module/internal/utils"
)

func AuthMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    // 从请求头获取 Token
    token := c.GetHeader("Authorization")
    if token == "" {
      utils.ErrorResponse(c, 401, "Missing token", nil)
      c.Abort()
      return
    }

    // 验证 Token
    claims, err := utils.VerifyToken(token)
    if err != nil {
      utils.ErrorResponse(c, 401, "Invalid token", nil)
      c.Abort()
      return
    }

    // 将用户 ID 存储在上下文中
    c.Set("user_id", claims.UserID)
    c.Next()
  }
}
```

---

## 部署配置

### 环境变量 (.env)

```env
# 服务器
SERVER_ADDR=:8080
SERVER_ENV=development  # development | production

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=chat_db
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=86400       # access token 过期时间（秒）
JWT_REFRESH_EXPIRE=604800  # refresh token 过期时间（秒）

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# 日志
LOG_LEVEL=info  # debug | info | warn | error
LOG_FORMAT=json  # json | text

# WebSocket
WS_READ_BUFFER_SIZE=1024
WS_WRITE_BUFFER_SIZE=1024
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: chat_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
  redis_data:
```

### 启动指令

```bash
# 1. 启动 Docker 容器
docker-compose up -d

# 2. 运行数据库迁移
go run cmd/main.go migrate

# 3. 生成测试数据
go run cmd/main.go seed

# 4. 启动服务器
go run cmd/main.go

# 5. 或使用 make
make run
```

---

## 总结

这个 Go 后端架构遵循以下原则：

✅ **分层架构** - Handlers → Services → Repositories → Database  
✅ **接口隔离** - 每个服务都有清晰的接口  
✅ **依赖注入** - 易于测试和维护  
✅ **错误处理** - 统一的错误响应格式  
✅ **性能优化** - 使用 Redis 缓存和数据库索引  
✅ **可扩展性** - 支持多实例部署（Redis Pub/Sub）  
✅ **安全性** - JWT 认证、密码加密、CORS  

