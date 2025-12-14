'use client';

/**
 * ============================================================================
 * CreateGroupDialog 组件 - 群聊创建对话框
 * ============================================================================
 * 功能特性：
 * - 输入群名称和描述
 * - 搜索并选择成员
 * - 显示已选择的成员列表
 * - 支持移除已选成员
 * - 表单验证
 * - 加载状态处理
 * 
 * 使用示例：
 * ```tsx
 * <CreateGroupDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onCreateGroup={handleCreateGroup}
 * />
 * ```
 */

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Search, Loader2 } from 'lucide-react';
import { User } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (groupData: {
    name: string;
    description?: string;
    avatar_url?: string;
    member_ids: string[];
  }) => Promise<void>;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreateGroup,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  /**
   * 搜索用户
   */
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.user.searchUsers(searchQuery, 1, 10);
        // 过滤掉已选择的成员
        const selectedIds = selectedMembers.map((m) => m.id);
        setSearchResults(
          response.items.filter((user) => !selectedIds.includes(user.id))
        );
      } catch (error) {
        toast.error('搜索用户失败');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedMembers]);

  /**
   * 添加成员
   */
  const handleAddMember = (user: User) => {
    if (!selectedMembers.find((m) => m.id === user.id)) {
      setSelectedMembers([...selectedMembers, user]);
      setSearchQuery('');
    }
  };

  /**
   * 移除成员
   */
  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
  };

  /**
   * 创建群聊
   */
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('请输入群名称');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('请至少添加一个成员');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateGroup({
        name: groupName,
        description: description || undefined,
        member_ids: selectedMembers.map((m) => m.id),
      });

      // 重置表单
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setSearchQuery('');
      setSearchResults([]);
      onOpenChange(false);
      toast.success('群聊创建成功');
    } catch (error) {
      toast.error('创建群聊失败');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * 获取用户头像首字母
   */
  const getAvatarFallback = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>创建群聊</DialogTitle>
          <DialogDescription>
            创建一个新的群聊并邀请成员加入
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 群名称 */}
          <div>
            <Label htmlFor="group-name" className="text-sm font-medium">
              群名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder="例如：项目讨论"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-2"
              disabled={isCreating}
            />
          </div>

          {/* 群描述 */}
          <div>
            <Label htmlFor="group-description" className="text-sm font-medium">
              群描述（可选）
            </Label>
            <Input
              id="group-description"
              placeholder="例如：讨论项目进度和任务分配"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              disabled={isCreating}
            />
          </div>

          <Separator />

          {/* 成员搜索 */}
          <div>
            <Label htmlFor="member-search" className="text-sm font-medium">
              添加成员
            </Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                id="member-search"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={isCreating}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {getAvatarFallback(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            user.status === 'online'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}></span>
                          {user.status === 'online' ? '在线' : '离线'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddMember(user)}
                      className="flex-shrink-0 ml-2"
                      disabled={isCreating}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 已选成员 */}
          {selectedMembers.length > 0 && (
            <div>
              <Label className="text-sm font-medium">
                已选成员 ({selectedMembers.length})
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {getAvatarFallback(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isCreating}
                      className="ml-1 hover:text-blue-600 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            取消
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              '创建群聊'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
