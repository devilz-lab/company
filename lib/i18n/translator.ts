/**
 * Multi-language support
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh'

export const SUPPORTED_LANGUAGES: Array<{ code: Language; name: string; flag: string }> = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
]

export interface Translation {
  [key: string]: string
}

const translations: Record<Language, Translation> = {
  en: {
    chat: 'Chat',
    personas: 'Personas',
    timeline: 'Timeline',
    kinks: 'Kinks',
    stats: 'Stats',
    settings: 'Settings',
    'type-message': 'Type a message...',
    'start-conversation': 'Start a conversation',
    'companion-ready': 'Your companion is ready to chat',
  },
  es: {
    chat: 'Chat',
    personas: 'Personas',
    timeline: 'Línea de tiempo',
    kinks: 'Fetiches',
    stats: 'Estadísticas',
    settings: 'Configuración',
    'type-message': 'Escribe un mensaje...',
    'start-conversation': 'Inicia una conversación',
    'companion-ready': 'Tu compañero está listo para chatear',
  },
  fr: {
    chat: 'Chat',
    personas: 'Personas',
    timeline: 'Chronologie',
    kinks: 'Fantasmes',
    stats: 'Statistiques',
    settings: 'Paramètres',
    'type-message': 'Tapez un message...',
    'start-conversation': 'Démarrer une conversation',
    'companion-ready': 'Votre compagnon est prêt à discuter',
  },
  de: {
    chat: 'Chat',
    personas: 'Personas',
    timeline: 'Zeitachse',
    kinks: 'Vorlieben',
    stats: 'Statistiken',
    settings: 'Einstellungen',
    'type-message': 'Nachricht eingeben...',
    'start-conversation': 'Gespräch beginnen',
    'companion-ready': 'Ihr Begleiter ist bereit zum Chatten',
  },
  ja: {
    chat: 'チャット',
    personas: 'ペルソナ',
    timeline: 'タイムライン',
    kinks: 'キンク',
    stats: '統計',
    settings: '設定',
    'type-message': 'メッセージを入力...',
    'start-conversation': '会話を開始',
    'companion-ready': 'あなたのコンパニオンがチャットの準備ができています',
  },
  zh: {
    chat: '聊天',
    personas: '角色',
    timeline: '时间线',
    kinks: '癖好',
    stats: '统计',
    settings: '设置',
    'type-message': '输入消息...',
    'start-conversation': '开始对话',
    'companion-ready': '您的伴侣已准备好聊天',
  },
}

export function translate(key: string, language: Language = 'en'): string {
  return translations[language]?.[key] || translations.en[key] || key
}

export function getLanguageFromCode(code: string): Language {
  return (SUPPORTED_LANGUAGES.find(l => l.code === code)?.code || 'en') as Language
}

