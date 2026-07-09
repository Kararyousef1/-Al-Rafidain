// ── أنواع ملفات الوسائط المتعددة ──

export type MediaType = 'image' | 'video' | 'document' | 'audio' | 'other';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number; // بالبايت
  thumbnailUrl?: string;
  createdAt: string;
  alt?: string; // نص بديل للصورة
  description?: string;
}

export interface RichContentBlock {
  id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'document' | 'audio' | 'list' | 'table';
  content: string; // نص أو HTML للنص، URL للوسائط
  headingLevel?: 1 | 2 | 3 | 4;
  mediaFile?: MediaFile;
  items?: string[]; // للقوائم
  tableData?: string[][]; // للجداول
  order: number;
  metadata?: Record<string, any>;
}

export interface RichContent {
  blocks: RichContentBlock[];
  mediaFiles: MediaFile[];
  summary?: string;
  readingTimeMinutes?: number;
}

// ── Helper functions ──
export const MEDIA_ACCEPTED_TYPES = {
  image: 'image/*',
  video: 'video/*',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
  audio: 'audio/*',
};

export const MEDIA_MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export const getMediaIcon = (type: MediaType): string => {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎬';
    case 'document': return '📄';
    case 'audio': return '🎵';
    default: return '📁';
  }
};

export const getMediaTypeLabel = (type: MediaType): string => {
  switch (type) {
    case 'image': return 'صورة';
    case 'video': return 'فيديو';
    case 'document': return 'مستند';
    case 'audio': return 'صوت';
    default: return 'أخرى';
  }
};