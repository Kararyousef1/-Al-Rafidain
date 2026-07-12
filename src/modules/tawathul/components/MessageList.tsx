/**
 * قائمة الرسائل + ردود + تفاعلات + مرفقات + تثبيت
 */

import { useEffect, useRef, useState } from 'react';
import type { TawathulMessage } from '../types';
import { TAWATHUL_QUICK_EMOJIS } from '../types';
import { cn } from '../../../utils/cn';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CornerUpLeft,
  Download,
  FileText,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
  Pencil,
} from 'lucide-react';
import { tawathulMessageService } from '../services';

interface Props {
  messages: TawathulMessage[];
  currentUserId?: string | null;
  loading?: boolean;
  conversationId?: string | null;
  onReply?: (msg: TawathulMessage) => void;
  onChanged?: () => void;
}

export default function MessageList({
  messages,
  currentUserId,
  loading,
  conversationId,
  onReply,
  onChanged,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-16 rounded-2xl bg-slate-100 animate-pulse max-w-md',
              i % 2 ? 'mr-auto' : 'ml-auto',
            )}
          />
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8">
        ابدأ المحادثة — اكتب أول رسالة
      </div>
    );
  }

  const react = async (msg: TawathulMessage, emoji: string) => {
    if (!conversationId) return;
    try {
      await tawathulMessageService.toggleReaction(msg.id, conversationId, emoji);
      onChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await tawathulMessageService.editMessage(id, editText);
      setEditingId(null);
      onChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
      {messages.map((m) => {
        const mine = !!currentUserId && m.sender_id === currentUserId;
        if (m.message_type === 'system') {
          return (
            <div key={m.id} className="text-center text-xs text-slate-400 py-1">
              {m.body}
            </div>
          );
        }

        return (
          <div key={m.id} className={cn('flex group', mine ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-[90%] sm:max-w-[75%] relative')}>
              <div
                className={cn(
                  'rounded-2xl px-3.5 py-2.5 shadow-sm',
                  mine
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md',
                  m.is_pinned ? 'ring-2 ring-amber-300' : '',
                )}
              >
                {!mine && (
                  <div className="text-[11px] font-semibold mb-1 opacity-80">
                    {m.sender_name || 'مستخدم'}
                  </div>
                )}

                {m.reply_to_id && (
                  <div
                    className={cn(
                      'text-[11px] mb-2 px-2 py-1 rounded-lg border-r-2',
                      mine
                        ? 'bg-indigo-500/40 border-white/60 text-indigo-50'
                        : 'bg-slate-50 border-indigo-400 text-slate-500',
                    )}
                  >
                    رد على: {m.reply_preview || 'رسالة'}
                  </div>
                )}

                {editingId === m.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-sm rounded-lg border border-white/30 bg-white/10 p-2 text-inherit"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => saveEdit(m.id)}
                      >
                        حفظ
                      </button>
                      <button
                        type="button"
                        className="text-xs underline opacity-80"
                        onClick={() => setEditingId(null)}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  m.body && (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {m.body}
                    </p>
                  )
                )}

                {/* مرفقات */}
                {!!m.files?.length && (
                  <div className="mt-2 space-y-2">
                    {m.files.map((f) =>
                      f.kind === 'image' && f.file_url ? (
                        <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer">
                          <img
                            src={f.file_url}
                            alt={f.file_name}
                            className="max-h-48 rounded-xl border border-white/20"
                          />
                        </a>
                      ) : (
                        <a
                          key={f.id}
                          href={f.file_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            'flex items-center gap-2 text-xs rounded-xl px-2 py-1.5',
                            mine ? 'bg-indigo-500/40' : 'bg-slate-50 border border-slate-200',
                          )}
                        >
                          <FileText size={14} />
                          <span className="truncate flex-1">{f.file_name}</span>
                          <Download size={12} />
                        </a>
                      ),
                    )}
                  </div>
                )}

                {/* تفاعلات */}
                {!!m.reaction_summary?.length && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.reaction_summary.map((r) => (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => react(m, r.emoji)}
                        className={cn(
                          'text-[11px] px-1.5 py-0.5 rounded-full border',
                          r.reactedByMe
                            ? mine
                              ? 'bg-white text-indigo-700 border-white'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : mine
                              ? 'bg-indigo-500/30 border-white/20'
                              : 'bg-slate-50 border-slate-200',
                        )}
                      >
                        {r.emoji} {r.count}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={cn(
                    'text-[10px] mt-1 flex items-center gap-1',
                    mine ? 'text-indigo-100' : 'text-slate-400',
                  )}
                >
                  {m.is_pinned && <Pin size={10} />}
                  {format(new Date(m.created_at), 'HH:mm · d MMM', { locale: ar })}
                  {m.edited_at ? ' · معدّلة' : ''}
                </div>
              </div>

              {/* شريط أدوات سريع */}
              <div
                className={cn(
                  'absolute -top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition',
                  mine ? 'left-2' : 'right-2',
                )}
              >
                <div className="bg-white border border-slate-200 shadow rounded-full px-1 py-0.5 flex items-center gap-0.5">
                  {TAWATHUL_QUICK_EMOJIS.slice(0, 4).map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="text-xs hover:scale-110 px-0.5"
                      onClick={() => react(m, e)}
                      title="تفاعل"
                    >
                      {e}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="p-1 text-slate-500 hover:text-indigo-600"
                    title="رد"
                    onClick={() => onReply?.(m)}
                  >
                    <CornerUpLeft size={12} />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-slate-500 hover:text-indigo-600"
                    onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>
              </div>

              {menuId === m.id && (
                <div
                  className={cn(
                    'absolute z-10 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg text-xs py-1 min-w-[140px]',
                    mine ? 'left-0' : 'right-0',
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                    onClick={() => {
                      onReply?.(m);
                      setMenuId(null);
                    }}
                  >
                    <CornerUpLeft size={12} /> رد
                  </button>
                  <button
                    type="button"
                    className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                    onClick={async () => {
                      await tawathulMessageService.togglePinMessage(m.id, !m.is_pinned);
                      setMenuId(null);
                      onChanged?.();
                    }}
                  >
                    {m.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    {m.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                  </button>
                  {mine && (
                    <button
                      type="button"
                      className="w-full text-right px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditText(m.body || '');
                        setMenuId(null);
                      }}
                    >
                      <Pencil size={12} /> تعديل
                    </button>
                  )}
                  {mine && (
                    <button
                      type="button"
                      className="w-full text-right px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                      onClick={async () => {
                        await tawathulMessageService.softDeleteMessage(m.id);
                        setMenuId(null);
                        onChanged?.();
                      }}
                    >
                      <Trash2 size={12} /> حذف
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
