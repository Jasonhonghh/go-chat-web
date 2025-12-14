'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Chat, Message, User } from '@/lib/types';
import { api } from '@/lib/api';

interface ChatContextType {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChat: Chat | null;
  isLoading: boolean;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string, replyTo?: string) => string | undefined;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  updateMessageContent: (chatId: string, messageId: string, content: string) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  markChatAsRead: (chatId: string) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  currentUser?: User | null;
}

export function ChatProvider({ children, currentUser }: ChatProviderProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch chat list
  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { items } = await api.chat.getChats({ page: 1, limit: 50, sort: 'updated_at:desc' });
      setChats(items ?? []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const { items } = await api.message.getMessages(chatId, { page: 1, limit: 100, sort: 'created_at:asc' });
      setMessages(prev => ({
        ...prev,
        [chatId]: items ?? [],
      }));
    } catch (error) {
      console.error(`Failed to fetch messages for chat ${chatId}:`, error);
    }
  }, []);

  // Send a new message (optimistic update)
  const sendMessage = useCallback((chatId: string, content: string, replyTo?: string) => {
    if (!currentUser) return undefined;
    
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content,
      createdAt: Date.now(),
      status: 'sending',
      type: 'text',
    };

    // Optimistic update
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage],
    }));

    // Update chat's last message
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, lastMessage: newMessage, updatedAt: Date.now() }
        : chat
    ));

    // Call backend to send message
    api.message.sendMessage(chatId, { content, type: 'text', reply_to: replyTo }).catch((error) => {
      console.error('Failed to send message:', error);
    });
    return tempId;
  }, [currentUser]);
  // Update message content (after edit)
  const updateMessageContent = useCallback((chatId: string, messageId: string, content: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
    }));

    setChats(prev => prev.map(chat =>
      chat.id === chatId && chat.lastMessage?.id === messageId
        ? { ...chat, lastMessage: { ...chat.lastMessage, content } }
        : chat
    ));
  }, []);

  // Remove a message (after delete)
  const removeMessage = useCallback((chatId: string, messageId: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter((msg) => msg.id !== messageId),
    }));

    setChats(prev => prev.map(chat =>
      chat.id === chatId && chat.lastMessage?.id === messageId
        ? { ...chat, lastMessage: undefined }
        : chat
    ));
  }, []);

  // Add a received message
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => ({
      ...prev,
      [message.chatId]: [...(prev[message.chatId] || []), message],
    }));

    // Update chat's last message and unread count
    setChats(prev => prev.map(chat => {
      if (chat.id === message.chatId) {
        const isActive = activeChat?.id === message.chatId;
        return {
          ...chat,
          lastMessage: message,
          unreadCount: isActive ? 0 : chat.unreadCount + 1,
          updatedAt: Date.now(),
        };
      }
      return chat;
    }).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
  }, [activeChat]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: Message['status']) => {
    setMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(chatId => {
        updated[chatId] = updated[chatId].map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        );
      });
      return updated;
    });
  }, []);

  // Mark chat as read
  const markChatAsRead = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
  }, []);

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat && !messages[activeChat.id]) {
      fetchMessages(activeChat.id);
    }
    if (activeChat) {
      markChatAsRead(activeChat.id);
    }
  }, [activeChat, messages, fetchMessages, markChatAsRead]);

  const value: ChatContextType = {
    chats,
    messages,
    activeChat,
    isLoading,
    setActiveChat,
    sendMessage,
    addMessage,
    updateMessageStatus,
    updateMessageContent,
    removeMessage,
    markChatAsRead,
    fetchChats,
    fetchMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
