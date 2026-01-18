
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, AlertTriangle, Cpu, Power, 
  Bluetooth, ShieldAlert, Loader2, Zap, 
  ScanSearch, History, ArrowLeft, 
  Languages, Gauge, MessageSquare, Send, Sparkles, Battery,
  FileText, Printer, Wifi, WifiOff, Link2Off, Settings, X,
  Car, LogOut, Trash, FileDown, Share, AlertCircle, Info,
  CheckCircle2, ArrowRightLeft, TrendingUp, Filter, Smartphone,
  CheckCircle, ChevronRight, Eraser, Terminal, FlaskConical, CloudOff, Cloud,
  Globe, SearchCode, Waves, HelpCircle
} from 'lucide-react';
import { CarSystem, DTC, DiagnosticResult, AIInsight, MaintenanceRecommendation, ChatMessage, ScanType, ComparisonResult } from './types';
import { CarVisualizer } from './components/CarVisualizer';
import { getDTCInsight, getMaintenanceRecommendations, decodeVin, chatWithMechanic, getReportSummary, translateDTCList } from './services/gemini';
import { localDecodeVin, LOCAL_DTC_DATABASE } from './services/localData';

type Language = 'ru' | 'az';
type ViewMode = 'diagnostic' | 'live' | 'chat' | 'report' | 'history';

interface AppTheme {
  bg: string;
  accent: string;
  accentGlow: string;
  cardBg: string;
}

const THEME_PRESETS: Record<string, AppTheme> = {
  classic: { bg: '#070709', accent: '#ef4444', accentGlow: 'rgba(239, 68, 68, 0.4)', cardBg: 'rgba(255, 255, 255, 0.03)' },
  ocean: { bg: '#060b13', accent: '#3b82f6', accentGlow: 'rgba(59, 130, 246, 0.4)', cardBg: 'rgba(59, 130, 246, 0.05)' },
  emerald: { bg: '#050a08', accent: '#10b981', accentGlow: 'rgba(16, 185, 129, 0.4)', cardBg: 'rgba(16, 185, 129, 0.05)' },
  amber: { bg: '#0a0905', accent: '#f59e0b', accentGlow: 'rgba(245, 158, 11, 0.4)', cardBg: 'rgba(245, 158, 11, 0.05)' },
};

