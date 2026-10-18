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

const MAX_SIZE = 10 * 1024 * 1024;

const EXTRACTION_INSTRUCTION = `You are the Resume Intelligence Extraction Agent in CareerPilot AI.
Extract structured professional profile information from the parsed resume document text.
Strict Rules:
1. Extract true factual data only. Never invent companies, dates, degrees, metrics, or credentials.
2. Extract the candidate's full name, contact information, professional headline, and summary.
3. Group roles, companies, dates, responsibilities, and achievements cleanly.
4. Extract education degrees, institutions, graduation dates, and certifications.
5. Extract all verified technical skills and tools into clean canonical names.
Return ONLY valid JSON matching this shape:
{"fullName":"","email":"","phone":"","headline":"","location":"","summary":"","skills":[],"experience":[{"company":"","role":"","location":"","startDate":"","endDate":"","current":false,"responsibilities":[],"achievements":[]}],"education":[{"institution":"","degree":"","field":"","startDate":"","endDate":"","current":false}],"certifications":[]}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function base64ToBytes(data: string): Uint8Array {
  const clean = data.startsWith('data:') ? data.split(',')[1] || '' : data;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join('\n') : text;
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  const { unzipSync, strFromU8 } = await import('fflate');
  const files = unzipSync(bytes);
  const doc = files['word/document.xml'];
  if (!doc) return '';
  const xml = strFromU8(doc);
  return xml
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

function deterministicExtract(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
  const phoneMatch = text.match(/(\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g);
  const phone = phoneMatch?.find((p) => p.replace(/\D/g, '').length >= 8);

  const known = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL',
    'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Git', 'HTML', 'CSS',
    'Tailwind CSS', 'FastAPI', 'Power BI', 'Excel', 'Figma', 'Next.js',
    'REST APIs', 'GraphQL', 'C++', 'Java', 'Linux',
  ];
  const lower = text.toLowerCase();
  const skills = known.filter((k) => lower.includes(k.toLowerCase()));

  const nameLine = lines.find((l) => {
    const words = l.split(/\s+/);
    return words.length >= 2 && words.length <= 4 && /^[A-Za-z؀-ۿ\s.'-]+$/.test(l);
  });

  const isContactLine = (l: string) =>
    /@/.test(l) || /\d{3}/.test(l) || /^https?:/i.test(l) || /linkedin/i.test(l);

  const headlineLine = lines.find(
    (l) => l !== nameLine && !isContactLine(l) && l.length >= 3 && l.length <= 80
  );

  return {
    fullName: nameLine || '',
    email: emailMatch?.[0] || '',
    phone: phone || '',
    headline: headlineLine || '',
    location: '',
    summary: lines.slice(0, 6).join(' ').slice(0, 400),
    skills,
    experience: [],
    education: [],
    certifications: [],
  };
}

async function aiExtract(text: string, apiKey?: string): Promise<{ data: any | null; error?: string }> {
  if (!apiKey) return { data: null, error: 'no-api-key' };
  let lastErr = '';
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: EXTRACTION_INSTRUCTION }] },
            contents: [{ role: 'user', parts: [{ text: text.slice(0, 30000) }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
          }),
        }
      );
      if (!res.ok) {
        lastErr = `${model}: HTTP ${res.status}`;
        continue;
      }
      const data = (await res.json()) as any;
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) {
        lastErr = `${model}: no-text`;
        continue;
      }
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end <= start) {
        lastErr = `${model}: no-json`;
        continue;
      }
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (parsed && typeof parsed === 'object') return { data: parsed };
    } catch (e: any) {
      lastErr = `${model}: ${e?.message || 'parse-error'}`;
      continue;
    }
  }
  return { data: null, error: lastErr };
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { fileName, fileData } = (await context.request.json()) as any;
    if (!fileName || !fileData) {
      return json({ success: false, error: 'Both fileName and fileData are required for upload.' }, 400);
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      return json({ success: false, error: `Unsupported file extension .${ext || 'unknown'}. Allowed formats: PDF, DOCX, TXT.` }, 400);
    }

    const bytes = base64ToBytes(fileData);
    if (bytes.length === 0) {
      return json({ success: false, error: 'Uploaded file is empty (0 bytes). Please upload a valid document.' }, 400);
    }
    if (bytes.length > MAX_SIZE) {
      return json({ success: false, error: 'File exceeds 10MB limit. Please upload a smaller document.' }, 400);
    }

    if (ext === 'pdf') {
      const header = String.fromCharCode(...bytes.subarray(0, 5));
      if (!header.startsWith('%PDF')) {
        return json({ success: false, error: 'Corrupt or invalid PDF file header.' }, 400);
      }
    } else if (ext === 'docx') {
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        return json({ success: false, error: 'Corrupt or invalid DOCX document archive.' }, 400);
      }
    }

    let text = '';
    if (ext === 'pdf') {
      text = await extractPdf(bytes);
    } else if (ext === 'docx' || ext === 'doc') {
      text = await extractDocx(bytes);
    } else {
      text = new TextDecoder().decode(bytes);
    }

    if (!text || text.trim().length < 15) {
      return json({ success: false, error: 'Document appears to be empty or unscannable image. Please provide a text-based PDF or DOCX.' }, 422);
    }

    const apiKey = context.env.GEMINI_API_KEY || context.env.VITE_GEMINI_API_KEY;
    const aiResult = await aiExtract(text, apiKey);
    const fallback = deterministicExtract(text);
    let extracted: any;
    let extractionMethod: 'ai' | 'deterministic';
    let aiError: string | undefined;

    if (!aiResult.data) {
      extracted = fallback;
      extractionMethod = 'deterministic';
      aiError = aiResult.error;
    } else {
      extracted = aiResult.data;
      extracted.skills = Array.from(new Set([...(aiResult.data.skills || []), ...fallback.skills]));
      if (!extracted.email) extracted.email = fallback.email;
      if (!extracted.phone) extracted.phone = fallback.phone;
      if (!extracted.fullName) extracted.fullName = fallback.fullName;
      extractionMethod = 'ai';
    }

    const docRecord = {
      id: `doc-${Date.now()}`,
      fileName,
      fileSizeBytes: bytes.length,
      fileType: ext === 'doc' ? 'docx' : ext,
      extractedText: text.slice(0, 15000),
      extractedProfile: extracted,
      uploadedAt: new Date().toISOString(),
    };

    return json({
      success: true,
      document: docRecord,
      extractedInfo: extracted,
      extractionMethod,
      rawTextPreview: text.slice(0, 1000),
    });
  } catch (err: any) {
    return json({ success: false, error: err?.message || 'Resume upload failed' }, 500);
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