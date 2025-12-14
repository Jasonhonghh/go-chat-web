'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';
import { mapMessage } from '@/lib/api';

/**
 * Component that bridges WebSocket events with Chat state management
 */
export function ChatWebSocketBridge() {
  const { onNewMessage, onUserStatus, onMessageStatus, onTyping, onMessageEdited, onMessageDeleted } = useWebSocket();
  const { addMessage, updateMessageStatus, updateMessageContent, removeMessage, chats } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    // Listen for new messages
    const unsubscribeMessages = onNewMessage((event) => {
      const message = mapMessage(event.data);
      // Only add message if it's from another user or confirmed from server
      if (message.senderId !== user?.id || message.id.startsWith('msg-')) {
        addMessage(message);
      }
    });

    // Listen for message status updates
    const unsubscribeStatus = onMessageStatus((event) => {
      updateMessageStatus(event.data.message_id, event.data.status);
    });

    // Listen for user status changes
    const unsubscribeUserStatus = onUserStatus((event) => {
      console.log('User status changed:', event.data);
      // This could update participant status in chats
    });

    // Listen for typing events
    const unsubscribeTyping = onTyping((event) => {
      console.log('Typing event:', event);
      // Could update UI to show "{user} is typing..."
    });

    // Listen for message edited events
    const unsubscribeEdited = onMessageEdited((event) => {
      updateMessageContent(event.data.chat_id, event.data.message_id, event.data.content);
    });

    // Listen for message deleted events
    const unsubscribeDeleted = onMessageDeleted((event) => {
      removeMessage(event.data.chat_id, event.data.message_id);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeUserStatus();
      unsubscribeTyping();
      unsubscribeEdited();
      unsubscribeDeleted();
    };
  }, [onNewMessage, onMessageStatus, onUserStatus, onTyping, onMessageEdited, onMessageDeleted, addMessage, updateMessageStatus, updateMessageContent, removeMessage, user]);

  return null; // This is a logic-only component
}
