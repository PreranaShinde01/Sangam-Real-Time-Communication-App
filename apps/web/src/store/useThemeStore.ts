import { create } from 'zustand';

export type Language = 'en' | 'hi' | 'mr';

interface ThemeState {
  theme: 'dark' | 'light';
  lang: Language;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLang: (lang: Language) => void;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Common
    app_name: 'Sangam',
    tagline: 'Meet. Collaborate. Stay secure.',
    secure_meet: 'Secure Meet',

    // Navigation
    sign_in: 'Sign in',
    sign_up: 'Get Started',
    logout: 'Log out',
    dashboard: 'Dashboard',
    admin: 'Admin Console',
    switch_dark: 'Switch to Dark',
    switch_light: 'Switch to Light',
    change_lang: 'Change Language',

    // Hero Section
    hero_badge: 'Encrypted WebRTC DTLS-SRTP & Client-Side AES-256',
    hero_title_prefix: 'Meet. Collaborate.',
    hero_title_suffix: 'Stay secure.',
    hero_desc:
      'Sangam unites video calling, screen sharing, collaborative whiteboarding, and client-side encrypted file transfers in a fast, privacy-first platform.',
    start_instant: 'Start Instant Meeting',
    enter_code: 'Enter room code',
    creating_room: 'Creating Room...',
    join: 'Join',
    quick_test: 'Want a quick test?',
    join_demo_room: 'Join Demo Room (san-gam-demo)',

    // Features Section
    features_heading: 'Engineered for Modern Teams & Security',
    features_subheading:
      'Everything you need for seamless audio-visual meetings, real-time collaboration, and safe data exchange.',
    feat_video_title: 'High-Def WebRTC Mesh Video',
    feat_video_desc:
      'Crisp peer-to-peer video with active speaker highlights, speaker vs grid layouts, audio volume meter, and ICE auto-reconnect.',
    feat_screen_title: 'Presenter Spotlight Sharing',
    feat_screen_desc:
      'Share your screen, window, or specific tab with audio. Spotlight stage layout automatically highlights the active presenter.',
    feat_files_title: 'AES-256-GCM File Sharing',
    feat_files_desc:
      'Files are encrypted client-side using Web Crypto before hitting the network. Auto-purged upon meeting termination.',
    feat_board_title: 'Shared Canvas & Sticky Notes',
    feat_board_desc:
      'Draw with pens, highlighters, shapes, and sticky notes. Synchronized in real time with undo/redo and PNG export.',
    feat_security_title: 'Lobby, Passcodes & Fingerprint',
    feat_security_desc:
      'Waiting room admission, room locks, meeting passwords, and short verification security codes to compare with peers.',
    feat_advanced_title: 'Captions, Recording & Polls',
    feat_advanced_desc:
      'Live Speech-to-Text transcription with transcript downloads, client-side meeting recording, and interactive polls.',
    footer_built_with: 'Built with React, TypeScript, Node.js, WebRTC, and AES-256-GCM.',

    // Auth
    sign_in_title: 'Sign In',
    sign_up_title: 'Create your Account',
    sign_up_sub: 'Start hosting encrypted meetings and collaborating seamlessly',
    guest_join_tab: 'Guest Join',
    sign_in_tab: 'Sign In',
    email_label: 'Email Address',
    password_label: 'Password',
    display_name_label: 'Display Name',
    password_hint: 'Must include 1 uppercase letter, 1 lowercase letter, and 1 number.',
    dont_have_account: "Don't have an account?",
    already_have_account: 'Already have an account?',
    create_one_now: 'Create one now',
    two_factor_auth: 'Two-Factor Authentication',
    enter_totp_code: 'Enter the 6-digit verification code from your authenticator app.',
    confirm_2fa: 'Confirm 2FA Code',
    demo_accounts: 'Autofill Demo Accounts:',
    continue_as_guest: 'Continue as Guest',
    guest_desc: 'Guest sessions allow you to join open meetings without creating an account.',

