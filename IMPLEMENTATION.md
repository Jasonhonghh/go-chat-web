# Real-Time Chat Application - Implementation Guide

## 🎉 MVP Implementation Complete

This is a fully functional real-time chat MVP built with Next.js 15, TypeScript, WebSocket (Socket.IO), and shadcn/ui components.

## ✨ Features

### Core Features (MVP)
- ✅ **Real-time Messaging** - WebSocket-based instant message delivery
- ✅ **Private Chats** - One-on-one conversations
- ✅ **Group Chats** - Multi-participant group messaging
- ✅ **Text Messages** - Full text message support with emoji
- ✅ **Message Status** - Sending/Sent indicators
- ✅ **Unread Count** - Badge showing unread messages per chat
- ✅ **User Presence** - Online/offline status and last seen
- ✅ **Mock Backend** - Complete mock API and WebSocket server for development
- ✅ **Authentication** - Token-based auth with protected routes
- ✅ **Responsive UI** - Clean, modern interface with Tailwind CSS

### Technical Features
- 🔄 **Optimistic Updates** - Messages appear instantly before server confirmation
- 🔌 **Auto-reconnection** - WebSocket reconnects automatically on disconnect
- 📦 **State Management** - React Context for global state
- 🎨 **UI Components** - shadcn/ui component library
- 🧪 **Mock Mode** - Fully functional without backend server

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open the application**
   - Navigate to http://localhost:3000
   - Login with any email and password: `password123`
   - Start chatting!

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Enable mock mode (no real backend required)
NEXT_PUBLIC_USE_MOCK=true

# WebSocket server URL (for production)
NEXT_PUBLIC_WS_URL=http://localhost:3001

# API base URL (for production)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Mock Mode vs Production Mode

**Mock Mode (Default):**
- `NEXT_PUBLIC_USE_MOCK=true`
- Uses mock API endpoints and WebSocket simulator
- No backend server required
- Perfect for development and testing
- Random incoming messages every 10-30 seconds

**Production Mode:**
- `NEXT_PUBLIC_USE_MOCK=false`
- Connects to real backend WebSocket server
- Requires backend implementation (Go server)

## 📁 Project Structure

```
go-chat-web/
├── app/
│   ├── chat/
│   │   └── page.tsx          # Main chat page
│   ├── login/
│   │   └── page.tsx          # Login page
│   └── signup/
│       └── page.tsx          # Signup page
├── components/
│   ├── chat-main.tsx         # Main chat area with messages
│   ├── chat-sidebar.tsx      # Chat list sidebar
│   ├── chat-websocket-bridge.tsx  # WebSocket event handler
│   ├── require-auth.tsx      # Auth guard component
│   └── ui/                   # shadcn/ui components
├── contexts/
│   ├── auth-context.tsx      # Authentication state
│   ├── chat-context.tsx      # Chat and message state
│   ├── websocket-context.tsx # WebSocket connection
│   └── index.tsx            # Combined providers
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   ├── auth.ts              # Auth utilities
│   ├── api.ts               # Axios API client
│   ├── mock.ts              # Mock API endpoints
│   └── mock-websocket.ts    # Mock WebSocket server
└── public/
```

## 🎯 Usage Guide

### Login
1. Go to http://localhost:3000
2. Enter any email
3. Password: `password123`
4. Click "Sign in"

### Chat Features

**Private Chats:**
- Click on "Personal" tab
- Select a user from the list
- Type and send messages in real-time

**Group Chats:**
- Click on "Groups" tab
- Select a group from the list
- Messages are broadcast to all group members

**Message Features:**
- Type in the input box at the bottom
- Press Enter or click Send button
- Messages show timestamp and status
- Unread counts update automatically

## 🔌 WebSocket Event Protocol

### Client → Server Events

**Send Message:**
```typescript
{
  type: 'send_message',
  data: {
    chatId: string,
    content: string,
    timestamp: number
  }
}
```

### Server → Client Events

**New Message:**
```typescript
{
  type: 'new_message',
  data: {
    id: string,
    chatId: string,
    senderId: string,
    senderName: string,
    senderAvatar?: string,
    content: string,
    timestamp: number,
    status: 'sent'
  }
}
```

**User Status:**
```typescript
{
  type: 'user_status',
  data: {
    userId: string,
    status: 'online' | 'offline',
    lastSeen?: number
  }
}
```

**Message Status:**
```typescript
{
  type: 'message_status',
  data: {
    messageId: string,
    status: 'sending' | 'sent' | 'delivered' | 'read'
  }
}
```

## 🔧 API Endpoints (Mock)

### Authentication
- `POST /login` - Login with credentials
- `GET /user/profile` - Get current user profile

### Chats
- `GET /chats` - Get all chats (private + group)
- `GET /messages/:chatId` - Get message history for a chat

## 🎨 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **WebSocket:** Socket.IO Client
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Mock Server:** axios-mock-adapter

## 🚧 Future Enhancements

### Phase 2 (Planned)
- [x] Typing indicators (UI + mock WS)
- [ ] Message read receipts (backend verification pending)
- [x] Image/file upload (mock/real API via `api.file.uploadFile`)
- [x] Message search (UI with highlighting + API backend)
- [ ] Emoji picker
- [ ] User profile editing
- [x] Create new chats/groups (UI in sidebar + dialog)
- [x] Add/remove group members (GroupSettingsDialog)

### Phase 3 (Advanced)
- [x] Message editing/deletion (UI flows wired to `api.message`)
- [x] Reply/threading (basic inline reply)
- [ ] Voice messages
- [ ] Video calls
- [ ] End-to-end encryption
- [ ] Push notifications
- [ ] Message pinning
- [ ] Custom themes

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill existing process
pkill -f "next dev"

# Or use different port
npm run dev -- -p 3001
```

### Mock Not Working
- Ensure `NEXT_PUBLIC_USE_MOCK=true` in `.env.local`
- Clear browser cache and reload
- Check browser console for errors

### WebSocket Connection Failed
- In mock mode, this is expected and harmless
- Mock WebSocket simulator runs client-side
- For production, ensure backend WebSocket server is running

## 📝 Development Notes

### Mock Data
- 5 pre-configured users (1 current user + 4 others)
- 5 chat conversations (3 private, 2 groups)
- Sample message history for each chat
- Random incoming messages every 10-30 seconds

### Authentication
- Mock login accepts any email
- Password must be: `password123`
- Token stored in localStorage
- Protected routes use `<RequireAuth>` wrapper

### State Management
- **AuthContext** - User authentication and profile
- **ChatContext** - Chat list and messages
- **WebSocketContext** - Real-time connection
- All contexts combined in `<ChatAppProvider>`

## 👨‍💻 Contributing

When adding new features:

1. Define types in `lib/types.ts`
2. Add mock data in `lib/mock.ts`
3. Update contexts for state management
4. Create/update UI components
5. Test in both mock and production modes

## 📄 License

MIT License - feel free to use this for learning and projects!

---

**Built with ❤️ using Next.js and TypeScript**
