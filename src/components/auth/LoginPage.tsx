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
      style={{ backgroundColor: 'var(--surface-container-lowest)' }}
    >
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(184, 196, 255, 0.08)' }} />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(108, 136, 255, 0.06)' }} />
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(76, 215, 246, 0.05)' }} />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={onToggleLang}
          className="btn-secondary flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md shadow-sm"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <Globe className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border backdrop-blur-md text-label-caps mb-4" style={{ backgroundColor: 'rgba(184, 196, 255, 0.1)', borderColor: 'rgba(184, 196, 255, 0.2)', color: 'var(--primary)' }}>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{isAr ? 'نظام التشغيل المهني الذكي' : 'AI Career Operating System'}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <img
              src="/logo.png"
              alt="CareerPilot AI"
              className="w-11 h-11 rounded-full object-contain border shadow-lg p-0.5"
              style={{ borderColor: 'rgba(184, 196, 255, 0.3)', backgroundColor: '#ffffff' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-headline-lg-mobile sm:text-headline-lg font-black tracking-tight" style={{ color: 'var(--on-surface)' }}>
              CareerPilot <span style={{ color: 'var(--primary)' }}>AI</span>
            </h1>
          </div>
          <p className="text-body-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {isAr
              ? 'بوابتك الذكية للوظائف، صياغة السيرة الذاتية، ومحاكاة المقابلات بالذكاء الاصطناعي.'
              : 'Continuous career intelligence, ATS optimization, and AI interview simulations.'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-surface border-hairline rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Error / Success banners */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border text-body-sm" style={{ backgroundColor: 'rgba(255, 180, 171, 0.15)', borderColor: 'rgba(255, 180, 171, 0.3)', color: 'var(--error)' }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border text-body-sm" style={{ backgroundColor: 'rgba(78, 222, 163, 0.15)', borderColor: 'rgba(78, 222, 163, 0.3)', color: 'var(--tertiary)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Forgot Password Mode ─────────────────────────── */}
          {mode === 'forgot' ? (
            <>
              <div className="text-center">
                <p className="text-title-base mb-1" style={{ color: 'var(--on-surface)' }}>{t.resetPw}</p>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-body-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t.emailLabel}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="input-field w-full ps-10 pe-4"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
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
                className="w-full text-center text-body-sm cursor-pointer transition-colors"
                style={{ color: 'var(--primary)' }}
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
                className="w-full py-3 px-4 rounded-xl text-body-base font-bold transition-all cursor-pointer flex items-center justify-between group shadow-lg disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary) 100%)',
                  color: 'var(--on-primary-container)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: 'var(--secondary)' }} />
                  </div>
                  <div className="text-start">
                    <div className="font-bold leading-tight">{t.orQuickDemo}</div>
                    <div className="text-micro font-normal opacity-90">{t.demoSubtitle}</div>
                  </div>
                </div>
                <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" style={{ color: 'var(--primary-fixed-dim)' }} />
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t w-full" style={{ borderColor: 'var(--outline-variant)' }} />
                <span className="px-3 text-label-caps shrink-0 rounded-full" style={{ color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface-container)' }}>
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
                  className="btn-secondary flex items-center justify-center gap-2 py-2.5 px-3 text-body-sm font-semibold disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--error)' }} />
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
                  className="btn-secondary flex items-center justify-center gap-2 py-2.5 px-3 text-body-sm font-semibold disabled:opacity-50"
                >
                  {oauthLoading === 'linkedin' ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
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
                <div className="border-t w-full" style={{ borderColor: 'var(--outline-variant)' }} />
                <span className="px-3 text-label-caps shrink-0 rounded-full" style={{ color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface-container)' }}>
                  {isAr ? 'أو بالبريد الإلكتروني' : 'or with email'}
                </span>
              </div>

              {/* ── Mode Tabs ───────────────────────────────────── */}
              <div className="grid grid-cols-2 p-1 rounded-xl border" style={{ backgroundColor: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
                  className="py-2 text-body-sm font-bold rounded-lg transition-all cursor-pointer"
                  style={mode === 'signin' ? {
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--on-primary-container)'
                  } : {
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  {t.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
                  className="py-2 text-body-sm font-bold rounded-lg transition-all cursor-pointer"
                  style={mode === 'signup' ? {
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--on-primary-container)'
                  } : {
                    color: 'var(--on-surface-variant)'
                  }}
                >
                  {t.signUp}
                </button>
              </div>

              {/* ── Email/Password Form ─────────────────────────── */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-body-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t.fullName}</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant)' }} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isAr ? 'مثال: محمد غنام' : 'e.g. John Doe'}
                        className="input-field w-full ps-10 pe-4"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-body-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t.emailLabel}</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="input-field w-full ps-10 pe-4"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-body-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>{t.passwordLabel}</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
                        className="text-micro cursor-pointer"
                        style={{ color: 'var(--primary)' }}
                      >
                        {t.forgotPw}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="input-field w-full ps-10 pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 -translate-y-1/2 end-3 cursor-pointer"
                      style={{ color: 'var(--on-surface-variant)' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-micro" style={{ color: 'var(--on-surface-variant)' }}>
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
                      className="mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer"
                      style={agreedToTerms ? {
                        backgroundColor: 'var(--primary-container)',
                        borderColor: 'var(--primary-container)'
                      } : {
                        backgroundColor: 'transparent',
                        borderColor: 'var(--outline)'
                      }}
                    >
                      {agreedToTerms && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12" style={{ color: 'var(--on-primary-container)' }}>
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className="text-micro leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                      {isAr ? 'أوافق على ' : 'I agree to the '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="underline cursor-pointer"
                        style={{ color: 'var(--primary)' }}
                      >
                        {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
                      </button>
                      {isAr ? ' و' : ' and '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="underline cursor-pointer"
                        style={{ color: 'var(--primary)' }}
                      >
                        {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
                      </button>
                      {isAr ? ' الخاصة بـ CareerPilot AI' : ' of CareerPilot AI'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-1 text-micro" style={{ color: 'var(--on-surface-variant)' }}>
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--tertiary)' }} />
                    <span>{isAr ? 'مشفر AES-256' : 'AES-256 Encrypted'}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-email-auth"
                  disabled={isLoading || !!oauthLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-body-base font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  style={{
                    backgroundColor: 'var(--on-surface)',
                    color: 'var(--surface)'
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--surface-container)' }} />
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-micro" style={{ color: 'var(--on-surface-variant)' }}>
          {/* Terms Modal */}
          {showTermsModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(16, 19, 27, 0.7)' }} onClick={() => setShowTermsModal(false)}>
              <div
                className="border-hairline rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4 relative"
                style={{ backgroundColor: 'var(--surface-container)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="absolute top-4 right-4 cursor-pointer transition-colors"
                  style={{ color: 'var(--on-surface-variant)' }}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <h3 className="text-title-base" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? 'شروط الاستخدام وسياسة الخصوصية' : 'Terms of Service & Privacy Policy'}
                  </h3>
                </div>
                <div className="text-body-sm space-y-3 leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? '١. قبول الشروط' : '1. Acceptance of Terms'}
                  </p>
                  <p>
                    {isAr
                      ? 'باستخدامك لـ CareerPilot AI، فأنت توافق على هذه الشروط وتلتزم بها. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الخدمة.'
                      : 'By using CareerPilot AI, you agree to be bound by these Terms. If you do not agree to any of these terms, please do not use the service.'}
                  </p>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? '٢. استخدام الخدمة' : '2. Use of Service'}
                  </p>
                  <p>
                    {isAr
                      ? 'CareerPilot AI هي منصة مساعدة مهنية بالذكاء الاصطناعي. لا تضمن المنصة توظيفك أو نجاح طلباتك الوظيفية. المحتوى المولّد بالذكاء الاصطناعي للمساعدة فقط.'
                      : 'CareerPilot AI is an AI-powered career assistance platform. We do not guarantee employment or job application success. AI-generated content is for assistance only.'}
                  </p>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? '٣. البيانات والخصوصية' : '3. Data & Privacy'}
                  </p>
                  <p>
                    {isAr
                      ? 'نحن نجمع بيانات الملف الشخصي والسير الذاتية والتفاعلات لتحسين التوصيات. لا نبيع بياناتك لأطراف ثالثة. يمكنك تصدير أو حذف بياناتك في أي وقت من إعدادات الخصوصية.'
                      : 'We collect profile data, resumes, and interactions to improve recommendations. We do not sell your data to third parties. You can export or delete your data at any time from Privacy Settings.'}
                  </p>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? '٤. حقوق الملكية الفكرية' : '4. Intellectual Property'}
                  </p>
                  <p>
                    {isAr
                      ? 'السير الذاتية والمحتوى الذي تُنشئه يخصك. نحتفظ بحق استخدام البيانات المجمّعة وغير المعرّفة لتحسين الخدمة.'
                      : 'Resumes and content you create belong to you. We retain the right to use aggregated, anonymized data to improve the service.'}
                  </p>
                  <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                    {isAr ? '٥. التواصل مع المطور' : '5. Contact Developer'}
                  </p>
                  <p>
                    {isAr
                      ? 'للاستفسارات والدعم الفني، تواصل مع مطور المنصة أحمد إبراهيم عبر:'
                      : 'For inquiries and technical support, contact platform developer Ahmed Ebrahim at:'}
                  </p>
                  <p>
                    WhatsApp:{' '}
                    <a
                      href="https://wa.me/201027053876"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      01027053876
                    </a>
                  </p>
                  <p>
                    LinkedIn:{' '}
                    <a
                      href="https://www.linkedin.com/in/ahmed-ebrahim2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      linkedin.com/in/ahmed-ebrahim2
                    </a>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="btn-primary w-full"
                >
                  {isAr ? 'أوافق على الشروط والأحكام' : 'I Agree to Terms & Conditions'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-micro" style={{ color: 'var(--on-surface-variant)' }}>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            <span>{t.atsBadge}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            <span>{t.aiBadge}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--tertiary)' }} />
            <span>{t.secureBadge}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