    // Dashboard
    welcome_back: 'Welcome back,',
    secure_dashboard: 'Secure Dashboard',
    dashboard_sub: 'Host instant encrypted meetings or schedule collaboration sessions with your team.',
    instant_meeting: 'Instant Meeting',
    schedule_meeting: 'Schedule Meeting',
    enable_2fa: 'Enable 2FA',
    have_invite_code: 'Have a meeting invite code or link? Join directly:',
    your_meetings: 'Your Meetings & History',
    no_meetings: 'No meetings found yet.',
    click_create: "Click 'Instant Meeting' or 'Schedule Meeting' to create one.",
    join_room: 'Join Room',

    // In-Meeting Controls & Panels
    chat: 'Meeting Chat',
    people: 'Participants',
    whiteboard: 'Whiteboard',
    files: 'Encrypted Files',
    polls: 'Polls & Quizzes',
    recording: 'Recording',
    mute: 'Mute Mic',
    unmute: 'Unmute Mic',
    stop_video: 'Turn Off Camera',
    start_video: 'Turn On Camera',
    share_screen: 'Share Screen',
    stop_share: 'Stop Sharing',
    raise_hand: 'Raise Hand',
    lower_hand: 'Lower Hand',
    leave: 'Leave Meeting',
    end_for_all: 'End for All',
    security_verified: 'Encrypted',
    live_captions: 'Live Captions',
    mute_all: 'Mute All',
    lock_room: 'Lock Room',
    room_locked: 'Room Locked',
  },

  hi: {
    // Brand & Common
    app_name: 'संगम',
    tagline: 'मिलें। सहयोग करें। सुरक्षित रहें।',
    secure_meet: 'सुरक्षित बैठक',

    // Navigation
    sign_in: 'लॉग इन करें',
    sign_up: 'शुरू करें',
    logout: 'लॉग आउट',
    dashboard: 'डैशबोर्ड',
    admin: 'प्रशासन कक्ष',
    switch_dark: 'डार्क मोड पर जाएं',
    switch_light: 'लाइट मोड पर जाएं',
    change_lang: 'भाषा बदलें',

    // Hero Section
    hero_badge: 'एन्क्रिप्टेड WebRTC DTLS-SRTP एवं क्लाइंट-साइड AES-256',
    hero_title_prefix: 'मिलें। सहयोग करें।',
    hero_title_suffix: 'सुरक्षित रहें।',
    hero_desc:
      'संगम वीडियो कॉलिंग, स्क्रीन शेयरिंग, सहयोगी व्हाइटबोर्ड और क्लाइंट-साइड एन्क्रिप्टेड फ़ाइल स्थानांतरण को एक तेज़, सुरक्षित मंच पर जोड़ता है।',
    start_instant: 'तुरंत मीटिंग शुरू करें',
    enter_code: 'कमरा कोड दर्ज करें',
    creating_room: 'कमरा बनाया जा रहा है...',
    join: 'शामिल हों',
    quick_test: 'क्या तुरंत आज़माना चाहते हैं?',
    join_demo_room: 'डेमो रूम में शामिल हों (san-gam-demo)',

    // Features Section
    features_heading: 'आधुनिक टीमों और सुरक्षा के लिए निर्मित',
    features_subheading:
      'सहज दृश्य-श्रव्य बैठकों, वास्तविक समय सहयोग और सुरक्षित डेटा विनिमय के लिए सब कुछ।',
    feat_video_title: 'हाई-डेफिनिशन WebRTC मेश वीडियो',
    feat_video_desc:
      'सक्रिय वक्ता हाइलाइट, ग्रिड लेआउट, ऑडियो वॉल्यूम मीटर और स्वतः पुनःकनेक्शन के साथ स्पष्ट वीडियो।',
    feat_screen_title: 'प्रस्तुतकर्ता स्क्रीन शेयरिंग',
    feat_screen_desc:
      'ऑडियो के साथ अपनी पूरी स्क्रीन, विंडो या टैब साझा करें। सक्रिय प्रस्तुतकर्ता पर स्वतः ध्यान केंद्रित होता है।',
    feat_files_title: 'AES-256-GCM फ़ाइल शेयरिंग',
    feat_files_desc:
      'नेटवर्क पर जाने से पहले फ़ाइलें आपके ब्राउज़र में एन्क्रिप्ट होती हैं। बैठक समाप्त होते ही स्वतः नष्ट।',
    feat_board_title: 'साझा व्हाइटबोर्ड और नोट्स',
    feat_board_desc:
      'पेन, आकृतियों और स्टिकी नोट्स के साथ बनाएं। रीयल-टाइम में सिंक, अनडू/रीडू और PNG एक्सपोर्ट।',
    feat_security_title: 'प्रतीक्षा कक्ष, पासकोड और कोड',
    feat_security_desc:
      'प्रतीक्षा कक्ष स्वीकृति, रूम लॉक, पासकोड सुरक्षा और साथियों से तुलना के लिए सत्यापन सुरक्षा कोड।',
    feat_advanced_title: 'लाइव उपशीर्षक, रिकॉर्डिंग और मतदान',
    feat_advanced_desc:
      'लाइव वाक्-से-पाठ उपशीर्षक, ब्राउज़र में बैठक रिकॉर्डिंग और लाइव त्वरित मतदान।',
    footer_built_with: 'React, TypeScript, Node.js, WebRTC और AES-256-GCM से निर्मित।',

    // Auth
    sign_in_title: 'लॉग इन करें',
    sign_up_title: 'अपना खाता बनाएं',
    sign_up_sub: 'सुरक्षित बैठकें आयोजित करना और सहयोग करना शुरू करें',
    guest_join_tab: 'अतिथि प्रवेश',
    sign_in_tab: 'लॉग इन',
    email_label: 'ईमेल पता',
    password_label: 'पासवर्ड',
    display_name_label: 'प्रदर्शित नाम',
    password_hint: 'कम से कम 1 बड़ा अक्षर, 1 छोटा अक्षर और 1 अंक होना चाहिए।',
    dont_have_account: 'खाता नहीं है?',
    already_have_account: 'पहले से खाता है?',
    create_one_now: 'नया बनाएं',
    two_factor_auth: 'द्वि-चरणीय प्रमाणीकरण (2FA)',
    enter_totp_code: 'अपने प्रमाणक ऐप से 6 अंकों का कोड दर्ज करें।',
    confirm_2fa: 'कोड सत्यापित करें',
    demo_accounts: 'डेमो खाते स्वतः भरें:',
    continue_as_guest: 'अतिथि के रूप में आगे बढ़ें',
    guest_desc: 'अतिथि सत्र आपको बिना खाता बनाए खुली बैठकों में शामिल होने की अनुमति देता है।',

    // Dashboard
    welcome_back: 'वापसी पर स्वागत है,',
    secure_dashboard: 'सुरक्षित डैशबोर्ड',
    dashboard_sub: 'तुरंत एन्क्रिप्टेड बैठकें आयोजित करें या अपनी टीम के साथ बैठकें निर्धारित करें।',
    instant_meeting: 'तुरंत बैठक',
    schedule_meeting: 'मीटिंग शेड्यूल करें',
    enable_2fa: '2FA सक्रिय करें',
    have_invite_code: 'क्या आपके पास आमंत्रण कोड या लिंक है? सीधे जुड़ें:',
    your_meetings: 'आपकी बैठकें और इतिहास',
    no_meetings: 'अभी कोई बैठक नहीं मिली।',
    click_create: "शुरू करने के लिए 'तुरंत बैठक' या 'मीटिंग शेड्यूल करें' पर क्लिक करें।",
    join_room: 'कक्ष में जुड़ें',

    // In-Meeting Controls & Panels
    chat: 'बातचीत',
    people: 'प्रतिभागी',
    whiteboard: 'व्हाइटबोर्ड',
    files: 'सुरक्षित फ़ाइलें',
    polls: 'मतदान',
    recording: 'रिकॉर्डिंग',
    mute: 'माइक बंद',
    unmute: 'माइक चालू',
    stop_video: 'कैमरा बंद',
    start_video: 'कैमरा चालू',
    share_screen: 'स्क्रीन साझा करें',
    stop_share: 'साझा करना रोकें',
    raise_hand: 'हाथ उठाएं',
    lower_hand: 'हाथ नीचे करें',
    leave: 'मीटिंग छोड़ें',
    end_for_all: 'सभी के लिए समाप्त करें',
    security_verified: 'पूर्णतः एन्क्रिप्टेड',
    live_captions: 'लाइव उपशीर्षक',
    mute_all: 'सभी को म्यूट करें',
    lock_room: 'कक्ष लॉक करें',
    room_locked: 'कक्ष लॉक है',
  },

  mr: {
    // Brand & Common
    app_name: 'संगम',
    tagline: 'भेटा. सहकार्य करा. सुरक्षित रहा.',
    secure_meet: 'सुरक्षित बैठक',

    // Navigation
    sign_in: 'लॉग इन करा',
    sign_up: 'सुरू करा',
    logout: 'बाहेर पडा',
    dashboard: 'डॅशबोर्ड',
    admin: 'प्रशासन पॅनेल',
    switch_dark: 'डार्क मोड चालू करा',
    switch_light: 'लाइट मोड चालू करा',
    change_lang: 'भाषा बदला',

    // Hero Section
    hero_badge: 'एन्क्रिप्टेड WebRTC DTLS-SRTP आणि क्लायंट-साइड AES-256',
    hero_title_prefix: 'भेटा. सहकार्य करा.',
    hero_title_suffix: 'सुरक्षित रहा.',
    hero_desc:
      'संगम व्हिडिओ कॉलिंग, स्क्रीन शेअरिंग, परस्पर व्हाइटबोर्ड आणि क्लायंट-साइड सुरक्षित फाइल हस्तांतरण एका वेगवान, खाजगी मंचावर एकत्र आणते.',
    start_instant: 'त्वरित बैठक सुरू करा',
    enter_code: 'खोली कोड प्रविष्ट करा',
    creating_room: 'खोली तयार करत आहे...',
    join: 'सामील व्हा',
    quick_test: 'त्वरित चाचणी हवी आहे का?',
    join_demo_room: 'डेमो खोलीत सामील व्हा (san-gam-demo)',

    // Features Section
    features_heading: 'आधुनिक कार्यसंघ आणि सुरक्षेसाठी तयार केलेले',
    features_subheading:
      'सुलभ ऑडिओ-व्हिडिओ बैठका, थेट सहकार्य आणि सुरक्षित माहितीच्या देवाणघेवाणीसाठी सर्वकाही.',
    feat_video_title: 'हाय-डेफिनिशन WebRTC मेश व्हिडिओ',
    feat_video_desc:
      'सक्रिय वक्ता हायलाइट, ग्रिड मांडणी, व्हॉल्यूम मीटर आणि स्वयंचलित री-कनेक्शनसह स्पष्ट व्हिडिओ.',
    feat_screen_title: 'प्रस्तुतकर्ता स्क्रीन शेअरिंग',
    feat_screen_desc:
      'ऑडिओसह तुमची संपूर्ण स्क्रीन, विंडो किंवा टॅब शेअर करा. सक्रिय सादरकर्त्यावर त्वरित फोकस होतो.',
    feat_files_title: 'AES-256-GCM फाइल शेअरिंग',
    feat_files_desc:
      'नेटवर्कवर जाण्यापूर्वी फायली ब्राउझरमध्ये एन्क्रिप्ट होतात. बैठक संपताच स्वयंचलित नष्ट.',
    feat_board_title: 'सामायिक व्हाइटबोर्ड आणि नोट्स',
    feat_board_desc:
      'पेन, आकार आणि स्टिकी नोट्ससह काम करा. रिअल-टाइम सिंक, अनडू/रीडू आणि PNG निर्यात.',
    feat_security_title: 'प्रतिक्षा कक्ष, पासकोड आणि कोड',
    feat_security_desc:
      'प्रतिक्षा कक्ष प्रवेश, खोली लॉक, पासकोड आणि मित्रांशी तुलना करण्यासाठी सुरक्षा पडताळणी कोड.',
    feat_advanced_title: 'थेट मथळे, रेकॉर्डिंग आणि मतदान',
    feat_advanced_desc:
      'थेट भाषण-ते-मजकूर मथळे, ब्राउझरमध्ये बैठक रेकॉर्डिंग आणि थेट द्रुत मतदान.',
    footer_built_with: 'React, TypeScript, Node.js, WebRTC आणि AES-256-GCM द्वारे निर्मित.',

    // Auth
    sign_in_title: 'लॉग इन करा',
    sign_up_title: 'आपले खाते तयार करा',
    sign_up_sub: 'सुरक्षित बैठका आयोजित करणे आणि सहकार्य करणे सुरू करा',
    guest_join_tab: 'अतिथी प्रवेश',
    sign_in_tab: 'लॉग इन',
    email_label: 'ईमेल पत्ता',
    password_label: 'पासवर्ड',
    display_name_label: 'प्रदर्शित नाव',
    password_hint: 'किमान १ मोठे अक्षर, १ लहान अक्षर आणि १ अंक असणे आवश्यक आहे.',
    dont_have_account: 'खाते नाही का?',
    already_have_account: 'आधीच खाते आहे का?',
    create_one_now: 'नवीन तयार करा',
    two_factor_auth: 'दोन-चरणी प्रमाणीकरण (2FA)',
    enter_totp_code: 'तुमच्या ऑथेंटिकेटर अ‍ॅपमधून ६-अंकी कोड प्रविष्ट करा.',
    confirm_2fa: 'कोड सत्यापित करा',
    demo_accounts: 'डेमो खाती स्वयंचलित भरा:',
    continue_as_guest: 'अतिथी म्हणून पुढे जा',
    guest_desc: 'अतिथी सत्रामुळे तुम्हाला खाते न उघडता खुल्या बैठकीत सामील होता येते.',

    // Dashboard
    welcome_back: 'पुन्हा स्वागत आहे,',
    secure_dashboard: 'सुरक्षित डॅशबोर्ड',
    dashboard_sub: 'त्वरित एन्क्रिप्टेड बैठका आयोजित करा किंवा तुमच्या टीमसोबत बैठकांचे नियोजन करा.',
    instant_meeting: 'त्वरित बैठक',
    schedule_meeting: 'बैठक नियोजित करा',
    enable_2fa: '2FA सक्षम करा',
    have_invite_code: 'आमंत्रण कोड किंवा लिंक आहे का? थेट सामील व्हा:',
    your_meetings: 'तुमच्या बैठका आणि इतिहास',
    no_meetings: 'अद्याप कोणत्याही बैठका आढळल्या नाहीत.',
    click_create: "सुरू करण्यासाठी 'त्वरित बैठक' किंवा 'बैठक नियोजित करा' वर क्लिक करा.",
    join_room: 'खोलीत सामील व्हा',

    // In-Meeting Controls & Panels
    chat: 'गप्पा',
    people: 'सहभागी',
    whiteboard: 'व्हाइटबोर्ड',
    files: 'सुरक्षित फाइल्स',
    polls: 'मतदान',
    recording: 'रेकॉर्डिंग',
    mute: 'माइक बंद',
    unmute: 'माइक चालू',
    stop_video: 'व्हिडिओ बंद',
    start_video: 'व्हिडिओ चालू',
    share_screen: 'स्क्रीन शेअर करा',
    stop_share: 'शेअर थांबवा',
    raise_hand: 'हात वर करा',
    lower_hand: 'हात खाली करा',
    leave: 'बैठक सोडा',
    end_for_all: 'सर्वांसाठी संपवा',
    security_verified: 'पूर्णतः एन्क्रिप्टेड',
    live_captions: 'थेट मथळे',
    mute_all: 'सर्वांना म्यूट करा',
    lock_room: 'खोली लॉक करा',
    room_locked: 'खोली लॉक केली आहे',
  },
};

// Initial theme determination
const getInitialTheme = (): 'dark' | 'light' => {
  try {
    const saved = localStorage.getItem('sangam_theme') as 'dark' | 'light';
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
};

const getInitialLang = (): Language => {
  try {
    const saved = localStorage.getItem('sangam_lang') as Language;
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
  } catch {}
  return 'en';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  lang: getInitialLang(),

  setTheme: (theme) => {
    try {
      localStorage.setItem('sangam_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {}
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setLang: (lang) => {
    try {
      localStorage.setItem('sangam_lang', lang);
    } catch {}
    set({ lang });
  },
}));

/**
 * Reactive translation hook: ensures any component using it automatically
 * re-renders whenever `lang` changes in the store!
 */
export function useTranslation() {
  const lang = useThemeStore((s) => s.lang);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setLang = useThemeStore((s) => s.setLang);

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return { t, lang, theme, toggleTheme, setLang };
}
