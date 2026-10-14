export type CareerTrackId =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'devops'
  | 'datascience'
  | 'dataengineering'
  | 'cybersecurity'
  | 'uiux'
  | 'qa'
  | 'product'
  | 'freshgrad';

export interface CareerTrackMeta {
  id: CareerTrackId;
  nameEn: string;
  nameAr: string;
  icon: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface TrackQuestionBank {
  HR: { ar: string[]; en: string[] };
  Behavioral: { ar: string[]; en: string[] };
  Technical: { ar: string[]; en: string[] };
  Mixed: { ar: string[]; en: string[] };
}

export const TRACKS_CATALOG: CareerTrackMeta[] = [
  {
    id: 'fullstack',
    nameEn: 'Full-Stack & AI Engineer',
    nameAr: 'مهندس برمجيات متكامل وذكاء اصطناعي',
    icon: 'Layers',
    descriptionEn: 'End-to-end web apps, LLM integration, APIs, microservices, and databases.',
    descriptionAr: 'تطوير التطبيقات المتكاملة ودمج نماذج الذكاء الاصطناعي وقواعد البيانات.',
  },
  {
    id: 'frontend',
    nameEn: 'Frontend Developer',
    nameAr: 'مطور واجهات أمامية (Frontend)',
    icon: 'Layout',
    descriptionEn: 'React, Next.js, TypeScript, CSS, Core Web Vitals, and responsive UI/UX.',
    descriptionAr: 'رياكت، نكست، تايب سكريبت، تحسين سرعة الواجهات وتجربة المستخدم.',
  },
  {
    id: 'backend',
    nameEn: 'Backend Developer',
    nameAr: 'مطور خلفي (Backend)',
    icon: 'Server',
    descriptionEn: 'Node.js, Python, Go, System Design, SQL/NoSQL, Caching, and High Availability.',
    descriptionAr: 'تصميم البنية الخلفية، قواعد البيانات، الكاشينج وهندسة الأنظمة عالية التوسع.',
  },
  {
    id: 'mobile',
    nameEn: 'Mobile App Developer',
    nameAr: 'مطور تطبيقات الموبايل',
    icon: 'Smartphone',
    descriptionEn: 'Flutter, React Native, Swift, Kotlin, native bridges, and offline sync.',
    descriptionAr: 'تطبيقات الهواتف بأنظمة فلاتر ورياكت نيتف وiOS وأندرويد وإدارة الذاكرة.',
  },
  {
    id: 'devops',
    nameEn: 'DevOps & Cloud Engineer',
    nameAr: 'مهندس DevOps وسحابيات',
    icon: 'Cloud',
    descriptionEn: 'Docker, Kubernetes, AWS/GCP, Terraform, CI/CD pipelines, and SRE monitoring.',
    descriptionAr: 'الحاويات، كوبرنيتس، خطوط النشر الآلي، البنية ككود والمراقبة المستمرة.',
  },
  {
    id: 'datascience',
    nameEn: 'Data Scientist & ML Engineer',
    nameAr: 'عالم بيانات ومهندس تعلم آلة',
    icon: 'Cpu',
    descriptionEn: 'Machine Learning, PyTorch, Transformers, MLOps, feature engineering, and evaluation.',
    descriptionAr: 'خوارزميات التعلم الآلي، بايتورش، نماذج اللغة ومعالجة البيانات الضخمة.',
  },
  {
    id: 'dataengineering',
    nameEn: 'Data Engineer',
    nameAr: 'مهندس بيانات (Data Engineer)',
    icon: 'Database',
    descriptionEn: 'ETL/ELT pipelines, Spark, Airflow, BigQuery/Snowflake, Kafka, and Data Lakes.',
    descriptionAr: 'بناء خطوط البيانات، معالجة التدفقات اللحظية ومستودعات البيانات الضخمة.',
  },
  {
    id: 'cybersecurity',
    nameEn: 'Cybersecurity Specialist',
    nameAr: 'أخصائي أمن سيبراني',
    icon: 'Shield',
    descriptionEn: 'Penetration testing, OWASP Top 10, Zero Trust, Incident response, and cryptography.',
    descriptionAr: 'اختبار الاختراق، حماية التطبيقات من الثغرات، التشفير والاستجابة للحوادث.',
  },
  {
    id: 'uiux',
    nameEn: 'UI/UX & Product Designer',
    nameAr: 'مصمم واجهات وتجربة مستخدم',
    icon: 'Palette',
    descriptionEn: 'Figma, Design Systems, User Research, wireframing, usability testing, and WCAG.',
    descriptionAr: 'تصميم نظم الواجهات، أبحاث المستخدمين، قابلية الاستخدام وسهولة الوصول.',
  },
  {
    id: 'qa',
    nameEn: 'QA & Test Automation Engineer',
    nameAr: 'مهندس جودة واختبارات آلية',
    icon: 'CheckSquare',
    descriptionEn: 'Cypress, Playwright, Jest, E2E testing, API testing, load testing, and CI gates.',
    descriptionAr: 'أتمتة الاختبارات الشاملة، اختبارات الأداء وتكامل البرمجيات في خطوط النشر.',
  },
  {
    id: 'product',
    nameEn: 'Product Manager',
    nameAr: 'مدير منتج تقني (Product Manager)',
    icon: 'Target',
    descriptionEn: 'Product discovery, roadmap prioritization (RICE), user analytics, and agile execution.',
    descriptionAr: 'تخطيط خارطة طريق المنتجات، تحديد الأولويات، تحليل المقاييس وقيادة فرق العمل.',
  },
  {
    id: 'freshgrad',
    nameEn: 'Junior / CS Fundamentals',
    nameAr: 'خريج جديد / أساسيات علوم الحاسب',
    icon: 'BookOpen',
    descriptionEn: 'Data Structures, Algorithms, OOP, Git, clean code, and engineering foundations.',
    descriptionAr: 'هياكل البيانات، الخوارزميات، البرمجة كائنية التوجه وأساسيات هندسة البرمجيات.',
  },
];

export const TRACK_QUESTIONS: Record<CareerTrackId, TrackQuestionBank> = {
  // ── 1. FRONTEND DEVELOPER ──────────────────────────────────────────────────
  frontend: {
    Technical: {
      ar: [
        'اشرح دورة حياة مكون React (Component Lifecycle) مع الـ Hooks، وما الفرق بين useEffect و useLayoutEffect؟',
        'كيف يعمل Virtual DOM في React 18 و 19 وما دور Fiber Architecture و Concurrent Mode؟',
        'ما هي معايير Core Web Vitals (LCP, FID/INP, CLS) وكيف تقوم بتحسين كل منها عملياً في تطبيق ضخم؟',
        'اشرح استراتيجيات إدارة الحالة (State Management): متى تفضل Context API ومتى تتجه لـ Redux Toolkit أو Zustand أو TanStack Query؟',
        'ما الفرق بين SSR (Server-Side Rendering) و SSG و ISR و Client-Side Rendering، ومتى تستخدم كلاً منها في Next.js؟',
        'كيف تتعامل مع Memory Leaks في تطبيقات JavaScript للويب، وكيف تستخدم Chrome DevTools Profiler لاكتشافها؟',
        'ما هو الفرق بين Event Bubbling و Event Capturing، وكيف تستفيد من Event Delegation؟',
        'اشرح مفهوم Tree Shaking و Code Splitting و Dynamic Imports وكيف تقلل من حجم الـ Bundle النهائي.',
        'كيف تضمن إمكانية وصول الويب (Accessibility - WCAG 2.1 AA) في الواجهات واستخدام ARIA attributes بشكل سليم؟',
        'ما هو الفرق بين CSS Grid و Flexbox، ومتى يكون استخدام أحدهما أفضل من الآخر؟',
        'كيف تطبق سياسات الأمان في الواجهة الأمامية للحماية من هجمات XSS و CSRF و Clickjacking؟',
        'اشرح كيفية عمل Web Workers و Service Workers ومتى نلجأ لاستخدامها في تطبيقات المتصفح.',
        'ما هي ميزات React 19 الجديدة مثل Server Actions، useOptimistic و useActionState؟',
        'كيف تنظم هيكل Design System قابل لإعادة الاستخدام في مشروع مؤسسي باستخدام Tailwind CSS أو Vanilla CSS؟',
        'ما هو الفرق بين Debounce و Throttle؟ اذكر سيناريو عملي لكل منهما في واجهات المستخدم.',
      ],
      en: [
        'Explain the React component lifecycle with Hooks. What is the fundamental difference between useEffect and useLayoutEffect?',
        'How does the Virtual DOM work in React, and what problem does the Fiber architecture solve with Concurrent Rendering?',
        'Walk through Core Web Vitals (LCP, INP, CLS). How do you practically diagnose and optimize each in a large-scale web app?',
        'Compare state management options: when is React Context sufficient versus Zustand, Redux Toolkit, or TanStack Query (React Query)?',
        'Explain the trade-offs between SSR, SSG, ISR, and CSR in modern frameworks like Next.js.',
        'How do you identify and fix memory leaks in single-page JavaScript applications using Chrome DevTools Memory & Performance panels?',
        'What is the difference between Event Bubbling and Event Capturing? How does Event Delegation enhance runtime efficiency?',
        'Explain Tree Shaking, Code Splitting, and Dynamic Imports. How do you inspect and optimize the final JavaScript bundle size?',
        'How do you ensure WCAG 2.1 AA web accessibility compliance using semantic HTML, ARIA landmarks, and keyboard navigation?',
        'When should you use CSS Grid over Flexbox? Provide real-world layout scenarios for each.',
        'How do you defend a client-side application against XSS, CSRF, and Clickjacking vulnerabilities?',
        'Explain the role of Service Workers and Web Workers. When would you offload heavy computations to a background thread?',
        'What are the core capabilities introduced in React 19, such as Server Actions, useOptimistic, and useActionState?',
        'How do you structure an enterprise Design System for consistency, theme switching, and zero-runtime overhead?',
        'Differentiate between Debouncing and Throttling with practical UI examples (e.g., search autocomplete vs. infinite scroll).',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن موقف اضطررت فيه لإقناع فريق التصميم أو المنتج بتغيير تصميم معين لصعوبة تنفيذه أو لتأثيره السلبي على سرعة الواجهة.',
        'صف مشروعاً واجهت فيه ضغطاً زمنياً شديداً لإطلاق ميزة في الواجهة الأمامية. كيف وازنت بين سرعة التسليم وجودة الكود؟',
        'كيف تتعامل مع مراجعات الكود (Code Reviews) عندما يختلف معك زميل حول طريقة بناء مكون معين؟',
        'احكِ عن مشكلة حرجة ظهرت في بيئة الإنتاج على متصفح أو جهاز معين للمستخدمين ولم تظهر أثناء الاختبار المحلي. كيف تعاملت معها؟',
        'كيف تواكب التطور السريع والمستمر في مكتبات وإطارات عمل الـ Frontend وتختار التقنية الأنسب دون الانجرار وراء الهوس بالترند؟',
      ],
      en: [
        'Describe a situation where you had to push back on a designer or product manager due to performance or technical feasibility constraints.',
        'Tell me about a high-pressure launch where you had to balance clean code practices with immediate delivery deadlines.',
        'How do you navigate code review disagreements regarding architecture, component patterns, or abstraction levels?',
        'Walk me through a production bug that only occurred on specific client devices or browsers. How did you triage and resolve it?',
        'How do you stay ahead of the rapidly evolving frontend ecosystem without falling into the hype trap of rewriting stable code?',
      ],
    },
    HR: {
      ar: [
        'ما الذي جذبك لتقديم طلب في شركتنا تحديداً ولماذا اخترت مسار الواجهات الأمامية؟',
        'أين ترى نفسك تقنياً ومهنياً بعد 3 إلى 5 سنوات من الآن؟',
        'ما هي بيئة العمل التي تساعدك على الإنتاج بأعلى كفاءة: العمل عن بعد بالكامل أم الهجين، وكيف تدير وقتك ذاتياً؟',
        'كيف تتعامل مع المهام الروتينية أو الكود القديم (Legacy Code) الذي يحتاج لصيانة مستمرة دون إحباط؟',
        'ما هي توقعاتك من قائد الفريق والمدير المباشر لضمان نجاحك وتطورك المهني؟',
      ],
      en: [
        'What specifically attracted you to our engineering team and product mission?',
        'Where do you see yourself evolving technically and professionally in the next 3 to 5 years?',
        'What work environment enables you to perform at your peak, and how do you manage asynchronous communication?',
        'How do you stay motivated and deliver value when tasked with maintaining and refactoring complex legacy codebases?',
        'What expectations do you have from your engineering lead to foster your continuous growth and mentorship?',
      ],
    },
    Mixed: {
      ar: [
        'تطبيقك يعاني من تجمد الواجهة (UI Freezing) عند استقبال آلاف التحديثات اللحظية عبر WebSocket في لوحة البيانات. كيف تشخص المشكلة وتعيد هندسة المكونات؟',
        'المدير طلب إطلاق ميزة معقدة قبل مؤتمر الشركة بعد يومين، لكن كود الواجهة يحتوي على ثغرة قد تؤثر على تجربة المستخدمين. ماذا تفعل؟',
        'فريق الـ Backend قام بتغيير صيغة الـ API Response دون إشعار مسبق مما عطل صفحة رئيسية. كيف تدير الأزمة وتمنع تكرارها تقنياً وتنظيمياً؟',
      ],
      en: [
        'Your dashboard UI freezes when receiving thousands of real-time WebSocket updates per second. How do you isolate the bottleneck and re-architect the rendering flow?',
        'Leadership requests releasing a feature in two days for a client demo, but the UI has known accessibility and responsiveness glitches. How do you handle the trade-off?',
        'A backend API breaking change unexpectedly broke the production checkout page. How do you triage the incident and prevent future regressions architecturally?',
      ],
    },
  },

  // ── 2. BACKEND DEVELOPER ───────────────────────────────────────────────────
  backend: {
    Technical: {
      ar: [
        'اشرح مبادئ هندسة النظم الموزعة: ما هي نظرية CAP Theorem وكيف تطبقها عند اختيار قاعدة البيانات؟',
        'ما الفرق بين قواعد البيانات العلاقية (SQL) وقواعد البيانات غير العلاقية (NoSQL)، ومتى تفضل استخدام كل منهما؟',
        'كيف تصمم نظام كاشينج فعال باستخدام Redis، وما هي استراتيجيات التعامل مع Cache Stampede و Cache Invalidation؟',
        'اشرح كيفية عمل الـ Indexing في محركات قواعد البيانات مثل B-Tree و Hash Index وكيف يؤثر على سرعة القراءة والكتابة.',
        'ما الفرق بين RESTful API و GraphQL و gRPC، ومتى تختار كلاً منها للتواصل بين الخدمات؟',
        'كيف تصمم بنية رسائل غير متزامنة (Message Queue) باستخدام Kafka أو RabbitMQ لضمان تسليم الرسائل وعدم فقدانها؟',
        'ما هي خطوات حماية الـ APIs من هجمات DDoS، وكيف تطبق Rate Limiting و Token Bucket Algorithm؟',
        'اشرح مفهوم Database Sharding و Read Replicas و Connection Pooling وكيف تساعد في التوسع الأفقي (Horizontal Scaling).',
        'كيف تتعامل مع المعاملات المالية الحساسة لضمان مبادئ ACID وتفادي الـ Race Conditions باستخدام Pessimistic و Optimistic Locking؟',
        'ما الفرق بين التزامن (Concurrency) والتوازي (Parallelism) وكيف يتعامل محرك لغتك المفضلة (Node Event Loop / Go Goroutines / Python Asyncio) معها؟',
        'كيف تصمم نظام مصادقة آمن باستخدام JWT مع Refresh Tokens وحماية من سرقة الجلسات؟',
        'اشرح نمط الـ Circuit Breaker ونمط الـ Saga في معالجة المعاملات الموزعة عبر الخدمات المصغرة (Microservices).',
        'كيف تقوم بتتبع الأخطاء ومراقبة الأداء في النظم الموزعة باستخدام OpenTelemetry و Distributed Tracing؟',
        'ما هي أفضل الممارسات لتصميم Database Schema قادرة على تحمل ملايين السجلات مع ضمان سرعة استعلامات الـ JOIN؟',
        'كيف تضمن Zero-Downtime Database Migration في بيئة إنتاج تعمل على مدار الساعة؟',
      ],
      en: [
        'Explain the CAP theorem in distributed systems. How do you evaluate consistency vs availability when picking storage engines?',
        'Compare relational databases (PostgreSQL/MySQL) with NoSQL (MongoDB/DynamoDB). What access patterns justify each choice?',
        'How do you design a high-throughput caching tier with Redis? How do you prevent Cache Stampede and handle Cache Invalidation?',
        'Walk through how B-Tree database indexing works internally. How do composite indexes impact read vs write performance?',
        'Compare REST, GraphQL, and gRPC. What criteria determine the communication protocol between internal microservices vs public clients?',
        'How do you implement an event-driven architecture with Kafka or RabbitMQ ensuring exactly-once or at-least-once message delivery?',
        'How do you secure public APIs against abuse using Rate Limiting algorithms (Token Bucket, Leaky Bucket, Sliding Window)?',
        'Explain Database Sharding, Read Replicas, and Connection Pooling. How do they enable horizontal scaling under high concurrent read/write loads?',
        'How do you guarantee ACID compliance in payment transactions while avoiding deadlocks using Optimistic vs Pessimistic locking?',
        'Differentiate between Concurrency and Parallelism. How does your runtime of choice (Node Event Loop, Go Goroutines, Java virtual threads) handle I/O bound workloads?',
        'How do you design a secure stateless authentication system using access tokens and rotating refresh tokens with blacklisting?',
        'Explain the Circuit Breaker pattern and the Saga pattern for managing distributed transactions across microservices.',
        'How do you implement distributed tracing and observability in microservices using OpenTelemetry, Prometheus, and Grafana?',
        'What are the foundational rules for database schema design when dealing with high-velocity append-heavy tables?',
        'How do you perform zero-downtime database schema migrations for tables with hundreds of millions of active records?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن عطل إنتاجي فادح (Outage) واجهته في الخوادم أو قاعدة البيانات. كيف كان تسلسل تصرفك لاحتواء المشكلة وحلها؟',
        'صف قراراً معمارياً اتخذته سابقاً واكتشفت لاحقاً أنه لم يكن الخيار الأمثل. كيف تداركت الأمر وماذا تعلمت؟',
        'كيف تدير الخلاف مع مطوري الواجهة الأمامية عندما تكون متطلبات الـ API غير متوافقة أو معقدة؟',
        'احكِ عن موقف قمت فيه بتحسين أداء استعلام بطيء أو معالجة معقدة قللت من استهلاك الموارد بنسبة كبيرة.',
        'كيف توازن بين بناء كود معماري مثالي (Over-Engineering) وبين تسليم المطلوب للعمل بسرعة مع الالتزام بالمعايير؟',
      ],
      en: [
        'Walk me through a severe production outage you investigated. What were your immediate steps to diagnose, mitigate, and post-mortem the root cause?',
        'Tell me about an architectural decision you made that you later realized had flaws. How did you remediate it and what did you learn?',
        'How do you collaborate with frontend and mobile teams when negotiating API contracts and payload schemas?',
        'Describe a time when you profiled an expensive database query or memory-intensive background job and drastically reduced resource consumption.',
        'How do you avoid over-engineering while ensuring that the backend infrastructure remains extensible and maintainable?',
      ],
    },
    HR: {
      ar: [
        'لماذا تفضل التخصص في هندسة الـ Backend والنظم بدلاً من الواجهات أو المجالات الأخرى؟',
        'كيف تتعامل مع فترات المناوبة (On-Call) واستقبال التنبيهات في أوقات غير رسمية لحل الأعطال الطارئة؟',
        'ما هي معاييرك لتقييم صحة وجودة الكود داخل الفريق؟',
        'كيف تتعلم التقنيات المعمارية الجديدة وتتحقق من جدواها قبل اقتراحها في مشاريع الشركة؟',
        'ما هي خطتك للتطور خلال أول 90 يوماً في هذا المنصب؟',
      ],
      en: [
        'Why did you choose backend systems engineering as your primary professional craft?',
        'How do you handle on-call responsibilities, incident escalation, and urgent off-hours incident response?',
        'What code quality metrics, linting standards, and architectural reviews do you advocate for inside an engineering culture?',
        'How do you vet emerging backend technologies or databases before advocating for their adoption in production?',
        'What is your target 30-60-90 day impact roadmap upon joining our backend engineering team?',
      ],
    },
    Mixed: {
      ar: [
        'معدل استهلاك المعالج وقاعدة البيانات ارتفع إلى 99% فجأة في الـ Black Friday واستجابة الموقع تتجاوز 10 ثوانٍ. ما هي خطواتك الدقيقة خلال أول 15 دقيقة؟',
        'فريق الأمان اكتشف ثغرة SQL Injection أو تسريب بيانات في مسار API قديم مستخدم من قبل عملاء مهمين. كيف تدير الإغلاق المؤقت والتصحيح دون إيقاف الخدمة؟',
        'مدير المنتج يطلب تخزين كلمات المرور أو بيانات بطاقات الدفع مباشرة في قاعدة البيانات لتسهيل الدخول السريع. كيف تشرح له المخاطر والبديل القانوني والتقني؟',
      ],
      en: [
        'CPU and database connection usage spike to 99% during a seasonal traffic peak, causing response times to exceed 10 seconds. What are your first 15 minutes of triage actions?',
        'A security audit reveals a potential SQL injection or data leakage vector in a legacy API used by high-tier clients. How do you hotfix the vulnerability safely?',
        'A business stakeholder asks to store raw credentials or payment tokens for a streamlined checkout flow. How do you communicate compliance requirements and present a secure architecture?',
      ],
    },
  },

  // ── 3. FULL-STACK & AI ENGINEER ────────────────────────────────────────────
  fullstack: {
    Technical: {
      ar: [
        'كيف تصمم نظاماً متكاملاً (Full-Stack) يدمج نماذج الذكاء الاصطناعي التوليدي (LLMs) مع الحفاظ على زمن استجابة سريع وتجربة مستخدم تفاعلية (Streaming)؟',
        'اشرح كيفية بناء خط أنابيب RAG (Retrieval-Augmented Generation) متكامل باستخدام Vector Databases و Embeddings وكيف تقيس جودة الإجابات الناتجة.',
        'ما هي استراتيجيات التعامل مع حدود معدل الطلبات (Rate Limits) والتكلفة المرتفعة لـ LLM APIs في تطبيق يخدم مئات الآلاف من المستخدمين؟',
        'كيف تضمن مزامنة الحالة اللحظية (Real-time State Sync) بين الواجهة الأمامية والخادم باستخدام WebSockets أو Server-Sent Events (SSE)؟',
        'اشرح معمارية التطبيقات التي تستخدم Next.js App Router مع React Server Components و Server Actions وكيف تؤثر على الأمان والأداء.',
        'كيف تطبق مبدأ Least Privilege وسياسات Row Level Security (RLS) في Supabase أو PostgreSQL لحماية بيانات المستخدمين؟',
        'ما هي تقنيات تحسين الـ Prompt Engineering والـ Structured Outputs (JSON Schema / Zod) لضمان عدم هلوسة النموذج الذكي؟',
        'كيف تصمم نظام Fallback متعدد النماذج (Multi-Provider AI Gateway) للتبديل التلقائي بين مزودي الذكاء الاصطناعي (مثل Gemini و OpenAI و Anthropic) عند حدوث خطأ أو بطء؟',
        'اشرح الفرق بين Client-side Hydration و Partial Hydration و Island Architecture في أطر العمل الحديثة.',
        'كيف تنفذ معالجة الملفات الكبيرة (PDF, DOCX) واستخراج النصوص منها على الخادم دون استهلاك الذاكرة وحظر الـ Event Loop؟',
        'ما هي استراتيجيات حماية تطبيقات الـ LLM من هجمات Prompt Injection وتسميم البيانات (Data Poisoning)؟',
        'كيف تبني نظام Caching ذكي للاستعلامات الدلالية (Semantic Caching) لتوفير تكلفة استدعاء النماذج الذكية؟',
        'اشرح كيفية عمل Background Workers ومعالجة المهام الثقيلة في الخلفية في بيئات Serverless مثل Cloudflare Workers أو Vercel أو Node.',
        'كيف تدير التوافق بين أنواع البيانات المشتركة (Shared Types / End-to-End Type Safety) بين الفرونت إند والباك إند باستخدام TypeScript أو tRPC؟',
        'ما هي أفضل الممارسات لاختبار تطبيقات الـ AI (E2E Testing, Model Evaluation Benchmarks, Unit Tests)؟',
      ],
      en: [
        'How do you architect an end-to-end full-stack application that streams LLM completions to the client with sub-second perceived latency?',
        'Explain how to design an enterprise RAG (Retrieval-Augmented Generation) pipeline using Vector Databases, hybrid search, and semantic re-ranking.',
        'How do you mitigate API rate limiting, latency spikes, and operational expenses when consuming frontier LLMs at enterprise scale?',
        'Compare WebSockets versus Server-Sent Events (SSE) for streaming AI token outputs to the browser. Which do you choose and why?',
        'Explain the security and performance implications of React Server Components (RSC) and Server Actions in modern full-stack architectures.',
        'How do you enforce Row Level Security (RLS) in PostgreSQL/Supabase to guarantee multitenant tenant isolation with zero data leakage?',
        'How do you force deterministic structured outputs (e.g., via Zod schemas) from generative AI models to avoid schema validation errors?',
        'How would you engineer an automated Multi-Provider AI Gateway with health checks, retries, exponential backoff, and circuit breaking across Gemini, OpenAI, and Claude?',
        'Explain client-side hydration versus Island Architecture. How do modern build tools optimize initial JavaScript delivery?',
        'How do you handle heavy document ingestion (PDF, Word, OCR) on the server without blocking the main event loop or exceeding container memory limits?',
        'How do you protect production AI agents against Direct and Indirect Prompt Injection attacks?',
        'Explain the mechanics of Semantic Caching using vector similarity to avoid redundant generative AI queries.',
        'How do you coordinate long-running background tasks across asynchronous queue workers within serverless or containerized environments?',
        'How do you achieve end-to-end type safety across client and server boundaries in a TypeScript monorepo?',
        'What automated evaluation strategies (e.g., RAG Triad, LLM-as-a-judge, unit fixtures) do you implement for AI output regression testing?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن مشروع قمت فيه ببناء نظام من الصفر من واجهة المستخدم وحتى الخوادم ونماذج الذكاء الاصطناعي. ما هي أكبر التحديات المعمارية التي تغلبت عليها؟',
        'كيف تتعامل مع عدم موثوقية استجابات الذكاء الاصطناعي (AI Non-Determinism) وتضمن تقديم تجربة مستقرة وموثوقة للمستخدم النهائي؟',
        'صف موقفاً اضطررت فيه للتنقل السريع بين إصلاح عطل في الواجهة وإصلاح أداء قاعدة البيانات في نفس اليوم.',
        'كيف تتواصل مع أعضاء الفريق وأصحاب المصلحة لشرح الإمكانيات الواقعية والحدود الحالية لتقنيات الذكاء الاصطناعي؟',
        'احكِ عن ميزة طورتها وفرت وقتاً أو تكلفة كبيرة على الشركة بفضل أتمتة ذكية.',
      ],
      en: [
        'Tell me about an end-to-end system you built from scratch encompassing UI, server APIs, and AI integrations. What was the toughest hurdle?',
        'How do you handle the non-deterministic nature of AI model outputs to ensure a dependable, high-trust user experience?',
        'Describe a day where you had to context-switch across frontend responsiveness issues, database indexing, and model prompt tuning.',
        'How do you manage stakeholder expectations regarding generative AI capabilities versus realistic production limitations?',
        'Describe an automation or intelligent feature you implemented that yielded substantial cost savings or efficiency gains.',
      ],
    },
    HR: {
      ar: [
        'ما الذي يجعلك شغوفاً بالدمج بين هندسة البرمجيات الكاملة وتطبيقات الذكاء الاصطناعي التوليدي؟',
        'كيف توزع وقتك وجهدك بين إتقان تفاصيل الواجهة وتفاصيل البنية التحتية والذكاء الاصطناعي؟',
        'ما رأيك في مستقبل وظائف البرمجة في ظل التطور السريع لأدوات الذكاء الاصطناعي؟',
        'كيف تتأكد من أن الحلول التي تبنيها تركز على القيمة الحقيقية للمستخدم وليس مجرد استعراض تقني؟',
        'ما هي بيئة الفريق المثالية التي تشجعك على الابتكار وإطلاق الميزات بسرعة وأمان؟',
      ],
      en: [
        'What drives your passion for combining full-stack software craftsmanship with generative AI systems?',
        'How do you prioritize your time between mastering frontend nuances, backend robustness, and emerging AI paradigms?',
        'How do you perceive the future of software engineering in the era of AI agentic systems and code generation?',
        'How do you ensure that the AI products you build solve genuine human problems rather than serving as technical gimmicks?',
        'What team culture empowers you to ship experiments rapidly while maintaining production reliability?',
      ],
    },
    Mixed: {
      ar: [
        'المستخدمون يشتكون من أن المساعد الذكي يستغرق 12 ثانية للرد على أسئلة تحليل السيرة الذاتية وأحياناً يفشل تماماً. كيف تشخص أين يضيع الوقت (Frontend, Network, Database, Vector Search, LLM API) وما هي خطة تحسين السرعة إلى أقل من 2 ثانية؟',
        'نموذج الذكاء الاصطناعي قام بإنشاء توصيات خاطئة تماماً لمستخدم مهم مما تسبب في شكوى رسمية. كيف تدير التحقيق في السجلات وتمنع تكرار الهلوسة؟',
        'تكلفة استدعاءات الـ API للذكاء الاصطناعي تضاعفت 5 أضعاف في شهر واحد بسبب ميزة جديدة أصبحت واسعة الانتشار. ما هي الحلول الفورية لتخفيض التكلفة دون إغلاق الميزة؟',
      ],
      en: [
        'Users complain that the AI career assistant takes 12 seconds to respond and intermittently times out. How do you instrument distributed latency tracking across UI, database, vector retrieval, and LLM providers to bring TTFT under 1.5 seconds?',
        'An AI agent produces a severe hallucination during an executive candidate screening. How do you inspect telemetry logs, audit the prompt versioning, and implement guardrail mitigations?',
        'Monthly third-party AI provider costs spike 5x unexpectedly due to a viral feature. What immediate architecture optimizations (caching, model tiering, token trimming) do you deploy?',
      ],
    },
  },

  // ── 4. MOBILE APP DEVELOPER ────────────────────────────────────────────────
  mobile: {
    Technical: {
      ar: [
        'اشرح دورة حياة تطبيق الهاتف (App Lifecycle) وكيف تدير الحالات المختلفة (Active, Paused, Detached) لحفظ البيانات وتوفير البطارية.',
        'ما هي استراتيجيات إدارة الحالة (State Management) في Flutter (Riverpod, Bloc, Provider) أو React Native (Zustand, Redux) وما معايير اختيارك؟',
        'كيف تتعامل مع تخزين البيانات دون اتصال (Offline-First Architecture) ومزامنتها تلقائياً عند عودة الاتصال؟',
        'اشرح كيفية تحسين أداء الرسوميات ومعدل الإطارات (60/120 FPS) وتجنب الـ Jank في القوائم الطويلة (ListView / FlatList).',
        'كيف يعمل الجسر الأصلي (Native Bridge / JSI / Platform Channels) للتواصل بين كود الـ JavaScript/Dart والكود الأصلي (Swift/Kotlin)؟',
        'ما هي أفضل الممارسات لتأمين بيانات التطبيق الحساسة باستخدام Keychain في iOS و EncryptedSharedPreferences في Android؟',
        'كيف تصمم نظام إشعارات لحظية (Push Notifications) فعال وموثوق باستخدام Firebase Cloud Messaging (FCM) أو Apple Push Notification service (APNs)؟',
        'ما هي معايير قبول التطبيقات في متجر Apple App Store و Google Play Store وكيف تتجنب أسباب الرفض الشائعة؟',
        'كيف تتعامل مع أذونات النظام الحساسة (Permissions: Location, Camera, Microphone) لضمان خصوصية المستخدم والامتثال للقوانين؟',
        'اشرح كيفية تقليل حجم حزمة التثبيت النهائية للتطبيق (APK / IPA) باستخدام ProGuard و Tree Shaking وضغط الموارد.',
      ],
      en: [
        'Walk through the mobile application lifecycle across foreground, background, and inactive states. How do you conserve battery and preserve critical session state?',
        'Compare mobile state management paradigms (e.g., Bloc vs Riverpod in Flutter, or Zustand vs Redux in React Native). What dictates your architectural choice?',
        'How do you design a robust offline-first mobile architecture with local SQLite/WatermelonDB/Hive storage and conflict-free background synchronization?',
        'How do you diagnose and eliminate frame drops and UI jank in infinitely scrolling lists to maintain a steady 60/120 FPS rendering pipeline?',
        'Explain how the platform bridge operates (Platform Channels in Flutter or JSI/TurboModules in React Native) when communicating with native Swift/Kotlin APIs.',
        'How do you securely store authentication tokens and cryptographic secrets using iOS Keychain Services and Android Keystore/EncryptedSharedPreferences?',
        'How do you architect reliable background and foreground push notification dispatching via FCM and APNs?',
        'What are the most frequent reasons for Apple App Store and Google Play rejections, and how do you build compliance into your CI/CD workflow?',
        'How do you gracefully handle runtime permission requests (Location, Camera, Microphone) to maximize user trust and prevent crashes?',
        'What strategies do you employ to minimize final APK/AAB and IPA bundle sizes (asset optimization, tree shaking, R8/ProGuard)?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن عيب برمجي كان يحدث على نوع محدد من أجهزة أندرويد القديمة ولم يظهر في أجهزة المحاكاة. كيف تتبعت المشكلة وحللتها؟',
        'صف تجربة رفض فيها متجر التطبيقات تحديثاً عاجلاً قبل موعد إطلاق هام. كيف تصرفت مع الفريق؟',
        'كيف توازن بين دعم الإصدارات القديمة من نظام التشغيل وبين الاستفادة من الميزات الحديثة؟',
      ],
      en: [
        'Tell me about an elusive bug that only replicated on low-end Android hardware. How did you diagnose and patch it?',
        'Describe an instance where Apple or Google rejected a mission-critical update right before a marketing launch. How did you lead the remediation?',
        'How do you determine OS version deprecation thresholds without alienating valuable existing users?',
      ],
    },
    HR: {
      ar: [
        'ما الذي جذبك لتطوير تطبيقات الموبايل ولماذا تفضل العمل بتقنيات Cross-Platform أو Native؟',
        'كيف تضمن مواكبة التحديثات السنوية لأنظمة iOS و Android وتوافق تطبيقاتك معها في وقت مبكر؟',
      ],
      en: [
        'Why did you choose mobile application development as your specialized domain?',
        'How do you maintain continuous alignment with annual iOS and Android OS architectural changes?',
      ],
    },
    Mixed: {
      ar: [
        'المستخدمون يشتكون من نفاد البطارية وارتفاع حرارة الهاتف عند استخدام التطبيق لأكثر من 10 دقائق. ما هي خطتك لتشخيص تسريب الذاكرة والعمليات الخلفية؟',
        'حدث خطأ في واجهة برمجة التطبيقات بالخادم جعل التطبيق ينهار فور فتحه لجميع المستخدمين. كيف تدير حل الأزمة دون انتظار أيام لمراجعة المتجر؟',
      ],
      en: [
        'Users report severe battery drain and device overheating within 10 minutes of app usage. How do you profile memory allocations, wake locks, and GPS telemetry?',
        'A malformed backend API payload causes an unhandled exception that crashes the mobile app on startup. How do you resolve this immediately without waiting for store approval?',
      ],
    },
  },

  // ── 5. DEVOPS & CLOUD ENGINEER ─────────────────────────────────────────────
  devops: {
    Technical: {
      ar: [
        'اشرح دورة حياة الحاوية في Docker وما الفرق بين Image و Container وكيف تبني Multi-stage Dockerfiles بأقل حجم ممكن؟',
        'ما هي المكونات الأساسية لـ Kubernetes (Pod, Service, Ingress, Deployment, ConfigMap, Secrets) وكيف تتواصل فيما بينها؟',
        'اشرح استراتيجيات النشر في بيئات الإنتاج: ما الفرق بين Rolling Update و Blue/Green Deployment و Canary Deployment؟',
        'كيف تطبق مبدأ البنية التحتية ككود (Infrastructure as Code - IaC) باستخدام Terraform وما هي إدارة الـ State Lock؟',
        'كيف تصمم خط أنابيب CI/CD متكامل وآمن باستخدام GitHub Actions أو GitLab CI يتضمن فحص الثغرات (SAST/DAST) والاختبارات الآلية؟',
        'ما هي معايير مراقبة صحة النظم (The Four Golden Signals: Latency, Traffic, Errors, Saturation) باستخدام Prometheus و Grafana؟',
        'كيف تضمن إدارة الأسرار (Secrets Management) وتدوير المفاتيح بأمان باستخدام HashiCorp Vault أو AWS Secrets Manager؟',
        'اشرح كيفية إعداد وتأمين شبكة سحابية خاصة (VPC, Subnets, NAT Gateway, Security Groups) على AWS أو Google Cloud.',
        'ما هي استراتيجيات التعافي من الكوارث (Disaster Recovery: RTO و RPO) والنسخ الاحتياطي التلقائي للبيانات؟',
        'كيف تتعامل مع التحجيم التلقائي (Horizontal Pod Autoscaling - HPA) بناءً على مقاييس مخصصة مثل عدد الرسائل في الـ Queue؟',
      ],
      en: [
        'Explain Docker container internals. How do you craft secure, minimal multi-stage Dockerfiles utilizing distroless images?',
        'Walk through core Kubernetes architecture: API Server, etcd, Kubelet, Scheduler. How do Pods discover and communicate through Services and Ingress?',
        'Compare deployment strategies: Rolling Updates, Blue/Green, and Canary releases. How do you automate rollback triggers on error rate spikes?',
        'How do you enforce Infrastructure as Code (IaC) governance with Terraform, remote state locking, and drift detection?',
        'How do you architect an enterprise CI/CD pipeline incorporating automated SAST, DAST, container scanning (Trivy), and signed artifacts?',
        'Explain the SRE Four Golden Signals (Latency, Traffic, Errors, Saturation). How do you configure actionable alerting thresholds in Prometheus/Alertmanager?',
        'How do you manage secret rotation, dynamic credentials, and zero-trust workload identities using HashiCorp Vault or Cloud KMS?',
        'How do you design a highly available multi-region VPC topology with public/private subnets, NAT gateways, and least-privilege security groups?',
        'Define Recovery Time Objective (RTO) and Recovery Point Objective (RPO). How do you validate disaster recovery failovers in production?',
        'How do you implement Kubernetes Horizontal Pod Autoscaling (HPA) driven by custom Prometheus metrics like queue depth or event consumer lag?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن حادثة أمنية أو انهيار كامل للبنية التحتية أثناء الليل. كيف قمت بإدارة الأزمة والتواصل مع الفريق لاستعادة الخدمة؟',
        'صف موقفاً واجهت فيه مقاومة من فريق المطورين لتطبيق معايير أمنية أو قيود جديدة على خطوط النشر. كيف أقنعتهم؟',
        'احكِ عن خطأ ارتكبته في ملف إعدادات سحابي وتسبب في مشكلة. كيف تعاملت مع الخطأ بشفافية؟',
      ],
      en: [
        'Describe a critical middle-of-the-night infrastructure outage. How did you triage, establish incident command, and communicate with stakeholders?',
        'Tell me about a time software developers pushed back against new CI/CD security scanning gates. How did you build consensus?',
        'Walk me through a misconfiguration in production infrastructure that caused an unexpected disruption. How did you take ownership and remediate it?',
      ],
    },
    HR: {
      ar: [
        'ما الذي دفعك للتخصص في مجال الـ DevOps وثقافة الـ SRE؟',
        'كيف تحافظ على هدوئك وتفكيرك المنطقي تحت ضغط توقف الأنظمة الإنتاجية؟',
      ],
      en: [
        'What attracted you to DevOps and Site Reliability Engineering as a career discipline?',
        'How do you maintain analytical composure when high-severity production incidents arise?',
      ],
    },
    Mixed: {
      ar: [
        'فاتورة الخدمات السحابية للشركة تضاعفت ثلاث مرات هذا الشهر بسبب موارد منسية وغير مراقبة. ما هي خطتك لتدقيق الموارد وخفض التكلفة فوراً بنسبة 40%؟',
        'شهادة الأمان SSL انتهت فجأة وتوقفت جميع الخدمات الحيوية للعملاء. ما هو إجراء الطوارئ اللحظي وكيف تضمن أتمتة التجديد وعدم تكرار ذلك إطلاقاً؟',
      ],
      en: [
        'The monthly cloud infrastructure bill triples unexpectedly due to unmanaged compute instances and unindexed storage buckets. What is your FinOps audit roadmap?',
        'A wildcard production SSL certificate expires unexpectedly, severing customer API traffic globally. How do you restore traffic immediately and ensure automated renewal?',
      ],
    },
  },

  // ── 6. DATA SCIENTIST & ML ENGINEER ────────────────────────────────────────
  datascience: {
    Technical: {
      ar: [
        'اشرح مشكلة الـ Overfitting و Underfitting في نماذج التعلم الآلي وكيف تعالجها باستخدام Regularization و Cross-Validation.',
        'ما الفرق بين مقاييس التقييم: Precision, Recall, F1-Score, ROC-AUC ومتى تفضل استخدام Recall على حساب Precision؟',
        'اشرح معمارية الـ Transformer ومبدأ الـ Self-Attention Mechanism الذي بنيت عليه نماذج اللغة الكبيرة الحديثة.',
        'كيف تتعامل مع البيانات غير المتوازنة (Imbalanced Datasets) في مشاكل التصنيف مثل اكتشاف الاحتيال؟',
        'ما هو الفرق بين Fine-tuning للنماذج الكبيرة واستخدام تقنيات PEFT مثل LoRA و QLoRA؟',
        'اشرح مفهوم Data Drift و Concept Drift في بيئة الإنتاج وكيف تراقب تراجع أداء النموذج بمرور الوقت.',
        'كيف تختار الخوارزمية الأنسب: متى تختار Gradient Boosting (XGBoost/LightGBM) ومتى تختار Deep Neural Networks؟',
        'ما هي خطوات تجهيز الـ Embeddings وبناء فهرس بحث تشابهي فعال باستخدام خوارزميات مثل HNSW في قواعد البيانات الشعاعية؟',
        'كيف تطبق MLOps لتسجيل التجارب وإصدارات النماذج وتتبع البيانات باستخدام أدوات مثل MLflow أو Weights & Biases؟',
        'ما هي معايير قياس التحيز والعدالة (Fairness & Bias) في النماذج قبل اعتمادها في قرارات تؤثر على المستخدمين؟',
      ],
      en: [
        'Explain the bias-variance trade-off. How do you combat overfitting using L1/L2 regularization, dropout, and k-fold cross-validation?',
        'Compare Precision, Recall, F1-Score, and ROC-AUC. Under what real-world circumstances (e.g., medical diagnostics, fraud detection) is Recall prioritized over Precision?',
        'Walk through the Transformer architecture: Multi-Head Self-Attention, Positional Encodings, and Feed-Forward layers.',
        'How do you handle severely imbalanced datasets (e.g., 99.9% negative vs 0.1% positive class) via resampling, focal loss, and metric selection?',
        'Differentiate full fine-tuning of foundation LLMs from Parameter-Efficient Fine-Tuning (PEFT) methods like LoRA and QLoRA.',
        'What is the difference between Data Drift and Concept Drift? How do you set up automated statistical alerting (e.g., KS test, PSI) in production pipelines?',
        'When do tabular gradient boosting trees (XGBoost, CatBoost) outperform deep learning architectures, and vice versa?',
        'Explain vector embeddings and Approximate Nearest Neighbor (ANN) index algorithms like HNSW and IVF-PQ.',
        'How do you implement an end-to-end MLOps workflow incorporating experiment tracking, model registry, and automated CI/CD deployment with MLflow?',
        'How do you evaluate and mitigate algorithmic bias, disparate impact, and hallucinations in machine learning deliverables?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن مشروع قمت فيه ببناء نموذج ذكاء اصطناعي واكتشفت أن البيانات المتاحة كانت مليئة بالضوضاء والأخطاء. كيف تغلبت على ذلك؟',
        'صف موقفاً رفضت فيه إدارة الأعمال نتائج النموذج لأنها لم تتوافق مع توقعاتهم المسبقة. كيف شرحت النتائج بالأدلة الإحصائية؟',
      ],
      en: [
        'Tell me about an ML project where raw training data was heavily corrupted or noisy. How did you cleanse and validate the dataset?',
        'Describe a situation where stakeholders rejected model insights because they contradicted their business intuition. How did you communicate the statistical validity?',
      ],
    },
    HR: {
      ar: [
        'ما الذي يحفزك في مجال الذكاء الاصطناعي وتعلم الآلة: البحث النظري أم التطبيق العملي في منتجات حقيقية؟',
        'كيف تواكب وتيرة الأبحاث والأوراق العلمية التي تصدر أسبوعياً في مجال الذكاء الاصطناعي؟',
      ],
      en: [
        'Are you more energized by theoretical research or applied machine learning engineering delivering customer value?',
        'How do you filter and digest the rapid deluge of academic papers and model breakthroughs published weekly?',
      ],
    },
    Mixed: {
      ar: [
        'دقة نموذج الإنتاج انخفضت فجأة بنسبة 25% بعد تحديث البيانات الأسبوعي دون أي تغيير في الكود. كيف تبدأ بالتحقيق في سبب المشكلة؟',
        'النموذج يحقق 98% دقة على مجموعة البيانات، لكنه يفشل في إعطاء نتائج مقبولة عند استخدامه من مستخدمين حقيقيين. ما هو تفسيرك وخطة علاجك؟',
      ],
      en: [
        'Production inference accuracy drops by 25% overnight following a routine weekly data ingest without any code commits. How do you triage the pipeline?',
        'A model demonstrates a 98% validation accuracy in the laboratory but degrades severely upon live production deployment. What failure modes (data leakage, selection bias) do you investigate?',
      ],
    },
  },

  // ── 7. DATA ENGINEER ───────────────────────────────────────────────────────
  dataengineering: {
    Technical: {
      ar: [
        'ما الفرق بين معمارية ETL و ELT ومتى يكون التحول إلى ELT في مستودعات البيانات الحديثة خياراً أفضل؟',
        'اشرح كيفية عمل Apache Spark في الذاكرة: ما هي RDDs و DataFrames وما هو الفرق بين Transformations و Actions؟',
        'كيف تصمم Data Warehouse باستخدام نماذج Star Schema و Snowflake Schema وما هي Slow Changing Dimensions (SCD Type 1 & 2)؟',
        'ما هي استراتيجيات التعامل مع تدفقات البيانات اللحظية (Streaming Data) مقابل الدفعات (Batch Processing) باستخدام Kafka و Flink؟',
        'كيف تنظم إدارة وتجديد الـ Data Pipelines باستخدام Apache Airflow وما هي الـ Idempotency في مهام البيانات؟',
        'اشرح مفهوم Data Lakehouse وما الفرق بين تنسيقات الملفات الحديثة مثل Parquet و ORC مع طبقات التخزين Delta Lake و Apache Iceberg.',
        'كيف تضمن جودة البيانات (Data Quality & Observability) وتطبيق فحوصات تلقائية لمنع تسرب بيانات فاسدة للمحللين؟',
        'ما هي تقنيات Partitioning و Clustering في BigQuery أو Snowflake وكيف تؤثر على تكلفة وسرعة الاستعلامات؟',
      ],
      en: [
        'Compare ETL versus ELT data pipeline paradigms. What factors justify migrating transformation workloads into modern cloud data warehouses?',
        'Explain the internal execution engine of Apache Spark: Catalyst Optimizer, Tungsten execution, Transformations (narrow vs wide), and Actions.',
        'How do you design dimensional data models (Star Schema vs Snowflake Schema)? Explain the implementation of Slowly Changing Dimensions (SCD Type 2).',
        'How do you balance real-time stream processing with micro-batch architectures using Apache Kafka, Flink, and Spark Streaming?',
        'How do you architect resilient DAG workflows in Apache Airflow ensuring complete task idempotency and replayability upon pipeline failures?',
        'Explain the Data Lakehouse architecture. What advantages do open table formats (Apache Iceberg, Delta Lake) provide over raw Parquet files in object storage?',
        'How do you build data quality contracts and observability gates (e.g., Great Expectations, dbt tests) into automated ingestion pipelines?',
        'Explain table partitioning, clustering, and pruning strategies in BigQuery and Snowflake. How do they directly optimize computational cost and scan efficiency?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن خط أنابيب بيانات توقف في منتصف الليل وتسبب في تأخير تقارير الإدارة التنفيذية. كيف قمت بحل المشكلة؟',
        'صف تعاونك مع علماء البيانات ومحللي الأعمال لتقديم جداول بيانات واضحة وسريعة تلبي احتياجاتهم.',
      ],
      en: [
        'Tell me about an automated ETL pipeline that failed overnight and stalled executive business reporting. How did you resolve and harden the job?',
        'Describe how you partner with data scientists and business intelligence analysts to define clean, performant data marts.',
      ],
    },
    HR: {
      ar: [
        'لماذا اخترت مسار هندسة البيانات وما هي التحديات التي تجدها ممتعة في هذا المجال؟',
      ],
      en: [
        'What motivated you to specialize in data engineering and large-scale data infrastructure?',
      ],
    },
    Mixed: {
      ar: [
        'استعلامات لوحة التحكم تأخذ أكثر من 45 ثانية وتكلف الشركة آلاف الدولارات شهرياً. ما هي خطواتك المعمارية لتقليل الوقت لأقل من ثانيتين؟',
      ],
      en: [
        'A critical BI dashboard query takes 45 seconds to render and scans terabytes of unindexed data per refresh. How do you re-architect the data model to return sub-second responses?',
      ],
    },
  },

  // ── 8. CYBERSECURITY SPECIALIST ────────────────────────────────────────────
  cybersecurity: {
    Technical: {
      ar: [
        'اشرح أهم ثغرات OWASP Top 10 للويب (مثل SQL Injection, Broken Access Control, SSRF) وكيفية الحماية منها برمجياً.',
        'ما هو مبدأ Zero Trust Architecture وكيف يختلف عن أسلوب الحماية التقليدي القائم على الجدران النارية (Perimeter Defense)؟',
        'اشرح مراحل دورة حياة الاستجابة للحوادث الأمنية (Incident Response Lifecycle) وفقاً لمعايير NIST.',
        'ما الفرق بين التشفير المتماثل (Symmetric) وغير المتماثل (Asymmetric) وكيف يعمل بروتوكول TLS 1.3 في تأمين الاتصال؟',
        'كيف تنفذ تدقيق أمني واختبار اختراق (Penetration Testing) لتطبيق ويب حديث وخدمات APIs؟',
        'ما هي معايير تأمين الهوية وإدارة الوصول (IAM) ومبدأ Least Privilege والمصادقة متعددة العوامل (MFA)؟',
        'كيف تحمي البنية التحتية للحاويات وKubernetes من ثغرات الهروب (Container Escape) وحقن الحزم الخبيثة؟',
        'اشرح كيفية عمل أدوات SIEM و SOC وكيف تكتشف الهجمات المتقدمة (APTs) عبر تحليل السجلات والشذوذ السلوكي.',
      ],
      en: [
        'Walk through the OWASP Top 10 web application vulnerabilities (e.g., Broken Access Control, SSRF, Injection) and modern defensive code mitigations.',
        'Explain the Zero Trust Architecture model (Never Trust, Always Verify). How does it contrast with traditional perimeter-based network defenses?',
        'Outline the NIST Incident Response lifecycle: Preparation, Detection & Analysis, Containment, Eradication, and Post-Incident Recovery.',
        'Compare symmetric versus asymmetric encryption. Walk through the TLS 1.3 cryptographic handshake process.',
        'How do you approach a comprehensive penetration test and vulnerability assessment against modern single-page applications and REST/GraphQL APIs?',
        'How do you architect an enterprise Identity and Access Management (IAM) framework enforcing Least Privilege, RBAC/ABAC, and phish-resistant MFA?',
        'What controls do you implement to prevent container escape vulnerabilities and secure Kubernetes clusters against privilege escalation?',
        'How do SIEM and SOC operations correlate telemetry across cloud logs, endpoint EDR, and network flows to identify Advanced Persistent Threats (APTs)?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن ثغرة أمنية حرجة اكتشفتها في نظام قيد التشغيل. كيف قمت بالإبلاغ عنها والتعامل مع الفريق لإصلاحها فوراً دون فوضى؟',
        'صف موقفاً كان فيه إجراء أمني صارم يعيق سرعة المطورين أو تجربة المستخدمين. كيف وازنت بين الأمان وسهولة الاستخدام؟',
      ],
      en: [
        'Describe a critical zero-day or high-severity vulnerability you discovered in production systems. How did you orchestrate rapid patching without operational panic?',
        'Tell me about an instance where stringent security compliance introduced friction into developer velocity. How did you balance security assurance with developer ergonomics?',
      ],
    },
    HR: {
      ar: [
        'ما هي المعايير الأخلاقية والمهنية التي توجه عملك اليومي كمتخصص في أمن المعلومات؟',
      ],
      en: [
        'How do you uphold the highest ethical and professional standards in sensitive security and forensic investigations?',
      ],
    },
    Mixed: {
      ar: [
        'تم رصد محاولة تسريب بيانات نشطة (Data Exfiltration) من خادم قاعدة البيانات الآن. ما هي أول ثلاث خطوات تقوم بها فوراً لاحتواء الاختراق وحفظ الأدلة الرقمية؟',
      ],
      en: [
        'Your SIEM triggers an active data exfiltration alert from a production database subnet. What are your immediate containment steps to halt egress while preserving forensic evidence integrity?',
      ],
    },
  },

  // ── 9. UI/UX & PRODUCT DESIGNER ────────────────────────────────────────────
  uiux: {
    Technical: {
      ar: [
        'اشرح خطوات منهجية التفكير التصميمي (Design Thinking): Empathize, Define, Ideate, Prototype, Test وكيف تطبقها في مشروع جديد.',
        'كيف تبني وتدير نظام تصميم (Design System) متكامل في Figma يخدم فرق التصميم والبرمجة بالتوازي مع الـ Design Tokens؟',
        'ما هي معايير سهولة الوصول الرقمي (WCAG 2.1 AA) من حيث تباين الألوان، حجم الخطوط، والتنقل بلوحة المفاتيح؟',
        'كيف تخطط وتجري جلسة اختبار قابلية الاستخدام (Usability Testing) مع مستخدمين حقيقيين وما هي المقاييس التي تركز عليها؟',
        'ما الفرق بين المعلومات الهيكلية (Information Architecture) وتصميم رحلة المستخدم (User Journey Mapping)؟',
        'كيف تستخدم البيانات الكمية (Product Analytics مثل Mixpanel/Hotjar) والبيانات النوعية (User Interviews) لاتخاذ قرارات التصميم؟',
      ],
      en: [
        'Walk through the Design Thinking framework: Empathize, Define, Ideate, Prototype, and Test. How do you apply this to ambiguous feature briefs?',
        'How do you establish and govern a multi-brand Design System in Figma utilizing auto-layout, component variants, and design tokens aligned with code?',
        'How do you design for WCAG 2.1 AA accessibility standards regarding color contrast ratios, screen reader hierarchies, and touch target sizing?',
        'How do you design and facilitate an effective unmoderated or moderated usability testing session, and how do you synthesize actionable insights?',
        'Differentiate Information Architecture (IA) from User Journey Mapping. How do they complement each other in complex workflows?',
        'How do you triangulate quantitative telemetry (Hotjar, Google Analytics) with qualitative user feedback to inform UX iterations?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن تصميم كنت فخوراً به جداً ولكن عند اختباره مع المستخدمين اتضح أنه مربك لهم. كيف تقبلت النقد وأعدت التصميم؟',
        'صف خلافاً حدث بينك وبين فريق تطوير البرمجيات حول صعوبة تنفيذ حركة أو تصميم معين. كيف وصلتم لحل وسط؟',
      ],
      en: [
        'Tell me about a design prototype you were passionate about that failed usability validation. How did you adapt your solution without ego?',
        'Describe a disagreement you had with frontend developers over interaction animations or responsive layout feasibility. How did you collaborate on a pragmatic compromise?',
      ],
    },
    HR: {
      ar: [
        'ما الذي يميز المصمم العظيم عن المصمم الجيد في بيئة العمل التقنية السريعة؟',
      ],
      en: [
        'What distinguishes an exceptional product designer from a good visual designer in a high-velocity product team?',
      ],
    },
    Mixed: {
      ar: [
        'نسبة التخلي عن الشراء (Drop-off rate) في صفحة الدفع بلغت 65%. ما هي خطتك لتحليل أسباب المشكلة واقتراح تعديلات ترفع معدل التحويل؟',
      ],
      en: [
        'User drop-off at the final checkout funnel is measured at 65%. What is your methodical plan to diagnose friction points and redesign the conversion experience?',
      ],
    },
  },

  // ── 10. QA & TEST AUTOMATION ENGINEER ──────────────────────────────────────
  qa: {
    Technical: {
      ar: [
        'ما هو هرم الاختبارات (Testing Pyramid) وما هي النسبة المثالية بين اختبارات الوحدة (Unit) والتكامل (Integration) واختبارات النهاية إلى النهاية (E2E)؟',
        'اشرح كيفية كتابة اختبارات E2E قوية ومستقرة باستخدام Playwright أو Cypress وتجنب مشاكل الاختبارات غير المستقرة (Flaky Tests).',
        'ما الفرق بين اختبارات الأداء (Performance Testing)، واختبارات الحمل (Load Testing)، واختبارات الإجهاد (Stress Testing) وكيف تنفذها بـ k6؟',
        'كيف تصمم إطار عمل لأتمتة اختبارات الـ API (REST & GraphQL) للتحقق من الـ Status Codes و Schemas وأوقات الاستجابة؟',
        'ما هي استراتيجيات إدارة بيانات الاختبار (Test Data Management) في بيئات CI/CD لتفادي تلوث قواعد البيانات؟',
        'اشرح مفهوم التحليل الإحصائي للكود (Code Coverage) وهل وصول التغطية إلى 100% يعني خلو النظام من العيوب البرمجية؟',
      ],
      en: [
        'Explain the Test Automation Pyramid. What is the recommended balance between Unit, Integration, and End-to-End (E2E) test suites?',
        'How do you author robust, non-flaky automated E2E tests using Playwright or Cypress? How do you handle asynchronous waiting and dynamic DOM hydration?',
        'Differentiate Performance, Load, Stress, and Soak testing. How do you simulate high-concurrency virtual users using k6 or JMeter?',
        'How do you design a comprehensive API test automation framework validating response status, payload schemas, security headers, and latency thresholds?',
        'What are best practices for Test Data Management and database seeding/teardown in automated CI regression pipelines?',
        'Explain code coverage metrics (line, branch, statement). Does 100% code coverage guarantee software correctness?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن عيب برمجي خطير اكتشفته قبل ساعات قليلة من موعد إطلاق التطبيق. كيف نسقت مع المطورين لتأكيد وإصلاح المشكلة؟',
        'صف موقفاً أصر فيه مدير المشروع على إطلاق تحديث رغم وجود اختبارات فاشلة. كيف أدرت الموقف ووثقت المخاطر؟',
      ],
      en: [
        'Tell me about a high-severity bug you caught right before a scheduled production release. How did you triage and communicate the release risk?',
        'Describe a situation where a stakeholder insisted on deploying software despite outstanding QA regressions. How did you manage risk sign-off?',
      ],
    },
    HR: {
      ar: [
        'ما الذي يحفزك في مهنة ضمان الجودة وكيف تساهم في نشر ثقافة الجودة بين جميع أفراد الفريق البرمجي؟',
      ],
      en: [
        'What drives your commitment to quality engineering, and how do you instill a shared quality culture across engineering teams?',
      ],
    },
    Mixed: {
      ar: [
        'مجموعة اختبارات الـ CI تستغرق 45 دقيقة مما يعطل نشر التحديثات العاجلة. كيف تعيد هيكلة الاختبارات لتخفيض وقت التنفيذ إلى أقل من 8 دقائق؟',
      ],
      en: [
        'The continuous integration test suite takes 45 minutes to execute, stalling continuous delivery. How do you optimize, parallelize, and prune test suites to achieve sub-8-minute pipeline execution?',
      ],
    },
  },

  // ── 11. PRODUCT MANAGER ────────────────────────────────────────────────────
  product: {
    Technical: {
      ar: [
        'كيف تستخدم أطر تحديد الأولويات (مثل RICE, MoSCoW, Kano Model) لاختيار الميزات التي سيتم تطويرها في الربع القادم؟',
        'ما هي المقاييس الأساسية لنجاح المنتجات الرقمية (North Star Metric, DAU/MAU, Retention Rate, Churn, LTV, CAC)؟',
        'كيف تدير دورة اكتشاف المنتج (Product Discovery) والتحقق من المشكلة قبل كتابة أي سطر كود برمجي؟',
        'كيف تصمم وتدير تجربة A/B Testing ذات دلالة إحصائية (Statistical Significance) وكيف تقرأ النتائج؟',
        'ما هي استراتيجيتك في صياغة مواصفات المتطلبات البرمجية (PRDs / User Stories) لضمان وضوح الرؤية للمطورين؟',
      ],
      en: [
        'How do you leverage prioritization frameworks (RICE, MoSCoW, Kano) to defend your quarterly roadmap decisions?',
        'Define key SaaS product metrics: North Star Metric, Retention cohorts, Churn rate, LTV, and CAC. How do they interconnect?',
        'How do you conduct customer discovery and validate problem-solution fit before committing engineering resources?',
        'How do you formulate hypotheses and execute statistically significant A/B tests to make data-informed product decisions?',
        'How do you write high-clarity Product Requirement Documents (PRDs) and user stories that empower autonomous engineering delivery?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن ميزة أطلقتها ولم تحقق التفاعل المتوقع من المستخدمين. كيف حللت أسباب الإخفاق وما هي القرارات التي اتخذتها؟',
        'صف موقفاً حدث فيه تعارض قوي في الأولويات بين طلبات فريق المبيعات واحتياجات فريق الهندسة لإصلاح الـ Technical Debt. كيف حسمت الأمر؟',
      ],
      en: [
        'Tell me about a major feature launch that failed to meet its target adoption metrics. How did you conduct the post-launch audit and pivot?',
        'Describe a tense conflict between sales demands for custom enterprise features and engineering demands to address technical debt. How did you resolve the deadlock?',
      ],
    },
    HR: {
      ar: [
        'ما هي فلسفتك في قيادة الفرق التقنية بالتأثير والإقناع (Leading without Authority)؟',
      ],
      en: [
        'What is your philosophy on leading high-performing cross-functional squads through influence without direct authority?',
      ],
    },
    Mixed: {
      ar: [
        'الرئيس التنفيذي طلب إضافة ميزة جديدة فجأة لأن منافساً أطلقها بالأمس، بينما الفريق في منتصف Sprint حاسم. كيف تتصرف بحكمة واحترافية؟',
      ],
      en: [
        'The CEO demands dropping current sprint commitments to clone a competitor’s newly announced feature. How do you analyze market impact and communicate your recommendation constructively?',
      ],
    },
  },

  // ── 12. CS FUNDAMENTALS / JUNIOR ───────────────────────────────────────────
  freshgrad: {
    Technical: {
      ar: [
        'ما الفرق بين الـ Array والـ Linked List، ومتى يكون استخدام أحدهما أفضل من حيث الـ Time Complexity لعمليات الإدخال والبحث؟',
        'اشرح مفهوم Big O Notation وما هو التعقيد الزمني والمكاني لخوارزميات الترتيب الشائعة مثل Merge Sort و Quick Sort؟',
        'ما هي المبادئ الأربعة للبرمجة كائنية التوجه (OOP: Encapsulation, Inheritance, Polymorphism, Abstraction) مع مثال لكل منها؟',
        'ما هو الفرق بين Stack و Queue، واذكر تطبيقاً عملياً لكل منهما في أنظمة التشغيل أو البرمجيات.',
        'كيف يعمل بروتوكول HTTP/HTTPS وما الفرق بين GET و POST و PUT و DELETE و PATCH؟',
        'ما الفرق بين الـ Stack Memory والـ Heap Memory وكيف تدار المتغيرات في كل منهما؟',
        'اشرح مفهوم الـ Recursion وكيف تتجنب مشكلة الـ Stack Overflow.',
        'ما هي مبادئ كود البرمجة النظيف (Clean Code) ومبادئ SOLID بشكل مبسط؟',
        'كيف يعمل نظام التحكم بالإصدارات Git، وما الفرق بين git merge و git rebase؟',
        'ما هي الـ Primary Key و Foreign Key في قواعد البيانات العلاقية ولماذا نستخدم الـ Normalization؟',
      ],
      en: [
        'Compare an Array with a Singly Linked List regarding Big-O time and space complexity for insertion, deletion, and random access.',
        'Explain Big-O notation. What are the average and worst-case time complexities of Merge Sort versus Quick Sort?',
        'Walk through the four pillars of Object-Oriented Programming (Encapsulation, Abstraction, Inheritance, Polymorphism) with code examples.',
        'Contrast a Stack with a Queue. Describe practical applications of each in operating systems or language runtimes.',
        'How does HTTP/HTTPS operate? Differentiate idempotent HTTP methods (GET, PUT, DELETE) from non-idempotent methods (POST, PATCH).',
        'Explain the difference between Stack and Heap memory allocation and how variable lifecycles are governed.',
        'What is recursion, what constitutes a base case, and how does infinite recursion trigger a stack overflow?',
        'What are the core tenets of Clean Code and SOLID principles in everyday software construction?',
        'Explain Git version control mechanics: what is the difference between git merge and git rebase?',
        'What are Primary Keys, Foreign Keys, and database normalization (1NF, 2NF, 3NF)? Why do we normalize data schemas?',
      ],
    },
    Behavioral: {
      ar: [
        'حدثني عن مشروع تخرجك أو مشروع شخصي بنيته: ما هي التقنيات التي استخدمتها وأكبر تحدٍ تقني واجهته؟',
        'عندما تواجه مسألة برمجية صعبة وتعجز عن حلها لساعات، ما هي خطواتك للبحث وحل المشكلة قبل طلب المساعدة؟',
        'كيف تتقبل الملاحظات والنقد لكودك البرمجي أثناء المراجعة؟',
      ],
      en: [
        'Tell me about a capstone or personal side project you engineered from scratch: what technical hurdles did you overcome?',
        'When you get stuck on a difficult bug or algorithmic challenge, what is your systematic troubleshooting process before asking a senior engineer?',
        'How do you receive constructive critique during code reviews and turn it into actionable learning?',
      ],
    },
    HR: {
      ar: [
        'لماذا اخترت دراسة علوم الحاسب والبرمجة، وما الذي يحفزك للتعلم كل يوم؟',
        'ما هي خطتك لتطوير نفسك وسد أي فجوات مهارية خلال سنتك الأولى في العمل؟',
      ],
      en: [
        'What originally sparked your curiosity in computer science and software development?',
        'What is your structured learning plan to rapidly bridge academic concepts with real-world enterprise engineering?',
      ],
    },
    Mixed: {
      ar: [
        'طلب منك إنجاز مهمة باستخدام تقنية أو لغة برمجة لم تدرسها من قبل ولديك يومين فقط. كيف تخطط لتعلم الأساسيات وتسليم المهمة؟',
      ],
      en: [
        'You are assigned a critical ticket requiring a language or framework you have never used before, due in two days. How do you ramp up and deliver safely?',
      ],
    },
  },
};

/**
 * Intelligent detector: maps any arbitrary job role or title string to the most accurate track.
 */
export function detectTrackFromRole(role?: string): CareerTrackId {
  if (!role || typeof role !== 'string') return 'fullstack';
  const r = role.toLowerCase().trim();

  // Mobile
  if (
    r.includes('mobile') ||
    r.includes('flutter') ||
    r.includes('react native') ||
    r.includes('ios') ||
    r.includes('android') ||
    r.includes('swift') ||
    r.includes('kotlin') ||
    r.includes('موبايل') ||
    r.includes('هواتف')
  ) {
    return 'mobile';
  }

  // DevOps & Cloud
  if (
    r.includes('devops') ||
    r.includes('cloud') ||
    r.includes('sre') ||
    r.includes('reliability') ||
    r.includes('infrastructure') ||
    r.includes('kubernetes') ||
    r.includes('docker') ||
    r.includes('aws') ||
    r.includes('سحابي') ||
    r.includes('ديف اوبس')
  ) {
    return 'devops';
  }

  // Data Science & ML
  if (
    r.includes('machine learning') ||
    r.includes('ml engineer') ||
    r.includes('data scien') ||
    r.includes('deep learning') ||
    r.includes('ai researcher') ||
    r.includes('nlp') ||
    r.includes('ذكاء اصطناعي') ||
    r.includes('تعلم آلة') ||
    r.includes('عالم بيانات')
  ) {
    return 'datascience';
  }

  // Data Engineering
  if (
    r.includes('data eng') ||
    r.includes('etl') ||
    r.includes('spark') ||
    r.includes('big data') ||
    r.includes('مهندس بيانات') ||
    r.includes('بيانات ضخمة')
  ) {
    return 'dataengineering';
  }

  // Cybersecurity
  if (
    r.includes('security') ||
    r.includes('cyber') ||
    r.includes('infosec') ||
    r.includes('penetration') ||
    r.includes('soc') ||
    r.includes('أمن') ||
    r.includes('سيبراني')
  ) {
    return 'cybersecurity';
  }

  // UI/UX Design
  if (
    r.includes('ui') ||
    r.includes('ux') ||
    r.includes('design') ||
    r.includes('figma') ||
    r.includes('product design') ||
    r.includes('مصمم') ||
    r.includes('تجربة مستخدم') ||
    r.includes('واجهات مستخدم')
  ) {
    return 'uiux';
  }

  // QA & Testing
  if (
    r.includes('qa') ||
    r.includes('test') ||
    r.includes('quality') ||
    r.includes('automation engineer') ||
    r.includes('جودة') ||
    r.includes('اختبار')
  ) {
    return 'qa';
  }

  // Product Management
  if (
    r.includes('product manage') ||
    r.includes('product lead') ||
    r.includes('product owner') ||
    r.includes('مدير منتج')
  ) {
    return 'product';
  }

  // Junior / Fresh Grad
  if (
    r.includes('junior') ||
    r.includes('intern') ||
    r.includes('fresh') ||
    r.includes('entry') ||
    r.includes('طالب') ||
    r.includes('خريج') ||
    r.includes('مبتدئ')
  ) {
    return 'freshgrad';
  }

  // Frontend
  if (
    r.includes('frontend') ||
    r.includes('front-end') ||
    r.includes('front end') ||
    r.includes('react') ||
    r.includes('vue') ||
    r.includes('angular') ||
    r.includes('واجهة') ||
    r.includes('واجهات')
  ) {
    return 'frontend';
  }

  // Backend
  if (
    r.includes('backend') ||
    r.includes('back-end') ||
    r.includes('back end') ||
    r.includes('node') ||
    r.includes('django') ||
    r.includes('fastapi') ||
    r.includes('spring') ||
    r.includes('golang') ||
    r.includes('خلفي')
  ) {
    return 'backend';
  }

  // Full-Stack / Default
  return 'fullstack';
}

/**
 * Returns a randomized, distinct slice of questions for a track and interview type.
 */
export function getTrackQuestions(
  trackId: CareerTrackId | string,
  type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed',
  language: 'ar' | 'en' = 'en',
  count: number = 3
): string[] {
  const safeTrack: CareerTrackId = (TRACK_QUESTIONS[trackId as CareerTrackId] ? trackId : 'fullstack') as CareerTrackId;
  const trackBank = TRACK_QUESTIONS[safeTrack];
  const langKey = language === 'ar' ? 'ar' : 'en';

  const pool = trackBank[type]?.[langKey] || trackBank.Technical[langKey] || [];
  if (!pool || pool.length === 0) {
    return language === 'ar'
      ? ['حدثني عن خبرتك التقنية وأبرز المشاريع التي قمت ببنائها.']
      : ['Walk me through your engineering background and the most impactful projects you have built.'];
  }

  // Shuffle copy of pool using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.max(1, count));
}
