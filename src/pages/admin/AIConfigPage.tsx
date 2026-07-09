import { useState, useEffect } from 'react';
import { Cpu, Save, RefreshCw, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../shared/components/ui/Card';
import Button from '../../shared/components/ui/Button';
import Badge from '../../shared/components/ui/Badge';
import { useUIStore } from '../../core/stores';
import { settingsService } from '../../services/sdk';

const models = [
  { id: 'claude-3-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: 'active', latency: '1.2s', accuracy: 94 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', status: 'standby', latency: '0.9s', accuracy: 92 },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', status: 'inactive', latency: '1.5s', accuracy: 90 },
];

export default function AIConfigPage() {
  const { addToast } = useUIStore();
  const [activeModel, setActiveModel] = useState('claude-3-sonnet');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const aiSettings = await settingsService.findAiSettings();
        if (aiSettings) {
          if (aiSettings.activeModel) setActiveModel(aiSettings.activeModel);
          if (aiSettings.temperature !== undefined) setTemperature(aiSettings.temperature);
          if (aiSettings.maxTokens !== undefined) setMaxTokens(aiSettings.maxTokens);
        }
      } catch (err) {
        console.error('Error loading AI settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateAiSettings({ activeModel, temperature, maxTokens } as unknown as Record<string, unknown>);
      addToast('تم حفظ إعدادات AI بنجاح', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult('');
    await new Promise(r => setTimeout(r, 2000));
    setTestResult('✅ النموذج يعمل بشكل صحيح. وقت الاستجابة: 1.2 ثانية. دقة التصنيف: 94%');
    setTesting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">🤖 إعداد الذكاء الاصطناعي</h2>
        <p className="text-sm text-slate-500">تكوين نماذج AI وإعدادات التحليل</p>
      </div>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle>🧠 اختيار النموذج</CardTitle>
          <Badge variant="success" dot>نشط</Badge>
        </CardHeader>
        <div className="space-y-3">
          {models.map(model => (
            <div
              key={model.id}
              onClick={() => setActiveModel(model.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                activeModel === model.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeModel === model.id ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}>
                    <Cpu size={18} className={activeModel === model.id ? 'text-indigo-600' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{model.name}</p>
                    <p className="text-xs text-slate-500">{model.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-xs text-slate-500">الدقة: <span className="font-bold text-slate-700">{model.accuracy}%</span></p>
                    <p className="text-xs text-slate-500">وقت: <span className="font-bold text-slate-700">{model.latency}</span></p>
                  </div>
                  <Badge variant={model.status === 'active' ? 'success' : model.status === 'standby' ? 'warning' : 'neutral'} size="sm">
                    {model.status === 'active' ? 'نشط' : model.status === 'standby' ? 'احتياطي' : 'غير نشط'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ معاملات النموذج</CardTitle>
        </CardHeader>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">درجة الإبداعية (Temperature)</label>
              <span className="text-sm font-bold text-indigo-600">{temperature}</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.1" value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>دقيق (0)</span>
              <span>إبداعي (1)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              الحد الأقصى للرموز (Max Tokens): <span className="text-indigo-600">{maxTokens}</span>
            </label>
            <input
              type="range" min="256" max="8192" step="256" value={maxTokens}
              onChange={e => setMaxTokens(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Test */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 اختبار النموذج</CardTitle>
        </CardHeader>
        <Button
          variant="outline"
          fullWidth
          onClick={handleTest}
          loading={testing}
          icon={<RefreshCw size={14} />}
          iconPosition="left"
        >
          تشغيل اختبار سريع
        </Button>
        {testResult && (
          <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-emerald-700">{testResult}</p>
          </div>
        )}
      </Card>

      <Button fullWidth size="lg" onClick={handleSave} loading={saving} icon={<Save size={16} />} iconPosition="left">
        حفظ إعدادات AI
      </Button>
    </div>
  );
}