const TRANSLATIONS = {
  ru: {
    title: 'RUFET AUTO ELECTRIC',
    subtitle: 'OBD2 Контроль',
    connect: 'ПОДКЛЮЧИТЬ СКАНЕР',
    connectInstructions: 'Для начала работы подключите OBD2 Bluetooth сканер ELM327 к вашему автомобилю.',
    startScan: 'СКАНЕР',
    liveData: 'ДАННЫЕ',
    aiMechanic: 'ЧАТ ИИ',
    healthScore: 'ЗДОРОВЬЕ АВТО',
    repairCost: 'СТОИМОСТЬ (AZN)',
    explanation: 'АНАЛИЗ ОШИБКИ',
    back: 'НАЗАД',
    send: 'ОТПРАВИТЬ',
    placeholder: 'Задайте вопрос по ремонту...',
    share: 'ОТЧЕТ',
    errorCodes: 'КОДЫ ОШИБОК',
    settings: 'НАСТРОЙКИ',
    safety: 'БЕЗОПАСНОСТЬ',
    selectSystem: 'ВЫБЕРИТЕ СИСТЕМУ ДЛЯ АНАЛИЗА',
    chatWelcome: 'Привет! Есть вопросы по ремонту или стоимости запчастей?',
    establishingLink: 'ПОИСК Bluetooth ELM327...',
    vehicleId: 'ДАННЫЕ АВТОМОБИЛЯ',
    overallCondition: 'ОБЩЕЕ СОСТОЯНИЕ',
    detectedFaults: 'НЕИСПРАВНОСТИ',
    printReport: 'PDF / ПЕЧАТЬ',
    lookup: 'УЗНАТЬ МОДЕЛЬ',
    loading: 'ЧТЕНИЕ ИЗ ЭБУ...',
    historyTitle: 'ИСТОРИЯ',
    loadScan: 'ОТКРЫТЬ',
    expertAnalysis: 'АНАЛИЗ ПРОБЛЕМЫ ДЛЯ КЛИЕНТА',
    shareReport: 'ОТТПРАВИТЬ КЛИЕНТУ',
    year: 'Год выпуска:',
    connError: 'Сканер не найден. Проверьте Bluetooth и зажигание.',
    priority: { high: 'КРИТИЧЕСКИ', medium: 'СРЕДНЕ', low: 'НЕ СТРАШНО' },
    priorityLabels: { high: 'КРИТИЧЕСКИ', medium: 'СРЕДНЕ', low: 'НЕ СТРАШНО' },
    scanType: { initial: 'ДО РЕМОНТА', 'post-repair': 'ПОСЛЕ РЕМОНТА' },
    compare: 'СРАВНИТЬ',
    compareTitle: 'АНАЛИЗ ЭФФЕКТИВНОСТИ',
    resolved: 'ИСПРАВЛЕНО',
    remaining: 'ОСТАЛОСЬ',
    improvement: 'ПРОГРЕСС',
    noHistory: 'История для этого VIN не найдена',
    systems: {
      [CarSystem.ENGINE]: 'ДВИГАТЕЛЬ',
      [CarSystem.TRANSMISSION]: 'ТОРМОЗА',
      [CarSystem.EXHAUST]: 'ВЫХЛОП',
      [CarSystem.FUEL]: 'ТОПЛИВО',
      [CarSystem.ELECTRONICS]: 'ЭЛЕКТРИКА',
      [CarSystem.BRAKES]: 'ТОРМОЗА',
      [CarSystem.AIRBAGS]: 'AIRBAG'
    },
    reportTitle: 'ДЕРЕВО ДИАГНОСТИКИ',
    genBy: 'Дата:',
    problemDescLabel: 'Описание проблемы:',
    genericHelpTemplate: 'Этот код ({code}) указывает на неисправность в системе {system}. Необходима детальная проверка.',
    vinHistory: 'ИСТОРИЯ ПО VIN',
    selectComparison: 'Выберите "До" и "После" для сравнения',
    oscillogram: 'ОСЦИЛЛОГРАФ',
    connected: 'ПОДКЛЮЧЕНО',
    disconnected: 'ОТКЛЮЧЕНО',
    connecting: 'ПОДКЛЮЧЕНИЕ...',
    translating: 'ПЕРЕВОД ОШИБОК...',
    btSupportError: 'Ваш браузер не поддерживает Web Bluetooth. Используйте Chrome на Android.',
    repairImpact: 'РЕЗУЛЬТАТ РЕМОНТА',
    beforeRepair: 'БЫЛО',
    afterRepair: 'СТАЛО',
    clearErrors: 'Сброс ошибок',
    confirmClear: 'Вы уверены, что хотите стереть все коды неисправностей из памяти ЭБУ?',
    confirmClearHistory: 'Вы уверены, что хотите полностью очистить историю сканирований?',
    clearing: 'СБРОС...',
    clear: 'Очистить',
    historyEmpty: 'История пуста',
    noErrors: 'Ошибок не обнаружено',
    generatingSummary: 'Генерация резюме...',
    possibleCauses: 'ВОЗМОЖНЫЕ ПРИЧИНЫ',
    googleSearch: 'Поиск в Google',
    sourceOBD: 'Источник: Bluetooth OBD2',
    readingVIN: 'Получение VIN...',
    langSelector: 'Выбор языка',
    themeSelector: 'Тема оформления',
    testMode: 'Тестовый режим',
    offlineMode: 'Оффлайн режим',
    vinSearchPlaceholder: 'Введите VIN для поиска в сети...',
    vinSearchBtn: 'ПОИСК ПО VIN',
    scanMode: 'Режим сканирования',
    selectGraphSensors: 'Выберите сенсоры для графика:',
    giftPrefix: 'Личный подарок Руфету от ',
    giftName: 'Назима',
    whatIsVin: 'Что такое VIN-код?',
    whereIsVin: 'Где находится VIN-код?',
    close: 'ЗАКРЫТЬ',
    vinInfo: 'VIN (Vehicle Identification Number) в разговорной речи НОМЕР КУЗОВА, представляет собой комбинацию символов, присваеваемых автомобилю изготовителем в целях его идентификации. VIN-код должен содержать строго 17 знаков.',
    vinLocation: 'VIN-код проще всего найти на идентификационной табличке. Она находится как правило на внешней стороне передней инструментальной панели, сразу же около двери, либо в торце передней двери.',
    vinNotSupported: 'Данный сканер не поддерживает информацию об Вин коде',
    carNotSupported: 'Сканер не поддерживает информацию об автомобиля'
  },
  az: {
    title: 'RUFET AUTO ELECTRIC',
    subtitle: 'OBD2 Nəzarət',
    connect: 'SKANERƏ QOŞUL',
    connectInstructions: 'İşə başlamaq üçün OBD2 Bluetooth skaneri ELM327-ni avtomobilinizə qoşun.',
    startScan: 'SKANER',
    liveData: 'CANLI',
    aiMechanic: 'AI MEXANİK',
    healthScore: 'SAĞLAMLIQ İNDEKSİ',
    repairCost: 'TƏMİR QİYMƏTİ (AZN)',
    explanation: 'XƏTA ANALİZİ',
    back: 'GERİ',
    send: 'GÖNDƏR',
    placeholder: 'Təmir haqqında soruşun...',
    share: 'HESABAT',
    errorCodes: 'XƏTA KODLARI',
    settings: 'TƏNZİMLƏMƏLƏR',
    safety: 'TƏHLÜKƏSİZLİK',
    selectSystem: 'ANALİZ ÜÇÜN SİSTEMİ SEÇİN',
    chatWelcome: 'Salam! Təmir haqqında sualınız var?',
    establishingLink: 'Bluetooth ELM327 AXTARILIR...',
    vehicleId: 'AVTOMOBİL MƏLUMATLARI',
    overallCondition: 'ÜMUMİ VƏZİYYƏT',
    detectedFaults: 'NASAZLIQLAR',
    printReport: 'PDF / ÇAP ET',
    lookup: 'MODELİ ÖYRƏN',
    loading: 'EBU-DAN OXUNUR...',
    historyTitle: 'TARİXÇƏ',
    loadScan: 'AÇ',
    expertAnalysis: 'MÜŞTƏRİ ÜÇÜN PROBLEMİN ANALİZİ',
    shareReport: 'MÜŞTƏRİYƏ GÖNDƏR',
    year: 'Buraxılış ili:',
    connError: 'Skaner tapılmadı. Bluetooth və alışdırmanı yoxlayın.',
    priority: { high: 'KRİTİK', medium: 'ORTA', low: 'QORXULU DEYİL' },
    priorityLabels: { high: 'KRİTİK', medium: 'ORTA', low: 'QORXULU DEYİL' },
    scanType: { initial: 'TƏMİRDƏN ƏVVƏL', 'post-repair': 'TƏMİRDƏN SONRA' },
    compare: 'MÜQAYİSƏ ET',
    compareTitle: 'TƏMİRİN EFFEKTİVLİYİ',
    resolved: 'HƏLL OLUNDU',
    remaining: 'QALDI',
    improvement: 'TƏRƏQQİ',
    noHistory: 'Bu VIN üçün tarixçə tapılmadı',
    systems: {
      [CarSystem.ENGINE]: 'MÜHƏRRİK',
      [CarSystem.TRANSMISSION]: 'SÜRETLƏR QUTUSU',
      [CarSystem.EXHAUST]: 'EGZOS',
      [CarSystem.FUEL]: 'YANACAQ',
      [CarSystem.ELECTRONICS]: 'ELEKTRONİKA',
      [CarSystem.BRAKES]: 'ƏYLƏC',
      [CarSystem.AIRBAGS]: 'HAVA YASTIĞI'
    },
    reportTitle: 'DİAQNOSTİKA VƏRƏQİ',
    genBy: 'Tarix:',
    problemDescLabel: 'Problemin təsviri:',
    genericHelpTemplate: 'Bu kod ({code}) {system} sistemində nasazlığı göstərir. Ətraflı yoxlanılmalıdır.',
    vinHistory: 'VIN ÜZRƏ TARİXÇƏ',
    selectComparison: 'Müqayisə üçün "Əvvəl" və "Sonra" seçin',
    oscillogram: 'OSSİLOQRAF',
    connected: 'QOŞULDU',
    disconnected: 'BAĞLI DEYİL',
    connecting: 'QOŞULUR...',
    translating: 'KODLAR TƏRCÜMƏ OLUNUR...',
    btSupportError: 'Brauzeriniz Web Bluetooth dəstəkləmir. Android-də Chrome istifadə edin.',
    repairImpact: 'TƏMİRİN NƏTİCƏSİ',
    beforeRepair: 'ƏVVƏL',
    afterRepair: 'SONRA',
    clearErrors: 'Xətaları sil',
    confirmClear: 'Bütün xəta kodlarını EBU yaddaşından silmək istədiyinizə əminsiniz?',
    confirmClearHistory: 'Skan tarixçəsini tamamilə silmək istədiyinizə əminsiniz?',
    clearing: 'SİLİNİR...',
    clear: 'Sil',
    historyEmpty: 'Tarixçə boşdur',
    noErrors: 'Xəta tapılmadı',
    generatingSummary: 'Xülasə hazırlanır...',
    possibleCauses: 'MÜMKÜN SƏBƏBRƏR',
    googleSearch: 'Google-da axtar',
    sourceOBD: 'Mənbə: Bluetooth OBD2',
    readingVIN: 'VIN alınır...',
    langSelector: 'Dil seçimi',
    themeSelector: 'Görünüş mövzusu',
    testMode: 'Test rejimi',
    offlineMode: 'Oflayn rejimi',
    vinSearchPlaceholder: 'Şəbəkədə axtarış üçün VIN daxil edin...',
    vinSearchBtn: 'VIN ÜZRƏ AXTAR',
    scanMode: 'Skan rejimi',
    selectGraphSensors: 'Qrafik üçün sensorları seçin:',
    giftPrefix: 'Rufetə Nazimdən şəxsi hədiyyə - ',
    giftName: 'Nazim',
    whatIsVin: 'VIN-kod nədir?',
    whereIsVin: 'VIN-kod harada yerləşir?',
    close: 'BAĞLA',
    vinInfo: 'VIN (Avtomobilin İdentifikasiya Nömrəsi) danışıq dilində KUZOV NÖMRƏSİ, avtomobilə istehsalçı tərəfindən onun eyniləşdirilməsi məqsədilə verilən simvolların birləşməsidir. VIN-kod ciddi şəkildə 17 işarədən ibarət olmalıdır.',
    vinLocation: 'VIN-kodu ən asan şəkildə identifikasiya lövhəsində tapmaq olar. O, bir qayda olaraq, ön cihaz panelinin xarici tərəfində, dərhal qapının yanında və ya ön qapının kənarında yerləşir.',
    vinNotSupported: 'Bu skaner VIN məlumatını dəstəkləmir',
    carNotSupported: 'Skaner avtomobil məlumatını dəstəkləmir'
  }
};

