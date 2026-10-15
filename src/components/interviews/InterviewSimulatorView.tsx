import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Send,
  RefreshCw,
  MessageSquare,
  Play,
  Square,
  Radio,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Award,
  AlertCircle,
  HelpCircle,
  Headphones,
  X,
  Layers,
  Server,
  Layout,
  Smartphone,
  Cloud,
  Cpu,
  Database,
  Shield,
  Palette,
  CheckSquare,
  Target,
  BookOpen,
  Compass,
} from 'lucide-react';
import { InterviewSession, CareerProfile } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import {
  TRACKS_CATALOG,
  detectTrackFromRole,
  CareerTrackId,
  CareerTrackMeta,
  TRACK_QUESTIONS,
} from '../../data/interviewQuestions.js';

interface InterviewSimulatorViewProps {
  interviews: InterviewSession[];
  profile: CareerProfile;
  onStartInterview: (data: {
    jobRole?: string;
    trackId?: string;
    type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed';
    language?: 'ar' | 'en';
    count?: number;
  }) => Promise<InterviewSession>;
  onSubmitAnswer: (
    id: string,
    data: { questionIndex: number; answer: string }
  ) => Promise<any>;
  lang: 'en' | 'ar';
}

// Sound effects generator using Web Audio API
const playChime = (type: 'start' | 'stop' | 'success') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'stop') {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // AudioContext not allowed or not supported
  }
};

