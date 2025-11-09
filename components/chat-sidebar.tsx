"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/contexts/chat-context";
import { Chat } from "@/lib/types";

interface ChatContactProps {
  chat: Chat;
  isActive: boolean;
  onClick: (chat: Chat) => void;
}


const ChatContact = ({ chat, isActive, onClick }: ChatContactProps) => {
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={cn(
        "hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
        isActive && "bg-muted"
      )}
      onClick={() => onClick(chat)}
    >
      <Avatar>
        <AvatarImage src={chat.avatar} alt={chat.name} />
        <AvatarFallback>{chat.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{chat.name}</span>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {chat.lastMessage ? formatTimestamp(chat.lastMessage.timestamp) : ''}
          </span>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-sm gap-2">
          <p className="truncate">
            {chat.lastMessage?.content || 'No messages yet'}
          </p>
          {chat.unreadCount > 0 && (
            <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export function ChatSidebar() {
  const [activeTab, setActiveTab] = useState<'private' | 'group'>('private');
  const { chats, activeChat, setActiveChat, isLoading } = useChat();

  const filteredChats = chats.filter(chat => chat.type === activeTab);

  return (
    <div className="flex w-80 flex-col border border-r p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Search className="text-muted-foreground h-5 w-5 cursor-pointer" />
      </div>

      <div className="mb-6 flex rounded-lg border p-1">
        <Button
          variant="ghost"
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            activeTab === "private" ? "shadow-sm" : "text-muted-foreground hover:bg-transparent"
          )}
          onClick={() => setActiveTab("private")}
        >
          <User className="mr-2 h-4 w-4" />
          Personal
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            activeTab === "group" ? "shadow-sm" : "text-muted-foreground hover:bg-transparent"
          )}
          onClick={() => setActiveTab("group")}
        >
          <Users className="mr-2 h-4 w-4" />
          Groups
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="text-muted-foreground text-center text-sm">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="text-muted-foreground text-center text-sm">
            No {activeTab === 'private' ? 'personal' : 'group'} chats yet
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatContact
              key={chat.id}
              chat={chat}
              isActive={activeChat?.id === chat.id}
              onClick={setActiveChat}
            />
          ))
        )}
      </div>

      <div className="mt-6">
        <Button className="w-full">New chat</Button>
      </div>
    </div>
  );
}