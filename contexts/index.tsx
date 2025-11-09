'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ChatProvider, useChat } from './chat-context';
import { WebSocketProvider, useWebSocket } from './websocket-context';
import { AuthProvider, useAuth } from './auth-context';

/**
 * Combined provider that wraps Auth, Chat, and WebSocket contexts
 */
export function ChatAppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChatAppProviderInner>
        {children}
      </ChatAppProviderInner>
    </AuthProvider>
  );
}

function ChatAppProviderInner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  return (
    <ChatProvider currentUser={user}>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </ChatProvider>
  );
}

/**
 * Hook that combines chat and websocket functionality
 */
export function useChatWithWebSocket() {
  const chat = useChat();
  const ws = useWebSocket();

  const sendMessageWithWebSocket = (chatId: string, content: string) => {
    // Create optimistic message first
    chat.sendMessage(chatId, content);
    
    // Send via WebSocket
    ws.sendEvent({
      type: 'send_message',
      data: {
        chatId,
        content,
        timestamp: Date.now(),
      },
    });
  };

  return {
    ...chat,
    sendMessage: sendMessageWithWebSocket,
    isConnected: ws.isConnected,
  };
}
