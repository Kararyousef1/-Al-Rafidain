import { useState } from 'react';
import {
  Plus, Trash2, Save, X, Brain, Sparkles,
  Loader2, AlertTriangle, CheckCircle, Star,
  HelpCircle, FileText, Settings
} from 'lucide-react';
import Button from './Button';
import Card, { CardHeader, CardTitle } from './Card';
import type { QuizQuestion, DifficultyLevel, Quiz } from '../../types/quiz';
import type { RichContent } from '../../types/media';
import { generateQuizWithAI, analyzeCourseContent } from '../../lib/quizAiService';

interface QuizEditorProps {
  courseId: string;
  courseTitle: string;
  courseContent?: RichContent;
  existingQuiz?: Quiz;
  onSave: (quiz: Partial<Quiz>) => void;
  onClose: () => void;
}

const DIFFICULTIES: DifficultyLevel[] = ['مبتدئ', 'متوسط', 'متقدم', 'خبير'];

export default function QuizEditor({
  courseId,
  courseTitle,
  courseContent,
  existingQuiz,
  onSave,
  onClose,
}: QuizEditorProps) {
  const [tab, setTab] = useState<'manual' | 'ai'>('manual');
  const [questions, setQuestions] = useState<QuizQuestion[]>(existingQuiz?.questions || []);
  const [title, setTitle] = useState(existingQuiz?.title || `اختبار: ${courseTitle}`);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(existingQuiz?.difficulty || 'متوسط');
  const [passingScore, setPassingScore] = useState(existingQuiz?.passingScore || 70);
  const [timeLimit, setTimeLimit] = useState(existingQuiz?.timeLimit || 30);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Generation
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>('متوسط');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiLanguage, setAiLanguage] = useState<'ar' | 'en'>('ar');

  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: difficulty,
      points: 10,
      timeLimit: 30,
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: string, optIdx: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOptions = [...q.options];
      newOptions[optIdx] = value;
      return { ...q, options: newOptions };
    }));
  };

  const handleGenerateAI = async () => {
    if (!courseContent) {
      setError('هذه الدورة لا تحتوي على محتوى غني لتوليد الاختبار منه');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      // Extract text from rich content
      const text = extractTextFromBlocks(courseContent);
      
      const result = await generateQuizWithAI({
        courseContent: text,
        courseTitle,
        difficulty: aiDifficulty,
        numberOfQuestions: aiQuestionCount,
        language: aiLanguage,
      });

      const newQuestions: QuizQuestion[] = result.questions.map((q, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: aiDifficulty,
        points: q.points || 10,
        timeLimit: q.timeLimit || 30,
      }));

      setQuestions(newQuestions);
      setDifficulty(aiDifficulty);
      setTitle(`اختبار ${aiDifficulty}: ${courseTitle}`);
    } catch (err: any) {
      setError(err.message || 'فشل في توليد الاختبار');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    // Validate
    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      setError('يرجى تعبئة جميع الأسئلة');
      return;
    }
    if (questions.length === 0) {
      setError('يرجى إضافة سؤال واحد على الأقل');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      onSave({
        id: existingQuiz?.id || `quiz-${Date.now()}`,
        course_id: courseId,
        title,
        description: `اختبار ${difficulty} لمادة ${courseTitle}`,
        type: tab === 'ai' ? 'ai_generated' : 'manual',
        status: 'active',
        questions,
        difficulty,
        passingScore,
        timeLimit,
        attemptsAllowed: 3,
        created_at: existingQuiz?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'فشل في حفظ الاختبار');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="relative bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <HelpCircle size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">إدارة الاختبارات</h3>
            <p className="text-xs text-slate-500">{courseTitle}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-50 rounded-xl p-1">
          <button
            onClick={() => setTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 justify-center ${
              tab === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText size={16} /> إضافة اختبار يدوي
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 justify-center ${
              tab === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Brain size={16} /> توليد بالذكاء الاصطناعي
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Manual Tab */}
        {tab === 'manual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">عنوان الاختبار</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">درجة النجاح (%)</label>
                <input type="number" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الوقت (دقائق)</label>
                <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                الأسئلة ({questions.length})
              </h4>
              <Button variant="outline" size="sm" onClick={addQuestion} icon={<Plus size={14} />} iconPosition="left">
                إضافة سؤال
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <HelpCircle size={40} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold">لا توجد أسئلة بعد</p>
                <p className="text-xs mt-1">أضف أسئلة يدوياً أو استخدم الذكاء الاصطناعي للتوليد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <input value={q.question} onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                        placeholder="نص السؤال..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      <button onClick={() => removeQuestion(q.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mr-9">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === oIdx}
                            onChange={() => updateQuestion(q.id, 'correctAnswer', oIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <input value={opt} onChange={e => updateOption(q.id, oIdx, e.target.value)}
                            placeholder={`الخيار ${oIdx + 1}${q.correctAnswer === oIdx ? ' (صحيح)' : ''}`}
                            className={`flex-1 bg-white border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 ${
                              q.correctAnswer === oIdx ? 'border-emerald-300 focus:ring-emerald-300' : 'border-slate-200 focus:ring-indigo-300'
                            }`} />
                          {q.correctAnswer === oIdx && <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 mr-9">
                      <textarea value={q.explanation} onChange={e => updateQuestion(q.id, 'explanation', e.target.value)}
                        placeholder="شرح الإجابة الصحيحة..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 h-16 resize-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Tab */}
        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">توليد اختبار بالذكاء الاصطناعي</h4>
                  <p className="text-xs text-slate-500">سيقوم AI بتحليل محتوى الدورة وإنشاء اختبار مخصص</p>
                </div>
              </div>

              {!courseContent ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">المحتوى غير متوفر</p>
                    <p className="text-xs text-amber-600">يجب إضافة محتوى غني للدورة أولاً (صور، نصوص، فيديوهات) ليتمكن AI من تحليلها</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">مستوى الصعوبة</label>
                      <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value as DifficultyLevel)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأسئلة</label>
                      <input type="number" min={3} max={20} value={aiQuestionCount} onChange={e => setAiQuestionCount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اللغة</label>
                      <select value={aiLanguage} onChange={e => setAiLanguage(e.target.value as 'ar' | 'en')}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    variant="primary"
                    onClick={handleGenerateAI}
                    disabled={generating}
                    icon={generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    iconPosition="left"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {generating ? 'جاري التوليد...' : 'توليد الاختبار الآن'}
                  </Button>

                  {questions.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-semibold">تم توليد {questions.length} سؤال بنجاح!</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Preview generated questions */}
            {questions.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <Star size={14} className="text-amber-500" />
                  معاينة الأسئلة المولدة
                </h4>
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-3">
                      <p className="font-bold text-slate-700 text-sm mb-2">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-2 gap-1.5 mr-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`px-3 py-1.5 rounded-lg text-xs ${
                            q.correctAnswer === oIdx ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {opt}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 mr-4">{q.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button fullWidth variant="outline" onClick={onClose}>إلغاء</Button>
          <Button fullWidth variant="primary" onClick={handleSave} disabled={questions.length === 0 || saving}
            icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} iconPosition="left">
            {saving ? 'جاري الحفظ...' : 'حفظ الاختبار'}
          </Button>
        </div>

        <button onClick={onClose} className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * استخراج النص من المحتوى الغني للدورة
 */
function extractTextFromBlocks(content: RichContent): string {
  let text = '';
  for (const block of content.blocks) {
    text += `${block.content}\n`;
    if (block.items) {
      text += block.items.join('\n') + '\n';
    }
    if (block.tableData) {
      for (const row of block.tableData) {
        text += row.join(' | ') + '\n';
      }
    }
  }
  return text.trim();
}