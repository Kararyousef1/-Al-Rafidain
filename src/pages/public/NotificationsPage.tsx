import { useState, useEffect, useRef } from 'react';
import { Megaphone, FileText, Image, Video, BarChart3, Send, X, Edit3, Trash2, Calendar, Clock, User, ThumbsUp, Eye, Upload, Bell, Users, Building2, Filter, PieChart, CheckCircle, AlertCircle, Star, Target, Plus, Vote, Shield, Layers } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
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
  targetDepartments: string[]; // [] = الكل
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
  poll?: PollData;
}

interface PollData {
  question: string;
  options: PollOption[];
  endDate?: string;
  totalVotes: number;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

const STORAGE_KEY = 'hr_advanced_notifications';
const DEPARTMENTS = ['الكل', 'الإدارة العامة', 'الموارد البشرية', 'قسم الشرابات', 'قسم الحبوب', 'قسم المراهم', 'قسم المساحيق', 'المشرفين', 'الحراسة', 'المطورين'];

const loadData = (): Announcement[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveData = (data: Announcement[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const initialForm: { title: string; content: string; type: 'text' | 'image' | 'video' | 'poll'; mediaUrl: string; tags: string; priority: 'normal' | 'important' | 'urgent'; hasNotification: boolean; targetDepartments: string[] } = { title: '', content: '', type: 'text', mediaUrl: '', tags: '', priority: 'normal', hasNotification: true, targetDepartments: [] };

const emptyPoll = (): PollData => ({ question: '', options: [{ id: '1', text: '', votes: 0, voters: [] }, { id: '2', text: '', votes: 0, voters: [] }], totalVotes: 0 });

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>(loadData);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; content: string; type: 'text' | 'image' | 'video' | 'poll'; mediaUrl: string; tags: string; priority: 'normal' | 'important' | 'urgent'; hasNotification: boolean; targetDepartments: string[] }>(initialForm);
  const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video' | 'poll'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pollData, setPollData] = useState<PollData>(emptyPoll());
  const [deptFilter, setDeptFilter] = useState('all');

  // صلاحية النشر: المشرف والمطور فقط (الموارد البشرية تحتاج تفعيل من الإدارة)
  const canPublish = user?.role === 'admin' || user?.role === 'developer';
  const canPublishWithPermission = user?.role === 'hr' && (user as any)?.permissions?.includes('publish-announcements');
  const canPublishAny = canPublish || canPublishWithPermission;

  useEffect(() => { saveData(announcements); }, [announcements]);

  // تحديد الأقسام المسموح للمستخدم رؤيتها
  const userDept = (user as any)?.manufacturing_dept || (user as any)?.department || '';
  const visibleAnnouncements = announcements.filter(a => {
    if (a.targetDepartments.length === 0 || a.targetDepartments.includes('الكل')) return true;
    if (user?.role === 'admin' || user?.role === 'developer') return true;
    if (a.targetDepartments.includes(userDept)) return true;
    // إذا كان المستخدم من المشرفين و التبليغ موجه للمشرفين
    if ((user?.role === 'supervisor' || user?.role === 'manager') && a.targetDepartments.includes('المشرفين')) return true;
    if (user?.role === 'hr' && a.targetDepartments.includes('الموارد البشرية')) return true;
    if (user?.role === 'gatekeeper' && a.targetDepartments.includes('الحراسة')) return true;
    return false;
  });

  const filtered = visibleAnnouncements
    .filter(a => filter === 'all' || a.type === filter)
    .filter(a => deptFilter === 'all' || a.targetDepartments.includes(deptFilter) || (deptFilter === 'الكل' && a.targetDepartments.length === 0));

  const targetDeptNames = (deps: string[]): string => {
    if (deps.length === 0 || deps.includes('الكل')) return 'جميع الأقسام';
    return deps.join('، ');
  };

  const handleCreateOrUpdate = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (form.type === 'poll' && (!pollData.question.trim() || pollData.options.filter(o => o.text.trim()).length < 2)) {
      addToast('الاستفتاء يجب أن يحتوي على سؤال وخيارين على الأقل', 'error');
      return;
    }
    
    const now = new Date().toISOString();
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const authorName = user?.full_name || user?.name || 'مستخدم';
    const targetDepts = form.targetDepartments.length > 0 ? form.targetDepartments : ['الكل'];

    if (editingId) {
      setAnnouncements(prev => prev.map(a => 
        a.id === editingId ? { ...a, title: form.title, content: form.content, type: form.type, mediaUrl: form.mediaUrl, tags, priority: form.priority, hasNotification: form.hasNotification, targetDepartments: targetDepts, poll: form.type === 'poll' ? pollData : undefined } : a
      ));
      addToast('تم تحديث التبليغ بنجاح', 'success');
    } else {
      const newAnn: Announcement = {
        id: Date.now().toString(),
        type: form.type,
        title: form.title,
        content: form.content,
        mediaUrl: form.mediaUrl || undefined,
        targetDepartments: targetDepts,
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
        poll: form.type === 'poll' ? { ...pollData } : undefined,
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      
      if (form.hasNotification) {
        addToast(`📢 تم نشر "${form.title}"' مع إشعار لـ ${targetDeptNames(targetDepts)}`, 'success');
      } else {
        addToast('تم نشر التبليغ بنجاح (بدون إشعار)', 'success');
      }
    }

    setForm(initialForm);
    setPollData(emptyPoll());
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف هذا التبليغ؟')) return;
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    addToast('تم حذف التبليغ', 'info');
  };

  const handleEdit = (ann: Announcement) => {
    setForm({ title: ann.title, content: ann.content, type: ann.type, mediaUrl: ann.mediaUrl || '', tags: ann.tags.join(', '), priority: ann.priority, hasNotification: ann.hasNotification, targetDepartments: ann.targetDepartments.includes('الكل') ? [] : ann.targetDepartments });
    if (ann.poll) setPollData(ann.poll);
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

  const handleVote = (annId: string, optionId: string) => {
    if (!user?.id) return;
    setAnnouncements(prev => prev.map(a => {
      if (a.id !== annId || !a.poll) return a;
      // هل صوت المستخدم سابقاً؟
      const alreadyVoted = a.poll.options.some(o => o.voters.includes(user.id));
      if (alreadyVoted) {
        addToast('لقد صوت مسبقاً في هذا الاستفتاء', 'warning');
        return a;
      }
      const newOptions = a.poll.options.map(o => 
        o.id === optionId ? { ...o, votes: o.votes + 1, voters: [...o.voters, user.id] } : o
      );
      return { ...a, poll: { ...a.poll, options: newOptions, totalVotes: a.poll.totalVotes + 1 } };
    }));
    addToast('تم تسجيل صوتك', 'success');
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

  const getMyVote = (poll: PollData): string | null => {
    if (!user?.id) return null;
    for (const opt of poll.options) {
      if (opt.voters.includes(user.id)) return opt.id;
    }
    return null;
  };

  const addOption = () => {
    const newId = (pollData.options.length + 1).toString();
    setPollData(prev => ({ ...prev, options: [...prev.options, { id: newId, text: '', votes: 0, voters: [] }] }));
  };

  const removeOption = (id: string) => {
    if (pollData.options.length <= 2) return;
    setPollData(prev => ({ ...prev, options: prev.options.filter(o => o.id !== id) }));
  };

  const toggleDept = (dept: string) => {
    setForm(prev => ({
      ...prev,
      targetDepartments: prev.targetDepartments.includes(dept)
        ? prev.targetDepartments.filter(d => d !== dept)
        : [...prev.targetDepartments, dept]
    }));
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', text: 'text-red-700', icon: AlertCircle };
      case 'important': return { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700', icon: Star };
      default: return { bg: 'bg-white', badge: 'bg-blue-100 text-blue-700', text: '', icon: Bell };
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
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{announcements.length}</p>
          <p className="text-indigo-100 text-xs font-bold mt-1">إجمالي التبليغات</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{announcements.filter(a => a.priority === 'urgent').length}</p>
          <p className="text-amber-100 text-xs font-bold mt-1">عاجلة</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{visibleAnnouncements.length}</p>
          <p className="text-emerald-100 text-xs font-bold mt-1">متاحة لك</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{announcements.filter(a => a.type === 'poll').length}</p>
          <p className="text-violet-100 text-xs font-bold mt-1">استفتاءات</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-indigo-600" size={28} /> التبليغات المتقدمة
          </h2>
          <p className="text-slate-500 text-sm mt-1">إعلانات ذكية مع استهداف الأقسام واستفتاءات</p>
          {!canPublishAny && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Shield size={12} /> لا تملك صلاحية النشر - يلزم تفعيلها من الإدارة
            </p>
          )}
        </div>
        {canPublishAny && (
          <button onClick={() => { setForm(initialForm); setPollData(emptyPoll()); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-sm transition-all">
            <Send size={18} /> نشر تبليغ جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'text', 'image', 'video', 'poll'] as const).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${filter === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {tab === 'all' ? <Bell size={14} /> : tab === 'text' ? <FileText size={14} /> : tab === 'image' ? <Image size={14} /> : tab === 'video' ? <Video size={14} /> : <BarChart3 size={14} />}
              {tab === 'all' ? 'الكل' : tab === 'text' ? 'نصوص' : tab === 'image' ? 'صور' : tab === 'video' ? 'فيديو' : 'استفتاءات'}
            </button>
          ))}
        </div>
        <div className="mr-auto">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-400">
            <option value="all">جميع الأقسام</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              {editingId ? <><Edit3 size={20} className="text-indigo-600" /> تعديل التبليغ</> : <><Send size={20} className="text-indigo-600" /> نشر تبليغ جديد</>}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['text', 'image', 'video', 'poll'] as const).map(t => (
                <button key={t} onClick={() => setForm(prev => ({ ...prev, type: t }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${form.type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {t === 'text' ? <FileText size={14} /> : t === 'image' ? <Image size={14} /> : t === 'video' ? <Video size={14} /> : <BarChart3 size={14} />}
                  {t === 'text' ? 'نص' : t === 'image' ? 'صورة' : t === 'video' ? 'فيديو' : '📊 استفتاء'}
                </button>
              ))}
            </div>

            <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="📌 عنوان التبليغ *" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 font-bold text-lg" />

            <textarea value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="📝 محتوى التبليغ *" rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none" />

            {/* Poll Builder */}
            {form.type === 'poll' && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-200 space-y-4">
                <h4 className="font-bold text-orange-800 flex items-center gap-2"><Vote size={18} /> إنشاء استفتاء</h4>
                <input type="text" value={pollData.question} onChange={e => setPollData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="سؤال الاستفتاء *" className="w-full border border-orange-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 bg-white" />
                <div className="space-y-2">
                  {pollData.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input type="text" value={opt.text} onChange={e => {
                        const newOpts = [...pollData.options];
                        newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                        setPollData(prev => ({ ...prev, options: newOpts }));
                      }} placeholder={`خيار ${idx + 1}`} className="flex-1 border border-orange-200 rounded-xl px-3 py-2 outline-none focus:border-orange-500 text-sm bg-white" />
                      {pollData.options.length > 2 && (
                        <button onClick={() => removeOption(opt.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addOption} className="flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg">
                  <Plus size={14} /> إضافة خيار
                </button>
                {pollData.question && (
                  <div className="bg-white rounded-xl p-4 border border-orange-100">
                    <p className="font-bold text-sm text-slate-700 mb-3">معاينة الاستفتاء:</p>
                    <p className="font-bold text-slate-800 mb-3">{pollData.question}</p>
                    <div className="space-y-2">
                      {pollData.options.filter(o => o.text.trim()).map(opt => (
                        <div key={opt.id} className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg text-sm text-slate-600">
                          <input type="radio" disabled className="text-orange-500" />
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={form.mediaUrl} onChange={e => setForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                placeholder={form.type === 'image' ? '🖼️ رابط الصورة...' : form.type === 'video' ? '🎬 رابط الفيديو...' : '🔗 رابط مرفق...'}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-left" dir="ltr" />
              <button onClick={handleFilePick} disabled={uploading} className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-semibold flex items-center gap-1.5">
                <Upload size={16} /> {uploading ? '...' : 'رفع'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            </div>

            {form.mediaUrl && form.type === 'image' && (
              <div className="relative">
                <img src={form.mediaUrl} alt="preview" className="w-full max-h-40 object-cover rounded-xl" />
                <button onClick={() => setForm(prev => ({ ...prev, mediaUrl: '' }))} className="absolute top-2 left-2 p-1 bg-white/80 rounded-full hover:bg-white"><X size={16} /></button>
              </div>
            )}

            {/* Target Departments */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Target size={14} /> استهداف الأقسام (اختيار متعدد)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map(dept => (
                  <button key={dept} onClick={() => toggleDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      form.targetDepartments.includes(dept)
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {dept === 'الكل' ? <Layers size={12} className="inline ml-1" /> : <Building2 size={12} className="inline ml-1" />}
                    {dept}
                  </button>
                ))}
              </div>
              {form.targetDepartments.length === 0 && <p className="text-xs text-slate-400 mt-1">🔔 سيظهر التبليغ لجميع الأقسام</p>}
              {form.targetDepartments.length > 0 && <p className="text-xs text-indigo-600 mt-1">📌 سيظهر التبليغ لـ: {form.targetDepartments.join('، ')} فقط</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الأولوية</label>
                <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm">
                  <option value="normal">🔵 عادية</option>
                  <option value="important">🟡 مهمة</option>
                  <option value="urgent">🔴 عاجلة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">وسوم (Tags)</label>
                <input type="text" value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="مهم, عاجل, عام" className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="withNotif" checked={form.hasNotification}
                  onChange={e => setForm(prev => ({ ...prev, hasNotification: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="withNotif" className="text-sm font-semibold text-slate-700">🔔 مع إشعار للأقسام المستهدفة</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">إلغاء</button>
              <button onClick={handleCreateOrUpdate}
                disabled={!form.title.trim() || !form.content.trim()}
                className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                <Send size={16} /> {editingId ? 'تحديث التبليغ' : '📢 نشر التبليغ'}
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
          <p className="text-slate-400 mt-1">
            {canPublishAny ? 'انقر "نشر تبليغ جديد" لإنشاء أول تبليغ' : 'لا توجد تبليغات متاحة لقسمك أو لم يتم نشر أي تبليغ بعد'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ann => {
            const pc = getPriorityColor(ann.priority);
            const isLiked = user?.id ? ann.likedBy.includes(user.id) : false;
            const PriorityIcon = pc.icon;
            const myVote = ann.poll ? getMyVote(ann.poll) : null;

            return (
              <div key={ann.id} onClick={() => handleView(ann.id)}
                className={`rounded-2xl p-5 border ${pc.bg} shadow-sm transition-all hover:shadow-md cursor-pointer`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ann.priority === 'urgent' ? 'from-red-500 to-red-600' : ann.priority === 'important' ? 'from-amber-500 to-orange-600' : 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {ann.author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-base">{ann.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pc.badge}`}>
                          <PriorityIcon size={12} className="inline ml-1" />
                          {ann.priority === 'urgent' ? 'عاجل' : ann.priority === 'important' ? 'مهم' : 'عادي'}
                        </span>
                        {getTypeIcon(ann.type)}
                      </div>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{ann.content}</p>

                      {/* Poll Display */}
                      {ann.poll && (
                        <div className="mt-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 size={18} className="text-orange-600" />
                            <span className="font-bold text-sm text-orange-800">استفتاء: {ann.poll.question}</span>
                          </div>
                          <div className="space-y-2">
                            {ann.poll.options.map(opt => {
                              const pct = ann.poll.totalVotes > 0 ? Math.round((opt.votes / ann.poll.totalVotes) * 100) : 0;
                              const isMyVote = myVote === opt.id;
                              return (
                                <div key={opt.id}>
                                  <button onClick={() => handleVote(ann.id, opt.id)}
                                    disabled={!!myVote}
                                    className={`w-full text-right px-3 py-2 rounded-xl text-sm border transition-all flex items-center justify-between ${
                                      isMyVote ? 'bg-orange-100 border-orange-500 font-bold' : 
                                      myVote ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-orange-300'
                                    }`}>
                                    <span className="flex items-center gap-2">
                                      {isMyVote && <CheckCircle size={14} className="text-orange-600" />}
                                      {opt.text}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">{opt.votes} صوت ({pct}%)</span>
                                  </button>
                                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${isMyVote ? 'bg-orange-500' : 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">إجمالي الأصوات: {ann.poll.totalVotes}</p>
                        </div>
                      )}

                      {/* Media */}
                      {ann.mediaUrl && ann.type === 'image' && (
                        <img src={ann.mediaUrl} alt="" className="mt-3 rounded-xl max-h-60 object-cover w-full sm:w-auto border border-slate-100"
                          onClick={e => { e.stopPropagation(); window.open(ann.mediaUrl, '_blank'); }} />
                      )}
                      {ann.mediaUrl && ann.type === 'video' && (
                        <video src={ann.mediaUrl} controls className="mt-3 rounded-xl max-h-60 w-full sm:w-auto border border-slate-100"
                          onClick={e => e.stopPropagation()} />
                      )}

                      {/* Tags */}
                      {ann.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ann.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Department Badge */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Target size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-400">{targetDeptNames(ann.targetDepartments)}</span>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><User size={12} /> {ann.author} ({ann.authorRole})</span>
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
                {(canPublishAny || ann.authorId === user?.id) && (
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