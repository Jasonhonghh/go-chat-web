'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';

/**
 * Component that bridges WebSocket events with Chat state management
 */
export function ChatWebSocketBridge() {
  const { onNewMessage, onUserStatus, onMessageStatus } = useWebSocket();
  const { addMessage, updateMessageStatus, chats } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    // Listen for new messages
    const unsubscribeMessages = onNewMessage((event) => {
      // Only add message if it's from another user or confirmed from server
      if (event.data.senderId !== user?.id || event.data.id.startsWith('msg-')) {
        addMessage(event.data);
      }
    });

    // Listen for message status updates
    const unsubscribeStatus = onMessageStatus((event) => {
      updateMessageStatus(event.data.messageId, event.data.status);
    });

    // Listen for user status changes
    const unsubscribeUserStatus = onUserStatus((event) => {
      console.log('User status changed:', event.data);
      // This could update participant status in chats
    });

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeUserStatus();
    };
  }, [onNewMessage, onMessageStatus, onUserStatus, addMessage, updateMessageStatus, user]);

  return null; // This is a logic-only component
}
