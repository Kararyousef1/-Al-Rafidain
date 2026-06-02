import { useState } from 'react';
import { Shield, Globe, Key, CreditCard, ScanFace, Lock } from 'lucide-react';

// نصوص اللغات للواجهة
const translations = {
  ar: {
    welcome: 'مرحباً بكم في البوابة الذكية للتصنيع الدوائي GMP',
    selectLang: 'الرجاء اختيار اللغة:',
    loginTitle: 'تسجيل الدخول الآمن',
    empId: 'الرقم الوظيفي',
    password: 'كلمة المرور',
    loginBtn: 'دخول',
    rfidTab: 'بطاقة RFID',
    passTab: 'كلمة المرور',
    bioTab: 'البصمة البيومترية',
    rfidInstruction: 'الرجاء تمرير بطاقة العمل على القارئ...',
    bioInstruction: 'سيتم تفعيل بصمة الإصبع والوجه قريباً...',
    footer: 'نظام محمي ومشفر بالكامل - مطابق لمعايير GMP',
  },
  en: {
    welcome: 'Welcome to Smart GMP Manufacturing Portal',
    selectLang: 'Please select your language:',
    loginTitle: 'Secure Authentication',
    empId: 'Employee ID',
    password: 'Password',
    loginBtn: 'Login',
    rfidTab: 'RFID Card',
    passTab: 'Password',
    bioTab: 'Biometrics',
    rfidInstruction: 'Please swipe your employee card on the reader...',
    bioInstruction: 'Fingerprint & Face Recognition coming soon...',
    footer: 'Fully Encrypted & Secured System - GMP Compliant',
  }
};

export default function GMPAuthGateway() {
  const [step, setStep] = useState(1); // 1: Language, 2: Login
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [authMethod, setAuthMethod] = useState<'password' | 'rfid' | 'bio'>('password');
  
  const t = translations[lang];

  // التعامل مع اختيار اللغة
  const handleLanguageSelect = (selectedLang: 'ar' | 'en') => {
    setLang(selectedLang);
    setStep(2);
  };

  // التعامل مع تسجيل الدخول
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // هنا يتم إرسال البيانات المشفرة إلى الخادم (Backend)
    // ويتم إنشاء سجل تدقيق (Audit Trail) لعملية تسجيل الدخول
    alert(`Secure Login Triggered for ${lang === 'ar' ? 'العربية' : 'English'}`);
    // بعد النجاح يتم التوجيه إلى SCREEN 3 (بوابة الأقسام)
  };

  return (
    <div 
      className="min-h-screen bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-3xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header / Logo Area */}
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
            {t.welcome}
          </h1>
        </div>

        {/* SCREEN 1: Language Selection */}
        {step === 1 && (
          <div className="p-10 text-center animate-fade-in">
            <h2 className="text-2xl text-slate-300 mb-8">{t.selectLang}</h2>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <button 
                onClick={() => handleLanguageSelect('ar')}
                className="px-12 py-8 bg-slate-700 hover:bg-indigo-500 text-white text-3xl font-bold rounded-xl shadow-md transition-all active:scale-95 border border-slate-600 flex items-center justify-center gap-3"
              >
                <Globe className="w-8 h-8" /> العربية
              </button>
              <button 
                onClick={() => handleLanguageSelect('en')}
                className="px-12 py-8 bg-slate-700 hover:bg-indigo-500 text-white text-3xl font-bold rounded-xl shadow-md transition-all active:scale-95 border border-slate-600 flex items-center justify-center gap-3"
              >
                <Globe className="w-8 h-8" /> English
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: High Security Authentication */}
        {step === 2 && (
          <div className="p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">{t.loginTitle}</h2>
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white flex items-center gap-2">
                <Globe className="w-5 h-5" /> {lang === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex bg-slate-900 rounded-lg p-1 mb-8">
              <button 
                onClick={() => setAuthMethod('password')}
                className={`flex-1 py-4 text-xl font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${authMethod === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Key className="w-5 h-5" /> {t.passTab}
              </button>
              <button 
                onClick={() => setAuthMethod('rfid')}
                className={`flex-1 py-4 text-xl font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${authMethod === 'rfid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <CreditCard className="w-5 h-5" /> {t.rfidTab}
              </button>
              <button 
                onClick={() => setAuthMethod('bio')}
                className={`flex-1 py-4 text-xl font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${authMethod === 'bio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ScanFace className="w-5 h-5" /> {t.bioTab}
              </button>
            </div>

            {/* Form Area */}
            <div className="min-h-[250px] flex flex-col justify-center">
              {authMethod === 'password' && (
                <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                  <div>
                    <label className="block text-slate-300 text-lg mb-2 font-semibold">{t.empId}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. 10452"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-lg mb-2 font-semibold">{t.password}</label>
                    <input 
                      type="password" 
                      required
                      className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-bold py-5 rounded-lg shadow-lg transition-all active:scale-95 mt-4"
                  >
                    {t.loginBtn}
                  </button>
                </form>
              )}

              {authMethod === 'rfid' && (
                <div className="text-center p-8 bg-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-indigo-400 animate-pulse" />
                  <p className="text-2xl text-slate-300 font-semibold">{t.rfidInstruction}</p>
                </div>
              )}

              {authMethod === 'bio' && (
                <div className="text-center p-8 bg-slate-900 rounded-lg border border-slate-700 opacity-60 cursor-not-allowed animate-fade-in">
                  <ScanFace className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-2xl text-slate-300 font-semibold">{t.bioInstruction}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="bg-slate-900 p-4 text-center border-t border-slate-700">
          <p className="text-slate-500 text-sm font-semibold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> {t.footer}
          </p>
        </div>

      </div>
    </div>
  );
}