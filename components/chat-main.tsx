'use client';

import { useState, useRef, useEffect, FormEvent, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowRight, ImageIcon, MoreVertical, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/chat-context";
import { useAuth } from "@/contexts/auth-context";
import { useWebSocket } from "@/contexts/websocket-context";
import { Message } from "@/lib/types";
import { MessageBubbleEnhanced } from "@/components/message-bubble-enhanced";
import { GroupSettingsDialog } from "@/components/group-settings-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

const MessageBubble = ({ message, isCurrentUser }: MessageBubbleProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className={cn("flex items-start gap-3", isCurrentUser ? "justify-end" : "")}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1">
        {!isCurrentUser && (
          <span className="text-muted-foreground text-xs px-1">{message.senderName}</span>
        )}
        <div
          className={cn(
            "max-w-[70%] rounded-lg p-3",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-muted rounded-bl-none"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-muted-foreground text-xs px-1">
          {formatTime(message.timestamp)}
          {isCurrentUser && message.status && (
            <span className="ml-1">
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export function ChatMain() {
  const { activeChat, messages: allMessages, sendMessage, updateMessageContent, removeMessage } = useChat();
  const { user } = useAuth();
  const { sendTyping } = useWebSocket();
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  const messages = activeChat ? allMessages[activeChat.id] || [] : [];

  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    if (searchResults.length > 0) return searchResults;
    return messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [messages, searchQuery, searchResults]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChat) return;

    sendMessage(activeChat.id, inputValue.trim(), replyTo || undefined);
    setInputValue("");
    setReplyTo(null);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTyping(activeChat.id, false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (!activeChat) return;
    
    // Send typing indicator
    if (value.trim()) {
      sendTyping(activeChat.id, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeChat.id, false);
      }, 3000);
    } else {
      sendTyping(activeChat.id, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const performSearch = async (query: string) => {
    if (!activeChat) return;
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      if (!useMock) {
        const { items } = await api.message.searchMessages(activeChat.id, query, { limit: 50 });
        const mapped = items.map((msg) => ({
          id: msg.message_id,
          chatId: msg.chat_id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderAvatar: msg.sender_avatar,
          content: msg.content,
          timestamp: msg.created_at * 1000,
          status: msg.status,
        } as Message));
        setSearchResults(mapped);
      } else {
        // Fallback to local filter in mock mode
        setSearchResults(
          messages.filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
        );
      }
    } catch (error) {
      console.error('Message search failed:', error);
      // Graceful fallback to local filter
      setSearchResults(
        messages.filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
      );
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, activeChat]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    setIsUploading(true);
    try {
      const uploadedFile = await api.file.uploadFile(file, 'message');
      
      // Send message with file URL
      sendMessage(activeChat.id, uploadedFile.url, replyTo || undefined);
      toast.success('文件上传成功');
    } catch (error) {
      toast.error('文件上传失败');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getUserStatus = () => {
    if (!activeChat) return '';
    
    if (activeChat.type === 'group') {
      return `${activeChat.participants.length} members`;
    }

    // For private chats, show the other user's status
    const otherUser = activeChat.participants.find(p => p.id !== user?.id);
    if (!otherUser) return '';

    if (otherUser.status === 'online') return 'online';
    if (otherUser.lastSeen) {
      const diff = Date.now() - otherUser.lastSeen;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      if (minutes < 60) return `last seen ${minutes}m ago`;
      if (hours < 24) return `last seen ${hours}h ago`;
      return 'last seen recently';
    }
    return 'offline';
  };

  if (!activeChat) {
    return (
      <div className="m-4 flex flex-1 flex-col items-center justify-center rounded-lg border shadow-sm">
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">No chat selected</p>
          <p className="text-sm">Select a chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="m-4 flex flex-1 flex-col rounded-lg border shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between gap-4 border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activeChat.avatar} alt={activeChat.name} />
            <AvatarFallback>{activeChat.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{activeChat.name}</h2>
              {activeChat.type === 'group' && (
                <Users className="text-muted-foreground h-4 w-4" />
              )}
            </div>
            <p className="text-muted-foreground text-sm">{getUserStatus()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in chat"
              className="w-48 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {activeChat.type === 'group' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowGroupSettings(true)}>
                  群聊设置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <MoreVertical className="text-muted-foreground h-5 w-5 cursor-pointer" />
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {displayedMessages.length === 0 ? (
            <div className="text-muted-foreground text-center text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            displayedMessages.map((msg) => (
              <MessageBubbleEnhanced
                key={msg.id}
                message={{
                  message_id: msg.id,
                  chat_id: msg.chatId,
                  sender_id: msg.senderId,
                  sender_name: msg.senderName,
                  sender_avatar: msg.senderAvatar,
                  content: msg.content,
                  type: 'text',
                  status: msg.status,
                  created_at: Math.floor(msg.timestamp / 1000),
                }}
                isCurrentUser={msg.senderId === user?.id}
                onReply={(messageId) => setReplyTo(messageId)}
                onEdit={async (messageId, content) => {
                  await api.message.editMessage(messageId, content);
                  updateMessageContent(activeChat.id, messageId, content);
                }}
                onDelete={async (messageId) => {
                  await api.message.deleteMessage(messageId);
                  removeMessage(activeChat.id, messageId);
                }}
                highlightTerm={searchQuery.trim()}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t p-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx"
          onChange={handleFileUpload}
        />
        {isUploading ? (
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        ) : (
          <ImageIcon 
            className="text-muted-foreground h-5 w-5 cursor-pointer hover:text-primary transition-colors" 
            onClick={() => fileInputRef.current?.click()}
          />
        )}
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full"
          disabled={!inputValue.trim()}
        >
          <ArrowRight />
        </Button>
      </form>

      {/* Group Settings Dialog */}
      {activeChat.type === 'group' && (
        <GroupSettingsDialog
          open={showGroupSettings}
          onOpenChange={setShowGroupSettings}
          group={{
            group_id: activeChat.id,
            chat_id: activeChat.id,
            name: activeChat.name,
            description: activeChat.description,
            avatar_url: activeChat.avatar,
            owner_id: activeChat.participants[0]?.id || '',
            members: activeChat.participants.map(p => ({
              user_id: p.id,
              name: p.name,
              avatar_url: p.avatar,
              role: p.id === activeChat.participants[0]?.id ? 'owner' as const : 'member' as const,
              joined_at: Date.now() / 1000,
            })),
            member_count: activeChat.participants.length,
            created_at: activeChat.createdAt ? activeChat.createdAt / 1000 : Date.now() / 1000,
            updated_at: activeChat.updatedAt / 1000,
          }}
          onUpdate={async () => {
            // Refresh chat data after group update
            if (activeChat) {
              const { fetchChats } = await import('@/contexts/chat-context');
              // Note: In production, you'd want to re-fetch the specific chat
              // For now, we'll rely on WebSocket events to update the state
            }
          }}
          onLeave={() => {
            // Navigate away from the deleted chat
            setActiveChat(null);
          }}
          onDelete={() => {
            // Navigate away from the deleted chat
            setActiveChat(null);
          }}
        />
      )}
    </div>
  );
}