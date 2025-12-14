'use client';

/**
 * ============================================================================
 * GroupSettingsDialog 组件 - 群聊设置对话框
 * ============================================================================
 * 功能特性：
 * - 显示群聊信息（名称、描述、成员数）
 * - 查看所有群成员列表
 * - 添加新成员（搜索用户）
 * - 移除成员（仅管理员/群主）
 * - 退出群聊
 * - 解散群聊（仅群主）
 * 
 * 使用示例：
 * ```tsx
 * <GroupSettingsDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   group={groupData}
 *   onUpdate={handleGroupUpdate}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
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
import { X, Plus, Search, Loader2, UserMinus, LogOut, Trash2, Crown, Shield } from 'lucide-react';
import { User, Group, GroupMember } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onUpdate?: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  group,
  onUpdate,
  onLeave,
  onDelete,
}: GroupSettingsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'members'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isOwner = user?.id === group.ownerId;
  const currentUserMember = group.members.find(m => m.userId === user?.id);
  const isAdmin = currentUserMember?.role === 'admin' || isOwner;

  /**
   * 搜索用户以添加到群组
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
        // 过滤掉已在群组中的成员
        const memberIds = group.members.map((m) => m.userId);
        setSearchResults(
          response.items.filter((user) => !memberIds.includes(user.id))
        );
      } catch (error) {
        console.error('Search users failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, group.members]);

  /**
   * 添加成员到群组
   */
  const handleAddMember = async (userId: string) => {
    setIsProcessing(true);
    try {
      await api.group.addMembers(group.id, [userId]);
      toast.success('成员已添加');
      setSearchQuery('');
      setSearchResults([]);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('添加成员失败');
      console.error('Add member error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 移除群成员
   */
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!window.confirm(`确定移除成员 ${userName} 吗？`)) return;

    setIsProcessing(true);
    try {
      await api.group.removeMember(group.id, userId);
      toast.success('成员已移除');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('移除成员失败');
      console.error('Remove member error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 退出群聊
   */
  const handleLeaveGroup = async () => {
    if (!window.confirm('确定退出此群聊吗？')) return;

    setIsProcessing(true);
    try {
      await api.group.leaveGroup(group.id);
      toast.success('已退出群聊');
      onOpenChange(false);
      if (onLeave) onLeave();
    } catch (error) {
      toast.error('退出群聊失败');
      console.error('Leave group error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 解散群聊（仅群主）
   */
  const handleDeleteGroup = async () => {
    if (!window.confirm('确定解散此群聊吗？此操作不可撤销！')) return;

    setIsProcessing(true);
    try {
      await api.group.deleteGroup(group.id);
      toast.success('群聊已解散');
      onOpenChange(false);
      if (onDelete) onDelete();
    } catch (error) {
      toast.error('解散群聊失败');
      console.error('Delete group error:', error);
    } finally {
      setIsProcessing(false);
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

  /**
   * 获取角色图标
   */
  const getRoleIcon = (role: GroupMember['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>群聊设置</DialogTitle>
          <DialogDescription>
            {group.name} · {group.memberCount} 成员
          </DialogDescription>
        </DialogHeader>

        {/* 选项卡 */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('info')}
          >
            群信息
          </Button>
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('members')}
          >
            成员管理
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'info' && (
            <div className="space-y-4 py-4">
              {/* 群头像 */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={group.avatar} />
                  <AvatarFallback className="text-lg">
                    {getAvatarFallback(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.memberCount} 成员</p>
                </div>
              </div>

              {/* 群描述 */}
              {group.description && (
                <div>
                  <Label className="text-sm font-medium">群描述</Label>
                  <p className="mt-1 text-sm text-gray-700">{group.description}</p>
                </div>
              )}

              <Separator />

              {/* 操作按钮 */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLeaveGroup}
                  disabled={isProcessing}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出群聊
                </Button>

                {isOwner && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeleteGroup}
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    解散群聊
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4 py-4 h-full flex flex-col">
              {/* 添加成员搜索 */}
              {isAdmin && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">添加成员</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="搜索用户..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      disabled={isProcessing}
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* 搜索结果 */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                      {searchResults.map((searchUser) => (
                        <div
                          key={searchUser.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={searchUser.avatar} />
                              <AvatarFallback className="text-xs">
                                {getAvatarFallback(searchUser.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{searchUser.name}</p>
                              <p className="text-xs text-gray-500">{searchUser.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddMember(searchUser.id)}
                            disabled={isProcessing}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* 成员列表 */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Label className="text-sm font-medium mb-2">
                  成员列表 ({group.members.length})
                </Label>
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {group.members.map((member) => {
                      const canRemove = isAdmin && member.userId !== user?.id && member.role !== 'owner';
                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {getAvatarFallback(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{member.name}</p>
                                {getRoleIcon(member.role)}
                                {member.userId === user?.id && (
                                  <span className="text-xs text-gray-500">(你)</span>
                                )}
                              </div>
                              {member.joinedAt && (
                                <p className="text-xs text-gray-500">
                                  加入于 {new Date(member.joinedAt * 1000).toLocaleDateString('zh-CN')}
                                </p>
                              )}
                            </div>
                          </div>
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId, member.name)}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
