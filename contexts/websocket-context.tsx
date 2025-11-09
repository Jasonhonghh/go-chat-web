'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketEvent, NewMessageEvent, UserStatusEvent, MessageStatusEvent } from '@/lib/types';
import { mockWebSocketServer } from '@/lib/mock-websocket';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendEvent: (event: WebSocketEvent) => void;
  onNewMessage: (callback: (event: NewMessageEvent) => void) => () => void;
  onUserStatus: (callback: (event: UserStatusEvent) => void) => () => void;
  onMessageStatus: (callback: (event: MessageStatusEvent) => void) => () => void;
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
          event.data.chatId,
          event.data.content,
          `temp-${event.data.timestamp}`
        );
      }
    } else if (socket && isConnected) {
      socket.emit(event.type, event.data);
    }
  }, [socket, isConnected, useMock]);

  const onNewMessage = useCallback((callback: (event: NewMessageEvent) => void) => {
    if (useMock) {
      const handler = (data: NewMessageEvent['data']) => {
        callback({ type: 'new_message', data });
      };
      mockWebSocketServer.on('new_message', handler as any);
      return () => {
        mockWebSocketServer.off('new_message', handler as any);
      };
    }
    
    if (!socket) return () => {};
    
    const handler = (data: NewMessageEvent['data']) => {
      callback({ type: 'new_message', data });
    };
    
    socket.on('new_message', handler);
    return () => {
      socket.off('new_message', handler);
    };
  }, [socket, useMock]);

  const onUserStatus = useCallback((callback: (event: UserStatusEvent) => void) => {
    if (useMock) {
      const handler = (data: UserStatusEvent['data']) => {
        callback({ type: 'user_status', data });
      };
      mockWebSocketServer.on('user_status', handler as any);
      return () => {
        mockWebSocketServer.off('user_status', handler as any);
      };
    }
    
    if (!socket) return () => {};
    
    const handler = (data: UserStatusEvent['data']) => {
      callback({ type: 'user_status', data });
    };
    
    socket.on('user_status', handler);
    return () => {
      socket.off('user_status', handler);
    };
  }, [socket, useMock]);

  const onMessageStatus = useCallback((callback: (event: MessageStatusEvent) => void) => {
    if (useMock) {
      const handler = (data: MessageStatusEvent['data']) => {
        callback({ type: 'message_status', data });
      };
      mockWebSocketServer.on('message_status', handler as any);
      return () => {
        mockWebSocketServer.off('message_status', handler as any);
      };
    }
    
    if (!socket) return () => {};
    
    const handler = (data: MessageStatusEvent['data']) => {
      callback({ type: 'message_status', data });
    };
    
    socket.on('message_status', handler);
    return () => {
      socket.off('message_status', handler);
    };
  }, [socket, useMock]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    sendEvent,
    onNewMessage,
    onUserStatus,
    onMessageStatus,
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
