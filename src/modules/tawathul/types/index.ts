/**
 * بوابة التواصل (Tawathul) — الأنواع الكاملة (Core + Features)
 */

export type TawathulConversationType = 'dm' | 'group' | 'channel' | 'entity';
export type TawathulMemberRole = 'owner' | 'admin' | 'member' | 'guest';
export type TawathulMessageType = 'text' | 'system' | 'file' | 'voice';
export type TawathulAttachmentKind = 'file' | 'image' | 'voice' | 'video';
export type TawathulNotificationType =
  | 'message'
  | 'mention'
  | 'reaction'
  | 'invite'
  | 'system';

export type TawathulEntityType =
  | 'leave_request'
  | 'incident'
  | 'employee'
  | 'expense_request'
  | 'permission_request'
  | 'loan'
  | 'bonus';

export interface TawathulConversation {
  id: string;
  tenant_id: string;
  type: TawathulConversationType;
  title: string | null;
  description?: string | null;
  avatar_url?: string | null;
  is_private: boolean;
  created_by: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  deleted_at?: string | null;
  unread_count?: number;
  members_count?: number;
  entity?: TawathulEntityLink | null;
}

export interface TawathulMember {
  id: string;
  tenant_id: string;
  conversation_id: string;
  user_id: string;
  role: TawathulMemberRole;
  nickname?: string | null;
  is_muted: boolean;
  is_pinned: boolean;
  joined_at: string;
  left_at?: string | null;
  last_read_at?: string | null;
  last_read_message_id?: string | null;
  full_name?: string;
  profile_image?: string | null;
  email?: string;
  user_role?: string;
}

export interface TawathulAttachment {
  id: string;
  tenant_id: string;
  message_id: string;
  conversation_id: string;
  uploaded_by?: string | null;
  file_name: string;
  file_path: string;
  file_url?: string | null;
  mime_type?: string | null;
  file_size?: number;
  kind: TawathulAttachmentKind;
  created_at: string;
}

export interface TawathulReaction {
  id: string;
  tenant_id: string;
  message_id: string;
  conversation_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TawathulReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  user_ids: string[];
}

export interface TawathulMessage {
  id: string;
  tenant_id: string;
  conversation_id: string;
  sender_id: string | null;
  message_type: TawathulMessageType;
  body: string | null;
  attachments?: unknown[];
  reply_to_id?: string | null;
  metadata?: Record<string, unknown>;
  mentions?: string[];
  is_pinned?: boolean;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
  reply_preview?: string | null;
  reaction_summary?: TawathulReactionSummary[];
  files?: TawathulAttachment[];
}

export interface TawathulEntityLink {
  id: string;
  tenant_id: string;
  conversation_id: string;
  entity_type: TawathulEntityType | string;
  entity_id: string;
  title?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface TawathulSettings {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  allow_dms: boolean;
  allow_groups: boolean;
  allow_channels: boolean;
  allow_file_upload: boolean;
  max_file_size_mb: number;
  retention_days?: number | null;
  settings?: Record<string, unknown>;
}

export interface TawathulNotification {
  id: string;
  tenant_id: string;
  user_id: string;
  conversation_id?: string | null;
  message_id?: string | null;
  type: TawathulNotificationType;
  title: string;
  body?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateDmInput {
  otherUserId: string;
}

export interface CreateGroupInput {
  title: string;
  memberIds: string[];
  description?: string;
  isPrivate?: boolean;
}

export interface CreateChannelInput {
  title: string;
  description?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

export interface OpenEntityDiscussionInput {
  entityType: TawathulEntityType | string;
  entityId: string;
  title: string;
  memberIds?: string[];
}

export interface SendMessageInput {
  conversationId: string;
  body?: string;
  replyToId?: string;
  messageType?: TawathulMessageType;
  mentions?: string[];
  files?: File[];
}

export const TAWATHUL_QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🙏', '🔥', '✅', '👀'] as const;
