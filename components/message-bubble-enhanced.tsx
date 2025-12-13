'use client';

/**
 * ============================================================================
 * MessageBubbleEnhanced 组件 - 增强的消息气泡组件
 * ============================================================================
 * 功能特性：
 * - 支持消息编辑和删除
 * - 显示消息状态图标（sent、delivered、read）
 * - 显示消息编辑标记
 * - 上下文菜单操作
 * - 时间戳格式化
 * - 头像和发送者信息
 * 
 * 使用示例：
 * ```tsx
 * <MessageBubbleEnhanced
 *   message={messageData}
 *   isCurrentUser={true}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onReply={handleReply}
 * />
 * ```
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Message } from '@/lib/types';
import { Check, CheckCheck, Copy, Edit2, MoreVertical, Reply, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageBubbleEnhancedProps {
  message: Message;
  isCurrentUser: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string, senderName: string) => void;
  onCopy?: (content: string) => void;
  highlightTerm?: string;
}

/**
 * 格式化时间戳为易读的时间字符串
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    // 今天：显示 HH:MM
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } else if (diffInHours < 168) {
    // 一周内：显示 周X HH:MM
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${days[date.getDay()]} ${date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
  } else {
    // 一周外：显示完整日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
};

/**
 * 获取消息状态图标
 */
const getStatusIcon = (status: Message['status']) => {
  switch (status) {
    case 'sending':
      return <div className="inline-block w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />;
    case 'sent':
      return <Check className="w-4 h-4 text-gray-400" />;
    case 'delivered':
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    case 'read':
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
};

/**
 * 获取用户头像的首字母
 */
const getAvatarFallback = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function MessageBubbleEnhanced({
  message,
  isCurrentUser,
  onEdit,
  onDelete,
  onReply,
  onCopy,
  highlightTerm,
}: MessageBubbleEnhancedProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);

  /**
   * 处理消息编辑提交
   */
  const handleEditSubmit = async () => {
    if (!editedContent.trim() || editedContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      if (onEdit) {
        await onEdit(message.message_id, editedContent);
        setIsEditing(false);
        toast.success('消息已编辑');
      }
    } catch (error) {
      toast.error('编辑消息失败');
    }
  };

  /**
   * 处理消息复制
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    if (onCopy) {
      onCopy(message.content);
    }
    toast.success('已复制到剪贴板');
  };

  /**
   * 处理消息删除
   */
  const handleDelete = async () => {
    if (window.confirm('确定删除此消息吗？')) {
      try {
        if (onDelete) {
          await onDelete(message.message_id);
          toast.success('消息已删除');
        }
      } catch (error) {
        toast.error('删除消息失败');
      }
    }
  };

  /**
   * 处理回复
   */
  const handleReply = () => {
    if (onReply) {
      onReply(message.message_id, message.sender_name);
    }
  };

  const renderContent = () => {
    if (!highlightTerm || !highlightTerm.trim()) {
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
    }

    const term = highlightTerm.trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = message.content.split(regex);

    return (
      <p className="text-sm whitespace-pre-wrap">
        {parts.map((part, index) =>
          index % 2 === 1 ? (
            <mark key={index} className="bg-yellow-200 text-inherit">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>
    );
  };

  return (
    <div
      className={`flex gap-3 mb-4 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* 头像 */}
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.sender_avatar} />
          <AvatarFallback className="text-xs">
            {getAvatarFallback(message.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* 消息内容容器 */}
      <div
        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} flex-1 max-w-xs sm:max-w-md`}
      >
        {/* 发送者名称（非当前用户显示） */}
        {!isCurrentUser && (
          <div className="text-sm font-medium text-gray-700 mb-1">
            {message.sender_name}
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={`relative rounded-lg px-4 py-2 ${
            isCurrentUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          } break-words group/message`}
        >
          {/* 编辑状态 */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 rounded border border-gray-300 text-gray-900 text-sm resize-none focus:outline-none focus:border-blue-500"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditedContent(message.content);
                    setIsEditing(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditSubmit}
                  className={isCurrentUser ? 'bg-white text-blue-500 hover:bg-gray-100' : 'bg-blue-500 text-white hover:bg-blue-600'}
                >
                  保存
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* 消息内容 */}
              {renderContent()}

              {/* 编辑标记 */}
              {message.edited_at && (
                <div className="text-xs opacity-70 mt-1">
                  (已编辑)
                </div>
              )}
            </div>
          )}
        </div>

        {/* 时间戳和状态 */}
        <div
          className={`flex items-center gap-2 mt-1 text-xs ${
            isCurrentUser ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {isCurrentUser && getStatusIcon(message.status)}
        </div>
      </div>

      {/* 操作菜单（悬停时显示） */}
      {!isEditing && (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCurrentUser ? 'end' : 'start'} className="w-40">
            {/* 回复 */}
            {onReply && (
              <>
                <DropdownMenuItem onClick={handleReply} className="cursor-pointer">
                  <Reply className="w-4 h-4 mr-2" />
                  回复
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* 复制 */}
            <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
              <Copy className="w-4 h-4 mr-2" />
              复制
            </DropdownMenuItem>

            {/* 编辑（仅当前用户） */}
            {isCurrentUser && onEdit && (
              <DropdownMenuItem
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                编辑
              </DropdownMenuItem>
            )}

            {/* 删除（仅当前用户） */}
            {isCurrentUser && onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
