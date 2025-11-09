'use client';

import { Message, NewMessageEvent, UserStatusEvent } from './types';

type EventCallback = (event: NewMessageEvent | UserStatusEvent) => void;

class MockWebSocketServer {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private messageQueue: Message[] = [];
  private isEnabled = false;

  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;
    console.log('Mock WebSocket Server enabled');
    
    // Simulate random incoming messages
    this.startMessageSimulation();
  }

  disable() {
    this.isEnabled = false;
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback({ type: event, data } as any));
    }
  }

  // Simulate sending a message (optimistic update gets server confirmation)
  sendMessage(chatId: string, content: string, tempId: string) {
    // Simulate network delay
    setTimeout(() => {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: 'user-1',
        senderName: 'Current User',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
        content,
        timestamp: Date.now(),
        status: 'sent',
      };

      // Update message status from temp to real
      this.emit('message_status', {
        messageId: tempId,
        status: 'sent',
      });

      // Emit the confirmed message
      const event: NewMessageEvent = {
        type: 'new_message',
        data: newMessage,
      };
      this.emit('new_message', event.data);
    }, 500 + Math.random() * 500);
  }

  // Simulate incoming messages from other users
  private startMessageSimulation() {
    const simulateRandomMessage = () => {
      if (!this.isEnabled) return;

      const responses = [
        { chatId: 'chat-1', senderId: 'user-2', senderName: 'Alice Johnson', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', content: 'Hey! How are you doing?' },
        { chatId: 'chat-1', senderId: 'user-2', senderName: 'Alice Johnson', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', content: 'Did you see the latest updates?' },
        { chatId: 'chat-2', senderId: 'user-3', senderName: 'Bob Smith', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', content: 'I just reviewed everything' },
        { chatId: 'chat-3', senderId: 'user-2', senderName: 'Alice Johnson', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', content: 'Team, great progress today!' },
        { chatId: 'chat-3', senderId: 'user-4', senderName: 'Carol White', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol', content: 'Agreed! Let\'s keep it up.' },
        { chatId: 'chat-4', senderId: 'user-5', senderName: 'David Brown', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', content: 'The design iterations are coming along nicely' },
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const newMessage: Message = {
        id: `msg-sim-${Date.now()}`,
        ...randomResponse,
        timestamp: Date.now(),
        status: 'sent',
      };

      const event: NewMessageEvent = {
        type: 'new_message',
        data: newMessage,
      };
      this.emit('new_message', event.data);

      // Simulate user status changes occasionally
      if (Math.random() > 0.7) {
        const userIds = ['user-2', 'user-3', 'user-4', 'user-5'];
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomStatus: 'online' | 'offline' = Math.random() > 0.3 ? 'online' : 'offline';
        
        const statusEvent: UserStatusEvent = {
          type: 'user_status',
          data: {
            userId: randomUserId,
            status: randomStatus,
            lastSeen: randomStatus === 'offline' ? Date.now() : undefined,
          },
        };
        this.emit('user_status', statusEvent.data);
      }

      // Schedule next random message (between 10-30 seconds)
      const delay = 10000 + Math.random() * 20000;
      setTimeout(simulateRandomMessage, delay);
    };

    // Start first simulation after 5 seconds
    setTimeout(simulateRandomMessage, 5000);
  }
}

export const mockWebSocketServer = new MockWebSocketServer();

// Enable mock WebSocket if NEXT_PUBLIC_USE_MOCK is set
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
  mockWebSocketServer.enable();
}
