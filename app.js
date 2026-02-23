/* حس‌نگار — نسخه مفهومی (Goal + Action + Guided + Weekly + Analytics)
   همه داده‌ها فقط روی دستگاه (localStorage).

   مسیرها:
   - ثبت سریع (quick)
   - تحلیل عمیق (deep)
   - فلوهای فوری آماده (guided)

   ویژگی‌ها:
   - هدف جلسه (Session Goal)
   - پل Insight → Action (وضعیت اقدام + مانع)
   - اثر تکنیک‌ها (قبل/بعد + مدت)
   - Needs → Scripts
   - Safety Layer
   - ثبت لحظه خوب (Savoring)
   - هدف هفتگی + پیشرفت
   - History analytics
*/

(() => {
  'use strict';

  /* ==========================
     Helpers DOM
  ========================== */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const byId = (id) => document.getElementById(id);

  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }

  function safeAlert(msg){
    // موبایل‌ها بعضی وقت‌ها alert زیاد آزاردهنده است، اما برای نسخه ساده کافی است.
    alert(msg);
  }

  /* ==========================
     ثابت‌ها / داده پایه
  ========================== */

  const APP_SCHEMA_VERSION = 3;

  const STORE_KEY_V2 = 'hesnegar_records_v2';
  const STORE_KEY_V1 = 'hesnegar_records_v1';
  const WEEKLY_KEY = 'hesnegar_weekly_v1';

  const EMOTIONS_COMMON = [
    'اضطراب','استرس','ترس','غم','خشم','حسادت','شرم','گناه','حقارت','ناامیدی','بی‌قراری',
    'آرامش','شادی','امید','هیجان','رضایت','افتخار','عشق','سپاس','انگیزه'
  ];

  const BODY_SPOTS = [
    'گلو','سینه','شکم','سر','فک/صورت','دست/پا','کل بدن','نامشخص'
  ];

  const GOALS = [
    { id:'calm', title:'آرام شدن سریع', help:'وقتی شدت بالاست یا بدنت فعال شده: اول بدن را تنظیم کن، بعد تصمیم.' },
    { id:'understand', title:'فهمیدن ریشه', help:'وقتی می‌خواهی بفهمی «چی شد؟ چرا؟ نیازم چی بود؟» و از تکرار جلوگیری کنی.' },
    { id:'decide', title:'تصمیم‌گیری سالم', help:'وقتی باید تصمیم بگیری اما احساس/فکرهای شدید دخالت می‌کنند.' },
    { id:'relationship', title:'رابطه/مرز', help:'وقتی موضوع به ارتباط/احترام/مرزبندی مربوط است و خروجی باید «جمله آماده» باشد.' },
    { id:'focus', title:'تمرکز/اقدام', help:'وقتی گیر کردی و فقط یک قدم کوچک برای برگشت به مسیر می‌خواهی.' },
    { id:'savor', title:'ثبت لحظه خوب ✨', help:'وقتی حس خوب داری و می‌خواهی تثبیتش کنی و یاد بگیری تکرارش کنی.' },
  ];

  // این انتخاب کمک می‌کند مسیر را درست شروع کنی:
  // گاهی اول باید «بدن/هیجان» را تنظیم کرد، گاهی مسئله بیرونی نیاز به حل دارد.
  const PROBLEM_MODES = [
    { id:'regulate', title:'اول تنظیم هیجان', help:'وقتی موج شدیده/بدن فعال شده/ذهن قفل کرده. هدف: از ۹ به ۶ برسیم.' },
    { id:'solve', title:'حل مسئله بیرونی', help:'وقتی مشکل بیرونی مشخص است و نیاز به تصمیم/اقدام دارد. هدف: یک قدم کوچک کم‌ریسک.' },
    { id:'both', title:'هر دو', help:'هم بدن نیاز به تنظیم دارد هم مسئله نیاز به اقدام. اول تنظیم کوتاه، بعد اقدام کوچک.' },
    { id:'unsure', title:'نامشخص', help:'اگر مطمئن نیستی، «اول تنظیم هیجان» معمولاً امن‌تر است.' },
  ];

  // آسیب‌پذیری‌های روز (DBT/PLEASE + HALT) — برای فهم اینکه «چرا امروز حساس‌ترم»
  const VULN_FACTORS = [
    { id:'sleep', title:'کم‌خوابی/خستگی', help:'وقتی خواب کم است، مغز سریع‌تر تهدید می‌بیند.' },
    { id:'hungry', title:'گرسنگی/کم‌غذا', help:'قند پایین → تحریک‌پذیری و اضطراب بیشتر.' },
    { id:'lonely', title:'تنهایی/کم‌حمایت', help:'کمبود ارتباط → نشخوار و حساسیت بیشتر.' },
    { id:'caffeine', title:'کافئین/نیکوتین زیاد', help:'می‌تواند بدن را شبیه اضطراب فعال کند.' },
    { id:'pain', title:'درد/بیماری', help:'بدن در حالت دفاعی → تحمل کمتر.' },
    { id:'stress', title:'فشار کاری/ذهن شلوغ', help:'ظرفیت تصمیم‌گیری کمتر می‌شود.' },
  ];

  // دام‌های شناختی (CBT) — انتخاب ۱–۲ مورد برای شفاف‌سازی داستان ذهن
  const COG_DISTORTIONS = [
    { id:'catastrophizing', title:'فاجعه‌سازی', help:'بدترین سناریو را قطعی می‌بینم.' },
    { id:'mind_reading', title:'ذهن‌خوانی', help:'بدون شواهد مطمئنم دیگران چه فکر می‌کنند.' },
    { id:'all_or_nothing', title:'همه/هیچ', help:'یا کامل، یا شکست؛ حد وسط نمی‌بینم.' },
    { id:'shoulds', title:'بایدها', help:'با «باید/نباید» خودم را می‌زنم.' },
    { id:'personalization', title:'شخصی‌سازی', help:'همه‌چیز را تقصیر/ربط خودم می‌دانم.' },
    { id:'labeling', title:'برچسب‌زدن', help:'به جای رفتار، به خودم/دیگری برچسب می‌زنم.' },
    { id:'filter', title:'فیلتر منفی', help:'فقط بخش منفی را می‌بینم و بقیه را حذف می‌کنم.' },
  ];

  // راهبردهای رایجِ ناسالم برای تامین نیاز (برای خودآگاهی الگو)
  const OLD_STRATEGIES = [
    { id:'avoid', title:'اجتناب/فرار', help:'می‌پیچونم/قطع می‌کنم تا درد کم شود.' },
    { id:'control', title:'کنترل‌گری', help:'می‌خواهم همه‌چیز را سریع کنترل کنم.' },
    { id:'attack', title:'حمله/دعوا', help:'برای حفظ خودم فشار می‌آورم/می‌جنگم.' },
    { id:'freeze', title:'فریز/خاموشی', help:'قفل می‌کنم و کاری نمی‌کنم.' },
    { id:'please', title:'خواهش/راضی‌کردن', help:'خودم را قربانی می‌کنم تا رابطه خراب نشود.' },
    { id:'perfection', title:'کمال‌گرایی', help:'فقط اگر کامل باشم ارزش دارم.' },
  ];

  const NEED_INFO = {
    'بقا 🛡️': 'امنیت، سلامت، پول، نظم، کاهش ریسک.',
    'عشق و تعلق 💞': 'ارتباط، پذیرفته‌شدن، صمیمیت، حمایت.',
    'قدرت و ارزشمندی 💪': 'موثر بودن، احترام، نتیجه/پیشرفت، شایستگی.',
    'آزادی 🕊️': 'انتخاب، استقلال، مرزبندی، اختیار.',
    'تفریح و لذت 🎨': 'سرگرمی، خلاقیت، بازی، کنجکاوی.'
  };

  const NEED_SCRIPTS = {
    'بقا 🛡️': {
      request: '«برای اینکه حس امنیت بیشتری داشته باشم، دوست دارم دربارهٔ … شفاف‌سازی کنیم و یک برنامه/قدم مشخص بچینیم.»',
      boundary: '«اگر گفتگو/شرایط به سمت بی‌ثباتی یا ریسک بالا رفت، من گفتگو را متوقف می‌کنم و بعد از آرام‌شدن ادامه می‌دهم.»'
    },
    'عشق و تعلق 💞': {
      request: '«من به ارتباط و همراهی نیاز دارم. می‌تونی ۱۰ دقیقه کنارم باشی/گوش بدی بدون راه‌حل دادن؟»',
      boundary: '«اگر احساس کنم نادیده گرفته می‌شم، مکالمه را مکث می‌کنم و بعداً در زمان مناسب ادامه می‌دم.»'
    },
    'قدرت و ارزشمندی 💪': {
      request: '«برای من مهمه تلاش‌هام دیده بشه. می‌تونی مشخص بگی کجا خوب بودم و کجا باید بهتر شم؟»',
      boundary: '«اگر گفتگو به تحقیر/برچسب‌زدن برسه، من ادامه نمی‌دم. فقط دربارهٔ رفتار مشخص صحبت می‌کنیم.»'
    },
    'آزادی 🕊️': {
      request: '«برای من مهمه حق انتخاب داشته باشم. ترجیح می‌دم بین این دو گزینه خودم انتخاب کنم.»',
      boundary: '«اگر فشار/کنترل ادامه پیدا کنه، من فاصله می‌گیرم و تصمیمم را بعداً اعلام می‌کنم.»'
    },
    'تفریح و لذت 🎨': {
      request: '«من به کمی سبک‌کردن فضا نیاز دارم. می‌تونیم ۳۰ دقیقه یک کار ساده/تفریحی انجام بدیم؟»',
      boundary: '«اگر فقط کار/فشار ادامه داشته باشه، من برای استراحت کوتاه برنامه می‌ذارم و بعد برمی‌گردم.»'
    }
  };

  const NEED_ALT_STRATEGY = {
    'بقا 🛡️': 'یک «قدم امن» انتخاب کن: شفاف‌سازی + برنامه کوچک (۱۰ دقیقه) + کمک گرفتن.',
    'عشق و تعلق 💞': 'یک اتصال کوچک: پیام کوتاه صادقانه + درخواست گوش‌دادن ۱۰ دقیقه.',
    'قدرت و ارزشمندی 💪': 'تمرکز روی فرایند: یک کار کوچک قابل انجام + درخواست بازخورد مشخص.',
    'آزادی 🕊️': 'یک انتخاب مشخص: گزینه A/B + مرز محترمانه + اعلام زمان تصمیم.',
    'تفریح و لذت 🎨': '۱۰ دقیقه لذت سالم: موسیقی/حرکت/خلاقیت + برنامه تکرار.'
  };

  const TOOLBOX = [
    {
      id: 'breath_box',
      title: 'تنفس جعبه‌ای ۴×۴×۴×۴',
      tag: 'بدن/استرس',
      when: 'وقتی شدت ۶+ است یا ضربان/تنش بالاست.',
      steps: ['۴ ثانیه دم','۴ ثانیه نگه‌دار','۴ ثانیه بازدم','۴ ثانیه نگه‌دار','۴ دور تکرار'],
    },
    {
      id: 'ground_54321',
      title: 'گراندینگ ۵–۴–۳–۲–۱',
      tag: 'بدن/حضور',
      when: 'وقتی ذهن قفل کرده یا بدنت می‌لرزد/می‌پرد.',
      steps: ['۵ چیز که می‌بینی','۴ چیز که لمس می‌کنی','۳ چیز که می‌شنوی','۲ چیز که بو می‌کشی','۱ چیز که مزه می‌کنی']
    },
    {
      id: 'act_defusion',
      title: 'ACT: جداشدن از فکر (Defusion)',
      tag: 'ذهن/نشخوار',
      when: 'وقتی فکرها هی تکرار می‌شوند (مقایسه، فاجعه‌سازی…).',
      steps: [
        'جمله را این‌طور بگو: «دارم این فکر را تجربه می‌کنم که …»',
        'نامش را بگذار: «ذهنم دارد مقایسه پخش می‌کند.»',
        'بعد یک عمل کوچک انتخاب کن (۲–۱۰ دقیقه)'
      ]
    },
    {
      id: 'cbt_fact_story',
      title: 'CBT: جدا کردن «واقعیت» از «داستان»',
      tag: 'ذهن/شفاف‌سازی',
      when: 'وقتی معنی‌سازی سریع، حس را شعله‌ور کرده.',
      steps: ['واقعیتِ قابل مشاهده را بنویس (بدون تفسیر).','داستان/تعبیر ذهن را بنویس.','یک تفسیر جایگزینِ متعادل اضافه کن.']
    },
    {
      id: 'self_compassion',
      title: 'خود-شفقت ۶۰ ثانیه‌ای',
      tag: 'شفقت/شرم',
      when: 'وقتی شرم، حقارت یا خودسرزنش فعال است.',
      steps: ['دست روی سینه/شکم: «الان سخت است.»','نام‌گذاری: «این شرم/ترس است.»','انسانیت مشترک: «خیلی‌ها این حس را تجربه می‌کنند.»','مهربانی: «من می‌توانم با خودم مهربان‌تر باشم.»']
    },
    {
      id: 'savor',
      title: 'لذت‌بُردن آگاهانه (Savoring)',
      tag: 'مثبت/تثبیت',
      when: 'وقتی حس خوب داری و می‌خواهی تثبیتش کنی.',
      steps: ['۳۰ ثانیه حس بدنی را پیدا کن (گرمی، سبک شدن…).','۳ چیز که باعث این حس شد را نام ببر.','یک یادداشت کوتاه ثبت کن.','یک اقدام کوچک برای ادامه‌دادنش انتخاب کن.']
    },
    {
      id: 'cooldown',
      title: 'قانون Cooldown',
      tag: 'بدن/ریسک',
      when: 'وقتی شدت ۷+ است: تصمیم مهم/معامله/پیام حساس ممنوع.',
      steps: ['اول بدن را تنظیم کن (تنفس/گراندینگ).','بعد تصمیم را حداقل ۲۰ دقیقه عقب بینداز.','وقتی شدت < ۶ شد، دوباره بررسی کن.']
    },
    {
      id: 'values_pause',
      title: 'مکثِ ارزش‌محور (۳۰ ثانیه)',
      tag: 'ذهن/تصمیم',
      when: 'وقتی بین دو انتخاب گیر کردی یا تصمیم احساسی است.',
      steps: ['۳ نفس آهسته.','بپرس: «کدوم انتخاب با ارزش‌های من هماهنگ‌تره؟»','یک قدم کوچک کم‌ریسک انتخاب کن.']
    },
    {
      id: 'boundary_script',
      title: 'اسکریپت مرزبندی کوتاه',
      tag: 'رابطه/مرز',
      when: 'وقتی می‌خواهی محترمانه مرز بگذاری.',
      steps: ['واقعیت: «وقتی …»','اثر روی من: «من احساس … می‌کنم»','درخواست/مرز: «لطفاً … / اگر … من …»']
    },
    {
      id: 'gratitude_3',
      title: 'سپاس ۳تایی (۳۰ ثانیه)',
      tag: 'مثبت/تثبیت',
      when: 'وقتی می‌خواهی لحظه خوب را تقویت کنی.',
      steps: ['۳ چیز کوچک که خوب بود را بنویس.','یکی را به یک نفر پیام بده (اختیاری).','یک قدم برای تکرارش تعیین کن.']
    },
    {
      id: 'solve_4step',
      title: 'مینی حل مسئله (۴ قدم)',
      tag: 'مسئله/اقدام',
      when: 'وقتی مشکل بیرونی مشخصه و می‌خوای یک قدم کم‌ریسک برداری.',
      steps: [
        '۱) مسئله دقیق چیه؟ (یک جمله مشخص)',
        '۲) دو گزینه ممکن چی هست؟ (حتی ساده)',
        '۳) کوچک‌ترین قدم کم‌ریسک چیه؟ (۲–۱۵ دقیقه)',
        '۴) معیار موفقیت چیه؟ (یک علامت قابل مشاهده)'
      ]
    },
    {
      id: 'ba_5min_start',
      title: 'شروع ۵ دقیقه‌ای (Behavioral Activation)',
      tag: 'انرژی/غم',
      when: 'وقتی غم/بی‌انگیزگی داری و مغز می‌گه «حوصله ندارم». هدف: فقط شروع.',
      steps: [
        'یک کار خیلی کوچک انتخاب کن (۵ دقیقه).',
        'تایمر ۵ دقیقه بزن و فقط شروع کن.',
        'بعد از ۵ دقیقه: یا ۲ دقیقه ادامه بده، یا با مهربانی توقف کن.',
        'یک پاداش کوچک بده (چای/موسیقی/استراحت کوتاه).'
      ]
    },
    {
      id: 'urge_surfing',
      title: 'موج‌سواری وسوسه (Urge Surfing)',
      tag: 'وسوسه/عادت',
      when: 'وقتی وسوسه/اجبار داری (اسکرول، خوردن هیجانی، پیام دادن…). هدف: ۱۰ دقیقه تأخیر.',
      steps: [
        'نام‌گذاری: «این یک موجِ وسوسه است.»',
        'بدن: موج کجا حس می‌شه؟ (گلو/شکم…)',
        'تنفس آهسته ۱۰ نفس + نگاه به بالا/اطراف.',
        '۱۰ دقیقه تأخیر + یک جایگزین امن (آب، قدم، پیام به دوست امن).'
      ]
    },
    {
      id: 'dear_man',
      title: 'DEAR MAN (درخواست/مرز در DBT)',
      tag: 'رابطه/درخواست',
      when: 'وقتی باید محترمانه «درخواست» کنی یا «نه» بگی بدون جنگ/خواهش.',
      steps: [
        'D توصیف: «وقتی …» (فقط واقعیت)',
        'E احساس/اثر: «من احساس … می‌کنم / اثرش اینه…»',
        'A درخواست: «می‌خوام …» (شفاف و کوتاه)',
        'R نتیجه: «این کمک می‌کنه که …»',
        'M ذهن‌آگاهی: تکرار درخواست، وارد حاشیه نشو',
        'A مطمئن: تماس چشمی/تن صدای ثابت',
        'N مذاکره: یک گزینه جایگزین پیشنهاد بده'
      ]
    }
  ];

  const VALENCE_LABELS = { bad: 'بد/سنگین', good: 'خوب/سبک', neutral: 'خنثی/نامشخص' };

  const FLOWS = {
    panic: {
      id:'panic',
      title:'حمله اضطراب/پانیک',
      intro:'هدف: بدن را سریع به «حضور» برگردانیم تا شدت پایین بیاید.',
      goal:'calm',
      toolIds:['ground_54321','breath_box'],
    },
    anger: {
      id:'anger',
      title:'خشم/برانگیختگی',
      intro:'هدف: قبل از واکنش/پیام/تصمیم، بدن را آرام کنیم و یک مرز کوچک بسازیم.',
      goal:'calm',
      toolIds:['cooldown','breath_box','boundary_script'],
    },
    rumination: {
      id:'rumination',
      title:'نشخوار ذهنی',
      intro:'هدف: از حلقه فکر بیرون بیاییم و به یک عمل کوچک برگردیم.',
      goal:'focus',
      toolIds:['act_defusion','cbt_fact_story','values_pause'],
    },
    shame: {
      id:'shame',
      title:'شرم/خودسرزنش',
      intro:'هدف: از خودکوبی به سمت خودشفقت و واقع‌بینی برگردیم.',
      goal:'relationship',
      toolIds:['self_compassion','cbt_fact_story'],
    },
    savor: {
      id:'savor',
      title:'ثبت لحظه خوب ✨',
      intro:'هدف: حس خوب را «ثبت و تثبیت» کنیم تا مغز یاد بگیرد تکرارش کند.',
      goal:'savor',
      toolIds:['savor','gratitude_3'],
    },
    sadness: {
      id:'sadness',
      title:'غم/بی‌انگیزگی',
      intro:'هدف: از «خاموشی» به یک شروعِ کوچک برگردیم؛ نه با زور، با قدم خیلی کم.',
      goal:'focus',
      toolIds:['ba_5min_start','self_compassion','values_pause'],
    },
    urge: {
      id:'urge',
      title:'وسوسه/اجبار',
      intro:'هدف: موج وسوسه را ۱۰ دقیقه تحمل کنیم تا انتخابِ بهتر ممکن شود.',
      goal:'decide',
      toolIds:['urge_surfing','breath_box','values_pause'],
    },
    conflict: {
      id:'conflict',
      title:'تعارض رابطه‌ای',
      intro:'هدف: قبل از واکنش تند، بدن را تنظیم کنیم و یک درخواست/مرز سالم بسازیم.',
      goal:'relationship',
      toolIds:['cooldown','dear_man','boundary_script'],
    }
  };

  /* ==========================
     وضعیت (State)
  ========================== */

  const state = {
    nav: ['home'],
    quick: null,
    deep: null,
    guided: null,
    weekly: null,
  };

  function defaultQuick(){
    return {
      goal:'calm',
      mode:'regulate',
      vuln:[],
      valence:'bad',
      emotions:[],
      intensity:5,
      body:'سینه',
      trigger:'',
      mind:'',
      harm:'no',
      toolId:'',
      didTool:'yes',
      minutes:2,
      helpfulness:3,
      difficulty:2,
      nextAction:'',
      actionStatus:'planned',
      blocker:'',
      after:4,
      principles:[],
      improvements:[],
      achievements:[],
      summaryText:''
    };
  }

  function defaultDeep(){
    return {
      goal:'understand',
      mode:'both',
      vuln:[],
      emotionsText:'',
      intensity:6,
      body:'سینه',
      trigger:'',
      harm:'no',
      facts:'',
      story:'',
      distortions:[],
      balancedThought:'',
      underlyingText:'',
      rumination:'نامشخص',
      needs:[],
      oldStrategy:'',
      oldStrategyNote:'',
      newStrategy:'',
      voice:'',
      first:'',
      adultLine:'',
      toolId:'',
      didTool:'yes',
      minutes:5,
      helpfulness:3,
      difficulty:2,
      plan:'',
      actionStatus:'planned',
      blocker:'',
      after:4,
      nextTime:'',
      principles:[],
      improvements:[],
      achievements:[],
      summaryText:''
    };
  }

  function defaultGuided(flowId){
    const f = FLOWS[flowId] || FLOWS.panic;
    return {
      flowId: f.id,
      goal: f.goal,
      mode:'regulate',
      vuln:[],
      intensity:6,
      body:'سینه',
      trigger:'',
      harm:'no',
      toolId: f.toolIds[0] || '',
      didTool:'yes',
      minutes:3,
      helpfulness:3,
      difficulty:2,
      nextAction:'',
      actionStatus:'planned',
      blocker:'',
      after:4,
      principles:[],
      improvements:[],
      achievements:[],
      savorMoment:'',
      savorWhy:'',
      savorRepeat:'',
      summaryText:''
    };
  }

  /* ==========================
     ذخیره‌سازی
  ========================== */

  function loadJSON(key, fallback){
    try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch{ return fallback; }
  }

  function saveJSON(key, obj){
    localStorage.setItem(key, JSON.stringify(obj));
  }

  function uuid(){
    if(globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  }

  function nowISO(){ return new Date().toISOString(); }

  function fmtDate(iso){
    try{
      const d = new Date(iso);
      return d.toLocaleString('fa-IR', {dateStyle:'medium', timeStyle:'short'});
    }catch{ return iso; }
  }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function valenceLabel(v){ return VALENCE_LABELS[v] || v || '—'; }

  function loadRecordsRaw(){
    const v2 = loadJSON(STORE_KEY_V2, null);
    if(Array.isArray(v2)) return v2;

    const v1 = loadJSON(STORE_KEY_V1, []);
    if(Array.isArray(v1) && v1.length){
      const migrated = v1.map(migrateV1ToV2).filter(Boolean);
      saveJSON(STORE_KEY_V2, migrated);
      return migrated;
    }
    saveJSON(STORE_KEY_V2, []);
    return [];
  }

  function saveRecords(list){
    saveJSON(STORE_KEY_V2, list);
  }

  function migrateV1ToV2(rec){
    if(!rec || typeof rec !== 'object') return null;
    const type = rec.type;
    const base = {
      id: rec.id || uuid(),
      type: type === 'quick' || type === 'deep' ? type : 'quick',
      createdAt: rec.createdAt || nowISO(),
      meta: { schema: APP_SCHEMA_VERSION },
      data: {},
      summaryText: rec.summaryText || ''
    };

    if(type === 'quick'){
      const d = rec.data || {};
      base.data = {
        goal: 'calm',
        valence: d.valence ?? 'bad',
        emotions: Array.isArray(d.emotions) ? d.emotions : [],
        intensity: Number.isFinite(d.intensity) ? d.intensity : 5,
        body: d.body || 'نامشخص',
        trigger: d.trigger || '',
        mind: d.mind || '',
        harm: 'no',
        toolId: d.toolId || '',
        didTool: 'yes',
        minutes: 0,
        nextAction: d.nextAction || '',
        actionStatus: 'planned',
        blocker: '',
        after: Number.isFinite(d.after) ? d.after : 0,
      };
      return base;
    }

    if(type === 'deep'){
      const d = rec.data || {};
      base.data = {
        goal: 'understand',
        emotionsText: d.emotionsText || '',
        intensity: Number.isFinite(d.intensity) ? d.intensity : 6,
        body: d.body || 'نامشخص',
        trigger: d.trigger || '',
        harm: 'no',
        facts: d.facts || '',
        story: d.story || '',
        underlyingText: d.underlyingText || '',
        rumination: d.rumination || 'نامشخص',
        needs: Array.isArray(d.needs) ? d.needs : [],
        voice: d.voice || '',
        first: d.first || '',
        adultLine: d.adultLine || '',
        toolId: d.toolId || '',
        didTool: 'yes',
        minutes: 0,
        plan: d.plan || '',
        actionStatus: 'planned',
        blocker: '',
        after: Number.isFinite(d.after) ? d.after : 0,
        nextTime: d.nextTime || '',
      };
      return base;
    }

    return base;
  }

  function addRecord(rec){
    const list = loadRecordsRaw();
    list.unshift(rec);
    saveRecords(list);
  }

  /* ==========================
     ناوبری
  ========================== */

  function show(screen, {push=true} = {}){
    $$('.screen').forEach(sc => sc.classList.add('hidden'));
    const target = $(`.screen[data-screen="${screen}"]`);
    if(!target) return;
    target.classList.remove('hidden');
    document.body.dataset.screen = screen;
    if(push){
      const last = state.nav[state.nav.length - 1];
      if(last !== screen) state.nav.push(screen);
    }
    window.scrollTo({top:0, behavior:'auto'});
  }

  function back(){
    if(state.nav.length <= 1){ show('home', {push:false}); return; }
    state.nav.pop();
    show(state.nav[state.nav.length - 1], {push:false});
  }

  $$('[data-back]').forEach(b => on(b, 'click', back));

  /* ==========================
     رندرهای عمومی
  ========================== */

  function renderGoalChips(host, currentId, setId){
    if(!host) return;
    host.innerHTML = GOALS.map(g => {
      const onCls = g.id === currentId ? 'on' : '';
      return `<button class="chip ${onCls}" data-goal="${g.id}" title="${escapeHTML(g.help)}">${escapeHTML(g.title)}</button>`;
    }).join('');
    host.querySelectorAll('[data-goal]').forEach(btn => {
      on(btn, 'click', (e) => {
        const id = e.currentTarget.dataset.goal;
        setId(id);
        renderGoalChips(host, id, setId);
      });
    });
  }

  function renderModeChips(host, currentId, setId){
    if(!host) return;
    host.innerHTML = PROBLEM_MODES.map(m => {
      const onCls = m.id === currentId ? 'on' : '';
      return `<button class="chip ${onCls}" data-mode="${m.id}" title="${escapeHTML(m.help)}">${escapeHTML(m.title)}</button>`;
    }).join('');
    host.querySelectorAll('[data-mode]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const id = e.currentTarget.dataset.mode;
        setId(id);
        renderModeChips(host, id, setId);
      });
    });
  }

  function renderVulnChips(host, selected, setSelected){
    if(!host) return;
    const arr = Array.isArray(selected) ? selected : [];
    host.innerHTML = VULN_FACTORS.map(v => {
      const onCls = arr.includes(v.id) ? 'on' : '';
      return `<button class="chip ${onCls}" data-vuln="${v.id}" title="${escapeHTML(v.help)}">${escapeHTML(v.title)}</button>`;
    }).join('');
    host.querySelectorAll('[data-vuln]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const id = e.currentTarget.dataset.vuln;
        toggleIn(arr, id);
        setSelected([...arr]);
        renderVulnChips(host, arr, setSelected);
      });
    });
  }

  function renderDistortionChips(host, selected, setSelected, max=2){
    if(!host) return;
    const arr = Array.isArray(selected) ? selected : [];
    host.innerHTML = COG_DISTORTIONS.map(d => {
      const onCls = arr.includes(d.id) ? 'on' : '';
      return `<button class="chip ${onCls}" data-dist="${d.id}" title="${escapeHTML(d.help)}">${escapeHTML(d.title)}</button>`;
    }).join('');
    host.querySelectorAll('[data-dist]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const id = e.currentTarget.dataset.dist;
        toggleIn(arr, id);
        if(arr.length > max) arr.splice(0, arr.length - max);
        setSelected([...arr]);
        renderDistortionChips(host, arr, setSelected, max);
      });
    });
  }

  function renderOldStrategyChips(host, currentId, setId){
    if(!host) return;
    host.innerHTML = OLD_STRATEGIES.map(s => {
      const onCls = s.id === currentId ? 'on' : '';
      return `<button class="chip ${onCls}" data-oldst="${s.id}" title="${escapeHTML(s.help)}">${escapeHTML(s.title)}</button>`;
    }).join('');
    host.querySelectorAll('[data-oldst]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const id = e.currentTarget.dataset.oldst;
        setId(id);
        renderOldStrategyChips(host, id, setId);
      });
    });
  }

  function loadList(key){
    return loadJSON(key, []);
  }

  function addToList(key, text, limit=10){
    const t = String(text || '').trim();
    if(!t) return { ok:false, msg:'خالی است.' };
    const list = loadList(key);
    if(list.length >= limit) return { ok:false, msg:`به حداکثر تعداد (${limit}) رسیدی.` };
    list.unshift(t);
    saveJSON(key, list);
    return { ok:true, msg:'اضافه شد ✅' };
  }

  function renderListPicker({chipsHost, selectedHost, addInput, addBtn, key, selectedArr, setSelectedArr, max=1}){
    if(!chipsHost) return;
    const list = loadList(key);
    const arr = Array.isArray(selectedArr) ? selectedArr : [];

    if(!list.length){
      chipsHost.innerHTML = `<div class="helper">— لیست خالی است. از صفحهٔ مربوطه یا همین‌جا یک مورد اضافه کن.</div>`;
    }else{
      chipsHost.innerHTML = list.map(item => {
        const onCls = arr.includes(item) ? 'on' : '';
        return `<button class="chip ${onCls}" data-pick="${escapeHTML(item)}">${escapeHTML(item)}</button>`;
      }).join('');

      chipsHost.querySelectorAll('[data-pick]').forEach(btn => {
        on(btn, 'click', (e)=>{
          const v = e.currentTarget.getAttribute('data-pick') || '';
          toggleIn(arr, v);
          if(arr.length > max) arr.splice(0, arr.length - max);
          setSelectedArr([...arr]);
          renderListPicker({chipsHost, selectedHost, addInput, addBtn, key, selectedArr:arr, setSelectedArr, max});
        });
      });
    }

    if(selectedHost){
      selectedHost.textContent = arr.length ? `انتخاب: ${arr.join('، ')}` : '— اختیاری است.';
    }

    if(addBtn && addInput && !addBtn.dataset.bound){
      addBtn.dataset.bound = '1';
      on(addBtn, 'click', ()=>{
        const res = addToList(key, addInput.value);
        if(res.ok){
          addInput.value = '';
          renderListPicker({chipsHost, selectedHost, addInput, addBtn, key, selectedArr:arr, setSelectedArr, max});
        }else{
          safeAlert(res.msg);
        }
      });
    }
  }

  function renderActionPills(host, current, setStatus){
    if(!host) return;
    const items = [
      {id:'planned', title:'برنامه‌ریزی شد'},
      {id:'done', title:'انجام شد ✅'},
      {id:'skipped', title:'نشد'},
    ];
    host.innerHTML = items.map(it => `<button class="pill ${it.id===current?'on':''}" data-status="${it.id}">${it.title}</button>`).join('');
    host.querySelectorAll('[data-status]').forEach(btn => {
      on(btn, 'click', (e) => {
        const id = e.currentTarget.dataset.status;
        setStatus(id);
        renderActionPills(host, id, setStatus);
      });
    });
  }

  function toolById(id){ return TOOLBOX.find(t => t.id === id) || null; }

  function toolCard(t){
    const steps = (t.steps || []).map(s => `<li>${escapeHTML(s)}</li>`).join('');
    return `
      <div class="row wrap" style="justify-content:space-between">
        <div>
          <b>${escapeHTML(t.title)}</b>
          <div class="helper">${escapeHTML(t.tag)} • ${escapeHTML(t.when)}</div>
        </div>
        <span class="badge">${escapeHTML(t.id)}</span>
      </div>
      <ol class="helper" style="margin:8px 0 0">${steps}</ol>
    `;
  }

  function renderToolChips(chipsHost, infoHost, toolIds, selectedId, setSelected){
    if(!chipsHost || !infoHost) return;
    const tools = toolIds.map(toolById).filter(Boolean);
    chipsHost.innerHTML = tools.map(t => `<button class="chip ${t.id===selectedId?'on':''}" data-tool="${t.id}">${escapeHTML(t.title)}</button>`).join('');
    chipsHost.querySelectorAll('[data-tool]').forEach(btn => {
      on(btn, 'click', (e) => {
        const id = e.currentTarget.dataset.tool;
        setSelected(id);
        renderToolChips(chipsHost, infoHost, toolIds, id, setSelected);
      });
    });

    const selected = toolById(selectedId);
    infoHost.innerHTML = selected
      ? toolCard(selected)
      : `<div class="helper">یک ابزار انتخاب کن تا توضیحش نمایش داده شود.</div>`;
  }

  function escapeHTML(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  /* ==========================
     پیشنهاد ابزار
  ========================== */

  function recommendToolIds({goal, valence, intensity, rumination}){
    const ids = [];

    // لحظه خوب یا حس مثبت
    if(goal === 'savor' || valence === 'good'){
      ids.push('savor','gratitude_3');
      return Array.from(new Set(ids));
    }

    // شدت بالا
    if(intensity >= 7) ids.push('cooldown');
    if(intensity >= 6) ids.push('breath_box','ground_54321');

    // بر اساس هدف
    if(goal === 'calm'){
      ids.push('breath_box','ground_54321');
    }

    if(goal === 'understand'){
      ids.push('cbt_fact_story');
      if(rumination === 'بله') ids.push('act_defusion');
    }

    if(goal === 'decide'){
      ids.push('values_pause','cbt_fact_story','solve_4step');
    }

    if(goal === 'relationship'){
      ids.push('boundary_script','self_compassion','cbt_fact_story');
    }

    if(goal === 'focus'){
      ids.push('ba_5min_start','act_defusion','values_pause');
    }

    // همیشه یک گزینه مهربانی
    ids.push('self_compassion');

    return Array.from(new Set(ids)).filter(Boolean);
  }

  /* ==========================
     Safety Layer
  ========================== */

  function buildSafetyHTML({harm, intensity}){
    const shouldShow = harm === 'yes' || intensity >= 8;
    if(!shouldShow) return { show:false, html:'' };

    const lines = [];
    lines.push('<b>⛑️ پیام ایمنی</b>');

    if(harm === 'yes'){
      lines.push('<div class="helper">گفتی فکر آسیب (به خودت/دیگران) مطرحه. این اپ جای کمک حرفه‌ای نیست. اگر «خطر فوری» وجود دارد، همین الان با خدمات اضطراری محل زندگی‌ات تماس بگیر (در بسیاری از کشورها: <b>112</b> یا 911 یا 110). اگر امکانش هست، با یک نفر امن هم تماس بگیر.</div>');
      lines.push('<div class="helper"><b>قدم فوری (۳۰ ثانیه):</b> ۳ نفس آهسته + نوشیدن آب + دورکردن خودت از ابزار/موقعیت خطرناک + تماس با یک نفر.</div>');
    }else{
      lines.push('<div class="helper">شدت خیلی بالاست. تا وقتی شدت زیر ۶ نیومده، تصمیم مهم/ترید/پیام حساس نده. اول یک تکنیک بدن‌محور انجام بده.</div>');
    }

    lines.push(`<div class="row wrap"><span class="badge warn">شدت ${intensity}/10</span>${harm==='yes' ? '<span class="badge bad">هشدار</span>' : '<span class="badge warn">Cooldown</span>'}</div>`);

    return { show:true, html: lines.join('') };
  }

  function applySafety(box, harm, intensity){
    if(!box) return;
    const s = buildSafetyHTML({harm, intensity});
    if(!s.show){ box.classList.add('hidden'); box.innerHTML=''; return; }
    box.classList.remove('hidden');
    box.innerHTML = s.html;
  }

  /* ==========================
     Quick Flow
  ========================== */

  function resetQuick(){
    state.quick = defaultQuick();

    // UI reset
    if(byId('qcEmotionInput')) byId('qcEmotionInput').value = '';
    if(byId('qcTrigger')) byId('qcTrigger').value = '';
    if(byId('qcMind')) byId('qcMind').value = '';
    if(byId('qcNextAction')) byId('qcNextAction').value = '';
    if(byId('qcBlocker')) byId('qcBlocker').value = '';

    if(byId('qcIntensity')) byId('qcIntensity').value = String(state.quick.intensity);
    if(byId('qcAfter')) byId('qcAfter').value = String(state.quick.after);
    if(byId('qcMinutes')) byId('qcMinutes').value = String(state.quick.minutes);

    if(byId('qcBody')){
      byId('qcBody').innerHTML = BODY_SPOTS.map(b => `<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');
      byId('qcBody').value = state.quick.body;
    }
    if(byId('qcValence')) byId('qcValence').value = state.quick.valence;
    if(byId('qcHarm')) byId('qcHarm').value = state.quick.harm;
    if(byId('qcDidTool')) byId('qcDidTool').value = state.quick.didTool;

    if(byId('qcHelpfulness')) byId('qcHelpfulness').value = String(state.quick.helpfulness);
    if(byId('qcDifficulty')) byId('qcDifficulty').value = String(state.quick.difficulty);
    setBadge(byId('qcHelpfulnessVal'), state.quick.helpfulness);
    setBadge(byId('qcDifficultyVal'), state.quick.difficulty);

    setBadge(byId('qcIntensityVal'), state.quick.intensity);
    setBadge(byId('qcAfterVal'), state.quick.after);

    if(byId('qcSummary')) byId('qcSummary').textContent = '';
    if(byId('qcToolInfo')) byId('qcToolInfo').innerHTML = '';

    // action pills
    renderActionPills(byId('qcActionPills'), state.quick.actionStatus, (st)=>{
      state.quick.actionStatus = st;
      toggleBlocker('qcBlockerWrap', st);
      refreshQuickSummary();
    });

    renderQCEmotionChips();
    renderGoalChips(byId('qcGoalChips'), state.quick.goal, (id)=>{
      state.quick.goal = id;
      refreshQuickSummary();
    });
    renderModeChips(byId('qcModeChips'), state.quick.mode, (id)=>{ state.quick.mode = id; refreshQuickSummary(); });
    renderVulnChips(byId('qcVulnChips'), state.quick.vuln, (arr)=>{ state.quick.vuln = arr; refreshQuickSummary(); });

    // Identity pickers (optional)
    renderListPicker({
      chipsHost: byId('qcPrincipleChips'),
      selectedHost: byId('qcPrincipleSelected'),
      addInput: byId('qcPrincipleInput'),
      addBtn: byId('qcPrincipleAdd'),
      key: 'principles',
      selectedArr: state.quick.principles,
      setSelectedArr: (a)=>{ state.quick.principles = a; refreshQuickSummary(); },
      max: 1
    });
    renderListPicker({
      chipsHost: byId('qcImprovementChips'),
      selectedHost: byId('qcImprovementSelected'),
      addInput: byId('qcImprovementInput'),
      addBtn: byId('qcImprovementAdd'),
      key: 'improvements',
      selectedArr: state.quick.improvements,
      setSelectedArr: (a)=>{ state.quick.improvements = a; refreshQuickSummary(); },
      max: 1
    });
    renderListPicker({
      chipsHost: byId('qcAchievementChips'),
      selectedHost: byId('qcAchievementSelected'),
      addInput: byId('qcAchievementInput'),
      addBtn: byId('qcAchievementAdd'),
      key: 'achievements',
      selectedArr: state.quick.achievements,
      setSelectedArr: (a)=>{ state.quick.achievements = a; refreshQuickSummary(); },
      max: 1
    });

    applySafety(byId('qcSafety'), state.quick.harm, state.quick.intensity);
  }

  function toggleBlocker(wrapId, status){
    const wrap = byId(wrapId);
    if(!wrap) return;
    if(status === 'skipped') wrap.classList.remove('hidden');
    else wrap.classList.add('hidden');
  }

  function setBadge(el, n, kind=''){
    if(!el) return;
    el.textContent = String(n);
    el.classList.remove('good','warn','bad');
    if(kind) el.classList.add(kind);
  }

  function renderQCEmotionChips(){
    const host = byId('qcEmotionChips');
    if(!host || !state.quick) return;

    host.innerHTML = EMOTIONS_COMMON.map(e => {
      const onCls = state.quick.emotions.includes(e) ? 'on' : '';
      return `<button class="chip ${onCls}" data-qc-em="${escapeHTML(e)}">${escapeHTML(e)}</button>`;
    }).join('');

    host.querySelectorAll('[data-qc-em]').forEach(btn => {
      on(btn, 'click', (ev) => {
        const val = ev.currentTarget.dataset.qcEm;
        toggleIn(state.quick.emotions, val);
        renderQCEmotionChips();
        renderQCSelected();
        refreshQuickSummary();
      });
    });

    renderQCSelected();
  }

  function renderQCSelected(){
    const host = byId('qcEmotionSelected');
    if(!host || !state.quick) return;
    host.textContent = state.quick.emotions.length
      ? `انتخاب‌ها: ${state.quick.emotions.join('، ')}`
      : '— هنوز انتخابی نداری.';
  }

  function toggleIn(arr, v){
    const i = arr.indexOf(v);
    if(i > -1) arr.splice(i, 1);
    else arr.push(v);
  }

  function buildQuickSummary(createdAt){
    const q = state.quick;
    const toolTitle = q.toolId ? (toolById(q.toolId)?.title || q.toolId) : '—';

    const vulnTitles = (q.vuln || []).map(id => VULN_FACTORS.find(v => v.id === id)?.title).filter(Boolean);
    const modeTitle = PROBLEM_MODES.find(m => m.id === q.mode)?.title || q.mode || '—';

    const lines = [
      '📝 حس‌نگار — ثبت سریع',
      `🕒 زمان: ${fmtDate(createdAt)}`,
      `🎯 هدف: ${goalTitle(q.goal)}`,
      `🧭 مسیر: ${modeTitle}`,
      `🔎 نوع حس: ${valenceLabel(q.valence)}`,
      `💬 احساس(ها): ${q.emotions.length ? q.emotions.join('، ') : '—'}`,
      `🌡️ شدت قبل: ${q.intensity}/10`,
      `🧍 بدن: ${q.body || '—'}`,
      `🪫 آسیب‌پذیری امروز: ${vulnTitles.length ? vulnTitles.join('، ') : '—'}`,
      '',
      `⚡ تریگر: ${q.trigger || '—'}`,
      `🧠 جمله ذهن: ${q.mind || '—'}`,
      `⛑️ ایمنی: ${q.harm === 'yes' ? 'فکر آسیب مطرح شد' : (q.intensity>=8 ? 'شدت خیلی بالا' : '—')}`,
      '',
      `🧰 تکنیک: ${toolTitle}`,
      `⏱️ انجام شد؟ ${q.didTool === 'yes' ? 'بله' : 'نه'} • مدت: ${Number(q.minutes)||0} دقیقه`,
      `⭐ کمک‌کردن تکنیک: ${Number(q.helpfulness)||0}/5 • سختی: ${Number(q.difficulty)||0}/5`,
      `📉 شدت بعد: ${q.after}/10`,
      '',
      `✅ اقدام کوچک: ${q.nextAction || '—'}`,
      `📌 وضعیت اقدام: ${actionLabel(q.actionStatus)}`,
      `🧱 مانع: ${q.actionStatus==='skipped' ? (q.blocker||'—') : '—'}`,
      '',
      `🧩 همسویی هویت (اختیاری):`,
      `• اصل زندگی: ${(q.principles||[]).length ? q.principles.join('، ') : '—'}`,
      `• نقطه بهبود: ${(q.improvements||[]).length ? q.improvements.join('، ') : '—'}`,
      `• موهبت/دستاورد: ${(q.achievements||[]).length ? q.achievements.join('، ') : '—'}`,
    ];

    return lines.join('\n');
  }

  function goalTitle(id){
    return GOALS.find(g => g.id === id)?.title || id || '—';
  }

  function actionLabel(st){
    if(st === 'done') return 'انجام شد ✅';
    if(st === 'skipped') return 'نشد';
    return 'برنامه‌ریزی شد';
  }

  function refreshQuickSummary(){
    if(!state.quick) return;
    const createdAt = state.quick._createdAt || nowISO();
    state.quick._createdAt = createdAt;
    const text = buildQuickSummary(createdAt);
    state.quick.summaryText = text;
    const pre = byId('qcSummary');
    if(pre) pre.textContent = text;
  }

  function setupQuickListeners(){
    on(byId('qcValence'), 'change', (e) => {
      state.quick.valence = e.target.value;
      refreshQuickSummary();
    });

    on(byId('qcIntensity'), 'input', (e) => {
      state.quick.intensity = clamp(parseInt(e.target.value,10), 0, 10);
      setBadge(byId('qcIntensityVal'), state.quick.intensity, state.quick.intensity>=7?'bad': state.quick.intensity>=4?'warn':'good');
      applySafety(byId('qcSafety'), state.quick.harm, state.quick.intensity);
      refreshQuickSummary();
    });

    on(byId('qcBody'), 'change', (e) => { state.quick.body = e.target.value; refreshQuickSummary(); });

    on(byId('qcHarm'), 'change', (e) => {
      state.quick.harm = e.target.value;
      applySafety(byId('qcSafety'), state.quick.harm, state.quick.intensity);
      refreshQuickSummary();
    });

    on(byId('qcEmotionAdd'), 'click', () => {
      const input = byId('qcEmotionInput');
      const t = (input?.value || '').trim();
      if(!t) return;
      if(!EMOTIONS_COMMON.includes(t)) EMOTIONS_COMMON.push(t);
      if(!state.quick.emotions.includes(t)) state.quick.emotions.push(t);
      if(input) input.value = '';
      renderQCEmotionChips();
      refreshQuickSummary();
    });

    on(byId('toQuick2'), 'click', () => {
      // sync
      state.quick.valence = byId('qcValence')?.value || state.quick.valence;
      state.quick.body = byId('qcBody')?.value || state.quick.body;

      if(!state.quick.emotions.length){
        if(!confirm('هیچ احساسی انتخاب نشده. ادامه بدهم؟')) return;
      }
      show('quick-2');
    });

    on(byId('toQuick3'), 'click', () => {
      state.quick.trigger = (byId('qcTrigger')?.value || '').trim();
      state.quick.mind = (byId('qcMind')?.value || '').trim();
      state.quick.harm = byId('qcHarm')?.value || state.quick.harm;
      applySafety(byId('qcSafety'), state.quick.harm, state.quick.intensity);

      const ids = recommendToolIds({
        goal: state.quick.goal,
        valence: state.quick.valence,
        intensity: state.quick.intensity,
        rumination: 'نامشخص'
      });

      // اگر مسئله بیرونی است، یک ابزار حل مسئله هم پیشنهاد بده
      if(state.quick.mode === 'solve') ids.push('solve_4step');
      if(state.quick.mode === 'both') ids.push('solve_4step');

      const uniq = Array.from(new Set(ids));

      if(!state.quick.toolId && uniq[0]) state.quick.toolId = uniq[0];
      renderToolChips(byId('qcToolChips'), byId('qcToolInfo'), uniq, state.quick.toolId, (id)=>{
        state.quick.toolId = id;
        refreshQuickSummary();
      });

      // defaults
      state.quick.didTool = byId('qcDidTool')?.value || state.quick.didTool;
      state.quick.minutes = clamp(parseInt(byId('qcMinutes')?.value || String(state.quick.minutes),10) || 0, 0, 60);

      show('quick-3');
      refreshQuickSummary();
    });

    on(byId('qcDidTool'), 'change', (e) => { state.quick.didTool = e.target.value; refreshQuickSummary(); });
    on(byId('qcMinutes'), 'input', (e) => { state.quick.minutes = clamp(parseInt(e.target.value,10) || 0,0,60); refreshQuickSummary(); });

    on(byId('qcHelpfulness'), 'input', (e)=>{
      state.quick.helpfulness = clamp(parseInt(e.target.value,10) || 0, 0, 5);
      setBadge(byId('qcHelpfulnessVal'), state.quick.helpfulness);
      refreshQuickSummary();
    });

    on(byId('qcDifficulty'), 'input', (e)=>{
      state.quick.difficulty = clamp(parseInt(e.target.value,10) || 0, 0, 5);
      setBadge(byId('qcDifficultyVal'), state.quick.difficulty);
      refreshQuickSummary();
    });

    on(byId('qcNextAction'), 'input', (e) => { state.quick.nextAction = e.target.value; refreshQuickSummary(); });
    on(byId('qcBlocker'), 'input', (e) => { state.quick.blocker = e.target.value; refreshQuickSummary(); });

    on(byId('qcAfter'), 'input', (e) => {
      state.quick.after = clamp(parseInt(e.target.value,10), 0, 10);
      setBadge(byId('qcAfterVal'), state.quick.after, state.quick.after<=3?'good': state.quick.after<=6?'warn':'bad');
      refreshQuickSummary();
    });

    on(byId('qcCopy'), 'click', () => {
      const t = byId('qcSummary')?.textContent || '';
      navigator.clipboard?.writeText(t)
        .then(()=>safeAlert('کپی شد ✅'))
        .catch(()=>safeAlert('کپی نشد.'));
    });

    on(byId('qcShare'), 'click', () => {
      const t = byId('qcSummary')?.textContent || '';
      if(navigator.share){
        navigator.share({title:'حس‌نگار — ثبت سریع', text:t}).catch(()=>{});
      }else{
        navigator.clipboard?.writeText(t)
          .then(()=>safeAlert('در کلیپ‌بورد کپی شد ✅'))
          .catch(()=>safeAlert('کپی نشد.'));
      }
    });

    on(byId('qcSave'), 'click', () => {
      // sync fields
      state.quick.trigger = (byId('qcTrigger')?.value || '').trim();
      state.quick.mind = (byId('qcMind')?.value || '').trim();
      state.quick.nextAction = (byId('qcNextAction')?.value || '').trim();
      state.quick.blocker = (byId('qcBlocker')?.value || '').trim();
      state.quick.didTool = byId('qcDidTool')?.value || state.quick.didTool;
      state.quick.minutes = clamp(parseInt(byId('qcMinutes')?.value || '0',10) || 0,0,60);
      state.quick.helpfulness = clamp(parseInt(byId('qcHelpfulness')?.value || String(state.quick.helpfulness),10) || 0,0,5);
      state.quick.difficulty = clamp(parseInt(byId('qcDifficulty')?.value || String(state.quick.difficulty),10) || 0,0,5);
      refreshQuickSummary();

      const createdAt = state.quick._createdAt || nowISO();
      const record = {
        id: uuid(),
        type: 'quick',
        createdAt,
        meta: { schema: APP_SCHEMA_VERSION },
        data: {
          goal: state.quick.goal,
          mode: state.quick.mode,
          vuln: [...state.quick.vuln],
          valence: state.quick.valence,
          emotions: [...state.quick.emotions],
          intensity: state.quick.intensity,
          body: state.quick.body,
          trigger: state.quick.trigger,
          mind: state.quick.mind,
          harm: state.quick.harm,
          toolId: state.quick.toolId,
          didTool: state.quick.didTool,
          minutes: state.quick.minutes,
          helpfulness: state.quick.helpfulness,
          difficulty: state.quick.difficulty,
          nextAction: state.quick.nextAction,
          actionStatus: state.quick.actionStatus,
          blocker: state.quick.blocker,
          after: state.quick.after,
          principles: [...state.quick.principles],
          improvements: [...state.quick.improvements],
          achievements: [...state.quick.achievements],
        },
        summaryText: state.quick.summaryText,
      };

      addRecord(record);
      safeAlert('ذخیره شد ✅ (فقط روی دستگاه)');
      updateWeeklyWidget();
    });

    on(byId('qcGoHome'), 'click', () => show('home'));
  }

  /* ==========================
     Deep Flow
  ========================== */

  function resetDeep(){
    state.deep = defaultDeep();

    // reset UI
    if(byId('ddEmotions')) byId('ddEmotions').value = '';
    if(byId('ddTrigger')) byId('ddTrigger').value = '';
    if(byId('ddFacts')) byId('ddFacts').value = '';
    if(byId('ddStory')) byId('ddStory').value = '';
    if(byId('ddBalancedThought')) byId('ddBalancedThought').value = '';
    if(byId('ddUnder')) byId('ddUnder').value = '';
    if(byId('ddFirst')) byId('ddFirst').value = '';
    if(byId('ddAdult')) byId('ddAdult').value = '';
    if(byId('ddPlan')) byId('ddPlan').value = '';
    if(byId('ddNextTime')) byId('ddNextTime').value = '';
    if(byId('ddBlocker')) byId('ddBlocker').value = '';

    if(byId('ddIntensity')) byId('ddIntensity').value = String(state.deep.intensity);
    if(byId('ddAfter')) byId('ddAfter').value = String(state.deep.after);
    if(byId('ddMinutes')) byId('ddMinutes').value = String(state.deep.minutes);

    if(byId('ddBody')){
      byId('ddBody').innerHTML = BODY_SPOTS.map(b => `<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');
      byId('ddBody').value = state.deep.body;
    }

    if(byId('ddRumination')) byId('ddRumination').value = state.deep.rumination;
    if(byId('ddVoice')) byId('ddVoice').value = state.deep.voice;
    if(byId('ddHarm')) byId('ddHarm').value = state.deep.harm;
    if(byId('ddDidTool')) byId('ddDidTool').value = state.deep.didTool;

    if(byId('ddHelpfulness')) byId('ddHelpfulness').value = String(state.deep.helpfulness);
    if(byId('ddDifficulty')) byId('ddDifficulty').value = String(state.deep.difficulty);
    setBadge(byId('ddHelpfulnessVal'), state.deep.helpfulness);
    setBadge(byId('ddDifficultyVal'), state.deep.difficulty);

    setBadge(byId('ddIntensityVal'), state.deep.intensity);
    setBadge(byId('ddAfterVal'), state.deep.after);

    if(byId('ddRecommendation')) byId('ddRecommendation').innerHTML = '';
    if(byId('ddToolInfo')) byId('ddToolInfo').innerHTML = '';
    if(byId('ddSummary')) byId('ddSummary').textContent = '';

    renderGoalChips(byId('ddGoalChips'), state.deep.goal, (id)=>{ state.deep.goal = id; refreshDeepSummary(); });
    renderModeChips(byId('ddModeChips'), state.deep.mode, (id)=>{ state.deep.mode = id; refreshDeepSummary(); });
    renderVulnChips(byId('ddVulnChips'), state.deep.vuln, (arr)=>{ state.deep.vuln = arr; refreshDeepSummary(); });

    renderDistortionChips(byId('ddDistortionChips'), state.deep.distortions, (arr)=>{ state.deep.distortions = arr; refreshDeepSummary(); }, 2);
    if(byId('ddOldStrategyNote')) byId('ddOldStrategyNote').value = '';
    if(byId('ddNewStrategy')) byId('ddNewStrategy').value = '';
    renderOldStrategyChips(byId('ddOldStrategyChips'), state.deep.oldStrategy, (id)=>{ state.deep.oldStrategy = id; refreshDeepSummary(); });

    // Identity pickers (optional)
    renderListPicker({
      chipsHost: byId('ddPrincipleChips'),
      selectedHost: byId('ddPrincipleSelected'),
      addInput: byId('ddPrincipleInput'),
      addBtn: byId('ddPrincipleAdd'),
      key: 'principles',
      selectedArr: state.deep.principles,
      setSelectedArr: (a)=>{ state.deep.principles = a; refreshDeepSummary(); },
      max: 1
    });
    renderListPicker({
      chipsHost: byId('ddImprovementChips'),
      selectedHost: byId('ddImprovementSelected'),
      addInput: byId('ddImprovementInput'),
      addBtn: byId('ddImprovementAdd'),
      key: 'improvements',
      selectedArr: state.deep.improvements,
      setSelectedArr: (a)=>{ state.deep.improvements = a; refreshDeepSummary(); },
      max: 1
    });
    renderListPicker({
      chipsHost: byId('ddAchievementChips'),
      selectedHost: byId('ddAchievementSelected'),
      addInput: byId('ddAchievementInput'),
      addBtn: byId('ddAchievementAdd'),
      key: 'achievements',
      selectedArr: state.deep.achievements,
      setSelectedArr: (a)=>{ state.deep.achievements = a; refreshDeepSummary(); },
      max: 1
    });
    renderDDNeeds();

    renderActionPills(byId('ddActionPills'), state.deep.actionStatus, (st)=>{
      state.deep.actionStatus = st;
      toggleBlocker('ddBlockerWrap', st);
      refreshDeepSummary();
    });

    applySafety(byId('ddSafety'), state.deep.harm, state.deep.intensity);
  }

  function renderDDNeeds(){
    const host = byId('ddNeedChips');
    const hints = byId('ddNeedHints');
    if(!host || !hints || !state.deep) return;

    const needs = Object.keys(NEED_INFO);
    host.innerHTML = needs.map(n => `<button class="chip ${state.deep.needs.includes(n)?'on':''}" data-need="${escapeHTML(n)}">${escapeHTML(n)}</button>`).join('');

    host.querySelectorAll('[data-need]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const n = e.currentTarget.dataset.need;
        toggleIn(state.deep.needs, n);
        // حداکثر ۲
        if(state.deep.needs.length > 2) state.deep.needs.splice(0, state.deep.needs.length - 2);
        renderDDNeeds();
        refreshDeepSummary();
      });
    });

    hints.innerHTML = needs.map(n => `<div>• <b>${escapeHTML(n)}</b>: ${escapeHTML(NEED_INFO[n])}</div>`).join('');

    renderNeedScripts();
    updateNeedStrategySuggestion();
  }

  function updateNeedStrategySuggestion(){
    const box = byId('ddNeedStrategyHint');
    if(!box || !state.deep) return;
    const needs = state.deep.needs || [];
    if(!needs.length){
      box.innerHTML = `<div class="helper">— وقتی ۱–۲ نیاز را انتخاب کنی، اینجا یک پیشنهاد برای «راهبرد جایگزین سالم‌تر» نمایش داده می‌شود.</div>`;
      return;
    }
    const hints = needs.map(n => NEED_ALT_STRATEGY[n]).filter(Boolean);
    box.innerHTML = `<div class="helper"><b>پیشنهاد برای راهبرد جایگزین:</b><br>${hints.map(escapeHTML).join('<br>')}</div>`;
  }

  function renderNeedScripts(){
    const box = byId('ddNeedScripts');
    if(!box || !state.deep) return;

    if(!state.deep.needs.length){
      box.innerHTML = `<b>جمله‌های پیشنهادی برای نیازها</b><div class="helper">اول ۱–۲ نیاز را انتخاب کن تا «درخواست سالم» و «مرز سالم» پیشنهاد شود.</div>`;
      return;
    }

    const blocks = state.deep.needs.map(n => {
      const sc = NEED_SCRIPTS[n];
      if(!sc) return '';
      const req = sc.request;
      const bd = sc.boundary;
      return `
        <div class="script">
          <b>${escapeHTML(n)}</b>
          <div class="helper"><b>درخواست سالم:</b> <span class="copytxt" data-copytxt="${escapeHTML(req)}">${escapeHTML(req)}</span></div>
          <div class="helper"><b>مرز سالم:</b> <span class="copytxt" data-copytxt="${escapeHTML(bd)}">${escapeHTML(bd)}</span></div>
          <div class="row wrap" style="margin-top:8px">
            <button class="btn small" data-copy="${escapeHTML(req)}">کپی درخواست</button>
            <button class="btn small" data-copy="${escapeHTML(bd)}">کپی مرز</button>
          </div>
        </div>
      `;
    }).join('');

    box.innerHTML = `<b>جمله‌های پیشنهادی برای نیازها</b><div class="helper">می‌تونی همین‌ها را کپی کنی و کمی شخصی‌سازیش کنی.</div>${blocks}`;

    box.querySelectorAll('[data-copy]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const text = e.currentTarget.getAttribute('data-copy') || '';
        navigator.clipboard?.writeText(text)
          .then(()=>safeAlert('کپی شد ✅'))
          .catch(()=>safeAlert('کپی نشد.'));
      });
    });
  }

  function buildDeepRecommendation(){
    const d = state.deep;
    const lines = [];

    const modeTitle = PROBLEM_MODES.find(m => m.id === d.mode)?.title || '';
    if(modeTitle) lines.push(`🧭 مسیر انتخابی: ${modeTitle}`);

    if(d.intensity >= 7) lines.push('⛔ شدت بالاست → اول بدن را تنظیم کن و تصمیم مهم را عقب بینداز.');
    if(d.rumination === 'بله') lines.push('🔁 نشخوار فعال است → Defusion + برگشت به عمل کوچک.');
    if(d.mode === 'solve' && d.intensity >= 6) lines.push('🧩 حل مسئله وقتی بدن خیلی فعال است سخت می‌شود → اول یک تنظیم ۹۰ ثانیه‌ای، بعد حل مسئله.');

    const vulnTitles = (d.vuln || []).map(id => VULN_FACTORS.find(v => v.id === id)?.title).filter(Boolean);
    if(vulnTitles.length) lines.push(`🪫 آسیب‌پذیری امروز: ${vulnTitles.join('، ')} → یک چیز کوچک را اصلاح کن (آب/غذا/استراحت/پیام به دوست).`);
    if(d.goal === 'relationship') lines.push('🧩 هدف رابطه/مرز است → خروجی خوب: یک «درخواست» یا «مرز» کوتاه و محترمانه.');
    if(d.needs.includes('قدرت و ارزشمندی 💪')) lines.push('💪 نیاز ارزشمندی فعال است → ارزش را از «نتیجه لحظه‌ای» جدا کن و روی فرایند تمرکز کن.');

    return lines.length
      ? `<b>پیشنهاد لحظه‌ای</b><div class="helper">${lines.map(escapeHTML).join('<br>')}</div>`
      : `<b>پیشنهاد لحظه‌ای</b><div class="helper">یک ابزار انتخاب کن و یک اقدام کوچک تعریف کن.</div>`;
  }

  function buildDeepSummary(createdAt){
    const d = state.deep;
    const toolTitle = d.toolId ? (toolById(d.toolId)?.title || d.toolId) : '—';

    const vulnTitles = (d.vuln || []).map(id => VULN_FACTORS.find(v => v.id === id)?.title).filter(Boolean);
    const modeTitle = PROBLEM_MODES.find(m => m.id === d.mode)?.title || d.mode || '—';
    const distTitles = (d.distortions || []).map(id => COG_DISTORTIONS.find(x => x.id === id)?.title).filter(Boolean);
    const oldStTitle = OLD_STRATEGIES.find(s => s.id === d.oldStrategy)?.title || (d.oldStrategy || '—');

    const lines = [
      '🧭 حس‌نگار — تحلیل عمیق',
      `🕒 زمان: ${fmtDate(createdAt)}`,
      `🎯 هدف: ${goalTitle(d.goal)}`,
      `🧭 مسیر: ${modeTitle}`,
      `💬 احساس‌ها: ${d.emotionsText || '—'}`,
      `🌡️ شدت قبل: ${d.intensity}/10`,
      `🧍 بدن: ${d.body || '—'}`,
      `🪫 آسیب‌پذیری امروز: ${vulnTitles.length ? vulnTitles.join('، ') : '—'}`,
      `⚡ تریگر: ${d.trigger || '—'}`,
      `⛑️ ایمنی: ${d.harm === 'yes' ? 'فکر آسیب مطرح شد' : (d.intensity>=8 ? 'شدت خیلی بالا' : '—')}`,
      '',
      `✅ واقعیت (Facts):\n${d.facts || '—'}`,
      '',
      `🧠 داستان ذهن (Story):\n${d.story || '—'}`,
      '',
      `🧩 دام‌های شناختی (اختیاری): ${distTitles.length ? distTitles.join('، ') : '—'}`,
      `🟢 فکر متعادل‌تر: ${d.balancedThought || '—'}`,
      '',
      `🌊 احساس‌های زیرین: ${d.underlyingText || '—'}`,
      `🔁 نشخوار: ${d.rumination || '—'}`,
      '',
      `🌱 نیاز(ها): ${d.needs.length ? d.needs.join('، ') : '—'}`,
      `🔧 راهبرد قدیمی برای تامین نیاز: ${oldStTitle}`,
      `📝 توضیح کوتاه: ${d.oldStrategyNote || '—'}`,
      `🌿 راهبرد جایگزین سالم‌تر: ${d.newStrategy || '—'}`,
      `🎭 صدای غالب: ${d.voice || '—'}`,
      `🧩 ریشهٔ احتمالی/اولین یاد: ${d.first || '—'}`,
      `🧠 جملهٔ بالغ: ${d.adultLine || '—'}`,
      '',
      `🧰 تکنیک: ${toolTitle}`,
      `⏱️ انجام شد؟ ${d.didTool === 'yes' ? 'بله' : 'نه'} • مدت: ${Number(d.minutes)||0} دقیقه`,
      `⭐ کمک‌کردن تکنیک: ${Number(d.helpfulness)||0}/5 • سختی: ${Number(d.difficulty)||0}/5`,
      `📉 شدت بعد: ${d.after}/10`,
      '',
      `🛠️ پلن عمل (امروز):\n${d.plan || '—'}`,
      `📌 وضعیت اقدام: ${actionLabel(d.actionStatus)}`,
      `🧱 مانع: ${d.actionStatus==='skipped' ? (d.blocker||'—') : '—'}`,
      `🔮 دفعه بعد: ${d.nextTime || '—'}`,
      '',
      `🧩 همسویی هویت (اختیاری):`,
      `• اصل زندگی: ${(d.principles||[]).length ? d.principles.join('، ') : '—'}`,
      `• نقطه بهبود: ${(d.improvements||[]).length ? d.improvements.join('، ') : '—'}`,
      `• موهبت/دستاورد: ${(d.achievements||[]).length ? d.achievements.join('، ') : '—'}`,
    ];

    return lines.join('\n');
  }

  function refreshDeepSummary(){
    if(!state.deep) return;
    const createdAt = state.deep._createdAt || nowISO();
    state.deep._createdAt = createdAt;

    // sync live fields
    state.deep.plan = (byId('ddPlan')?.value || '').trim();
    state.deep.nextTime = (byId('ddNextTime')?.value || '').trim();
    state.deep.blocker = (byId('ddBlocker')?.value || '').trim();
    state.deep.balancedThought = (byId('ddBalancedThought')?.value || '').trim();
    state.deep.oldStrategyNote = (byId('ddOldStrategyNote')?.value || '').trim();
    state.deep.newStrategy = (byId('ddNewStrategy')?.value || '').trim();

    const text = buildDeepSummary(createdAt);
    state.deep.summaryText = text;
    if(byId('ddSummary')) byId('ddSummary').textContent = text;
  }

  function setupDeepListeners(){
    on(byId('ddIntensity'), 'input', (e)=>{
      state.deep.intensity = clamp(parseInt(e.target.value,10), 0, 10);
      setBadge(byId('ddIntensityVal'), state.deep.intensity, state.deep.intensity>=7?'bad': state.deep.intensity>=4?'warn':'good');
      applySafety(byId('ddSafety'), state.deep.harm, state.deep.intensity);
      refreshDeepSummary();
    });

    on(byId('ddBody'), 'change', (e)=>{ state.deep.body = e.target.value; refreshDeepSummary(); });
    on(byId('ddRumination'), 'change', (e)=>{ state.deep.rumination = e.target.value; refreshDeepSummary(); });
    on(byId('ddVoice'), 'change', (e)=>{ state.deep.voice = e.target.value; refreshDeepSummary(); });

    on(byId('ddHarm'), 'change', (e)=>{
      state.deep.harm = e.target.value;
      applySafety(byId('ddSafety'), state.deep.harm, state.deep.intensity);
      refreshDeepSummary();
    });

    on(byId('toDeep2'), 'click', ()=>{
      state.deep.emotionsText = (byId('ddEmotions')?.value || '').trim();
      state.deep.trigger = (byId('ddTrigger')?.value || '').trim();
      state.deep.body = byId('ddBody')?.value || state.deep.body;

      if(!state.deep.emotionsText){
        if(!confirm('احساس‌ها خالیه. ادامه بدهم؟')) return;
      }
      show('deep-2');
    });

    on(byId('toDeep3'), 'click', ()=>{
      state.deep.facts = (byId('ddFacts')?.value || '').trim();
      state.deep.story = (byId('ddStory')?.value || '').trim();
      state.deep.balancedThought = (byId('ddBalancedThought')?.value || '').trim();
      show('deep-3');
    });

    on(byId('toDeep4'), 'click', ()=>{
      state.deep.underlyingText = (byId('ddUnder')?.value || '').trim();
      state.deep.rumination = byId('ddRumination')?.value || state.deep.rumination;
      state.deep.oldStrategyNote = (byId('ddOldStrategyNote')?.value || '').trim();
      state.deep.newStrategy = (byId('ddNewStrategy')?.value || '').trim();

      if(!state.deep.needs.length){
        if(!confirm('نیازی انتخاب نشده. ادامه بدهم؟')) return;
      }
      show('deep-4');
    });

    on(byId('toDeep5'), 'click', ()=>{
      state.deep.voice = byId('ddVoice')?.value || state.deep.voice;
      state.deep.first = (byId('ddFirst')?.value || '').trim();
      state.deep.adultLine = (byId('ddAdult')?.value || '').trim();

      // پیشنهاد ابزارها
      const ids = recommendToolIds({
        goal: state.deep.goal,
        valence: 'bad',
        intensity: state.deep.intensity,
        rumination: state.deep.rumination,
      });

      if(state.deep.mode === 'solve' || state.deep.mode === 'both') ids.push('solve_4step');

      const uniq = Array.from(new Set(ids));

      if(!state.deep.toolId && uniq[0]) state.deep.toolId = uniq[0];

      renderToolChips(byId('ddToolChips'), byId('ddToolInfo'), uniq, state.deep.toolId, (id)=>{
        state.deep.toolId = id;
        refreshDeepSummary();
      });

      if(byId('ddRecommendation')) byId('ddRecommendation').innerHTML = buildDeepRecommendation();

      show('deep-5');
      refreshDeepSummary();
    });

    on(byId('ddDidTool'), 'change', (e)=>{ state.deep.didTool = e.target.value; refreshDeepSummary(); });
    on(byId('ddMinutes'), 'input', (e)=>{ state.deep.minutes = clamp(parseInt(e.target.value,10) || 0, 0, 120); refreshDeepSummary(); });

    on(byId('ddHelpfulness'), 'input', (e)=>{
      state.deep.helpfulness = clamp(parseInt(e.target.value,10) || 0, 0, 5);
      setBadge(byId('ddHelpfulnessVal'), state.deep.helpfulness);
      refreshDeepSummary();
    });

    on(byId('ddDifficulty'), 'input', (e)=>{
      state.deep.difficulty = clamp(parseInt(e.target.value,10) || 0, 0, 5);
      setBadge(byId('ddDifficultyVal'), state.deep.difficulty);
      refreshDeepSummary();
    });

    on(byId('ddPlan'), 'input', ()=> refreshDeepSummary());
    on(byId('ddNextTime'), 'input', ()=> refreshDeepSummary());
    on(byId('ddBlocker'), 'input', ()=> refreshDeepSummary());
    on(byId('ddBalancedThought'), 'input', ()=> refreshDeepSummary());
    on(byId('ddOldStrategyNote'), 'input', ()=> refreshDeepSummary());
    on(byId('ddNewStrategy'), 'input', ()=> refreshDeepSummary());

    on(byId('ddAfter'), 'input', (e)=>{
      state.deep.after = clamp(parseInt(e.target.value,10),0,10);
      setBadge(byId('ddAfterVal'), state.deep.after, state.deep.after<=3?'good': state.deep.after<=6?'warn':'bad');
      refreshDeepSummary();
    });

    on(byId('ddCopy'), 'click', ()=>{
      const t = byId('ddSummary')?.textContent || '';
      navigator.clipboard?.writeText(t)
        .then(()=>safeAlert('کپی شد ✅'))
        .catch(()=>safeAlert('کپی نشد.'));
    });

    on(byId('ddShare'), 'click', ()=>{
      const t = byId('ddSummary')?.textContent || '';
      if(navigator.share){
        navigator.share({title:'حس‌نگار — تحلیل عمیق', text:t}).catch(()=>{});
      }else{
        navigator.clipboard?.writeText(t)
          .then(()=>safeAlert('در کلیپ‌بورد کپی شد ✅'))
          .catch(()=>safeAlert('کپی نشد.'));
      }
    });

    on(byId('ddSave'), 'click', ()=>{
      // sync
      state.deep.emotionsText = (byId('ddEmotions')?.value || '').trim();
      state.deep.trigger = (byId('ddTrigger')?.value || '').trim();
      state.deep.facts = (byId('ddFacts')?.value || '').trim();
      state.deep.story = (byId('ddStory')?.value || '').trim();
      state.deep.balancedThought = (byId('ddBalancedThought')?.value || '').trim();
      state.deep.underlyingText = (byId('ddUnder')?.value || '').trim();
      state.deep.oldStrategyNote = (byId('ddOldStrategyNote')?.value || '').trim();
      state.deep.newStrategy = (byId('ddNewStrategy')?.value || '').trim();
      state.deep.first = (byId('ddFirst')?.value || '').trim();
      state.deep.adultLine = (byId('ddAdult')?.value || '').trim();
      state.deep.plan = (byId('ddPlan')?.value || '').trim();
      state.deep.nextTime = (byId('ddNextTime')?.value || '').trim();
      state.deep.blocker = (byId('ddBlocker')?.value || '').trim();
      state.deep.rumination = byId('ddRumination')?.value || state.deep.rumination;
      state.deep.voice = byId('ddVoice')?.value || state.deep.voice;
      state.deep.body = byId('ddBody')?.value || state.deep.body;
      state.deep.harm = byId('ddHarm')?.value || state.deep.harm;
      state.deep.didTool = byId('ddDidTool')?.value || state.deep.didTool;
      state.deep.minutes = clamp(parseInt(byId('ddMinutes')?.value || '0',10) || 0,0,120);
      state.deep.helpfulness = clamp(parseInt(byId('ddHelpfulness')?.value || String(state.deep.helpfulness),10) || 0,0,5);
      state.deep.difficulty = clamp(parseInt(byId('ddDifficulty')?.value || String(state.deep.difficulty),10) || 0,0,5);

      refreshDeepSummary();

      const createdAt = state.deep._createdAt || nowISO();
      const record = {
        id: uuid(),
        type: 'deep',
        createdAt,
        meta: { schema: APP_SCHEMA_VERSION },
        data: {
          goal: state.deep.goal,
          mode: state.deep.mode,
          vuln: [...state.deep.vuln],
          emotionsText: state.deep.emotionsText,
          intensity: state.deep.intensity,
          body: state.deep.body,
          trigger: state.deep.trigger,
          harm: state.deep.harm,
          facts: state.deep.facts,
          story: state.deep.story,
          distortions: [...state.deep.distortions],
          balancedThought: state.deep.balancedThought,
          underlyingText: state.deep.underlyingText,
          rumination: state.deep.rumination,
          needs: [...state.deep.needs],
          oldStrategy: state.deep.oldStrategy,
          oldStrategyNote: state.deep.oldStrategyNote,
          newStrategy: state.deep.newStrategy,
          voice: state.deep.voice,
          first: state.deep.first,
          adultLine: state.deep.adultLine,
          toolId: state.deep.toolId,
          didTool: state.deep.didTool,
          minutes: state.deep.minutes,
          helpfulness: state.deep.helpfulness,
          difficulty: state.deep.difficulty,
          plan: state.deep.plan,
          actionStatus: state.deep.actionStatus,
          blocker: state.deep.blocker,
          after: state.deep.after,
          nextTime: state.deep.nextTime,
          principles: [...state.deep.principles],
          improvements: [...state.deep.improvements],
          achievements: [...state.deep.achievements],
        },
        summaryText: state.deep.summaryText,
      };

      addRecord(record);
      safeAlert('ذخیره شد ✅ (فقط روی دستگاه)');
      updateWeeklyWidget();
    });

    on(byId('ddGoHome'), 'click', ()=> show('home'));
  }

  /* ==========================
     Toolkit
  ========================== */

  function renderToolkit(){
    const host = byId('tkList');
    if(!host) return;
    host.innerHTML = TOOLBOX.map(t => {
      const steps = (t.steps||[]).map(s=>`<li>${escapeHTML(s)}</li>`).join('');
      return `
        <div class="card">
          <div class="row wrap" style="justify-content:space-between">
            <div>
              <b>${escapeHTML(t.title)}</b>
              <div class="helper">${escapeHTML(t.tag)} • ${escapeHTML(t.when)}</div>
            </div>
            <span class="badge">${escapeHTML(t.id)}</span>
          </div>
          <hr class="sep">
          <ol class="helper" style="margin:0">${steps}</ol>
        </div>
      `;
    }).join('');
  }

  /* ==========================
     Guided flows
  ========================== */

  function resetGuided(flowId){
    state.guided = defaultGuided(flowId);

    // UI
    const flow = FLOWS[state.guided.flowId] || FLOWS.panic;
    if(byId('gdTitle')) byId('gdTitle').textContent = flow.title;
    if(byId('gdIntro')) byId('gdIntro').textContent = flow.intro;

    // body options
    if(byId('gdBody')){
      byId('gdBody').innerHTML = BODY_SPOTS.map(b=>`<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');
      byId('gdBody').value = state.guided.body;
    }

    if(byId('gdIntensity')) byId('gdIntensity').value = String(state.guided.intensity);
    setBadge(byId('gdIntensityVal'), state.guided.intensity);

    if(byId('gdTrigger')) byId('gdTrigger').value = '';
    if(byId('gdHarm')) byId('gdHarm').value = state.guided.harm;

    if(byId('gdDidTool')) byId('gdDidTool').value = state.guided.didTool;
    if(byId('gdMinutes')) byId('gdMinutes').value = String(state.guided.minutes);

    if(byId('gdHelpfulness')) byId('gdHelpfulness').value = String(state.guided.helpfulness);
    if(byId('gdDifficulty')) byId('gdDifficulty').value = String(state.guided.difficulty);
    setBadge(byId('gdHelpfulnessVal'), state.guided.helpfulness);
    setBadge(byId('gdDifficultyVal'), state.guided.difficulty);

    if(byId('gdNextAction')) byId('gdNextAction').value = '';
    if(byId('gdBlocker')) byId('gdBlocker').value = '';

    if(byId('gdAfter')) byId('gdAfter').value = String(state.guided.after);
    setBadge(byId('gdAfterVal'), state.guided.after);

    if(byId('gdSummary')) byId('gdSummary').textContent = '';
    if(byId('gdToolInfo')) byId('gdToolInfo').innerHTML = '';

    renderGoalChips(byId('gdGoalChips'), state.guided.goal, (id)=>{ state.guided.goal = id; refreshGuidedSummary(); });
    renderModeChips(byId('gdModeChips'), state.guided.mode, (id)=>{ state.guided.mode = id; refreshGuidedSummary(); });
    renderVulnChips(byId('gdVulnChips'), state.guided.vuln, (arr)=>{ state.guided.vuln = arr; refreshGuidedSummary(); });

    renderActionPills(byId('gdActionPills'), state.guided.actionStatus, (st)=>{
      state.guided.actionStatus = st;
      toggleBlocker('gdBlockerWrap', st);
      refreshGuidedSummary();
    });

    // savor block
    const savorWrap = byId('gdSavorBlock');
    if(savorWrap){
      if(state.guided.flowId === 'savor') savorWrap.classList.remove('hidden');
      else savorWrap.classList.add('hidden');
    }

    if(byId('gdSavorMoment')) byId('gdSavorMoment').value = '';
    if(byId('gdSavorWhy')) byId('gdSavorWhy').value = '';
    if(byId('gdSavorRepeat')) byId('gdSavorRepeat').value = '';

    // Identity pickers (optional)
    renderListPicker({
      chipsHost: byId('gdPrincipleChips'),
      selectedHost: byId('gdPrincipleSelected'),
      addInput: byId('gdPrincipleInput'),
      addBtn: byId('gdPrincipleAdd'),
      key: 'principles',
      selectedArr: state.guided.principles,
      setSelectedArr: (a)=>{ state.guided.principles = a; refreshGuidedSummary(); },
      max: 1
    });
    renderListPicker({
      chipsHost: byId('gdImprovementChips'),
      selectedHost: byId('gdImprovementSelected'),
      addInput: byId('gdImprovementInput'),
      addBtn: byId('gdImprovementAdd'),
      key: 'improvements',
      selectedArr: state.guided.improvements,
      setSelectedArr: (a)=>{ state.guided.improvements = a; refreshGuidedSummary(); },
      max: 1
    });
    renderListPicker({
      chipsHost: byId('gdAchievementChips'),
      selectedHost: byId('gdAchievementSelected'),
      addInput: byId('gdAchievementInput'),
      addBtn: byId('gdAchievementAdd'),
      key: 'achievements',
      selectedArr: state.guided.achievements,
      setSelectedArr: (a)=>{ state.guided.achievements = a; refreshGuidedSummary(); },
      max: 1
    });

    applySafety(byId('gdSafety'), state.guided.harm, state.guided.intensity);

    // step2 tool chips prepared when entering step2
  }

  function buildGuidedSummary(createdAt){
    const g = state.guided;
    const flow = FLOWS[g.flowId] || FLOWS.panic;
    const toolTitle = g.toolId ? (toolById(g.toolId)?.title || g.toolId) : '—';

    const vulnTitles = (g.vuln || []).map(id => VULN_FACTORS.find(v => v.id === id)?.title).filter(Boolean);
    const modeTitle = PROBLEM_MODES.find(m => m.id === g.mode)?.title || g.mode || '—';

    const lines = [
      `⚡ حس‌نگار — فلوی فوری: ${flow.title}`,
      `🕒 زمان: ${fmtDate(createdAt)}`,
      `🎯 هدف: ${goalTitle(g.goal)}`,
      `🧭 مسیر: ${modeTitle}`,
      `🌡️ شدت قبل: ${g.intensity}/10`,
      `🧍 بدن: ${g.body || '—'}`,
      `🪫 آسیب‌پذیری امروز: ${vulnTitles.length ? vulnTitles.join('، ') : '—'}`,
      `⚡ تریگر: ${g.trigger || '—'}`,
      `⛑️ ایمنی: ${g.harm === 'yes' ? 'فکر آسیب مطرح شد' : (g.intensity>=8 ? 'شدت خیلی بالا' : '—')}`,
    ];

    if(g.flowId === 'savor'){
      lines.push('');
      lines.push(`✨ لحظه خوب: ${g.savorMoment || '—'}`);
      lines.push(`💡 چرا مهم بود: ${g.savorWhy || '—'}`);
      lines.push(`🔁 چطور تکرارش کنم: ${g.savorRepeat || '—'}`);
    }

    lines.push('');
    lines.push(`🧰 تمرین: ${toolTitle}`);
    lines.push(`⏱️ انجام شد؟ ${g.didTool === 'yes' ? 'بله' : 'نه'} • مدت: ${Number(g.minutes)||0} دقیقه`);
    lines.push(`⭐ کمک‌کردن تمرین: ${Number(g.helpfulness)||0}/5 • سختی: ${Number(g.difficulty)||0}/5`);
    lines.push(`📉 شدت بعد: ${g.after}/10`);
    lines.push('');
    lines.push(`✅ اقدام کوچک: ${g.nextAction || '—'}`);
    lines.push(`📌 وضعیت اقدام: ${actionLabel(g.actionStatus)}`);
    lines.push(`🧱 مانع: ${g.actionStatus==='skipped' ? (g.blocker||'—') : '—'}`);

    lines.push('');
    lines.push('🧩 همسویی هویت (اختیاری):');
    lines.push(`• اصل زندگی: ${(g.principles||[]).length ? g.principles.join('، ') : '—'}`);
    lines.push(`• نقطه بهبود: ${(g.improvements||[]).length ? g.improvements.join('، ') : '—'}`);
    lines.push(`• موهبت/دستاورد: ${(g.achievements||[]).length ? g.achievements.join('، ') : '—'}`);

    return lines.join('\n');
  }

  function refreshGuidedSummary(){
    if(!state.guided) return;
    const createdAt = state.guided._createdAt || nowISO();
    state.guided._createdAt = createdAt;

    const text = buildGuidedSummary(createdAt);
    state.guided.summaryText = text;
    if(byId('gdSummary')) byId('gdSummary').textContent = text;
  }

  function setupGuidedListeners(){
    on(byId('gdIntensity'), 'input', (e)=>{
      state.guided.intensity = clamp(parseInt(e.target.value,10), 0, 10);
      setBadge(byId('gdIntensityVal'), state.guided.intensity, state.guided.intensity>=7?'bad': state.guided.intensity>=4?'warn':'good');
      applySafety(byId('gdSafety'), state.guided.harm, state.guided.intensity);
      refreshGuidedSummary();
    });

    on(byId('gdBody'), 'change', (e)=>{ state.guided.body = e.target.value; refreshGuidedSummary(); });
    on(byId('gdTrigger'), 'input', (e)=>{ state.guided.trigger = e.target.value; refreshGuidedSummary(); });

    on(byId('gdHarm'), 'change', (e)=>{
      state.guided.harm = e.target.value;
      applySafety(byId('gdSafety'), state.guided.harm, state.guided.intensity);
      refreshGuidedSummary();
    });

    // savor inputs
    on(byId('gdSavorMoment'), 'input', (e)=>{ state.guided.savorMoment = e.target.value; refreshGuidedSummary(); });
    on(byId('gdSavorWhy'), 'input', (e)=>{ state.guided.savorWhy = e.target.value; refreshGuidedSummary(); });
    on(byId('gdSavorRepeat'), 'input', (e)=>{ state.guided.savorRepeat = e.target.value; refreshGuidedSummary(); });

    on(byId('toGuided2'), 'click', ()=>{
      // sync
      state.guided.trigger = (byId('gdTrigger')?.value || '').trim();
      state.guided.body = byId('gdBody')?.value || state.guided.body;
      state.guided.harm = byId('gdHarm')?.value || state.guided.harm;

      // tools for this flow
      const flow = FLOWS[state.guided.flowId] || FLOWS.panic;
      const ids = Array.from(new Set(flow.toolIds.concat(recommendToolIds({
        goal: state.guided.goal,
        valence: state.guided.flowId === 'savor' ? 'good' : 'bad',
        intensity: state.guided.intensity,
        rumination: state.guided.flowId === 'rumination' ? 'بله' : 'نامشخص'
      }))));

      if(state.guided.mode === 'solve' || state.guided.mode === 'both') ids.push('solve_4step');

      const uniq = Array.from(new Set(ids));

      if(!state.guided.toolId && uniq[0]) state.guided.toolId = uniq[0];

      renderToolChips(byId('gdToolChips'), byId('gdToolInfo'), uniq, state.guided.toolId, (id)=>{
        state.guided.toolId = id;
        refreshGuidedSummary();
      });

      show('guided-2');
      refreshGuidedSummary();
    });

    on(byId('toGuided3'), 'click', ()=>{
      show('guided-3');
      refreshGuidedSummary();
    });

    on(byId('gdDidTool'), 'change', (e)=>{ state.guided.didTool = e.target.value; refreshGuidedSummary(); });
    on(byId('gdMinutes'), 'input', (e)=>{ state.guided.minutes = clamp(parseInt(e.target.value,10) || 0, 0, 60); refreshGuidedSummary(); });

    on(byId('gdHelpfulness'), 'input', (e)=>{
      state.guided.helpfulness = clamp(parseInt(e.target.value,10) || 0, 0, 5);
      setBadge(byId('gdHelpfulnessVal'), state.guided.helpfulness);
      refreshGuidedSummary();
    });

    on(byId('gdDifficulty'), 'input', (e)=>{
      state.guided.difficulty = clamp(parseInt(e.target.value,10) || 0, 0, 5);
      setBadge(byId('gdDifficultyVal'), state.guided.difficulty);
      refreshGuidedSummary();
    });

    on(byId('gdNextAction'), 'input', (e)=>{ state.guided.nextAction = e.target.value; refreshGuidedSummary(); });
    on(byId('gdBlocker'), 'input', (e)=>{ state.guided.blocker = e.target.value; refreshGuidedSummary(); });

    on(byId('gdAfter'), 'input', (e)=>{
      state.guided.after = clamp(parseInt(e.target.value,10),0,10);
      setBadge(byId('gdAfterVal'), state.guided.after, state.guided.after<=3?'good': state.guided.after<=6?'warn':'bad');
      refreshGuidedSummary();
    });

    on(byId('gdCopy'), 'click', ()=>{
      const t = byId('gdSummary')?.textContent || '';
      navigator.clipboard?.writeText(t)
        .then(()=>safeAlert('کپی شد ✅'))
        .catch(()=>safeAlert('کپی نشد.'));
    });

    on(byId('gdShare'), 'click', ()=>{
      const t = byId('gdSummary')?.textContent || '';
      if(navigator.share){
        navigator.share({title:'حس‌نگار — فلوی فوری', text:t}).catch(()=>{});
      }else{
        navigator.clipboard?.writeText(t)
          .then(()=>safeAlert('در کلیپ‌بورد کپی شد ✅'))
          .catch(()=>safeAlert('کپی نشد.'));
      }
    });

    on(byId('gdSave'), 'click', ()=>{
      // sync
      state.guided.body = byId('gdBody')?.value || state.guided.body;
      state.guided.trigger = (byId('gdTrigger')?.value || '').trim();
      state.guided.harm = byId('gdHarm')?.value || state.guided.harm;
      state.guided.didTool = byId('gdDidTool')?.value || state.guided.didTool;
      state.guided.minutes = clamp(parseInt(byId('gdMinutes')?.value || '0',10) || 0,0,60);
      state.guided.helpfulness = clamp(parseInt(byId('gdHelpfulness')?.value || String(state.guided.helpfulness),10) || 0,0,5);
      state.guided.difficulty = clamp(parseInt(byId('gdDifficulty')?.value || String(state.guided.difficulty),10) || 0,0,5);
      state.guided.nextAction = (byId('gdNextAction')?.value || '').trim();
      state.guided.blocker = (byId('gdBlocker')?.value || '').trim();

      if(state.guided.flowId === 'savor'){
        state.guided.savorMoment = (byId('gdSavorMoment')?.value || '').trim();
        state.guided.savorWhy = (byId('gdSavorWhy')?.value || '').trim();
        state.guided.savorRepeat = (byId('gdSavorRepeat')?.value || '').trim();
      }

      refreshGuidedSummary();

      const createdAt = state.guided._createdAt || nowISO();
      const record = {
        id: uuid(),
        type: 'guided',
        createdAt,
        meta: { schema: APP_SCHEMA_VERSION },
        data: {
          flowId: state.guided.flowId,
          goal: state.guided.goal,
          mode: state.guided.mode,
          vuln: [...state.guided.vuln],
          intensity: state.guided.intensity,
          body: state.guided.body,
          trigger: state.guided.trigger,
          harm: state.guided.harm,
          toolId: state.guided.toolId,
          didTool: state.guided.didTool,
          minutes: state.guided.minutes,
          helpfulness: state.guided.helpfulness,
          difficulty: state.guided.difficulty,
          after: state.guided.after,
          nextAction: state.guided.nextAction,
          actionStatus: state.guided.actionStatus,
          blocker: state.guided.blocker,
          savorMoment: state.guided.flowId==='savor' ? state.guided.savorMoment : '',
          savorWhy: state.guided.flowId==='savor' ? state.guided.savorWhy : '',
          savorRepeat: state.guided.flowId==='savor' ? state.guided.savorRepeat : '',
          principles: [...state.guided.principles],
          improvements: [...state.guided.improvements],
          achievements: [...state.guided.achievements],
        },
        summaryText: state.guided.summaryText,
      };

      addRecord(record);
      safeAlert('ذخیره شد ✅ (فقط روی دستگاه)');
      updateWeeklyWidget();
    });

    on(byId('gdGoHome'), 'click', ()=> show('home'));
  }

  /* ==========================
     Weekly goal
  ========================== */

  function weekStartISO(date = new Date()){
    const d = new Date(date);
    const day = d.getDay();
    // Monday start (ISO): diff days since Monday
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0,0,0,0);
    return d.toISOString();
  }

  function loadWeekly(){
    const currentWeek = weekStartISO();
    const w = loadJSON(WEEKLY_KEY, null);
    if(!w || typeof w !== 'object' || !w.weekStart){
      const fresh = { weekStart: currentWeek, focus:'any', target:3 };
      saveJSON(WEEKLY_KEY, fresh);
      return fresh;
    }
    if(w.weekStart !== currentWeek){
      const rolled = { ...w, weekStart: currentWeek };
      saveJSON(WEEKLY_KEY, rolled);
      return rolled;
    }
    return w;
  }

  function saveWeekly(w){
    saveJSON(WEEKLY_KEY, w);
  }

  function recordCategory(rec){
    const t = toolById(rec?.data?.toolId);
    if(rec?.type === 'guided' && rec?.data?.flowId === 'savor') return 'savor';
    if(t){
      if(t.id === 'self_compassion') return 'compassion';
      if(t.id === 'savor' || t.id === 'gratitude_3') return 'savor';
      if(t.id === 'boundary_script') return 'boundaries';
      if((t.tag||'').includes('بدن')) return 'body';
      if((t.tag||'').includes('ذهن')) return 'mind';
      if((t.tag||'').includes('مسئله')) return 'mind';
      if((t.tag||'').includes('شفقت')) return 'compassion';
    }
    // fallback: goal
    if(rec?.data?.goal === 'relationship') return 'boundaries';
    return 'any';
  }

  function isDoneSession(rec){
    const d = rec?.data || {};
    const didTool = d.didTool === 'yes' && (Number(d.minutes) || 0) > 0;
    const didAction = d.actionStatus === 'done';
    return didTool || didAction;
  }

  function countWeeklyProgress(records, w){
    const start = new Date(w.weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return records.filter(r => {
      const t = new Date(r.createdAt);
      if(!(t >= start && t < end)) return false;
      if(!isDoneSession(r)) return false;
      if(w.focus === 'any') return true;
      return recordCategory(r) === w.focus;
    }).length;
  }

  function renderWeeklyScreen(){
    state.weekly = loadWeekly();
    const w = state.weekly;

    if(byId('wkFocus')) byId('wkFocus').value = w.focus;
    if(byId('wkTarget')) byId('wkTarget').value = String(w.target);
    setBadge(byId('wkTargetVal'), w.target);

    const records = loadRecordsRaw();
    const done = countWeeklyProgress(records, w);
    const pct = clamp(Math.round((done / w.target) * 100), 0, 100);

    if(byId('wkInfo')){
      const start = fmtDate(w.weekStart);
      const end = fmtDate(new Date(new Date(w.weekStart).getTime() + 6*24*3600*1000).toISOString());
      byId('wkInfo').innerHTML = `این هفته (${escapeHTML(start)} تا ${escapeHTML(end)})\nپیشرفت: <b>${done}</b> از <b>${w.target}</b>\nتمرکز: <b>${escapeHTML(focusLabel(w.focus))}</b>`;
    }

    if(byId('wkProgressBar')) byId('wkProgressBar').style.width = `${pct}%`;

    show('weekly');
  }

  function focusLabel(f){
    const map = {
      any:'هرکدام',
      body:'بدن/استرس',
      mind:'ذهن/فکر',
      compassion:'خودشفقت',
      savor:'لحظه خوب',
      boundaries:'رابطه/مرز'
    };
    return map[f] || f;
  }

  function updateWeeklyWidget(){
    const w = loadWeekly();
    const records = loadRecordsRaw();
    const done = countWeeklyProgress(records, w);
    const pct = clamp(Math.round((done / w.target) * 100), 0, 100);

    const widget = byId('wkWidget');
    if(widget){
      widget.innerHTML = `هدف این هفته: <b>${w.target}</b> بار • تمرکز: <b>${escapeHTML(focusLabel(w.focus))}</b>\nپیشرفت: <b>${done}</b> / <b>${w.target}</b> (${pct}٪)`;
    }
    if(byId('wkBar')) byId('wkBar').style.width = `${pct}%`;

    // weekly screen might be open
    if(document.body.dataset.screen === 'weekly'){
      renderWeeklyScreen();
    }
  }

  function setupWeeklyListeners(){
    on(byId('wkTarget'), 'input', (e)=>{
      const v = clamp(parseInt(e.target.value,10) || 3, 1, 7);
      setBadge(byId('wkTargetVal'), v);
    });

    on(byId('wkSave'), 'click', ()=>{
      const w = loadWeekly();
      w.focus = byId('wkFocus')?.value || w.focus;
      w.target = clamp(parseInt(byId('wkTarget')?.value || String(w.target),10) || 3, 1, 7);
      w.weekStart = weekStartISO();
      saveWeekly(w);
      safeAlert('ذخیره شد ✅');
      updateWeeklyWidget();
    });

    on(byId('wkReset'), 'click', ()=>{
      if(!confirm('هدف هفتگی به حالت پیش‌فرض برگردد؟')) return;
      const fresh = { weekStart: weekStartISO(), focus:'any', target:3 };
      saveWeekly(fresh);
      updateWeeklyWidget();
      renderWeeklyScreen();
    });

    on(byId('wkGoHome'), 'click', ()=> show('home'));
  }

  /* ==========================
     History & Analytics
  ========================== */

  function normalizeTextList(text){
    return String(text || '')
      .replace(/،/g, ',')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function computeStats(records){
    const total = records.length;

    const now = Date.now();
    const last7 = records.filter(r => (now - new Date(r.createdAt).getTime()) <= 7*24*3600*1000).length;

    // avg intensity
    let sumIntensity = 0;
    let nIntensity = 0;

    const emoCount = new Map();
    const needCount = new Map();
    const triggerCount = new Map();
    const bodyCount = new Map();

    // time buckets
    const timeBuckets = new Map([
      ['صبح (۵–۱۱)', 0],
      ['ظهر (۱۲–۱۶)', 0],
      ['عصر (۱۷–۲۱)', 0],
      ['شب (۲۲–۴)', 0],
    ]);

    // tool effects
    const toolAgg = new Map(); // id -> {sumDelta, n}

    for(const r of records){
      const d = r.data || {};
      const intensity = Number(d.intensity);
      if(Number.isFinite(intensity)){
        sumIntensity += intensity;
        nIntensity += 1;
      }

      // emotions
      if(r.type === 'quick'){
        (Array.isArray(d.emotions) ? d.emotions : []).forEach(e => emoCount.set(e, (emoCount.get(e)||0)+1));
      }else if(r.type === 'deep'){
        normalizeTextList(d.emotionsText).forEach(e => emoCount.set(e, (emoCount.get(e)||0)+1));
        (Array.isArray(d.needs) ? d.needs : []).forEach(n => needCount.set(n, (needCount.get(n)||0)+1));
      }else if(r.type === 'guided'){
        // guided doesn't always have emotions; ignore
      }

      // trigger
      const trg = String(d.trigger || '').trim();
      if(trg) triggerCount.set(trg, (triggerCount.get(trg)||0)+1);

      // body
      const body = String(d.body || '').trim();
      if(body) bodyCount.set(body, (bodyCount.get(body)||0)+1);

      // time
      const hour = new Date(r.createdAt).getHours();
      if(hour >= 5 && hour <= 11) timeBuckets.set('صبح (۵–۱۱)', timeBuckets.get('صبح (۵–۱۱)')+1);
      else if(hour >= 12 && hour <= 16) timeBuckets.set('ظهر (۱۲–۱۶)', timeBuckets.get('ظهر (۱۲–۱۶)')+1);
      else if(hour >= 17 && hour <= 21) timeBuckets.set('عصر (۱۷–۲۱)', timeBuckets.get('عصر (۱۷–۲۱)')+1);
      else timeBuckets.set('شب (۲۲–۴)', timeBuckets.get('شب (۲۲–۴)')+1);

      // tool effect (delta)
      const after = Number(d.after);
      if(d.toolId && Number.isFinite(intensity) && Number.isFinite(after)){
        const delta = intensity - after; // positive means improvement
        const cur = toolAgg.get(d.toolId) || {sum:0, n:0};
        cur.sum += delta;
        cur.n += 1;
        toolAgg.set(d.toolId, cur);
      }
    }

    const avgIntensity = nIntensity ? Math.round((sumIntensity/nIntensity)*10)/10 : 0;

    function topK(map, k=5){
      return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,k);
    }

    const tools = Array.from(toolAgg.entries())
      .map(([id,agg]) => ({
        id,
        title: toolById(id)?.title || id,
        avgDelta: agg.n ? (agg.sum/agg.n) : 0,
        n: agg.n
      }))
      .sort((a,b)=>b.avgDelta - a.avgDelta)
      .slice(0,8);

    return {
      total,
      last7,
      avgIntensity,
      topEmo: topK(emoCount, 5),
      topNeed: topK(needCount, 5),
      topTrigger: topK(triggerCount, 5),
      topBody: topK(bodyCount, 5),
      timeBuckets: Array.from(timeBuckets.entries()),
      tools,
    };
  }

  function barRows(items, valueKey='value'){
    const max = Math.max(...items.map(it => it[valueKey] || 0), 1);
    return `<div class="barlist">${items.map(it => {
      const v = it[valueKey];
      const pct = clamp(Math.round((v/max)*100), 0, 100);
      return `
        <div class="barrow">
          <div class="barlabel">${escapeHTML(it.label)}</div>
          <div class="bartrack"><div class="barfill" style="width:${pct}%"></div></div>
          <div class="barvalue">${escapeHTML(String(v))}</div>
        </div>
      `;
    }).join('')}</div>`;
  }

  function renderHistory(){
    const filter = byId('hxFilter')?.value || 'all';
    const all = loadRecordsRaw();

    let list = all;
    if(filter === 'quick' || filter === 'deep' || filter === 'guided'){
      list = all.filter(r => r.type === filter);
    }else if(filter === 'savor'){
      list = all.filter(r => r.type === 'guided' && r.data?.flowId === 'savor');
    }

    const stats = computeStats(list);

    // main stats
    const hxStats = byId('hxStats');
    if(hxStats){
      hxStats.innerHTML = `
        <div class="kpis">
          <div class="kpi"><div class="muted">تعداد کل</div><div class="num">${stats.total}</div></div>
          <div class="kpi"><div class="muted">۷ روز اخیر</div><div class="num">${stats.last7}</div></div>
          <div class="kpi"><div class="muted">میانگین شدت</div><div class="num">${stats.avgIntensity}</div></div>
        </div>
        <div class="helper" style="margin-top:10px">
          <b>احساس‌های پرتکرار:</b><br>
          ${stats.topEmo.length ? stats.topEmo.map(([k,v])=>`${escapeHTML(k)} (${v})`).join(' • ') : '—'}
          <br>
          <b>نیازهای پرتکرار (از تحلیل عمیق):</b><br>
          ${stats.topNeed.length ? stats.topNeed.map(([k,v])=>`${escapeHTML(k)} (${v})`).join(' • ') : '—'}
        </div>
      `;
    }

    // tools effect
    const hxTools = byId('hxToolsEffect');
    if(hxTools){
      if(!stats.tools.length){
        hxTools.innerHTML = `<div class="helper">— هنوز داده کافی نداریم. چند رکورد با «شدت قبل» و «شدت بعد» ذخیره کن.</div>`;
      }else{
        hxTools.innerHTML = barRows(stats.tools.map(t => ({
          label: `${t.title} (${t.n})`,
          value: Math.round(t.avgDelta*10)/10
        })), 'value');
      }
    }

    // triggers / body / times
    const hxTopTriggers = byId('hxTopTriggers');
    if(hxTopTriggers){
      hxTopTriggers.innerHTML = stats.topTrigger.length
        ? stats.topTrigger.map(([k,v])=>`• ${escapeHTML(k)} (${v})`).join('<br>')
        : '—';
    }

    const hxBodyMap = byId('hxBodyMap');
    if(hxBodyMap){
      hxBodyMap.innerHTML = stats.topBody.length
        ? stats.topBody.map(([k,v])=>`• ${escapeHTML(k)} (${v})`).join('<br>')
        : '—';
    }

    const hxTimes = byId('hxTimes');
    if(hxTimes){
      hxTimes.innerHTML = barRows(stats.timeBuckets.map(([label, value]) => ({label, value})), 'value');
    }

    // list
    const host = byId('hxList');
    if(!host) return;

    if(!list.length){
      host.innerHTML = `<div class="helper">هنوز چیزی ذخیره نشده. از «ثبت سریع»، «تحلیل عمیق» یا «فلوی فوری» یک مورد ذخیره کن.</div>`;
      return;
    }

    host.innerHTML = list.map(r => {
      const title = recordTitle(r);
      const badgeClass = r.type === 'quick' ? 'good' : (r.type === 'deep' ? 'warn' : '');
      const preview = (r.summaryText || '').slice(0, 180) + ((r.summaryText || '').length > 180 ? '…' : '');
      return `
        <div class="item">
          <div class="row wrap" style="justify-content:space-between">
            <div><b>${escapeHTML(title)}</b> <span class="badge ${badgeClass}">${escapeHTML(fmtDate(r.createdAt))}</span></div>
            <div class="row wrap">
              <button class="btn" data-copy="${escapeHTML(r.id)}">کپی</button>
              <button class="btn danger" data-del="${escapeHTML(r.id)}">حذف</button>
            </div>
          </div>
          <div class="helper" style="margin-top:8px">${escapeHTML(preview).replace(/\n/g,'<br>')}</div>
          <details style="margin-top:8px">
            <summary>نمایش کامل</summary>
            <pre class="summary" style="margin-top:10px">${escapeHTML(r.summaryText || '')}</pre>
          </details>
        </div>
      `;
    }).join('');

    host.querySelectorAll('[data-copy]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const id = e.currentTarget.dataset.copy;
        const rec = all.find(x => x.id === id);
        const text = rec?.summaryText || '';
        navigator.clipboard?.writeText(text)
          .then(()=>safeAlert('کپی شد ✅'))
          .catch(()=>safeAlert('کپی نشد.'));
      });
    });

    host.querySelectorAll('[data-del]').forEach(btn => {
      on(btn, 'click', (e)=>{
        const id = e.currentTarget.dataset.del;
        const listAll = loadRecordsRaw();
        const idx = listAll.findIndex(x => x.id === id);
        if(idx > -1){
          listAll.splice(idx, 1);
          saveRecords(listAll);
          renderHistory();
          updateWeeklyWidget();
        }
      });
    });
  }

  function recordTitle(r){
    if(r.type === 'quick') return 'ثبت سریع';
    if(r.type === 'deep') return 'تحلیل عمیق';
    if(r.type === 'guided'){
      const f = FLOWS[r.data?.flowId] || null;
      return f ? `فلوی فوری: ${f.title}` : 'فلوی فوری';
    }
    return 'رکورد';
  }

  /* ==========================
     Export / Import / Reset
  ========================== */

  function downloadJSON(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function setupHeaderActions(){
    const headerMenu = document.querySelector('.menu');

    on(byId('btnExport'), 'click', ()=>{
      const payload = {
        version: APP_SCHEMA_VERSION,
        exportedAt: nowISO(),
        records: loadRecordsRaw(),
        weekly: loadWeekly(),
        lists: {
          achievements: loadJSON('achievements', []),
          principles: loadJSON('principles', []),
          improvements: loadJSON('improvements', []),
        }
      };
      downloadJSON(payload, `hesnegar-export-${new Date().toISOString().slice(0,10)}.json`);
      if(headerMenu) setTimeout(()=>{ headerMenu.open = false; }, 0);
    });

    on(byId('btnImport'), 'click', ()=>{
      byId('fileImport')?.click();
      if(headerMenu) setTimeout(()=>{ headerMenu.open = false; }, 0);
    });

    on(byId('fileImport'), 'change', async (e)=>{
      const file = e.target.files?.[0];
      if(!file) return;
      try{
        const text = await file.text();
        const obj = JSON.parse(text);

        const incomingRecords = Array.isArray(obj)
          ? obj
          : (Array.isArray(obj.records) ? obj.records : []);

        const current = loadRecordsRaw();
        const merged = [...incomingRecords, ...current];

        // dedupe by id
        const seen = new Set();
        const unique = [];
        for(const r of merged){
          const id = r?.id;
          if(!id || seen.has(id)) continue;
          seen.add(id);
          unique.push(r);
        }

        saveRecords(unique);

        // weekly
        if(obj?.weekly && typeof obj.weekly === 'object'){
          // keep current weekStart (avoid weird mismatch)
          const cur = loadWeekly();
          const w = { ...obj.weekly, weekStart: cur.weekStart };
          saveWeekly(w);
        }

        // lists
        if(obj?.lists){
          if(Array.isArray(obj.lists.achievements)) saveJSON('achievements', obj.lists.achievements);
          if(Array.isArray(obj.lists.principles)) saveJSON('principles', obj.lists.principles);
          if(Array.isArray(obj.lists.improvements)) saveJSON('improvements', obj.lists.improvements);
        }

        safeAlert('ایمپورت شد ✅');
        renderHistory();
        updateWeeklyWidget();
      }catch(err){
        console.error(err);
        safeAlert('ایمپورت ناموفق بود. فایل JSON معتبر نیست.');
      }finally{
        e.target.value = '';
      }
    });

    on(byId('btnReset'), 'click', ()=>{
      if(!confirm('همهٔ داده‌ها (رکوردها + هدف هفتگی + لیست‌ها) روی این دستگاه پاک شود؟')) return;
      localStorage.removeItem(STORE_KEY_V2);
      localStorage.removeItem(STORE_KEY_V1);
      localStorage.removeItem(WEEKLY_KEY);
      localStorage.removeItem('achievements');
      localStorage.removeItem('principles');
      localStorage.removeItem('improvements');
      safeAlert('پاک شد ✅');
      renderHistory();
      updateWeeklyWidget();
      if(headerMenu) setTimeout(()=>{ headerMenu.open = false; }, 0);
    });

    // close when clicking outside
    if(headerMenu){
      document.addEventListener('click', (e)=>{
        if(headerMenu.open && !headerMenu.contains(e.target)) headerMenu.open = false;
      });
    }
  }

  /* ==========================
     Home buttons
  ========================== */

  function setupHomeButtons(){
    on(byId('goQuick'), 'click', ()=>{
      resetQuick();
      show('quick-1');
      refreshQuickSummary();
    });

    on(byId('goDeep'), 'click', ()=>{
      resetDeep();
      show('deep-1');
      refreshDeepSummary();
    });

    on(byId('goToolkit'), 'click', ()=>{
      renderToolkit();
      show('toolkit');
    });

    on(byId('goHistory'), 'click', ()=>{
      renderHistory();
      show('history');
    });

    on(byId('goWeekly'), 'click', ()=>{
      renderWeeklyScreen();
    });

    // guided flows
    on(byId('goFlowPanic'), 'click', ()=>{ resetGuided('panic'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowAnger'), 'click', ()=>{ resetGuided('anger'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowRumination'), 'click', ()=>{ resetGuided('rumination'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowShame'), 'click', ()=>{ resetGuided('shame'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowSavor'), 'click', ()=>{ resetGuided('savor'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowSadness'), 'click', ()=>{ resetGuided('sadness'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowUrge'), 'click', ()=>{ resetGuided('urge'); show('guided-1'); refreshGuidedSummary(); });
    on(byId('goFlowConflict'), 'click', ()=>{ resetGuided('conflict'); show('guided-1'); refreshGuidedSummary(); });

    on(byId('tkGoHome'), 'click', ()=> show('home'));
    on(byId('hxGoHome'), 'click', ()=> show('home'));
  }

  function setupHistoryListeners(){
    on(byId('hxRefresh'), 'click', renderHistory);
    on(byId('hxFilter'), 'change', renderHistory);
  }

  /* ==========================
     Startup
  ========================== */

  function init(){
    // ensure data keys exist
    loadRecordsRaw();
    loadWeekly();

    setupHeaderActions();
    setupHomeButtons();
    setupQuickListeners();
    setupDeepListeners();
    setupGuidedListeners();
    setupWeeklyListeners();
    setupHistoryListeners();

    renderToolkit();
    updateWeeklyWidget();

    show('home', {push:false});
  }

  init();

  /* ==========================
     Service worker
  ========================== */
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    });
  }

})();

// ===================== Added logic for new strategies and emotion regulation vs problem-solving =====================

// Define old strategies with brief explanations
const oldStrategies = {
    "Escape": "Escaping or avoiding feelings, such as withdrawing or distracting yourself to avoid the discomfort.",
    "Control": "Trying to control situations and people around you when feeling anxious or unsafe, like micromanaging.",
    "Perfectionism": "Striving for perfection and always seeking to do things flawlessly, often leading to stress and burnout."
};

// Define new strategies based on psychology science
const newStrategies = {
    "Acceptance and Mindfulness": "Learn to accept your feelings as they are, without judgment. Practice mindfulness to stay present and manage distress.",
    "Boundary Setting": "Set healthy boundaries with others to protect your energy and maintain emotional well-being.",
    "Problem-Solving": "Break down issues into manageable steps and focus on practical solutions to make progress and reduce stress."
};

// Emotion list for quick selection in deep registration
const emotionsList = ["Anxiety", "Sadness", "Anger", "Frustration", "Joy", "Shame", "Fear", "Loneliness"];

// Recommendations based on 'Emotion Regulation vs Problem-Solving' choice
const recommendNextStep = (choice) => {
    if (choice === 'Emotion Regulation') {
        return "Try engaging in mindfulness or grounding exercises, focus on your breath or do a quick body scan to calm your mind.";
    } else if (choice === 'Problem-Solving') {
        return "Take a moment to clearly define the problem and break it down into smaller steps. Focus on what action you can take right now.";
    } else {
        return "Please choose either 'Emotion Regulation' or 'Problem-Solving' to get more tailored recommendations.";
    }
};

// Export for use in other parts of the app
window.oldStrategies = oldStrategies;
window.newStrategies = newStrategies;
window.emotionsList = emotionsList;
window.recommendNextStep = recommendNextStep;
