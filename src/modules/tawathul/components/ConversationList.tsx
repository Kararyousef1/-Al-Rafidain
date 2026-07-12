/**
 * قائمة المحادثات — الشريط الجانبي داخل البوابة
 */

import { Hash, Lock, MessageCircle, Users, Link2, Pin } from 'lucide-react';
import type { TawathulConversation } from '../types';
import { cn } from '../../../utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  conversations: TawathulConversation[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
}

function typeIcon(type: TawathulConversation['type']) {
  switch (type) {
    case 'channel':
      return <Hash size={16} className="shrink-0 text-indigo-500" />;
    case 'group':
      return <Users size={16} className="shrink-0 text-emerald-500" />;
    case 'entity':
      return <Link2 size={16} className="shrink-0 text-amber-500" />;
    default:
      return <MessageCircle size={16} className="shrink-0 text-slate-500" />;
  }
}

function titleOf(c: TawathulConversation) {
  if (c.title?.trim()) return c.title;
  if (c.type === 'dm') return 'محادثة خاصة';
  if (c.type === 'entity') return 'نقاش مرتبط بسجل';
  if (c.type === 'channel') return 'قناة';
  if (c.type === 'group') return 'مجموعة';
  return 'محادثة';
}

export default function ConversationList({ conversations, activeId, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm leading-relaxed">
        <MessageCircle className="mx-auto mb-3 text-slate-300" size={36} />
        <p className="font-medium text-slate-600">لا توجد محادثات بعد</p>
        <p className="mt-1">ابدأ محادثة جديدة أو افتح نقاشاً من سجل في النظام</p>
      </div>
    );
  }

  return (
    <ul className="py-2 overflow-y-auto flex-1">
      {conversations.map((c) => {
        const active = c.id === activeId;
        const time = c.last_message_at
          ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true, locale: ar })
          : '';
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                'w-full text-right px-3 py-3 flex gap-3 items-start transition-colors border-r-4',
                active
                  ? 'bg-indigo-50 border-indigo-600'
                  : 'border-transparent hover:bg-slate-50',
              )}
            >
              <div className="mt-1 w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                {c.is_private && c.type !== 'dm' ? (
                  <Lock size={14} className="text-slate-400" />
                ) : (
                  typeIcon(c.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('font-semibold text-sm truncate', active ? 'text-indigo-900' : 'text-slate-800')}>
                    {titleOf(c)}
                  </span>
                  {time && (
                    <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {c.last_message_preview || '— لا رسائل —'}
                </p>
              </div>
              {c.metadata && (c.metadata as any).pinned ? (
                <Pin size={12} className="text-amber-500 mt-1" />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