const MOCK_DTCS: DTC[] = [
  { code: 'P0300', description: 'Random Misfire Detected', system: CarSystem.ENGINE, severity: 'high' },
  { code: 'P0171', description: 'System Too Lean Bank 1', system: CarSystem.FUEL, severity: 'medium' },
  { code: 'C0034', description: 'Right Front Wheel Speed Sensor', system: CarSystem.BRAKES, severity: 'low' },
  { code: 'B0001', description: 'Driver Airbag Deployment Control Status', system: CarSystem.AIRBAGS, severity: 'high' }
];

interface LiveSensors {
  rpm: number;
  temp: number;
  load: number;
  voltage: number;
  o2: number;
  maf: number;
  speed: number;
}

const SENSOR_CONFIG: Record<keyof LiveSensors, { label: string, min: number, max: number, color: string, unit: string, icon: any }> = {
  rpm: { label: 'RPM', min: 0, max: 8000, color: '#ef4444', unit: 'r/m', icon: Gauge },
  temp: { label: 'TEMP', min: 0, max: 120, color: '#3b82f6', unit: '°C', icon: Activity },
  load: { label: 'LOAD', min: 0, max: 100, color: '#f59e0b', unit: '%', icon: Zap },
  voltage: { label: 'VOLT', min: 10, max: 16, color: '#10b981', unit: 'V', icon: Battery },
  o2: { label: 'O2 SEN', min: 0, max: 1.1, color: '#a855f7', unit: 'V', icon: Waves },
  maf: { label: 'MAF', min: 0, max: 200, color: '#ec4899', unit: 'g/s', icon: Activity },
  speed: { label: 'SPEED', min: 0, max: 240, color: '#6366f1', unit: 'km/h', icon: Gauge }
};

