'use client';

import { ApiMessage, NewMessageEvent, UserStatusEvent } from './types';

type EventCallback = (data: any) => void;

class MockWebSocketServer {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private messageQueue: ApiMessage[] = [];
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
      listeners.forEach(callback => callback(data));
    }
  }

  // Simulate sending a message (optimistic update gets server confirmation)
  sendMessage(chatId: string, content: string, tempId: string) {
    // Simulate network delay
    setTimeout(() => {
      const newMessage: ApiMessage = {
        message_id: `msg-${Date.now()}`,
        chat_id: chatId,
        sender_id: 'user-1',
        sender_name: 'Current User',
        sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
        content,
        type: 'text',
        created_at: Date.now(),
        status: 'sent',
      };

      // Update message status from temp to real
      this.emit('message_status', {
        message_id: tempId,
        status: 'sent',
        timestamp: Date.now(),
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
        { chat_id: 'chat-1', sender_id: 'user-2', sender_name: 'Alice Johnson', sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', content: 'Hey! How are you doing?' },
        { chat_id: 'chat-1', sender_id: 'user-2', sender_name: 'Alice Johnson', sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', content: 'Did you see the latest updates?' },
        { chat_id: 'chat-2', sender_id: 'user-3', sender_name: 'Bob Smith', sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', content: 'I just reviewed everything' },
        { chat_id: 'chat-3', sender_id: 'user-2', sender_name: 'Alice Johnson', sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', content: 'Team, great progress today!' },
        { chat_id: 'chat-3', sender_id: 'user-4', sender_name: 'Carol White', sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol', content: 'Agreed! Let\'s keep it up.' },
        { chat_id: 'chat-4', sender_id: 'user-5', sender_name: 'David Brown', sender_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', content: 'The design iterations are coming along nicely' },
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const newMessage: ApiMessage = {
        message_id: `msg-sim-${Date.now()}`,
        ...randomResponse,
        type: 'text',
        created_at: Date.now(),
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
            user_id: randomUserId,
            status: randomStatus,
            last_seen: randomStatus === 'offline' ? Date.now() : undefined,
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
