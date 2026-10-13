import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  User,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user?: { email: string; name: string }) => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  lang,
  onToggleLang,
}) => {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError(
        isAr
          ? 'كلمة المرور يجب ألا تقل عن 6 أحرف'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        email,
        name: name || (email.split('@')[0] || 'User'),
      });
    }, 600);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        email: 'mohamedghnnam801@gmail.com',
        name: 'Mohamed Ghnnam',
      });
    }, 400);
  };

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #1e293b 0%, #0f172a 100%)',
      }}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{isAr ? 'نظام التشغيل المهني الذكي' : 'AI Career Operating System'}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 mb-2">
            <img
              src="/logo.png"
              alt="CareerPilot AI"
              className="w-10 h-10 rounded-xl object-contain border border-slate-700 shadow-md bg-white p-0.5"
            />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CareerPilot <span className="text-blue-500">AI</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            {isAr
              ? 'بوابتك الذكية للوظائف، صياغة السيرة الذاتية، ومحاكاة المقابلات بالذكاء الاصطناعي.'
              : 'Continuous career intelligence, ATS optimization, and AI interview simulations.'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-between group shadow-lg hover:shadow-blue-500/25"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
              </div>
              <div className="text-start">
                <div className="font-bold leading-tight">
                  {isAr ? 'الدخول السريع بحساب العرض' : 'Quick Demo Access'}
                </div>
                <div className="text-[11px] text-blue-100 font-normal">
                  Mohamed Ghnnam (Full Profile)
                </div>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-blue-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-700 w-full" />
            <span className="bg-slate-850 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0 bg-slate-800 rounded-full">
              {isAr ? 'أو عبر البريد الإلكتروني' : 'or continue with email'}
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {isAr ? 'الاسم بالكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? 'مثال: محمد غنام' : 'e.g. Mohamed Ghnnam'}
                    className="w-full ps-10 pe-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full ps-10 pe-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        isAr
                          ? 'يمكنك تسجيل الدخول مباشرة عبر زر "الدخول السريع بحساب العرض"'
                          : 'You can sign in directly using the Quick Demo Access button.'
                      );
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full ps-10 pe-10 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>{isAr ? 'تذكر بيانات الدخول' : 'Remember me'}</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'مشفر 256-Bit' : 'Encrypted'}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin'
                      ? isAr
                        ? 'تسجيل الدخول إلى حسابي'
                        : 'Sign In to Workspace'
                      : isAr
                      ? 'إنشاء الحساب والبدء'
                      : 'Create Account & Get Started'}
                  </span>
                  <ArrowIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social login buttons */}
          <div className="pt-2 border-t border-slate-700/60">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <span className="font-bold text-red-400">G</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <span className="font-bold text-blue-400">in</span>
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature badges footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'متوافق مع أنظمة ATS' : 'ATS Compatible'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'محاكاة ذكية للمقابلات' : 'AI Simulations'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'حفظ البيانات محلياً' : 'Local Persistence'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
