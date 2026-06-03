import { useState } from 'react';
import { Bell, Megaphone, Image, Video, FileText, BarChart3, Loader, X } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'text' | 'image' | 'video' | 'poll'>('all');
  const notifications: any[] = [];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-indigo-600" /> التبليغات والأخبار
          </h2>
          <p className="text-slate-500 mt-1">نشر وإدارة التبليغات والإعلانات الداخلية</p>
        </div>
      </div>

      {/* Under Development Banner */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Megaphone size={40} className="text-amber-600" />
          </div>
          <div className="text-center md:text-right">
            <h3 className="text-xl font-black text-amber-800 mb-2">📢 هذه الخدمة قيد التطوير</h3>
            <p className="text-amber-700">
              سيتم إطلاق صفحة التبليغات قريباً بمزايا متطورة تشمل:
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              <span className="px-4 py-1.5 bg-white rounded-xl border border-amber-200 text-amber-800 text-sm font-bold">📝 نشر النصوص</span>
              <span className="px-4 py-1.5 bg-white rounded-xl border border-amber-200 text-amber-800 text-sm font-bold">🖼️ رفع الصور</span>
              <span className="px-4 py-1.5 bg-white rounded-xl border border-amber-200 text-amber-800 text-sm font-bold">🎬 رفع الفيديو</span>
              <span className="px-4 py-1.5 bg-white rounded-xl border border-amber-200 text-amber-800 text-sm font-bold">📊 استفتاءات</span>
              <span className="px-4 py-1.5 bg-white rounded-xl border border-amber-200 text-amber-800 text-sm font-bold">🔔 إشعارات فورية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview of how it will look */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h4 className="font-bold text-slate-800 mb-4">معاينة الواجهة المستقبلية:</h4>
        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <button className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setActiveTab('all')}>
            <Bell size={16} className="inline ml-1" /> الكل
          </button>
          <button className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setActiveTab('text')}>
            <FileText size={16} className="inline ml-1" /> نصوص
          </button>
          <button className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setActiveTab('image')}>
            <Image size={16} className="inline ml-1" /> صور
          </button>
          <button className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setActiveTab('video')}>
            <Video size={16} className="inline ml-1" /> فيديو
          </button>
        </div>
        <div className="text-center py-12 text-slate-400">
          <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">لا توجد تبليغات بعد</p>
          <p className="text-sm mt-1">هذه الخدمة قيد التطوير وستكون جاهزة قريباً</p>
        </div>
      </div>
    </div>
  );
}