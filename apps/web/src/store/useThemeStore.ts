import { create } from 'zustand';

export type Language = 'en' | 'hi' | 'mr';

interface ThemeState {
  theme: 'dark' | 'light';
  lang: Language;
  toggleTheme: () => void;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    tagline: 'Meet. Collaborate. Stay secure.',
    start_instant: 'Start Instant Meeting',
    join_meeting: 'Join Meeting',
    enter_code: 'Enter room code or link',
    schedule: 'Schedule Meeting',
    chat: 'Chat',
    people: 'Participants',
    whiteboard: 'Whiteboard',
    files: 'Encrypted Files',
    polls: 'Polls',
    recording: 'Recording',
    mute: 'Mute',
    unmute: 'Unmute',
    stop_video: 'Stop Video',
    start_video: 'Start Video',
    share_screen: 'Share Screen',
    stop_share: 'Stop Sharing',
    raise_hand: 'Raise Hand',
    lower_hand: 'Lower Hand',
    leave: 'Leave Meeting',
    end_for_all: 'End for All',
    security_verified: 'End-to-End Encrypted',
  },
  hi: {
    tagline: 'मिलें। सहयोग करें। सुरक्षित रहें।',
    start_instant: 'तुरंत मीटिंग शुरू करें',
    join_meeting: 'मीटिंग में शामिल हों',
    enter_code: 'कमरा कोड या लिंक दर्ज करें',
    schedule: 'मीटिंग शेड्यूल करें',
    chat: 'बातचीत',
    people: 'प्रतिभागी',
    whiteboard: 'व्हाइटबोर्ड',
    files: 'सुरक्षित फाइलें',
    polls: 'मतदान',
    recording: 'रिकॉर्डिंग',
    mute: 'माइक बंद',
    unmute: 'माइक चालू',
    stop_video: 'कैमरा बंद',
    start_video: 'कैमरा चालू',
    share_screen: 'स्क्रीन साझा करें',
    stop_share: 'साझा करना बंद करें',
    raise_hand: 'हाथ उठाएं',
    lower_hand: 'हाथ नीचे करें',
    leave: 'मीटिंग छोड़ें',
    end_for_all: 'सभी के लिए समाप्त करें',
    security_verified: 'पूर्णतः एन्क्रिप्टेड',
  },
  mr: {
    tagline: 'भेटा. सहकार्य करा. सुरक्षित रहा.',
    start_instant: 'त्वरित बैठक सुरू करा',
    join_meeting: 'बैठकीत सामील व्हा',
    enter_code: 'खोली कोड किंवा लिंक प्रविष्ट करा',
    schedule: 'बैठक नियोजित करा',
    chat: 'गप्पा',
    people: 'सहभागी',
    whiteboard: 'व्हाईटबोर्ड',
    files: 'सुरक्षित फायली',
    polls: 'मतदान',
    recording: 'रेकॉर्डिंग',
    mute: 'माईक बंद',
    unmute: 'माईक चालू',
    stop_video: 'व्हिडिओ बंद',
    start_video: 'व्हिडिओ सुरू',
    share_screen: 'स्क्रीन शेअर करा',
    stop_share: 'शेअर थांबवा',
    raise_hand: 'हात वर करा',
    lower_hand: 'हात खाली करा',
    leave: 'बैठक सोडा',
    end_for_all: 'सर्वांसाठी समाप्त',
    security_verified: 'संपूर्ण एन्क्रिप्टेड',
  },
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('sangam_theme') as 'dark' | 'light') || 'dark',
  lang: (localStorage.getItem('sangam_lang') as Language) || 'en',

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sangam_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: next });
  },

  setLang: (lang) => {
    localStorage.setItem('sangam_lang', lang);
    set({ lang });
  },

  t: (key: string) => {
    const currentLang = get().lang;
    return translations[currentLang]?.[key] || translations.en[key] || key;
  },
}));
