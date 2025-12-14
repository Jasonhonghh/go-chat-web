'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketEvent, NewMessageEvent, UserStatusEvent, MessageStatusEvent } from '@/lib/types';
import { mockWebSocketServer } from '@/lib/mock-websocket';
import { mapMessage } from '@/lib/api';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendEvent: (event: WebSocketEvent) => void;
  onNewMessage: (callback: (event: NewMessageEvent) => void) => () => void;
  onUserStatus: (callback: (event: UserStatusEvent) => void) => () => void;
  onMessageStatus: (callback: (event: MessageStatusEvent) => void) => () => void;
  onTyping: (callback: (event: { type: 'typing_start' | 'typing_stop'; data: { chat_id: string; user_id: string; user_name: string } }) => void) => () => void;
  onMessageEdited: (callback: (event: { type: 'message_edited'; data: { message_id: string; chat_id: string; content: string; edited_at: number } }) => void) => () => void;
  onMessageDeleted: (callback: (event: { type: 'message_deleted'; data: { message_id: string; chat_id: string; deleted_at: number } }) => void) => () => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  enabled?: boolean;
  useMock?: boolean;
}

export function WebSocketProvider({ 
  children, 
  url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  enabled = true,
  useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (useMock) {
      // Use mock WebSocket server
      mockWebSocketServer.enable();
      setIsConnected(true);
      console.log('Using mock WebSocket server');
      return;
    }

    // Create real socket connection
    const socketInstance = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url, enabled, useMock]);

  const sendEvent = useCallback((event: WebSocketEvent) => {
    if (useMock) {
      if (event.type === 'send_message') {
        mockWebSocketServer.sendMessage(
          event.data.chat_id,
          event.data.content,
          event.data.temp_id || `temp-${Date.now()}`
        );
      }
    } else if (socket && isConnected) {
      socket.emit(event.type, event.data);
    }
  }, [socket, isConnected, useMock]);

  const onNewMessage = useCallback((callback: (event: NewMessageEvent) => void) => {
    if (useMock) {
      const handler = (data: any) => {
        // Mock server emits snake_case data
        // We pass it as is because NewMessageEvent.data is ApiMessage
        callback({ type: 'new_message', data });
      };
      mockWebSocketServer.on('new_message', handler);
      return () => {
        mockWebSocketServer.off('new_message', handler);
      };
    }

    if (socket) {
      const handler = (data: any) => {
        callback({ type: 'new_message', data });
      };
      socket.on('new_message', handler);
      return () => {
        socket.off('new_message', handler);
      };
    }
    return () => {};
  }, [socket, useMock]);

  const onUserStatus = useCallback((callback: (event: UserStatusEvent) => void) => {
    if (useMock) {
      const handler = (data: any) => {
        callback({ type: 'user_status', data });
      };
      mockWebSocketServer.on('user_status', handler);
      return () => {
        mockWebSocketServer.off('user_status', handler);
      };
    }
    
    if (!socket) return () => {};
    
    const handler = (data: any) => {
      callback({ type: 'user_status', data });
    };
    
    socket.on('user_status', handler);
    return () => {
      socket.off('user_status', handler);
    };
  }, [socket, useMock]);

  const onMessageStatus = useCallback((callback: (event: MessageStatusEvent) => void) => {
    if (useMock) {
      const handler = (data: any) => {
        callback({ type: 'message_status', data });
      };
      mockWebSocketServer.on('message_status', handler);
      return () => {
        mockWebSocketServer.off('message_status', handler);
      };
    }
    
    if (!socket) return () => {};
    
    const handler = (data: any) => {
      callback({ type: 'message_status', data });
    };
    
    socket.on('message_status', handler);
    return () => {
      socket.off('message_status', handler);
    };
  }, [socket, useMock]);

  const onTyping = useCallback((callback: (event: any) => void) => {
    if (!socket && !useMock) return () => {};
    
    const startHandler = (data: any) => {
      callback({ type: 'typing_start', data });
    };
    const stopHandler = (data: any) => {
      callback({ type: 'typing_stop', data });
    };
    
    if (socket) {
      socket.on('typing_start', startHandler);
      socket.on('typing_stop', stopHandler);
      return () => {
        socket.off('typing_start', startHandler);
        socket.off('typing_stop', stopHandler);
      };
    }
    return () => {};
  }, [socket, useMock]);

  const onMessageEdited = useCallback((callback: (event: any) => void) => {
    if (!socket && !useMock) return () => {};
    
    const handler = (data: any) => {
      callback({ type: 'message_edited', data });
    };
    
    if (socket) {
      socket.on('message_edited', handler);
      return () => {
        socket.off('message_edited', handler);
      };
    }
    return () => {};
  }, [socket, useMock]);

  const onMessageDeleted = useCallback((callback: (event: any) => void) => {
    if (!socket && !useMock) return () => {};
    
    const handler = (data: any) => {
      callback({ type: 'message_deleted', data });
    };
    
    if (socket) {
      socket.on('message_deleted', handler);
      return () => {
        socket.off('message_deleted', handler);
      };
    }
    return () => {};
  }, [socket, useMock]);

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { chat_id: chatId });
    }
  }, [socket, isConnected]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    sendEvent,
    onNewMessage,
    onUserStatus,
    onMessageStatus,
    onTyping,
    onMessageEdited,
    onMessageDeleted,
    sendTyping,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