export const InterviewSimulatorView: React.FC<InterviewSimulatorViewProps> = ({
  interviews,
  profile,
  onStartInterview,
  onSubmitAnswer,
  lang,
}) => {
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(
    interviews[0] || null
  );
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [interviewType, setInterviewType] = useState<
    'HR' | 'Behavioral' | 'Technical' | 'Mixed'
  >('Technical');
  const [selectedTrack, setSelectedTrack] = useState<CareerTrackId>(() => {
    return detectTrackFromRole(profile?.targetRole);
  });
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [isStarting, setIsStarting] = useState(false);
  const [answerDraft, setAnswerDraft] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Helper to render track icon
  const renderTrackIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Layout': return <Layout className={className} />;
      case 'Server': return <Server className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Cloud': return <Cloud className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Database': return <Database className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'CheckSquare': return <CheckSquare className={className} />;
      case 'Target': return <Target className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      default: return <Compass className={className} />;
    }
  };

  // Session running state
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const sessionTimerRef = useRef<any>(null);

  // Interview language (separate from app lang)
  const [interviewLang, setInterviewLang] = useState<'ar' | 'en'>(lang);

  // Voice Interaction State
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(true);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);
  const [isListeningAnswer, setIsListeningAnswer] = useState<boolean>(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'ar-EG' | 'en-US'>(
    lang === 'ar' ? 'ar-EG' : 'en-US'
  );
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [autoReadQuestion, setAutoReadQuestion] = useState<boolean>(true);

  // Sync interview lang ↔ voice language
  const isInterviewAr = interviewLang === 'ar';

  useEffect(() => {
    setVoiceLanguage(interviewLang === 'ar' ? 'ar-EG' : 'en-US');
  }, [interviewLang]);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const isAr = lang === 'ar';

  // Sync selected index with activeSession
  useEffect(() => {
    if (activeSession) {
      setSelectedQuestionIndex(activeSession.currentQuestionIndex || 0);
    }
  }, [activeSession?.id]);

  const currentQ = activeSession?.questions[selectedQuestionIndex];

  // Speech Recognition Setup
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const isTTSSupported = typeof window !== 'undefined' && Boolean(window.speechSynthesis);

  // Auto-read question when switching questions in Voice Mode
  useEffect(() => {
    if (autoReadQuestion && isVoiceMode && currentQ?.question && !currentQ.feedback) {
      handleSpeakQuestion(currentQ.question);
    }
    return () => {
      stopSpeaking();
    };
  }, [currentQ?.id, isVoiceMode]);

  // Recording Timer
  useEffect(() => {
    if (isListeningAnswer) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListeningAnswer]);

  // Session elapsed timer
  useEffect(() => {
    if (isSessionRunning) {
      setSessionElapsed(0);
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed((p) => p + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    }
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [isSessionRunning]);


  // Stop TTS
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }
  };

  // Speak text with Text-to-Speech
  const handleSpeakQuestion = (text: string) => {
    if (!isTTSSupported) {
      setSpeechError(
        isAr
          ? 'خدمة النطق الصوتي (TTS) غير مدعومة في متصفحك الحالي.'
          : 'Text-to-speech voice service is not supported in your current browser.'
      );
      return;
    }
    stopSpeaking();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const hasArabic = /[\u0600-\u06FF]/.test(text) || interviewLang === 'ar';
      utterance.lang = hasArabic ? 'ar-SA' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select natural matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) =>
        hasArabic ? v.lang.startsWith('ar') : v.lang.startsWith('en')
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        setIsSpeakingQuestion(true);
      };

      utterance.onend = () => {
        setIsSpeakingQuestion(false);
      };

      utterance.onerror = (e) => {
        setIsSpeakingQuestion(false);
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          setSpeechError(
            isAr
              ? `تعذر تشغيل الصوت (${e.error}). يرجى التحقق من إعدادات الصوت في جهازك.`
              : `Voice audio could not be played (${e.error}). Please check your audio output settings.`
          );
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeakingQuestion(false);
      const msg = e instanceof Error ? e.message : String(e);
      setSpeechError(
        isAr ? `خدمة الصوت غير متاحة: ${msg}` : `Voice service unavailable: ${msg}`
      );
    }
  };

  // Start Speech Recognition
  const startListening = () => {
    stopSpeaking();
    setSpeechError(null);

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError(
        isAr
          ? 'المتصفح الحالي لا يدعم التعرف على الصوت. يمكنك استخدام الكتابة اليدوية.'
          : 'Your browser does not support Speech Recognition. Please type your answer.'
      );
      return;
    }

    try {
      playChime('start');
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLanguage;

      let finalTranscript = answerDraft ? answerDraft + ' ' : '';

      recognition.onstart = () => {
        setIsListeningAnswer(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk + ' ';
            setAnswerDraft(finalTranscript.trim());
          } else {
            currentInterim += transcriptChunk;
            setAnswerDraft((finalTranscript + currentInterim).trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Voice Recognition] error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError(
            isAr
              ? 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.'
              : 'Microphone permission denied. Please allow microphone access.'
          );
        } else if (event.error !== 'no-speech') {
          setSpeechError(
            isAr ? `تنبيه الصوت: ${event.error}` : `Voice recognition event: ${event.error}`
          );
        }
        setIsListeningAnswer(false);
        playChime('stop');
      };

      recognition.onend = () => {
        setIsListeningAnswer(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSpeechError(msg);
      setIsListeningAnswer(false);
    }
  };

  // Stop Speech Recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListeningAnswer(false);
    playChime('stop');
  };

  const toggleListening = () => {
    if (isListeningAnswer) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle start new session
  const handleStartNew = async () => {
    stopSpeaking();
    stopListening();
    setIsStarting(true);
    setShowReview(false);
    try {
      const currentTrackMeta = TRACKS_CATALOG.find((t) => t.id === selectedTrack);
      const roleTitle = currentTrackMeta
        ? (isInterviewAr ? currentTrackMeta.nameAr : currentTrackMeta.nameEn)
        : profile.targetRole;

      const session = await onStartInterview({
        jobRole: roleTitle,
        trackId: selectedTrack,
        type: interviewType,
        language: interviewLang,
        count: questionCount,
      });
      setActiveSession(session);
      setSelectedQuestionIndex(0);
      setAnswerDraft('');
      setIsSessionRunning(true);
      playChime('start');
    } finally {
      setIsStarting(false);
    }
  };

  // Stop / end the current session and show review
  const handleEndSession = () => {
    stopSpeaking();
    stopListening();
    setIsSessionRunning(false);
    setShowReview(true);
    playChime('stop');
  };

  // Handle submit answer
  const handleSubmit = async () => {
    if (!activeSession || !answerDraft.trim()) return;
    stopListening();
    stopSpeaking();
    setIsSubmittingAnswer(true);

    try {
      const res = await onSubmitAnswer(activeSession.id, {
        questionIndex: selectedQuestionIndex,
        answer: answerDraft,
      });
      setActiveSession(res.session);
      setAnswerDraft('');
      playChime('success');

      // If there's next question, move to it after a moment
      if (selectedQuestionIndex + 1 < res.session.questions.length) {
        setSelectedQuestionIndex(selectedQuestionIndex + 1);
      }
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentTrackMeta = TRACKS_CATALOG.find((t) => t.id === selectedTrack) || TRACKS_CATALOG[0];
  const trackQuestionsPool = TRACK_QUESTIONS[selectedTrack];
  const totalTrackQuestions =
    (trackQuestionsPool?.Technical?.[isInterviewAr ? 'ar' : 'en']?.length || 0) +
    (trackQuestionsPool?.Behavioral?.[isInterviewAr ? 'ar' : 'en']?.length || 0) +
    (trackQuestionsPool?.HR?.[isInterviewAr ? 'ar' : 'en']?.length || 0) +
    (trackQuestionsPool?.Mixed?.[isInterviewAr ? 'ar' : 'en']?.length || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="surface-elevated border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {isAr ? 'محاكي المقابلات الصوتي والذكي' : 'AI Voice & Track-Based Interview Simulator'}
            </span>
            {isSessionRunning && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse" style={{ backgroundColor: 'var(--error-subtle)', color: 'var(--error-strong)' }}>
                <Radio className="w-2.5 h-2.5" style={{ color: 'var(--error)' }} />
                {isAr ? 'جاري التسجيل' : 'LIVE'} {formatTimer(sessionElapsed)}
              </span>
            )}
            {!isSessionRunning && activeSession && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-secondary)' }}>
                {isAr ? 'متوقفة' : 'Paused'}
              </span>
            )}
          </div>
          <h1 className="heading-2xl flex items-center gap-2">
            <span>{isAr ? 'محاكي المقابلات التخصصي' : 'Specialized Track Interview Simulator'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border-hairline" style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-strong)' }}>
              {isInterviewAr ? currentTrackMeta.nameAr : currentTrackMeta.nameEn}
            </span>
          </h1>
          <p className="body-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {isInterviewAr
              ? `أسئلة واقعية تتغير تلقائياً حسب تخصصك مع بنك ضخم من الأسئلة وتصحيح تفاعلي بالذكاء الاصطناعي`
              : `Realistic dynamic questions tailored to your track with a massive question bank and AI feedback`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ── Interview Language Toggle ── */}
          <div className="flex items-center p-1 rounded-xl border-hairline text-xs gap-0.5" style={{ backgroundColor: 'var(--surface-raised)' }}>
            <button
              type="button"
              onClick={() => { setInterviewLang('ar'); setVoiceLanguage('ar-EG'); }}
              className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
              style={interviewLang === 'ar' ? { backgroundColor: 'var(--surface)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              🇸🇦 عربي
            </button>
            <button
              type="button"
              onClick={() => { setInterviewLang('en'); setVoiceLanguage('en-US'); }}
              className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
              style={interviewLang === 'en' ? { backgroundColor: 'var(--surface)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              🇺🇸 English
            </button>
          </div>

          {/* ── Voice Mode ── */}
          <button
            type="button"
            onClick={() => { stopSpeaking(); stopListening(); setIsVoiceMode(!isVoiceMode); }}
            className="px-3 py-2 text-xs font-semibold rounded-lg border-hairline transition-all flex items-center gap-1.5 cursor-pointer"
            style={isVoiceMode ? { backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-strong)' } : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{isInterviewAr ? 'صوتي' : 'Voice'}</span>
            <span className={`w-2 h-2 rounded-full ${isVoiceMode ? 'animate-pulse' : ''}`} style={{ backgroundColor: isVoiceMode ? 'var(--primary)' : 'var(--border-muted)' }} />
          </button>

          {/* ── START button (when not running) ── */}
          {!isSessionRunning && (
            <button
              type="button"
              onClick={handleStartNew}
              disabled={isStarting}
              className="px-4 py-2.5 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--success)', color: 'var(--surface)' }}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isStarting ? (isInterviewAr ? 'جاري التحضير…' : 'Preparing…') : (isInterviewAr ? '▶ ابدأ المقابلة الآن' : '▶ Start Interview')}</span>
            </button>
          )}

          {/* ── STOP button (when running) ── */}
          {isSessionRunning && (
            <button
              type="button"
              onClick={handleEndSession}
              className="px-4 py-2.5 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer animate-pulse"
              style={{ backgroundColor: 'var(--error)', color: 'var(--surface)' }}
            >
              <Square className="w-3.5 h-3.5" />
              <span>{isInterviewAr ? '⏹ إيقاف وعرض التصحيحات' : '⏹ Stop & Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Career Track & Interview Configuration Bar ────────────────── */}
      <div className="p-5 rounded-2xl border-hairline space-y-4" style={{ background: 'var(--gradient-dark)', color: 'var(--surface)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3" style={{ borderBottom: '1px solid var(--border-muted)' }}>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg border-hairline" style={{ backgroundColor: 'var(--primary-muted)', color: 'var(--primary-subtle-text)' }}>
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <h2 className="heading-sm" style={{ color: 'var(--surface)' }}>
                {isInterviewAr ? 'اختر تخصصك البرمجي (Track Selector)' : 'Choose Your Career Track'}
              </h2>
              <p className="body-xs" style={{ color: 'var(--text-on-dark-secondary)' }}>
                {isInterviewAr
                  ? 'اختر مجالك لتوليد أسئلة واقعية ومتخصصة من بنك الأسئلة أو الذكاء الاصطناعي'
                  : 'Select your track to dynamically calibrate question depth and domain requirements'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Question count selector */}
            <div className="flex items-center p-1 rounded-xl border-hairline text-xs" style={{ backgroundColor: 'var(--surface-sunken)' }}>
              <span className="text-[10px] px-2 font-medium" style={{ color: 'var(--primary-subtle-text)' }}>
                {isInterviewAr ? 'العدد:' : 'Count:'}
              </span>
              {[3, 4, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  disabled={isSessionRunning}
                  className="px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer"
                  style={questionCount === cnt ? { backgroundColor: 'var(--primary)', color: 'var(--surface)' } : { color: 'var(--primary-subtle-text)' }}
                >
                  {cnt} {isInterviewAr ? 'أسئلة' : 'Q'}
                </button>
              ))}
            </div>

            {/* Type selector */}
            <div className="flex items-center p-1 rounded-xl border-hairline text-xs gap-1" style={{ backgroundColor: 'var(--surface-sunken)' }}>
              {(['Technical', 'Behavioral', 'HR', 'Mixed'] as const).map((t) => {
                const label =
                  t === 'Technical'
                    ? isInterviewAr ? 'تقنية' : 'Tech'
                    : t === 'Behavioral'
                    ? isInterviewAr ? 'سلوكية (STAR)' : 'Behavioral'
                    : t === 'HR'
                    ? isInterviewAr ? 'HR ثقافة' : 'HR'
                    : isInterviewAr ? 'مختلطة' : 'Mixed';
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInterviewType(t)}
                    disabled={isSessionRunning}
                    className="px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer"
                    style={interviewType === t ? { backgroundColor: 'var(--success)', color: 'var(--surface)' } : { color: 'var(--primary-subtle-text)' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tracks horizontal chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {TRACKS_CATALOG.map((track) => {
            const isSelected = selectedTrack === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  if (!isSessionRunning) setSelectedTrack(track.id);
                }}
                disabled={isSessionRunning}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border-hairline"
                style={isSelected ? {
                  background: 'var(--gradient-primary)',
                  color: 'var(--surface)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                } : {
                  backgroundColor: 'var(--surface-sunken)',
                  color: 'var(--primary-subtle-text)'
                }}
              >
                <span>
                  {renderTrackIcon(track.icon, 'w-3.5 h-3.5')}
                </span>
                <span>{isInterviewAr ? track.nameAr : track.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Track Details Preview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs" style={{ borderTop: '1px solid var(--border-muted)' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-on-dark-secondary)' }}>
            <span className="font-bold" style={{ color: 'var(--surface)' }}>
              {isInterviewAr ? currentTrackMeta.nameAr : currentTrackMeta.nameEn}:
            </span>
            <span className="text-[11px]">
              {isInterviewAr ? currentTrackMeta.descriptionAr : currentTrackMeta.descriptionEn}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border-hairline" style={{ backgroundColor: 'var(--success-subtle)', color: 'var(--success-strong)' }}>
              <Sparkles className="w-3 h-3" />
              <span>
                {isInterviewAr
                  ? `${totalTrackQuestions}+ سؤال جاهز لهذا التراك`
                  : `${totalTrackQuestions}+ questions ready`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── End-of-Session Corrections Review Panel ──────────────────── */}
      {showReview && activeSession && (
        <div className="p-6 rounded-2xl space-y-5 surface-elevated" style={{ background: 'var(--gradient-subtle)', borderWidth: '2px', borderColor: 'var(--primary-muted)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                <Award className="w-5 h-5" style={{ color: 'var(--surface)' }} />
              </div>
              <div>
                <h2 className="heading-base">
                  {isInterviewAr ? '📋 تقرير المقابلة الكامل — تصحيحات AI' : '📋 Full Interview Report — AI Corrections'}
                </h2>
                <p className="body-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {isInterviewAr
                    ? `جلسة ${activeSession.type} · ${formatTimer(sessionElapsed)} · ${activeSession.questions.filter(q => q.userAnswer).length} إجابات`
                    : `${activeSession.type} session · ${formatTimer(sessionElapsed)} · ${activeSession.questions.filter(q => q.userAnswer).length} answers`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeSession.overallScore && (
                <span className="text-2xl font-black px-4 py-1.5 rounded-xl border-hairline surface-elevated" style={{ color: 'var(--primary-strong)' }}>
                  {activeSession.overallScore}%
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {activeSession.questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 surface-elevated border-hairline rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-strong)' }}>
                      {idx + 1}
                    </span>
                    <p className="body-sm font-semibold">{q.question}</p>
                  </div>
                  {q.feedback?.score && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0" style={
                      q.feedback.score >= 75 ? { backgroundColor: 'var(--success-subtle)', color: 'var(--success-strong)' }
                      : q.feedback.score >= 50 ? { backgroundColor: 'var(--warning-subtle)', color: 'var(--warning-strong)' }
                      : { backgroundColor: 'var(--error-subtle)', color: 'var(--error-strong)' }
                    }>
                      {q.feedback.score}%
                    </span>
                  )}
                </div>

                {q.userAnswer ? (
                  <>
                    <div className="p-3 border-hairline rounded-lg" style={{ backgroundColor: 'var(--surface-sunken)' }}>
                      <span className="text-[10px] font-mono uppercase block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        {isInterviewAr ? 'إجابتك:' : 'Your Answer:'}
                      </span>
                      <p className="body-sm italic" style={{ color: 'var(--text-secondary)' }}>"{q.userAnswer}"</p>
                    </div>

                    {q.feedback ? (
                      <div className="space-y-2">
                        {q.feedback.strengths.length > 0 && (
                          <div>
                            <span className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--success-strong)' }}>
                              {isInterviewAr ? '✅ نقاط القوة:' : '✅ Strengths:'}
                            </span>
                            {q.feedback.strengths.map((s, i) => (
                              <div key={i} className="body-sm flex items-start gap-1.5 mb-0.5">
                                <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.feedback.suggestedRefinement && (
                          <div className="p-3 border-hairline rounded-lg" style={{ backgroundColor: 'var(--primary-subtle)' }}>
                            <span className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--primary-strong)' }}>
                              {isInterviewAr ? '💡 الإجابة المثالية المقترحة:' : '💡 Suggested Ideal Answer:'}
                            </span>
                            <p className="body-sm italic" style={{ color: 'var(--primary-text)' }}>"{q.feedback.suggestedRefinement}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="body-sm italic" style={{ color: 'var(--text-tertiary)' }}>
                        {isInterviewAr ? '(لم يتم التقييم بعد)' : '(Not yet evaluated)'}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="body-sm italic px-2" style={{ color: 'var(--text-tertiary)' }}>
                    {isInterviewAr ? '⚠️ لم تتم الإجابة على هذا السؤال' : '⚠️ Question not answered'}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setShowReview(false); handleStartNew(); }}
              className="px-4 py-2 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--surface)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isInterviewAr ? 'بدء جلسة جديدة' : 'New Session'}
            </button>
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="px-4 py-2 surface-elevated border-hairline text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isInterviewAr ? 'إغلاق التقرير' : 'Close Report'}
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Previous Sessions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 surface-elevated border-hairline rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="body-sm font-semibold">
                {isAr ? 'جلسات التدريب السابقة' : 'Practice Sessions'}
              </span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {interviews.length} {isAr ? 'جلسات' : 'sessions'}
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {interviews.map((int) => {
                const isSelected = activeSession?.id === int.id;
                return (
                  <div
                    key={int.id}
                    onClick={() => {
                      stopSpeaking();
                      stopListening();
                      setActiveSession(int);
                      setSelectedQuestionIndex(0);
                    }}
                    className="p-3 rounded-lg border-hairline body-sm cursor-pointer transition-all"
                    style={isSelected ? {
                      borderColor: 'var(--primary)',
                      backgroundColor: 'var(--primary-subtle)'
                    } : {
                      backgroundColor: 'var(--surface)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{int.type}</span>
                        {int.completed && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono" style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-secondary)' }}>
                            {isAr ? 'مكتملة' : 'Done'}
                          </span>
                        )}
                      </div>
                      {int.overallScore && (
                        <span className="font-mono tabular-nums font-bold px-2 py-0.5 rounded text-[11px]" style={{ color: 'var(--primary-strong)', backgroundColor: 'var(--primary-subtle)' }}>
                          {int.overallScore}%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-1 flex justify-between" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{int.jobRole}</span>
                      <span>{formatDate(int.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Simulator Console */}
        <div className="lg:col-span-8 space-y-6">
          {activeSession ? (
            <div className="p-6 surface-elevated border-hairline rounded-xl space-y-6">
              {/* Session Top Bar & Question Selector Tabs */}
              <div className="pb-4 space-y-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="body-sm font-bold">
                      {activeSession.jobRole} · {activeSession.type}
                    </span>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {isInterviewAr ? 'السؤال' : 'Question'} {selectedQuestionIndex + 1} {isInterviewAr ? 'من' : 'of'}{' '}
                      {activeSession.questions.length}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeSession.completed && (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--surface)' }}>
                        {isInterviewAr ? 'النتيجة الإجمالية' : 'Overall'}: {activeSession.overallScore}%
                      </span>
                    )}
                  </div>
                </div>


                {/* Question Pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  {activeSession.questions.map((q, idx) => {
                    const isCur = selectedQuestionIndex === idx;
                    const hasAnswer = Boolean(q.userAnswer);
                    const hasScore = typeof q.feedback?.score === 'number';

                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => {
                          stopSpeaking();
                          stopListening();
                          setSelectedQuestionIndex(idx);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
                        style={isCur ? {
                          backgroundColor: 'var(--text-primary)',
                          color: 'var(--surface)'
                        } : hasScore ? {
                          backgroundColor: 'var(--surface-raised)',
                          color: 'var(--text-primary)'
                        } : {
                          backgroundColor: 'var(--surface-subtle)',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        <span>
                          {isAr ? 'سؤال' : 'Q'} {idx + 1}
                        </span>
                        {hasScore ? (
                          <span
                            className="text-[10px] font-mono font-bold"
                            style={{ color: isCur ? 'var(--success-subtle-text)' : 'var(--success-strong)' }}
                          >
                            {q.feedback!.score}%
                          </span>
                        ) : hasAnswer ? (
                          <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Question Display & Interviewer Audio Card */}
              {currentQ && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl space-y-3 relative overflow-hidden" style={{ background: 'var(--gradient-dark)', color: 'var(--surface)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <Headphones className="w-3.5 h-3.5" style={{ color: 'var(--primary-subtle-text)' }} />
                        </div>
                        <span className="text-[11px] font-mono tracking-wider uppercase" style={{ color: 'var(--text-on-dark-secondary)' }}>
                          {isAr ? 'سؤال مسؤول المقابلة (AI Interviewer)' : 'INTERVIEWER QUESTION'}
                        </span>
                      </div>

                      {/* TTS Audio Controls */}
                      <div className="flex items-center gap-2">
                        {isSpeakingQuestion ? (
                          <button
                            type="button"
                            onClick={stopSpeaking}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer animate-pulse"
                            style={{ backgroundColor: 'var(--error)', color: 'var(--surface)' }}
                          >
                            <Square className="w-3 h-3" />
                            <span>{isAr ? 'إيقاف الصوت' : 'Stop Audio'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSpeakQuestion(currentQ.question)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'var(--surface)' }}
                          >
                            <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--primary-subtle-text)' }} />
                            <span>{isAr ? 'استمع للسؤال' : 'Listen Question'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-semibold leading-relaxed">
                      "{currentQ.question}"
                    </h3>

                    {/* Interviewer Speaking Soundwave Animation */}
                    {isSpeakingQuestion && (
                      <div className="pt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--primary-subtle-text)' }}>
                        <div className="flex items-end gap-1 h-4">
                          <span className="w-1 rounded-full h-2 animate-pulse" style={{ backgroundColor: 'var(--primary-subtle-text)' }} />
                          <span className="w-1 rounded-full h-4 animate-pulse delay-75" style={{ backgroundColor: 'var(--primary-subtle-text)' }} />
                          <span className="w-1 rounded-full h-3 animate-pulse delay-150" style={{ backgroundColor: 'var(--primary-subtle-text)' }} />
                          <span className="w-1 rounded-full h-4 animate-pulse delay-100" style={{ backgroundColor: 'var(--primary-subtle-text)' }} />
                          <span className="w-1 rounded-full h-1 animate-pulse delay-200" style={{ backgroundColor: 'var(--primary-subtle-text)' }} />
                        </div>
                        <span className="text-[11px] font-medium">
                          {isAr ? 'مسؤول المقابلة يتحدث الآن...' : 'Interviewer is speaking...'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* If previous feedback exists on this question */}
                  {currentQ.feedback ? (
                    <div className="p-5 border-hairline rounded-xl space-y-4 text-xs" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                          <span className="heading-sm">
                            {isAr ? 'تقييم وتوجيه الذكاء الاصطناعي (STAR Coaching)' : 'AI Coaching & Feedback'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-bold text-sm px-3 py-0.5 rounded-full" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--surface)' }}>
                            {currentQ.feedback.score}%
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleSpeakQuestion(
                                `${isAr ? 'النتيجة' : 'Score'}: ${currentQ.feedback!.score}%. ${
                                  currentQ.feedback!.suggestedRefinement
                                }`
                              )
                            }
                            title={isAr ? 'قراءة التقييم صوتياً' : 'Read feedback aloud'}
                            className="p-1.5 rounded-lg cursor-pointer transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Candidate Answer Display */}
                      {currentQ.userAnswer && (
                        <div className="p-3 surface-elevated border-hairline rounded-lg space-y-1">
                          <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--text-tertiary)' }}>
                            {isAr ? 'إجابتك المسجلة:' : 'Your Answer:'}
                          </span>
                          <p className="italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            "{currentQ.userAnswer}"
                          </p>
                        </div>
                      )}

                      {/* Strengths */}
                      <div>
                        <span className="font-semibold block mb-1.5" style={{ color: 'var(--success-strong)' }}>
                          {isAr ? 'نقاط القوة في إجابتك:' : 'Key Strengths:'}
                        </span>
                        <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {currentQ.feedback.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Refinement */}
                      <div className="pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <span className="font-semibold block mb-1" style={{ color: 'var(--primary-strong)' }}>
                          {isAr ? 'صيغة الإجابة المثالية المقترحة:' : 'Suggested STAR Refinement:'}
                        </span>
                        <p className="italic p-3 rounded-lg border-hairline leading-relaxed surface-elevated" style={{ color: 'var(--text-secondary)' }}>
                          "{currentQ.feedback.suggestedRefinement}"
                        </p>
                      </div>

                      {/* Next Question Navigation Button */}
                      {selectedQuestionIndex + 1 < activeSession.questions.length && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              stopSpeaking();
                              stopListening();
                              setSelectedQuestionIndex(selectedQuestionIndex + 1);
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--surface)' }}
                          >
                            <span>{isAr ? 'الانتقال للسؤال التالي' : 'Next Question'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Interactive Voice & Text Answer Form */
                    <div className="space-y-4">
                      {/* Voice Recording Control Bar */}
                      <div className="p-4 rounded-xl space-y-3 border-hairline" style={{ background: 'var(--gradient-subtle)' }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {/* Big Pulse Record Button */}
                            <button
                              type="button"
                              onClick={toggleListening}
                              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                                isListeningAnswer ? 'animate-pulse' : ''
                              }`}
                              style={isListeningAnswer ? {
                                backgroundColor: 'var(--error)',
                                color: 'var(--surface)',
                                boxShadow: '0 0 0 4px var(--error-subtle)'
                              } : {
                                backgroundColor: 'var(--primary)',
                                color: 'var(--surface)'
                              }}
                            >
                              {isListeningAnswer ? (
                                <>
                                  <MicOff className="w-4 h-4 animate-bounce" />
                                  <span>{isAr ? 'إيقاف التسجيل الصوتي' : 'Stop Speaking'}</span>
                                </>
                              ) : (
                                <>
                                  <Mic className="w-4 h-4" />
                                  <span>{isAr ? 'اضغط وتحدث بالإجابة (صوتي)' : 'Speak Your Answer (Voice)'}</span>
                                </>
                              )}
                            </button>

                            {/* Live Recording Indicator */}
                            {isListeningAnswer && (
                              <div className="flex items-center gap-2 px-3 py-1 surface-elevated border-hairline rounded-lg text-xs font-mono" style={{ color: 'var(--error)' }}>
                                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--error)' }} />
                                <span>REC {formatTimer(recordingSeconds)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="text-[11px]">
                              {isAr
                                ? 'اللغة الحالية: ' + (voiceLanguage === 'ar-EG' ? 'عربي' : 'English')
                                : 'Language: ' + voiceLanguage}
                            </span>
                          </div>
                        </div>

                        {/* Speech Error Banner */}
                        {speechError && (
                          <div className="p-2.5 border-hairline rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'var(--error-subtle)', color: 'var(--error-strong)' }}>
                            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--error)' }} />
                            <span>{speechError}</span>
                          </div>
                        )}

                        {/* Live Waveform when speaking */}
                        {isListeningAnswer && (
                          <div className="p-3 surface-elevated border-hairline rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--primary-strong)' }}>
                              <Radio className="w-4 h-4 animate-pulse" style={{ color: 'var(--primary)' }} />
                              <span>{isAr ? 'الميكروفون يستمع لك الآن... تكلم بطلاقة' : 'Listening live... speak naturally'}</span>
                            </div>
                            <div className="flex items-end gap-1 h-5">
                              <span className="w-1 animate-pulse rounded-full h-3" style={{ backgroundColor: 'var(--primary)' }} />
                              <span className="w-1 animate-pulse rounded-full h-5 delay-75" style={{ backgroundColor: 'var(--primary-strong)' }} />
                              <span className="w-1 animate-pulse rounded-full h-2 delay-150" style={{ backgroundColor: 'var(--primary-muted)' }} />
                              <span className="w-1 animate-pulse rounded-full h-4 delay-100" style={{ backgroundColor: 'var(--primary-strong)' }} />
                              <span className="w-1 animate-pulse rounded-full h-5 delay-200" style={{ backgroundColor: 'var(--primary)' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Text Input / Transcription Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {isAr
                              ? 'نص إجابتك (يتم تفريغه تلقائياً من الصوت، أو يمكنك الكتابة والتعديل):'
                              : 'Your Answer (Transcribed automatically from speech, or type directly):'}
                          </label>
                          {answerDraft && (
                            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                              {answerDraft.split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
                            </span>
                          )}
                        </div>

                        <textarea
                          rows={6}
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          placeholder={
                            isAr
                              ? 'تحدث في الميكروفون بالأعلى لتفريغ إجابتك هنا، أو اكتب مباشرة بصيغة STAR (الموقف، الإجراء، والنتيجة)...'
                              : 'Speak using the microphone above to transcribe in real time, or type your STAR response directly...'
                          }
                          className="w-full text-xs p-3.5 border-hairline rounded-xl outline-none leading-relaxed font-sans"
                          style={{
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-primary)',
                            '--tw-ring-color': 'var(--primary-muted)'
                          } as React.CSSProperties}
                        />
                      </div>

                      {/* Action Submission Buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setAnswerDraft('')}
                          disabled={!answerDraft || isSubmittingAnswer}
                          className="text-xs underline cursor-pointer disabled:opacity-30"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {isAr ? 'مسح الإجابة' : 'Clear Draft'}
                        </button>

                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmittingAnswer || !answerDraft.trim()}
                          className="px-5 py-2.5 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-40"
                          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--surface)' }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {isSubmittingAnswer
                              ? isAr
                                ? 'جاري تقييم الإجابة بـ AI...'
                                : 'Evaluating with AI...'
                              : isAr
                              ? 'إرسال الإجابة واعتماد التقييم'
                              : 'Submit & Get STAR Evaluation'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center body-sm surface-elevated border-hairline rounded-xl space-y-3" style={{ color: 'var(--text-tertiary)' }}>
              <Headphones className="w-8 h-8 mx-auto" style={{ color: 'var(--text-tertiary)' }} />
              <p>
                {isAr
                  ? 'لا توجد جلسة نشطة. اختر جلسة من القائمة أو ابدأ محاكاة صوتية جديدة بالأعلى.'
                  : 'No active session. Select a session or start a new voice simulation above.'}
              </p>
              <button
                type="button"
                onClick={handleStartNew}
                className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--surface)' }}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isAr ? 'بدء محاكاة الآن' : 'Start Simulation Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
