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
  AlertCircle,
  Loader2,
  FileText,
  X,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithLinkedIn,
  sendPasswordReset,
  getOAuthErrorFromUrl,
} from '../../lib/supabaseClient.js';

interface LoginPageProps {
  onLogin: (user?: { email: string; name: string }) => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang, onToggleLang }) => {
  const isAr = lang === 'ar';
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'linkedin' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  React.useEffect(() => {
    const oauthError = getOAuthErrorFromUrl();
    if (oauthError) {
      setError(
        isAr
          ? `فشل تسجيل الدخول عبر المزود: ${oauthError}`
          : `Authentication failed: ${oauthError}`
      );
    }
  }, [isAr]);

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const t = {
    signIn: isAr ? 'تسجيل الدخول' : 'Sign In',
    signUp: isAr ? 'إنشاء حساب' : 'Create Account',
    forgotPw: isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    backToSignIn: isAr ? 'العودة لتسجيل الدخول' : 'Back to Sign In',
    resetPw: isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
    resetSent: isAr
      ? 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني'
      : 'Password reset link sent to your email',
    fullName: isAr ? 'الاسم بالكامل' : 'Full Name',
    emailLabel: isAr ? 'البريد الإلكتروني' : 'Email Address',
    passwordLabel: isAr ? 'كلمة المرور' : 'Password',
    continueWith: isAr ? 'أو تسجيل الدخول عبر' : 'or continue with',
    verifyEmail: isAr
      ? 'تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتفعيل الحساب.'
      : 'Account created! Check your email to verify your account.',
    signInBtn: isAr ? 'تسجيل الدخول إلى حسابي' : 'Sign In to Workspace',
    signUpBtn: isAr ? 'إنشاء الحساب والبدء' : 'Create Account & Get Started',
    orQuickDemo: isAr ? 'دخول سريع بحساب تجريبي' : 'Quick Demo Access',
    demoSubtitle: isAr ? 'تصفح التطبيق بدون حساب' : 'Explore the app without an account',
    googleBtn: isAr ? 'جوجل' : 'Google',
    linkedinBtn: isAr ? 'لينكدإن' : 'LinkedIn',
    atsBadge: isAr ? 'متوافق مع ATS' : 'ATS Compatible',
    aiBadge: isAr ? 'محاكاة ذكية' : 'AI Simulations',
    secureBadge: isAr ? 'مؤمَّن بالكامل' : 'Fully Secured',
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 8) {
      setError(
        isAr ? 'كلمة المرور يجب ألا تقل عن 8 أحرف' : 'Password must be at least 8 characters'
      );
      return;
    }
    if (mode === 'signup' && !agreedToTerms) {
      setError(isAr ? 'يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة' : 'You must agree to the Terms of Service and Privacy Policy to continue');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const { user, error: err } = await signUpWithEmail(email, password, name);
        if (err) {
          setError(err);
          return;
        }
        if (user && user.confirmed_at) {
          // Auto-confirmed (email confirmation disabled in Supabase settings)
          onLogin({ email: user.email!, name: user.user_metadata?.full_name || name || email.split('@')[0] });
        } else {
          setSuccessMsg(t.verifyEmail);
          setMode('signin');
        }
      } else {
        const { user, error: err } = await signInWithEmail(email, password);
        if (err) {
          setError(err);
          return;
        }
        if (user) {
          onLogin({
            email: user.email!,
            name: user.user_metadata?.full_name || email.split('@')[0],
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!email || !email.includes('@')) {
      setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      return;
    }
    setIsLoading(true);
    try {
      const { error: err } = await sendPasswordReset(email);
      if (err) {
        setError(err);
      } else {
        setSuccessMsg(t.resetSent);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setOauthLoading('google');
    try {
      const { error: err } = await signInWithGoogle();
      if (err) {
        setError(err);
        setOauthLoading(null);
      }
      // On success: Supabase redirects the browser — no further action needed here.
      // onAuthStateChange in App.tsx will pick up the session after redirect.
    } catch {
      setOauthLoading(null);
    }
  };

  const handleLinkedInLogin = async () => {
    setError(null);
    setOauthLoading('linkedin');
    try {
      const { error: err } = await signInWithLinkedIn();
      if (err) {
        setError(err);
        setOauthLoading(null);
      }
    } catch {
      setOauthLoading(null);
    }
  };

  const handleDemoLogin = () => {
    onLogin({ email: 'demo@careerpilot.ai', name: 'Demo User' });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #1e293b 0%, #0f172a 100%)' }}
    >
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher */}
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
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{isAr ? 'نظام التشغيل المهني الذكي' : 'AI Career Operating System'}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <img
              src="/logo.png"
              alt="CareerPilot AI"
              className="w-11 h-11 rounded-full object-contain border border-blue-500/30 shadow-lg bg-white p-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
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

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Error / Success banners */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Forgot Password Mode ─────────────────────────── */}
          {mode === 'forgot' ? (
            <>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">{t.resetPw}</p>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">{t.emailLabel}</label>
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.resetPw}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
                className="w-full text-center text-xs text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
              >
                ← {t.backToSignIn}
              </button>
            </>
          ) : (
            <>
              {/* ── Quick Demo ─────────────────────────────────── */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading || !!oauthLoading}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-between group shadow-lg hover:shadow-blue-500/25 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  </div>
                  <div className="text-start">
                    <div className="font-bold leading-tight">{t.orQuickDemo}</div>
                    <div className="text-[11px] text-blue-100 font-normal">{t.demoSubtitle}</div>
                  </div>
                </div>
                <ArrowIcon className="w-4 h-4 text-blue-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-700 w-full" />
                <span className="px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0 bg-slate-800 rounded-full">
                  {t.continueWith}
                </span>
              </div>

              {/* ── OAuth Buttons ───────────────────────────────── */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Google */}
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || !!oauthLoading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 12 4.9c1.76 0 3.35.64 4.59 1.69l3.41-3.41A11.94 11.94 0 0 0 12 .9C7.63.9 3.84 3.32 1.9 6.96l3.37 2.8z" />
                      <path fill="#34A853" d="M16.04 18.01A7.07 7.07 0 0 1 12 19.1c-2.99 0-5.55-1.85-6.71-4.51l-3.37 2.6C3.82 20.65 7.62 23.1 12 23.1c2.93 0 5.73-1.04 7.83-2.96l-3.79-2.13z" />
                      <path fill="#FBBC05" d="M5.29 14.59A7 7 0 0 1 4.9 12c0-.9.16-1.77.44-2.58L1.9 6.96A11.94 11.94 0 0 0 .9 12c0 1.81.39 3.52 1.08 5.07l3.31-2.48z" />
                      <path fill="#4285F4" d="M23.1 12c0-.79-.07-1.55-.19-2.29H12v4.34h6.22a5.3 5.3 0 0 1-2.3 3.48l3.79 2.13C21.66 17.55 23.1 14.98 23.1 12z" />
                    </svg>
                  )}
                  <span>{t.googleBtn}</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  id="btn-linkedin-login"
                  onClick={handleLinkedInLogin}
                  disabled={isLoading || !!oauthLoading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {oauthLoading === 'linkedin' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                    </svg>
                  )}
                  <span>{t.linkedinBtn}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-700 w-full" />
                <span className="px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider shrink-0 bg-slate-800 rounded-full">
                  {isAr ? 'أو بالبريد الإلكتروني' : 'or with email'}
                </span>
              </div>

              {/* ── Mode Tabs ───────────────────────────────────── */}
              <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.signUp}
                </button>
              </div>

              {/* ── Email/Password Form ─────────────────────────── */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">{t.fullName}</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isAr ? 'مثال: محمد غنام' : 'e.g. John Doe'}
                        className="w-full ps-10 pe-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">{t.emailLabel}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="w-full ps-10 pe-4 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">{t.passwordLabel}</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        {t.forgotPw}
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
                      minLength={8}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
                  {mode === 'signup' && (
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'على الأقل 8 أحرف' : 'Minimum 8 characters'}
                    </p>
                  )}
                </div>

                {/* Terms & Conditions Checkbox — signup only */}
                {mode === 'signup' && (
                  <div className="flex items-start gap-2.5 pt-1">
                    <button
                      type="button"
                      id="terms-checkbox"
                      onClick={() => setAgreedToTerms(!agreedToTerms)}
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        agreedToTerms
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-transparent border-slate-500 hover:border-blue-400'
                      }`}
                    >
                      {agreedToTerms && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400 leading-relaxed">
                      {isAr ? 'أوافق على ' : 'I agree to the '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
                      </button>
                      {isAr ? ' و' : ' and '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
                      </button>
                      {isAr ? ' الخاصة بـ CareerPilot AI' : ' of CareerPilot AI'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'مشفر AES-256' : 'AES-256 Encrypted'}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-email-auth"
                  disabled={isLoading || !!oauthLoading}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? t.signInBtn : t.signUpBtn}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          {/* Terms Modal */}
          {showTermsModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowTermsModal(false)}>
              <div
                className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={() => setShowTermsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">{isAr ? 'شروط الاستخدام وسياسة الخصوصية' : 'Terms of Service & Privacy Policy'}</h3>
                </div>
                <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                  <p className="font-semibold text-slate-200">{isAr ? '١. قبول الشروط' : '1. Acceptance of Terms'}</p>
                  <p>{isAr ? 'باستخدامك لـ CareerPilot AI، فأنت توافق على هذه الشروط وتلتزم بها. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الخدمة.' : 'By using CareerPilot AI, you agree to be bound by these Terms. If you do not agree to any of these terms, please do not use the service.'}</p>
                  <p className="font-semibold text-slate-200">{isAr ? '٢. استخدام الخدمة' : '2. Use of Service'}</p>
                  <p>{isAr ? 'CareerPilot AI هي منصة مساعدة مهنية بالذكاء الاصطناعي. لا تضمن المنصة توظيفك أو نجاح طلباتك الوظيفية. المحتوى المولّد بالذكاء الاصطناعي للمساعدة فقط.' : 'CareerPilot AI is an AI-powered career assistance platform. We do not guarantee employment or job application success. AI-generated content is for assistance only.'}</p>
                  <p className="font-semibold text-slate-200">{isAr ? '٣. البيانات والخصوصية' : '3. Data & Privacy'}</p>
                  <p>{isAr ? 'نحن نجمع بيانات الملف الشخصي والسير الذاتية والتفاعلات لتحسين التوصيات. لا نبيع بياناتك لأطراف ثالثة. يمكنك تصدير أو حذف بياناتك في أي وقت من إعدادات الخصوصية.' : 'We collect profile data, resumes, and interactions to improve recommendations. We do not sell your data to third parties. You can export or delete your data at any time from Privacy Settings.'}</p>
                  <p className="font-semibold text-slate-200">{isAr ? '٤. حقوق الملكية الفكرية' : '4. Intellectual Property'}</p>
                  <p>{isAr ? 'السير الذاتية والمحتوى الذي تُنشئه يخصك. نحتفظ بحق استخدام البيانات المجمّعة وغير المعرّفة لتحسين الخدمة.' : 'Resumes and content you create belong to you. We retain the right to use aggregated, anonymized data to improve the service.'}</p>
                  <p className="font-semibold text-slate-200">{isAr ? '٥. التواصل مع المطور' : '5. Contact Developer'}</p>
                  <p>{isAr ? 'للاستفسارات والدعم الفني، تواصل مع مطور المنصة أحمد إبراهيم عبر:' : 'For inquiries and technical support, contact platform developer Ahmed Ebrahim at:'}</p>
                  <p>WhatsApp: <a href="https://wa.me/201027053876" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">01027053876</a></p>
                  <p>LinkedIn: <a href="https://www.linkedin.com/in/ahmed-ebrahim2" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">linkedin.com/in/ahmed-ebrahim2</a></p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer mt-2"
                >
                  {isAr ? 'أوافق على الشروط والأحكام' : 'I Agree to Terms & Conditions'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.atsBadge}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.aiBadge}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.secureBadge}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
