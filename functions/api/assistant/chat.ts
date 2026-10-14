interface Env {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
];

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { message, history } = await context.request.json() as any;
    const apiKey = context.env.GEMINI_API_KEY || context.env.VITE_GEMINI_API_KEY;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemInstruction = `أنت مساعد CareerPilot AI الذكي والمباشر.
تعليمات صارمة جداً للإجابة:
1. أجب فقط وحصرياً على ما طلبه أو سأل عنه المستخدم بدقة واحترافية. لا تضف أي نصائح إضافية لم يطلبها، ولا مقدمات مطولة.
2. ممنوع منعاً باتاً استخدام علامة النجمة (* أو **) نهائياً في أي جزء من الرد للتنسيق أو التغميق. اكتب نصاً نظيفاً وواضحاً ومريحاً للعين.
3. إذا احتجت إلى تعداد، استخدم الأرقام (1. 2. 3.) أو النقطة العادية (•) وليس نجوماً.
4. الرد بنفس لغة المستخدم: إذا كتب بالعربية أجب بالعربية، وإذا كتب بالإنجليزية أجب بالإنجليزية.`;

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

    let reply = '';
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json() as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            reply = text
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .replace(/^[ \t]*-[ \t]*/gm, '• ')
              .trim();
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!reply) {
      reply = 'مرحباً بك! أنا مساعدك المهني في CareerPilot. كيف يمكنني مساعدتك اليوم في سيرتك الذاتية، التحضير للمقابلات، أو مسارك المهني؟';
    }

    return new Response(JSON.stringify({ success: true, reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
