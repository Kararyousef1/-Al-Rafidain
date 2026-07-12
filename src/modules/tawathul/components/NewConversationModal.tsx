/**
 * نافذة بدء محادثة / مجموعة / قناة
 */

import { useEffect, useMemo, useState } from 'react';
import { X, MessageCircle, Users, Hash } from 'lucide-react';
import Button from '../../../shared/components/ui/Button';
import { userService } from '../../../services/sdk';
import { tawathulConversationService } from '../services';
import type { TawathulConversation } from '../types';
import { useAuthStore } from '../../../core/stores';
import { ensureDefaultTenantCached } from '../utils/tenant';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (c: TawathulConversation) => void;
}

type Mode = 'dm' | 'group' | 'channel';

interface UserOption {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
}

export default function NewConversationModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<Mode>('dm');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    ensureDefaultTenantCached();
    setError(null);
    setLoadingUsers(true);
    (async () => {
      try {
        const list = await userService.findAllUsers();
        const mapped = (list || [])
          .filter((u) => u?.id && u.id !== user?.id)
          .map((u) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
          }));
        setUsers(mapped);
      } catch (e: any) {
        console.error(e);
        setUsers([]);
        setError(e?.message || 'تعذّر تحميل قائمة المستخدمين');
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [open, user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name || '').includes(q) ||
        (u.email || '').includes(q) ||
        (u.role || '').includes(q),
    );
  }, [users, query]);

  if (!open) return null;

  const toggle = (id: string) => {
    if (mode === 'dm') {
      setSelected([id]);
      return;
    }
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    ensureDefaultTenantCached();
    try {
      let conv: TawathulConversation;
      if (mode === 'dm') {
        if (!selected[0]) throw new Error('اختر مستخدماً');
        conv = await tawathulConversationService.getOrCreateDm({
          otherUserId: selected[0],
        });
      } else if (mode === 'group') {
        if (!title.trim()) throw new Error('أدخل اسم المجموعة');
        if (selected.length < 1) throw new Error('اختر عضواً واحداً على الأقل');
        conv = await tawathulConversationService.createGroup({
          title,
          memberIds: selected,
        });
      } else {
        if (!title.trim()) throw new Error('أدخل اسم القناة');
        conv = await tawathulConversationService.createChannel({
          title,
          memberIds: selected,
          isPrivate: false,
        });
      }
      onCreated(conv);
      setSelected([]);
      setTitle('');
      setQuery('');
      setMode('dm');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'فشل إنشاء المحادثة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">محادثة جديدة</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2">
          {(
            [
              { id: 'dm' as Mode, label: 'فردية', icon: MessageCircle },
              { id: 'group' as Mode, label: 'مجموعة', icon: Users },
              { id: 'channel' as Mode, label: 'قناة', icon: Hash },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setSelected([]);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition ${
                mode === m.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          {(mode === 'group' || mode === 'channel') && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'group' ? 'اسم المجموعة' : 'اسم القناة'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن موظف…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
            {loadingUsers && (
              <p className="p-4 text-sm text-slate-400 text-center">جاري التحميل…</p>
            )}
            {!loadingUsers && filtered.length === 0 && (
              <p className="p-4 text-sm text-slate-400 text-center">لا نتائج</p>
            )}
            {filtered.map((u) => {
              const checked = selected.includes(u.id);
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type={mode === 'dm' ? 'radio' : 'checkbox'}
                    checked={checked}
                    onChange={() => toggle(u.id)}
                    name="tawathul-user"
                    className="accent-indigo-600"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {u.full_name || 'بدون اسم'}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {[u.role, u.email].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="button" onClick={submit} loading={loading}>
              إنشاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
