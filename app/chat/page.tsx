'use client';

import { ChatMain } from "@/components/chat-main";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatWebSocketBridge } from "@/components/chat-websocket-bridge";
import RequireAuth from "@/components/require-auth";
import { ChatAppProvider } from "@/contexts/index";

function ChatContent() {
  return (
    <>
      <ChatWebSocketBridge />
      <div className="flex h-screen">
        <ChatSidebar />
        <ChatMain />
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <RequireAuth>
      <ChatAppProvider>
        <ChatContent />
      </ChatAppProvider>
    </RequireAuth>
  );
}