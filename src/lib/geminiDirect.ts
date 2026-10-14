import { clientDb } from './clientDb.js';

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
];

export async function generateClientGeminiReply(
  message: string,
  history: { role: 'user' | 'assistant'; text: string }[] = []
): Promise<string> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof window !== 'undefined' && (window as any).__GEMINI_KEY__);

  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const profile = clientDb.getProfile();
  const fullName = profile?.fullName || 'مستخدم CareerPilot';
  const targetRole = profile?.targetRole || 'مهني / باحث عن عمل';
  const skillsList = profile?.skills?.map((s) => s.canonicalName).join(', ') || 'مهارات تقنية وعملية';
  const readiness = profile?.readiness?.overallScore ?? 75;

  const systemInstructionText = `أنت مساعد CareerPilot AI الذكي والمباشر.
سياق الملف المهني للمستخدم:
- الاسم: ${fullName}
- الدور المستهدف: ${targetRole}
- المهارات: ${skillsList}
- الجاهزية المهنية: ${readiness}/100

تعليمات صارمة جداً للإجابة:
1. أجب فقط وحصرياً على ما طلبه أو سأل عنه المستخدم بدقة واحترافية. لا تضف نصائح غير مطلوبة أو مقدمات إنشائية طويلة.
2. ممنوع منعاً باتاً استخدام علامة النجمة (* أو **) نهائياً في أي جزء من الرد للتنسيق أو التغميق. اكتب نصاً نظيفاً وواضحاً ومريحاً للعين.
3. إذا احتجت إلى تعداد، استخدم الأرقام (1. 2. 3.) أو النقطة العادية (•) وليس نجوماً.
4. الرد بنفس لغة المستخدم: إذا كتب بالعربية أجب بالعربية، وإذا كتب بالإنجليزية أجب بالإنجليزية.`;

  // Build Gemini contents array
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  const recentHistory = (history || []).slice(-6);
  for (const item of recentHistory) {
    contents.push({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstructionText }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `Status ${res.status}`;
        lastError = new Error(`${model}: ${errMsg}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText && typeof rawText === 'string') {
        return rawText
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^[ \t]*-[ \t]*/gm, '• ')
          .trim();
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // If Gemini calls failed (e.g. offline or strict firewall), provide domain fallback
  return getOfflineFallbackReply(message, profile);
}

function getOfflineFallbackReply(message: string, profile: any): string {
  const query = message.toLowerCase();
  const targetRole = profile?.targetRole || 'مجالك المهني';
  const skills = profile?.skills?.map((s: any) => s.canonicalName).join('، ') || 'مهاراتك الحالية';

  if (query.includes('سيرة') || query.includes('cv') || query.includes('resume')) {
    return `بناءً على ملفك المهني لدور ${targetRole}، يمكنك تحسين سيرتك الذاتية من خلال قسم CV Studio في المنصة:
1. تأكد من إبراز مهاراتك الرئيسية: ${skills}.
2. صياغة الإنجازات بالأرقام والنتائج المحققة بدلاً من سرد المسؤوليات فقط.
3. الاستفادة من فحص ATS الذكي المتاح داخل المنصة للتأكد من توافق سيرتك بنسبة 100%.`;
  }

  if (query.includes('مقابلة') || query.includes('انترفيو') || query.includes('interview')) {
    return `للتحضير لمقابلات ${targetRole}:
1. تدرب على الأسئلة السلوكية باستخدام طريقة STAR (الموقف، المهمة، الإجراء، النتيجة).
2. راجع الأسئلة التقنية التفاعلية في قسم Interview Prep داخل المنصة.
3. كن مستعداً لشرح التحديات التي واجهتك وكيف تغلبت عليها برمجياً أو مهنياً.`;
  }

  if (query.includes('مسار') || query.includes('خطة') || query.includes('تعلم') || query.includes('roadmap')) {
    return `بناءً على جاهزيتك المهنية (${profile?.readiness?.overallScore ?? 75}%) ولدور ${targetRole}:
1. افتح قسم Roadmaps للاطلاع على مسار التعلم المخصص لك خطوة بخطوة.
2. ركز أولاً على تغطية أي مهارات مفقودة من المهارات المطلوبة في السوق.
3. أنجز المشاريع العملية المصغرة لتعزيز محفظة أعمالك وجذب مسؤولي التوظيف.`;
  }

  return `أهلاً بك! بصفتي مساعدك المهني الذكي في CareerPilot:
أنا هنا لمساعدتك في تطوير سيرتك الذاتية، التحضير للمقابلات، ومتابعة تقدمك نحو دور ${targetRole}.
يمكنك سؤالي عن نصائح مخصصة، مراجعة أي نقاط محددة في ملفك، أو استكشاف الخطوات القادمة في مسارك المهني.`;
}
