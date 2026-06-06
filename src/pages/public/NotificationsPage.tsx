import { useState, useEffect, useRef } from 'react';
import { Megaphone, FileText, Image, Video, BarChart3, Send, X, Edit3, Trash2, Calendar, Clock, User, MessageSquare, ThumbsUp, Eye, Paperclip, Link2, Camera, Upload, AlertCircle, Hash, Bell } from 'lucide-react';
import { useAuthStore } from '../../store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface Announcement {
  id: string;
  type: 'text' | 'image' | 'video' | 'poll';
  title: string;
  content: string;
  mediaUrl?: string;
  author: string;
  authorRole: string;
  authorId: string;
  createdAt: string;
  priority: 'normal' | 'important' | 'urgent';
  tags: string[];
  likes: number;
  likedBy: string[];
  views: number;
  hasNotification: boolean;
}

const STORAGE_KEY = 'hr_notifications_data';

const loadNotifications = (): Announcement[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveNotifications = (data: Announcement[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const initialForm = { title: '', content: '', type: 'text' as const, mediaUrl: '', tags: '', priority: 'normal' as const, hasNotification: true };

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>(loadNotifications);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video' | 'poll'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const canCreate = user?.role === 'admin' || user?.role === 'developer' || user?.role === 'hr';

  useEffect(() => { saveNotifications(announcements); }, [announcements]);

  const handleCreateOrUpdate = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    
    const now = new Date().toISOString();
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const authorName = user?.full_name || user?.name || 'مستخدم';

    if (editingId) {
      setAnnouncements(prev => prev.map(a => 
        a.id === editingId ? { ...a, title: form.title, content: form.content, type: form.type, mediaUrl: form.mediaUrl, tags, priority: form.priority, hasNotification: form.hasNotification } : a
      ));
    } else {
      const newAnn: Announcement = {
        id: Date.now().toString(),
        type: form.type,
        title: form.title,
        content: form.content,
        mediaUrl: form.mediaUrl || undefined,
        author: authorName,
        authorRole: user?.role || 'employee',
        authorId: user?.id || '',
        createdAt: now,
        priority: form.priority,
        tags,
        likes: 0,
        likedBy: [],
        views: 0,
        hasNotification: form.hasNotification,
      };
      setAnnouncements(prev => [newAnn, ...prev]);
    }

    setForm(initialForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف هذا التبليغ؟')) return;
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleEdit = (ann: Announcement) => {
    setForm({ title: ann.title, content: ann.content, type: ann.type, mediaUrl: ann.mediaUrl || '', tags: ann.tags.join(', '), priority: ann.priority, hasNotification: ann.hasNotification });
    setEditingId(ann.id);
    setShowForm(true);
  };

  const handleLike = (id: string) => {
    if (!user?.id) return;
    setAnnouncements(prev => prev.map(a => {
      if (a.id !== id) return a;
      const alreadyLiked = a.likedBy.includes(user.id);
      return { ...a, likes: alreadyLiked ? a.likes - 1 : a.likes + 1, likedBy: alreadyLiked ? a.likedBy.filter(uid => uid !== user.id) : [...a.likedBy, user.id] };
    }));
  };

  const handleView = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, views: a.views + 1 } : a));
  };

  const handleFilePick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, mediaUrl: reader.result as string }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const filtered = announcements.filter(a => filter === 'all' || a.type === filter);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return { bg: 'bg-red-50 border-red-200', badge: 'badge-danger', text: 'text-red-700' };
      case 'important': return { bg: 'bg-amber-50 border-amber-200', badge: 'badge-warning', text: 'text-amber-700' };
      default: return { bg: 'bg-white', badge: 'badge-info', text: '' };
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'image': return <Image size={16} className="text-green-500" />;
      case 'video': return <Video size={16} className="text-purple-500" />;
      case 'poll': return <BarChart3 size={16} className="text-orange-500" />;
      default: return <FileText size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-indigo-600" size={28} /> التبليغات والأخبار
          </h2>
          <p className="text-slate-500 text-sm mt-1">الإعلانات الداخلية والتحديثات المهمة</p>
        </div>
        {canCreate && (
          <button onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-sm transition-all">
            <Send size={18} /> نشر تبليغ جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'text', 'image', 'video', 'poll'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {tab === 'all' ? <Bell size={16} /> : tab === 'text' ? <FileText size={16} /> : tab === 'image' ? <Image size={16} /> : tab === 'video' ? <Video size={16} /> : <BarChart3 size={16} />}
            {tab === 'all' ? 'الكل' : tab === 'text' ? 'نصوص' : tab === 'image' ? 'صور' : tab === 'video' ? 'فيديو' : 'استفتاءات'}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{editingId ? 'تعديل التبليغ' : 'نشر تبليغ جديد'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            {/* Type Selector */}
            <div className="flex flex-wrap gap-2">
              {(['text', 'image', 'video', 'poll'] as const).map(t => (
                <button key={t} onClick={() => setForm(prev => ({ ...prev, type: t }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${form.type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t === 'text' ? <FileText size={14} /> : t === 'image' ? <Image size={14} /> : t === 'video' ? <Video size={14} /> : <BarChart3 size={14} />}
                  {t === 'text' ? 'نص' : t === 'image' ? 'صورة' : t === 'video' ? 'فيديو' : 'استفتاء'}
                </button>
              ))}
            </div>

            <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="عنوان التبليغ *" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 font-bold" />

            <textarea value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="محتوى التبليغ *" rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none" />

            {/* Media URL */}
            <div className="flex gap-2">
              <input type="text" value={form.mediaUrl} onChange={e => setForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                placeholder={form.type === 'image' ? 'رابط الصورة...' : form.type === 'video' ? 'رابط الفيديو...' : 'رابط مرفق...'}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-left" dir="ltr" />
              <button onClick={handleFilePick} disabled={uploading} className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-semibold flex items-center gap-1.5">
                <Upload size={16} /> رفع
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            </div>

            {form.mediaUrl && form.type === 'image' && (
              <div className="relative">
                <img src={form.mediaUrl} alt="preview" className="w-full max-h-40 object-cover rounded-xl" />
                <button onClick={() => setForm(prev => ({ ...prev, mediaUrl: '' }))} className="absolute top-2 left-2 p-1 bg-white/80 rounded-full hover:bg-white"><X size={16} /></button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الأولوية</label>
                <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm">
                  <option value="normal">عادية</option>
                  <option value="important">مهمة</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">وسوم (tags)</label>
                <input type="text" value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="مهم, عاجل, عام" className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="withNotif" checked={form.hasNotification}
                  onChange={e => setForm(prev => ({ ...prev, hasNotification: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="withNotif" className="text-sm font-semibold text-slate-700">مع إشعار</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">إلغاء</button>
              <button onClick={handleCreateOrUpdate}
                disabled={!form.title.trim() || !form.content.trim()}
                className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                <Send size={16} /> {editingId ? 'تحديث التبليغ' : 'نشر التبليغ'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={64} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-600">لا توجد تبليغات</h3>
          <p className="text-slate-400 mt-1">{canCreate ? 'انقر "نشر تبليغ جديد" لإنشاء أول تبليغ' : 'ستظهر التبليغات هنا عند نشرها'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ann => {
            const pc = getPriorityColor(ann.priority);
            const isLiked = user?.id ? ann.likedBy.includes(user.id) : false;

            return (
              <div key={ann.id} onClick={() => handleView(ann.id)}
                className={`rounded-2xl p-5 border ${pc.bg} shadow-sm transition-all hover:shadow-md cursor-pointer`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {ann.author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-base">{ann.title}</h3>
                        {ann.priority === 'urgent' && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">عاجل</span>}
                        {ann.priority === 'important' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">مهم</span>}
                        {getTypeIcon(ann.type)}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{ann.content}</p>

                      {ann.mediaUrl && ann.type === 'image' && (
                        <img src={ann.mediaUrl} alt="" className="mt-3 rounded-xl max-h-60 object-cover w-full sm:w-auto border border-slate-100"
                          onClick={e => { e.stopPropagation(); window.open(ann.mediaUrl, '_blank'); }} />
                      )}
                      {ann.mediaUrl && ann.type === 'video' && (
                        <video src={ann.mediaUrl} controls className="mt-3 rounded-xl max-h-60 w-full sm:w-auto border border-slate-100"
                          onClick={e => e.stopPropagation()} />
                      )}

                      {ann.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ann.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><User size={12} /> {ann.author}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(ann.createdAt), 'dd MMMM yyyy', { locale: ar })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(ann.createdAt), 'HH:mm')}</span>
                        <span className="flex items-center gap-1"><Eye size={12} /> {ann.views}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); handleLike(ann.id); }}
                      className={`p-2 rounded-lg transition-colors ${isLiked ? 'bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                      <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <span className={`text-xs font-bold ${isLiked ? 'text-red-500' : 'text-slate-400'}`}>{ann.likes}</span>
                  </div>
                </div>

                {/* Admin Actions */}
                {(canCreate || ann.authorId === user?.id) && (
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={e => { e.stopPropagation(); handleEdit(ann); }}
                      className="px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1">
                      <Edit3 size={14} /> تعديل
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(ann.id); }}
                      className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1">
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}