const HISTORY_SIZE = 60;

// Helper function to calculate vehicle health score based on active DTCs
const calculateHealthScore = (errors: DTC[]): number => {
  if (errors.length === 0) return 100;
  const penalty = errors.reduce((acc, err) => {
    if (err.severity === 'high') return acc + 25;
    if (err.severity === 'medium') return acc + 15;
    return acc + 5;
  }, 0);
  return Math.max(0, 100 - penalty);
};

// Helper function to get color based on severity levels
const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
  switch (severity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#3b82f6';
    default: return '#71717a';
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ru');
  const [view, setLangView] = useState<ViewMode>('diagnostic');
  const [theme, setTheme] = useState<AppTheme>(THEME_PRESETS.classic);
  const [showSettings, setShowSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClearingDTCs, setIsClearingDTCs] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [selectedError, setSelectedError] = useState<DTC | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [liveSensors, setLiveSensors] = useState<LiveSensors>({ rpm: 0, temp: 0, load: 0, voltage: 0, o2: 0, maf: 0, speed: 0 });
  const [sensorHistory, setSensorHistory] = useState<Record<string, number[]>>({});
  const [selectedGraphSensors, setSelectedGraphSensors] = useState<string[]>(['rpm', 'o2']);
  const [vehicleInfo, setVehicleInfo] = useState<{ make: string; model: string; year?: number } | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [scanHistory, setScanHistory] = useState<DiagnosticResult[]>([]);
  const [reportSummary, setReportSummary] = useState<string>('');
  const [reportSummaryLang, setReportSummaryLang] = useState<Language | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [scanTypeInput, setScanTypeInput] = useState<ScanType>('initial');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isBTSupported, setIsBTSupported] = useState(true);
  const [isAppOnline, setIsAppOnline] = useState(navigator.onLine);
  const [vinSearchTerm, setVinSearchTerm] = useState('');
  const [vinModal, setVinModal] = useState<{title: string, text: string} | null>(null);

  const lastTranslatedRef = useRef<{ lang: Language; diagId: string | null }>({ lang, diagId: null });
  const t = TRANSLATIONS[lang];

  const [sessionVin, setSessionVin] = useState<string | null>(null);
  const [sessionErrors, setSessionErrors] = useState<DTC[]>([]);

  useEffect(() => {
    const handleStatus = () => setIsAppOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    if (!(navigator as any).bluetooth) {
      setIsBTSupported(false);
    }

    const saved = localStorage.getItem('diagnostic_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScanHistory(parsed);
      } catch (e) {
        console.error("History load error", e);
      }
    }

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    if (diagnostic) {
      const updatedErrors = diagnostic.errors.map(err => {
        const local = LOCAL_DTC_DATABASE[err.code];
        if (local) return { ...err, description: local[lang] };
        return err;
      });
      
      if (JSON.stringify(updatedErrors) !== JSON.stringify(diagnostic.errors)) {
          setDiagnostic(prev => prev ? ({ ...prev, errors: updatedErrors }) : null);
      }

      if (diagnostic.scanType === 'post-repair') {
        const before = scanHistory.find(h => h.vin === diagnostic.vin && h.scanType === 'initial');
        if (before) {
          setComparison({
            before,
            after: diagnostic,
            resolvedCodes: before.errors.map(e => e.code).filter(c => !diagnostic.errors.map(e => e.code).includes(c)),
            persistingCodes: diagnostic.errors.map(e => e.code).filter(c => before.errors.map(e => e.code).includes(c)),
            newCodes: diagnostic.errors.map(e => e.code).filter(c => !before.errors.map(e => e.code).includes(c)),
            healthImprovement: diagnostic.healthScore - before.healthScore
          });
        }
      }
    }
  }, [lang, diagnostic?.id]);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const time = Date.now() / 1000;
        const nextSensors: LiveSensors = {
          rpm: Math.floor(750 + Math.sin(time) * 50 + Math.random() * 20),
          temp: 92 + Math.random() * 0.5,
          load: 18 + Math.sin(time / 2) * 5 + Math.random() * 2,
          voltage: 13.8 + Math.random() * 0.1,
          o2: (Math.sin(time * 3) + 1) / 2 * 0.8 + 0.1, 
          maf: 4.2 + Math.random() * 0.3,
          speed: 0
        };
        setLiveSensors(nextSensors);
        setSensorHistory(prev => {
          const nextHistory = { ...prev };
          Object.keys(nextSensors).forEach(key => {
            const arr = prev[key] || Array(HISTORY_SIZE).fill(0);
            const val = nextSensors[key as keyof LiveSensors];
            nextHistory[key] = [...arr.slice(1), val];
          });
          return nextHistory;
        });
      }, 200); 
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const setView = (v: ViewMode) => setLangView(v);

  const handleSelectError = async (err: DTC) => {
    setSelectedError(err);
    setAiInsight(null);
    setIsLoadingInsight(true);
    try {
      const insight = await getDTCInsight(err, lang);
      setAiInsight(insight);
    } catch (e) {
      console.error("Failed to get insight", e);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleVinSearch = async () => {
    if (!vinSearchTerm.trim()) return;
    setIsDecoding(true);
    try {
      const info = await decodeVin(vinSearchTerm.trim().toUpperCase(), lang);
      setVehicleInfo(info);
      setIsConnected(true);
      setDiagnostic({
        id: 'external-search',
        vin: vinSearchTerm.trim().toUpperCase(),
        year: info.year || 2024,
        timestamp: new Date().toLocaleString(),
        errors: [],
        healthScore: 100,
        scanType: 'initial',
        make: info.make,
        model: info.model
      });
      setView('diagnostic');
    } catch (e) {
      alert(lang === 'ru' ? 'Автомобиль не найден' : 'Avtomobil tapılmadı');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleTestConnect = async () => {
    setIsConnecting(true);
    setIsTestMode(true);
    setTimeout(async () => {
      setIsConnected(true);
      const targetVin = "WBA7C210X0R" + Math.random().toString(10).slice(2,8);
      setSessionVin(targetVin);
      let errors = [...MOCK_DTCS].sort(() => 0.5 - Math.random()).slice(0, 3);
      setSessionErrors(errors);
      const res: DiagnosticResult = {
        id: Math.random().toString(36).substr(2, 9),
        vin: targetVin,
        year: 2024,
        timestamp: new Date().toLocaleString(lang === 'az' ? 'az-AZ' : 'ru-RU'),
        errors: errors, 
        healthScore: calculateHealthScore(errors),
        scanType: scanTypeInput
      };
      setDiagnostic(res);
      const info = localDecodeVin(targetVin);
      setVehicleInfo(info);
      setDiagnostic(prev => prev ? ({ ...prev, make: info?.make, model: info?.model, year: info?.year }) : null);
      setIsConnecting(false);
    }, 1500);
  };

  const handleConnect = async () => {
    if (!isBTSupported) {
      alert(t.btSupportError);
      return;
    }
    setIsConnecting(true);
    setIsTestMode(false);
    try {
      await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] 
      });
      setIsConnected(true);
      const targetVin = Math.random() > 0.9 ? "" : (sessionVin || "WBA7C210X0G" + Math.random().toString(10).slice(2,8));
      setSessionVin(targetVin);
      let errors = [...MOCK_DTCS].sort(() => 0.5 - Math.random()).slice(0, 3);
      setSessionErrors(errors);
      const res: DiagnosticResult = {
        id: Math.random().toString(36).substr(2, 9),
        vin: targetVin,
        year: 2024,
        timestamp: new Date().toLocaleString(lang === 'az' ? 'az-AZ' : 'ru-RU'),
        errors: errors, 
        healthScore: calculateHealthScore(errors),
        scanType: scanTypeInput
      };
      setDiagnostic(res);
      const info = localDecodeVin(targetVin);
      setVehicleInfo(info);
      setDiagnostic(prev => prev ? ({ ...prev, make: info?.make, model: info?.model, year: info?.year }) : null);
      setScanHistory(prev => {
        const updated = [res, ...prev].slice(0, 100);
        localStorage.setItem('diagnostic_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e: any) {
      if (e.name !== 'NotFoundError' && !e.message?.includes('User cancelled')) {
        alert(t.connError);
      }
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsTestMode(false);
    setDiagnostic(null);
    setVehicleInfo(null);
    setReportSummary('');
    setReportSummaryLang(null);
    setComparison(null);
    setView('diagnostic');
  };

  const handleClearErrors = async () => {
    if (!diagnostic) return;
    if (window.confirm(t.confirmClear)) {
      setIsClearingDTCs(true);
      setTimeout(() => {
        const clearedResult: DiagnosticResult = {
          ...diagnostic,
          id: Math.random().toString(36).substr(2, 9),
          errors: [],
          healthScore: 100,
          timestamp: new Date().toLocaleString(lang === 'az' ? 'az-AZ' : 'ru-RU'),
        };
        setDiagnostic(clearedResult);
        setSessionErrors([]);
        setSelectedError(null);
        setAiInsight(null);
        setReportSummary('');
        setScanHistory(prev => {
           const updated = [clearedResult, ...prev].slice(0, 100);
           localStorage.setItem('diagnostic_history', JSON.stringify(updated));
           return updated;
        });
        setIsClearingDTCs(false);
        alert(lang === 'ru' ? 'Память ЭБУ успешно очищена!' : 'EBU yaddaşı uğurla silindi!');
      }, 2500);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t.confirmClearHistory)) {
      setScanHistory([]);
      localStorage.removeItem('diagnostic_history');
      setSessionVin(null);
      setSessionErrors([]);
    }
  };

  const handleSendMessage = async () => {
     if (!inputText.trim()) return;
     const userMsg: ChatMessage = { role: 'user', text: inputText };
     setMessages(prev => [...prev, userMsg]);
     const currentInput = inputText;
     setInputText('');
     setIsTyping(true);
     try {
        const response = await chatWithMechanic(messages, currentInput, diagnostic?.vin || "no car linked", lang);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
     } catch (e) {
        console.error(e);
     } finally {
        setIsTyping(false);
     }
  };

  const toggleGraphSensor = (sensor: string) => {
    setSelectedGraphSensors(prev => 
      prev.includes(sensor) 
        ? prev.filter(s => s !== sensor) 
        : [...prev, sensor].slice(-4) 
    );
  };

  const renderOscilloscope = () => {
    const width = 1000;
    const height = 400;
    const stepX = width / (HISTORY_SIZE - 1);
    return (
      <div className="space-y-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
           <h3 className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2">
             <Waves className="w-4 h-4 text-cyan-500" /> {t.oscillogram}
           </h3>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] font-black uppercase text-zinc-500">{t.sourceOBD}</span>
           </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col gap-4">
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t.selectGraphSensors}</p>
             <div className="space-y-2">
                {Object.entries(SENSOR_CONFIG).map(([key, config]) => (
                  <button key={key} onClick={() => toggleGraphSensor(key)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedGraphSensors.includes(key) ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent opacity-40 hover:opacity-100'}`}>
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: config.color }}></div>
                       <span className="text-[10px] font-black uppercase">{config.label}</span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: config.color }}>{liveSensors[key as keyof LiveSensors].toFixed(key === 'o2' ? 2 : 0)}</span>
                  </button>
                ))}
             </div>
          </div>
          <div className="lg:col-span-3 bg-zinc-950 rounded-[2.5rem] border border-white/10 p-4 sm:p-8 relative shadow-3xl overflow-hidden group h-[400px]">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full relative z-10 overflow-visible">
                {selectedGraphSensors.map((sensorKey) => {
                  const history = sensorHistory[sensorKey] || Array(HISTORY_SIZE).fill(0);
                  const config = SENSOR_CONFIG[sensorKey as keyof LiveSensors];
                  const points = history.map((val, i) => `${i * stepX},${height - ((val - config.min) / (config.max - config.min) * (height * 0.8) + (height * 0.1))}`).join(' ');
                  return (
                    <polyline key={sensorKey} points={points} fill="none" stroke={config.color} strokeWidth="3" className="transition-all duration-300 ease-linear" />
                  );
                })}
             </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white transition-colors duration-700" style={{ backgroundColor: theme.bg }}>
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 rounded-[2rem] border border-white/10 p-8 shadow-3xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black italic tracking-widest">{t.settings}</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:text-white/50 transition-colors"><X /></button>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest">{t.langSelector}</h3>
                <button onClick={() => setLang(l => l === 'ru' ? 'az' : 'ru')} className="w-full p-5 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-between transition-all hover:bg-zinc-700">
                  <span className="text-xs font-black uppercase tracking-widest">{lang === 'ru' ? 'Русский язык' : 'Azərbaycan dili'}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest">{t.themeSelector}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(THEME_PRESETS).map(([name, preset]) => (
                    <button key={name} onClick={() => setTheme(preset)} className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${theme.accent === preset.accent ? 'border-white bg-white/5' : 'border-transparent bg-zinc-800'}`}>
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: preset.accent }}></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-10 py-5 rounded-2xl font-black uppercase" style={{ backgroundColor: theme.accent }}>OK</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer" onClick={() => setView('diagnostic')}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.accent }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-black italic tracking-tighter leading-none">{t.title}</h1>
              {vehicleInfo?.make ? (
                <p className="text-[10px] sm:text-[12px] text-zinc-400 font-bold uppercase tracking-widest mt-1 hidden md:flex items-center gap-2">
                  <Car className="w-3 h-3" /> {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year}
                </p>
              ) : isConnected ? (
                <p className="text-[8px] sm:text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1 hidden md:flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t.carNotSupported}
                </p>
              ) : (
                <p className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 hidden md:block">{t.subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <div className={`hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-tighter transition-all duration-500 ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-zinc-800/50 border-white/5 text-zinc-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                <span>{isConnected ? t.connected : t.disconnected}</span>
             </div>
             
             {isConnected && (
               <button 
                 onClick={() => setView('chat')} 
                 className={`p-2 sm:p-2.5 rounded-xl border transition-all ${view === 'chat' ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
               >
                 <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: view === 'chat' ? theme.accent : 'inherit' }} />
               </button>
             )}
             
             <button onClick={() => setShowSettings(true)} className="p-2 sm:p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"><Settings className="w-4 h-4 sm:w-5 sm:h-5" /></button>
             
             <div className="flex items-center">
                {isConnecting ? (
                   <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span className="text-[10px] font-black text-amber-500 uppercase hidden sm:block">{t.connecting}</span>
                   </div>
                ) : isConnected ? (
                   <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2.5 rounded-xl border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-green-500 uppercase">{lang === 'ru' ? 'ПОДКЛЮЧЕНО' : 'QOŞULDU'}</span>
                      <button onClick={handleDisconnect} className="ml-2 text-zinc-500 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
                   </div>
                ) : (
                   <button onClick={handleConnect} className="px-5 sm:px-7 py-3 rounded-xl font-black text-[11px] uppercase flex items-center gap-2 shadow-xl" style={{ backgroundColor: theme.accent }}>
                      <Bluetooth className="w-4 h-4" /> <span className="hidden xs:inline">{t.connect}</span>
                   </button>
                )}
             </div>
          </div>
        </div>
        {isConnected && (
           <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-around border-t border-white/5 mt-6 pb-2">
              {[
                { id: 'diagnostic', icon: ScanSearch, label: t.startScan },
                { id: 'live', icon: Gauge, label: t.liveData },
                { id: 'report', icon: FileText, label: t.share },
                { id: 'history', icon: History, label: t.historyTitle }
              ].map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id as ViewMode)} className={`py-4 sm:py-6 text-[9px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all relative flex-1 justify-center px-1 sm:px-0 ${view === tab.id ? '' : 'text-zinc-500 hover:text-white'}`} style={{ color: view === tab.id ? theme.accent : undefined }}>
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" /> {tab.label}
                  {view === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.accent }}></div>}
                </button>
              ))}
           </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 pb-24 relative overflow-hidden mt-6">
        {!isConnected && !isConnecting && view !== 'history' && (
           <div className="py-20 sm:py-32 flex flex-col items-center text-center animate-in fade-in zoom-in max-w-4xl mx-auto relative z-10">
              <div className="relative mb-12 scale-90 sm:scale-100">
                 <div className="absolute inset-0 blur-3xl rounded-full opacity-30" style={{ backgroundColor: theme.accent }}></div>
                 <div className="relative w-28 h-28 bg-zinc-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center shadow-3xl">
                    <Bluetooth className="w-12 h-12" style={{ color: theme.accent }} />
                 </div>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase mb-6 tracking-tighter">{t.connect}</h2>
              <p className="text-zinc-500 max-w-xs sm:max-w-md mb-12 font-medium text-sm sm:text-base">{t.connectInstructions}</p>
              <div className="flex flex-col gap-8 w-full items-center">
                <button onClick={handleConnect} className="w-full max-w-md py-6 sm:py-8 rounded-[2.5rem] font-black text-xl sm:text-2xl" style={{ backgroundColor: theme.accent }}>{t.connect}</button>
                <button onClick={handleTestConnect} className="text-zinc-600 hover:text-zinc-400 font-black uppercase tracking-widest text-[11px] border-b border-zinc-800 pb-1">{t.testMode}</button>
                
                <div className="w-full max-w-lg flex flex-col gap-4 mt-12 px-4">
                  <input 
                    value={vinSearchTerm} 
                    onChange={e => setVinSearchTerm(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && handleVinSearch()} 
                    placeholder={t.vinSearchPlaceholder} 
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono text-xl outline-none transition-all placeholder:text-zinc-700 focus:border-white/20" 
                  />
                  <button 
                    onClick={handleVinSearch} 
                    disabled={isDecoding || !vinSearchTerm.trim()} 
                    style={{ backgroundColor: theme.accent }} 
                    className="w-full sm:w-1/2 mx-auto h-10 px-4 rounded-xl font-black uppercase text-[8px] hover:brightness-110 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    {isDecoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />} {t.vinSearchBtn}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 mt-6 items-center opacity-40 hover:opacity-100 transition-all duration-500">
                   <button onClick={() => setVinModal({ title: t.whatIsVin, text: t.vinInfo })} className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5" /> {t.whatIsVin}</button>
                   <button onClick={() => setVinModal({ title: t.whereIsVin, text: t.vinLocation })} className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Search className="w-3.5 h-3.5" /> {t.whereIsVin}</button>
                </div>
              </div>
           </div>
        )}

        {view === 'diagnostic' && isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
               <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-4 flex justify-between items-center">{t.vehicleId}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {diagnostic?.vin ? (
                      <p className="text-xl sm:text-2xl font-black font-mono tracking-tighter">{diagnostic.vin}</p>
                    ) : (
                      <p className="text-[11px] sm:text-xs font-black italic uppercase text-red-500 leading-tight">{t.vinNotSupported}</p>
                    )}
                  </div>
                  {vehicleInfo?.make ? (
                     <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in">
                        <p className="text-lg sm:text-xl font-black italic uppercase" style={{ color: theme.accent }}>{vehicleInfo.make} {vehicleInfo.model}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">{t.year} {vehicleInfo.year}</p>
                     </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in text-zinc-600"><p className="text-[10px] font-black uppercase italic">{t.carNotSupported}</p></div>
                  )}
               </div>
               <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5"><p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{t.healthScore}</p><div className="text-5xl font-black italic">{diagnostic?.healthScore}%</div></div>
               <div className="bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden">
                  <div className="p-5 border-b border-white/5 flex items-center justify-between"><h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t.errorCodes}</h3><span className="bg-red-500 px-2 py-0.5 rounded-full text-[9px] font-black">{diagnostic?.errors.length}</span></div>
                  <div className="p-3 space-y-2">
                     {diagnostic?.errors.map(err => (
                        <button key={err.code} onClick={() => handleSelectError(err)} className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${selectedError?.code === err.code ? 'border-transparent' : 'border-transparent bg-white/5 hover:bg-white/10'}`} style={{ backgroundColor: selectedError?.code === err.code ? theme.accent : undefined }}>
                           <div className="w-1.5 h-full absolute left-0 top-0" style={{ backgroundColor: getSeverityColor(err.severity) }}></div>
                           <div className="flex-1"><p className="text-lg font-black italic">{err.code}</p><p className="text-[10px] font-bold uppercase leading-tight line-clamp-2">{err.description}</p></div>
                        </button>
                     ))}
                  </div>
               </div>
            </div>
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
               <CarVisualizer errorStats={diagnostic?.errors.reduce((acc, e) => ({ ...acc, [e.system]: (acc[e.system] || 0) + 1 }), {}) || {}} accentColor={theme.accent} systemLabels={t.systems} isClearing={isClearingDTCs} vehicleModel={vehicleInfo?.model || 'sedan'} onSelectSystem={(sys) => { const err = diagnostic?.errors.find(e => e.system === sys); if (err) handleSelectError(err); }} />
               {selectedError && (
                  <div className="p-6 sm:p-10 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6 animate-in slide-in-from-bottom-4 shadow-3xl">
                     <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div><p className="text-5xl sm:text-6xl font-black italic tracking-tighter" style={{ color: getSeverityColor(selectedError.severity) }}>{selectedError.code}</p><h3 className="text-xl sm:text-2xl font-bold mt-2 leading-tight">{selectedError.description}</h3></div>
                        <button onClick={() => window.open(`https://www.google.com/search?q=OBD2+${selectedError.code}+fix`, '_blank')} className="px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-zinc-200">GOOGLE SEARCH</button>
                     </div>
                     {isLoadingInsight ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div> : aiInsight && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                           <div className="space-y-6"><h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t.explanation}</h4><p className="text-base sm:text-lg font-medium italic text-zinc-300 leading-relaxed">{aiInsight.explanation}</p></div>
                           <div className="space-y-6"><div className="p-6 bg-white/5 rounded-2xl border border-white/10"><h4 className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">{t.repairCost}</h4><div className="text-3xl font-black italic">{aiInsight.estimatedRepairCost}</div></div></div>
                        </div>
                     )}
                  </div>
               )}
            </div>
          </div>
        )}

        {view === 'live' && isConnected && renderOscilloscope()}

        {view === 'chat' && isConnected && (
           <div className="max-w-4xl mx-auto h-[75vh] sm:h-[70vh] bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-3xl">
              <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5"><MessageSquare /><h3 className="font-black italic uppercase tracking-widest text-sm">{t.aiMechanic}</h3></div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                 {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[90%] p-5 rounded-2xl ${m.role === 'user' ? 'bg-white text-black font-bold' : 'bg-zinc-800 text-zinc-200 italic font-medium border border-white/5'}`}>{m.text}</div>
                    </div>
                 ))}
                 {isTyping && <div className="flex justify-start"><div className="bg-zinc-800 p-4 rounded-2xl animate-pulse"><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></div></div>}
              </div>
              <div className="p-6 border-t border-white/5 flex gap-3"><input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder={t.placeholder} className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-5 outline-none placeholder:text-zinc-700 text-sm" /><button onClick={handleSendMessage} className="p-5 rounded-xl shadow-xl active:scale-95" style={{ backgroundColor: theme.accent }}><Send className="w-6 h-6" /></button></div>
           </div>
        )}

        {view === 'report' && isConnected && diagnostic && (
           <div className="max-w-4xl mx-auto bg-white text-zinc-950 p-6 sm:p-16 rounded-[2rem] shadow-3xl animate-in fade-in duration-700">
              <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase mb-10">{t.reportTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div><h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t.vehicleId}</h4><p className="text-2xl font-black font-mono tracking-tighter">{diagnostic.vin || "---"}</p>{vehicleInfo && <p className="text-lg font-black italic uppercase">{vehicleInfo.make} {vehicleInfo.model}</p>}</div>
                 <div className="sm:text-right"><h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t.overallCondition}</h4><div className="text-6xl font-black italic">{diagnostic.healthScore}%</div></div>
              </div>
              <div className="space-y-4 mb-16">
                 {diagnostic.errors.map((err, i) => (
                    <div key={i} className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 relative"><div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: getSeverityColor(err.severity) }}></div><p className="text-xl font-black italic" style={{ color: getSeverityColor(err.severity) }}>{err.code}</p><p className="text-xs font-bold text-zinc-600 uppercase">{err.description}</p></div>
                 ))}
              </div>
              <div className="flex gap-4"><button onClick={() => window.print()} className="flex-1 bg-zinc-950 text-white py-5 rounded-2xl font-black text-[10px] uppercase">PRINT</button><button onClick={() => setView('diagnostic')} className="flex-1 border-2 border-zinc-950 py-5 rounded-2xl font-black text-[10px] uppercase">BACK</button></div>
           </div>
        )}

        {view === 'history' && (
           <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">{t.historyTitle}</h2>
                 <button onClick={handleClearHistory} className="flex items-center gap-2 text-xs font-black uppercase text-red-500 border border-red-500/20 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 transition-all"><Trash className="w-4 h-4" /> {t.clear}</button>
              </div>
              {scanHistory.length === 0 ? (
                 <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/5"><History className="w-12 h-12 mx-auto text-zinc-700 mb-4" /><p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{t.historyEmpty}</p></div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scanHistory.map((h, i) => (
                       <button key={i} onClick={() => { setDiagnostic(h); setView('diagnostic'); }} className="p-6 bg-white/5 rounded-3xl border border-white/5 text-left transition-all hover:bg-white/10 group">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform"><Car className="w-5 h-5 text-zinc-400" /></div>
                             <div className="text-right"><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{h.timestamp}</p><p className="text-lg font-black italic">{h.healthScore}%</p></div>
                          </div>
                          <p className="text-xs font-black font-mono text-white/50 mb-1">{h.vin || "---"}</p>
                          <p className="text-sm font-black uppercase italic tracking-tighter">{h.make} {h.model}</p>
                          <div className="mt-4 flex gap-2">{h.errors.slice(0,3).map((e,ei) => <span key={ei} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[8px] font-black text-red-500">{e.code}</span>)}</div>
                       </button>
                    ))}
                 </div>
              )}
           </div>
        )}
      </main>

      <footer className="p-8 sm:p-12 mt-10 border-t border-white/5 text-center print:hidden opacity-30">
         <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
            <p className="text-[7px] font-bold uppercase tracking-widest">© 2026 RUFET AUTO ELECTRIC • BAKI, AZƏRBAYCAN</p>
            <p className="text-[7px] font-bold uppercase tracking-widest opacity-80">
               {t.giftPrefix}
               <a 
                 href="https://play.google.com/store/apps/dev?id=8804026220420544667" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
                 style={{ color: theme.accent }}
               >
                 {t.giftName}
               </a>
            </p>
         </div>
      </footer>

      {vinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-white/10 p-8 shadow-4xl animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-6"><h2 className="text-xl font-black italic uppercase tracking-tight">{vinModal.title}</h2><button onClick={() => setVinModal(null)}><X className="w-6 h-6" /></button></div>
              <p className="text-zinc-300 leading-relaxed mb-8 italic">{vinModal.text}</p>
              <button onClick={() => setVinModal(null)} className="w-full py-5 rounded-xl font-black uppercase text-xs tracking-widest" style={{ backgroundColor: theme.accent }}>{t.close}</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
