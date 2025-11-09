// User types
export type UserStatus = 'online' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  lastSeen?: number;
}

// Chat types
export type ChatType = 'private' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
}

// Message types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  status: MessageStatus;
}

// WebSocket event types
export type WebSocketEventType = 
  | 'connect'
  | 'disconnect'
  | 'send_message'
  | 'new_message'
  | 'user_status'
  | 'typing_start'
  | 'typing_stop'
  | 'message_status';

export interface SendMessageEvent {
  type: 'send_message';
  data: {
    chatId: string;
    content: string;
    timestamp: number;
  };
}

export interface NewMessageEvent {
  type: 'new_message';
  data: Message;
}

export interface UserStatusEvent {
  type: 'user_status';
  data: {
    userId: string;
    status: UserStatus;
    lastSeen?: number;
  };
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop';
  data: {
    chatId: string;
    userId: string;
    userName: string;
  };
}

export interface MessageStatusEvent {
  type: 'message_status';
  data: {
    messageId: string;
    status: MessageStatus;
  };
}

export type WebSocketEvent = 
  | SendMessageEvent
  | NewMessageEvent
  | UserStatusEvent
  | TypingEvent
  | MessageStatusEvent;
