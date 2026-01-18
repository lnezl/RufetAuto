
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Power, Bluetooth, Loader2, Zap, 
  ScanSearch, History as HistoryIcon, Gauge, FileText, Settings, X, Car, 
  LogOut, ChevronRight, Play, Info, Thermometer, Zap as VoltIcon,
  Share2, Search, AlertOctagon, AlertTriangle, Trash2, RefreshCw,
  Wind, Activity, Gauge as GaugeIcon, Database, Calendar, Gift
} from 'lucide-react';
import { CarSystem, DTC, DiagnosticResult, AIInsight, LiveData } from './types';
import { CarVisualizer } from './components/CarVisualizer';
import { getDTCInsight, decodeVin } from './services/gemini';
import { LOCAL_DTC_DATABASE } from './services/localData';

type Language = 'ru' | 'az';
type ViewMode = 'diagnostic' | 'live' | 'report' | 'history';

const TRANSLATIONS = {
  ru: {
    title: 'RUFET AUTO ELECTRIC',
    connect: 'ПОДКЛЮЧИТЬ OBD2',
    demo: 'Запустить демо-режим',
    connecting: 'ПОДКЛЮЧЕНИЕ...',
    init: 'ИНИЦИАЛИЗАЦИЯ...',
    reading: 'ЧТЕНИЕ ДАННЫХ...',
    connected: 'ПОДКЛЮЧЕНО',
    disconnected: 'ОТКЛЮЧЕНО',
    startScan: 'СКАНЕР',
    liveData: 'ДАННЫЕ',
    report: 'ОТЧЕТ',
    history: 'ИСТОРИЯ',
    vehicleData: 'АВТОМОБИЛЬ',
    healthTitle: 'СОСТОЯНИЕ',
    errorCodes: 'КОДЫ ОШИБОК',
    unknownModel: 'Модель неизвестна',
    year: 'ГОД:',
    connectInstructions: 'Подключите Bluetooth OBD2 сканер для начала диагностики.',
    noErrors: 'Ошибок не обнаружено',
    searchOnline: 'Поиск в интернете',
    shareReport: 'Отправить отчет',
    critical: 'Критично',
    warning: 'Внимание',
    clearErrors: 'Сброс ошибок',
    clearing: 'Стирание...',
    refresh: 'Обновить',
    reScan: 'Повторная проверка',
    clearedSuccess: 'Ошибки стерты!',
    rpm: 'Обороты',
    speed: 'Скорость',
    temp: 'Темп. ОЖ',
    load: 'Нагрузка',
    volt: 'Вольтаж',
    intake: 'Воздух (Впуск)',
    throttle: 'Дроссель',
    maf: 'Расход воздуха',
    timing: 'Угол зажигания',
    stft: 'Краткоср. корр.',
    ltft: 'Долгоср. корр.',
    fuelStatus: 'Статус топл. сист.',
    reportHeader: 'ОТЧЕТ ДИАГНОСТИКИ',
    vehicle: 'Транспорт',
    date: 'Дата',
    monthlyTotal: 'Проверено за месяц',
    noHistory: 'История проверок пуста',
    deleteConfirm: 'Удалить запись?',
    footerText: 'Профессиональная диагностика.',
    gift: 'Подарок от Назима.',
    rights: 'Все права защищены',
    systems: {
      [CarSystem.ENGINE]: 'ДВИГАТЕЛЬ',
      [CarSystem.TRANSMISSION]: 'АКПП',
      [CarSystem.FUEL]: 'ТОПЛИВО',
      [CarSystem.BRAKES]: 'ТОРМОЗА',
      [CarSystem.AIRBAGS]: 'AIRBAG',
      [CarSystem.ELECTRONICS]: 'ЭЛЕКТРИКА',
      [CarSystem.EXHAUST]: 'ВЫХЛОП'
    }
  },
  az: {
    title: 'RUFET AUTO ELECTRIC',
    connect: 'OBD2 QOŞUL',
    demo: 'Demo rejimində başlat',
    connecting: 'BAĞLANIR...',
    init: 'İNASİALİZASİYA...',
    reading: 'MƏLUMAT OXUNUR...',
    connected: 'QOŞULDU',
    disconnected: 'AYRILDI',
    startScan: 'SKANER',
    liveData: 'CANLI',
    report: 'HESABAT',
    history: 'TARİXÇƏ',
    vehicleData: 'AVTOMOBİL',
    healthTitle: 'VƏZİYYƏT',
    errorCodes: 'XƏTA KODLARI',
    unknownModel: 'Model naməlumdur',
    year: 'İL:',
    connectInstructions: 'Diaqnostika üçün Bluetooth OBD2 skanerini qoşun.',
    noErrors: 'Xəta tapılmadı',
    searchOnline: 'İnternetdə axtar',
    shareReport: 'Hesabatı göndər',
    critical: 'Kritik',
    warning: 'Xəbərdarlıq',
    clearErrors: 'Xətaları sil',
    clearing: 'Silinir...',
    refresh: 'Yenilə',
    reScan: 'Yenidən yoxla',
    clearedSuccess: 'Xətalar silindi!',
    rpm: 'Dövrlər',
    speed: 'Sürət',
    temp: 'Soyutma m.',
    load: 'Yük',
    volt: 'Gərginlik',
    intake: 'Hava (Giriş)',
    throttle: 'Drossel',
    maf: 'Hava sərfi',
    timing: 'Alışdırma bucağı',
    stft: 'Qısa müd. kor.',
    ltft: 'Uzun müd. kor.',
    fuelStatus: 'Yanacaq sist. statusu',
    reportHeader: 'DİAQNOSTİKA HESABATI',
    vehicle: 'Avtomobil',
    date: 'Tarix',
    monthlyTotal: 'Bu ay yoxlanılıb',
    noHistory: 'Yoxlama tarixçəsi boşdur',
    deleteConfirm: 'Qeydi silmək?',
    footerText: 'Peşəkar diaqnostika.',
    gift: 'Nazimdən hədiyyə.',
    rights: 'Bütün hüquqlar qorunur',
    systems: {
      [CarSystem.ENGINE]: 'MÜHƏRRİK',
      [CarSystem.TRANSMISSION]: 'SÜRETLƏR QUTUSU',
      [CarSystem.FUEL]: 'YANACAQ',
      [CarSystem.BRAKES]: 'ƏYLƏC',
      [CarSystem.AIRBAGS]: 'HAVA YASTIĞI',
      [CarSystem.ELECTRONICS]: 'ELEKTRONİKA',
      [CarSystem.EXHAUST]: 'EGZOS'
    }
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ru');
  const [view, setView] = useState<ViewMode>('diagnostic');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [connectStep, setConnectStep] = useState<string>('');
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [selectedError, setSelectedError] = useState<DTC | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [liveData, setLiveData] = useState<LiveData>({ 
    rpm: 0, speed: 0, coolantTemp: 0, load: 0, voltage: 14.2,
    intakeTemp: 0, throttle: 0, maf: 0, timing: 0,
    fuelTrimShort: 0, fuelTrimLong: 0, fuelStatus: 'Closed Loop'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('rufet_obd_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rufet_obd_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval: any;
    if (isConnected && !isClearing) {
      interval = setInterval(() => {
        setLiveData(prev => ({
          rpm: isConnected ? Math.floor(750 + Math.random() * 50) : 0,
          speed: 0,
          coolantTemp: 92,
          load: 12 + Math.random() * 3,
          voltage: 14.1 + Math.random() * 0.2,
          intakeTemp: 35 + Math.random() * 2,
          throttle: 14.5,
          maf: 2.8 + Math.random() * 0.4,
          timing: 12 + Math.random() * 4,
          fuelTrimShort: -2 + Math.random() * 4,
          fuelTrimLong: 3.2,
          fuelStatus: 'Closed Loop'
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, isClearing]);

  // Realistic non-linear health score calculation
  const calculateHealth = (errors: DTC[]) => {
    if (errors.length === 0) return 100;
    
    let baseScore = 100;
    let criticalPenalty = 0;
    let warningPenalty = 0;
    let minorPenalty = 0;

    errors.forEach(err => {
      // System importance weights
      const isCriticalSystem = [CarSystem.ENGINE, CarSystem.BRAKES, CarSystem.AIRBAGS].includes(err.system);
      
      if (err.severity === 'high' || isCriticalSystem) {
        criticalPenalty += 25;
      } else if (err.severity === 'medium') {
        warningPenalty += 10;
      } else {
        minorPenalty += 5;
      }
    });

    // Realistic caps: 1 critical = car is no more than 60%. 2 criticals = car is no more than 30%.
    const score = baseScore - criticalPenalty - warningPenalty - minorPenalty;
    const finalScore = Math.max(0, score);
    
    if (criticalPenalty >= 50) return Math.min(finalScore, 30);
    if (criticalPenalty >= 25) return Math.min(finalScore, 60);
    
    return finalScore;
  };

  const handleConnect = async (demo: boolean = false, isRefresh: boolean = false) => {
    if (!isRefresh) {
      setIsConnecting(true);
      setErrorLog(null);
      setConnectStep(demo ? "DEMO MODE..." : t.connecting);
    } else {
      setConnectStep(t.reading);
    }

    try {
      let deviceName = diagnostic?.make || t.unknownModel;
      let vin = diagnostic?.vin || "VIN_READING_FAILED";

      if (!isRefresh && !demo) {
        if (!(navigator as any).bluetooth) throw new Error("Bluetooth not supported");
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
        });
        deviceName = device.name || t.unknownModel;
        setConnectStep(t.init);
        await device.gatt?.connect();
        vin = "WBA7C210" + Math.random().toString(36).substring(2, 10).toUpperCase();
      } else if (!isRefresh && demo) {
        vin = "WBA8E110" + Math.random().toString(36).substring(2, 10).toUpperCase();
        deviceName = "BMW X5 (Demo)";
      }

      setConnectStep(t.reading);
      
      setTimeout(async () => {
        const codes = (demo || isRefresh) ? (isRefresh && Math.random() > 0.5 ? ['P0171'] : ['P0300', 'P0171', 'B0001']) : [];
        const foundErrors: DTC[] = codes.map(code => {
          const local = LOCAL_DTC_DATABASE[code];
          return {
            code,
            description: local ? local[lang] : 'Technical system error',
            system: local ? local.system : CarSystem.ENGINE,
            severity: local ? local.severity : 'medium'
          };
        });

        const vInfo = await decodeVin(vin, lang);

        const newResult: DiagnosticResult = {
          id: Date.now().toString(),
          vin: vin,
          year: vInfo?.year || 2024,
          timestamp: new Date().toLocaleString(lang === 'az' ? 'az-AZ' : 'ru-RU'),
          errors: foundErrors,
          healthScore: calculateHealth(foundErrors),
          scanType: isRefresh ? 'post-repair' : 'initial',
          make: vInfo?.make || deviceName.split(' ')[0] || t.unknownModel,
          model: vInfo?.model || deviceName.split(' ').slice(1).join(' ') || ""
        };

        setDiagnostic(newResult);
        if (!isRefresh) {
          setHistory(prev => [newResult, ...prev].slice(0, 100));
        }

        setIsConnected(true);
        setIsConnecting(false);
        setConnectStep('');
      }, 1500);

    } catch (error: any) {
      setErrorLog(error.name === 'NotFoundError' ? null : error.message);
      setIsConnecting(false);
    }
  };

  const handleClearErrors = () => {
    setIsClearing(true);
    setSelectedError(null);
    setAiInsight(null);
    
    setTimeout(() => {
      setIsClearing(false);
      handleConnect(diagnostic?.make.includes('Demo') || false, true);
    }, 2500);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const getMonthlyStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return history.filter(item => {
      const itemDate = new Date(parseInt(item.id));
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    }).length;
  };

  const handleSelectError = async (err: DTC) => {
    if (selectedError?.code === err.code) {
      setSelectedError(null);
      setAiInsight(null);
      return;
    }
    
    // Dynamic localization fix
    const localizedDesc = LOCAL_DTC_DATABASE[err.code] ? LOCAL_DTC_DATABASE[err.code][lang] : err.description;
    const localizedError = { ...err, description: localizedDesc };
    
    setSelectedError(localizedError);
    setIsLoadingInsight(true);
    setAiInsight(null);
    
    try {
      const insight = await getDTCInsight(localizedError, lang);
      setAiInsight(insight);
    } catch (e) {
      console.error("Insight failed:", e);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const shareReport = async () => {
    if (!diagnostic) return;
    const errorText = diagnostic.errors.length > 0 
      ? diagnostic.errors.map(e => {
          const desc = LOCAL_DTC_DATABASE[e.code] ? LOCAL_DTC_DATABASE[e.code][lang] : e.description;
          return `${e.code}: ${desc} (${e.severity === 'high' ? t.critical : t.warning})`;
        }).join('\n')
      : t.noErrors;

    const report = `🚗 ${t.title} - ${t.reportHeader}\n` +
      `--------------------------\n` +
      `${t.vehicle}: ${diagnostic.make} ${diagnostic.model}\n` +
      `VIN: ${diagnostic.vin}\n` +
      `${t.healthTitle}: ${diagnostic.healthScore}%\n` +
      `--------------------------\n` +
      `${t.errorCodes.toUpperCase()}:\n${errorText}\n` +
      `--------------------------\n` +
      `${t.date}: ${diagnostic.timestamp}`;

    if (navigator.share) {
      await navigator.share({ title: t.title, text: report });
    } else {
      navigator.clipboard.writeText(report);
      alert(lang === 'az' ? 'Hesabat kopyalandı' : 'Отчет скопирован');
    }
  };

  const openGoogleSearch = (code: string) => {
    const query = encodeURIComponent(`${code} error code automotive diagnostic`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen text-white font-sans bg-[#070709] selection:bg-red-500/30 flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black italic tracking-tighter leading-none">{t.title}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'} ${isConnecting ? 'animate-pulse' : ''}`}></div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{isConnected ? t.connected : t.disconnected}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20">
                <Bluetooth className="w-5 h-5 text-green-500" />
              </div>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {isConnected && (
          <nav className="max-w-xl mx-auto px-4 flex justify-between border-t border-white/5">
            {[
              { id: 'diagnostic', icon: ScanSearch, label: t.startScan },
              { id: 'live', icon: Gauge, label: t.liveData },
              { id: 'report', icon: FileText, label: t.report },
              { id: 'history', icon: HistoryIcon, label: t.history }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => { setView(tab.id as ViewMode); setSelectedError(null); }}
                className={`flex-1 py-5 flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all relative ${view === tab.id ? 'text-red-500' : 'text-zinc-500'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                {view === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444]"></div>}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-xl mx-auto w-full p-4 flex-grow space-y-6 relative">
        {!isConnected ? (
          <div className="py-20 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative w-28 h-28 bg-zinc-900 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
                {isConnecting ? (
                  <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                ) : (
                  <Bluetooth className="w-12 h-12 text-zinc-700" />
                )}
              </div>
            </div>
            <div className="space-y-3 px-6">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                {isConnecting ? connectStep : "OBD2 SCANNER"}
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {errorLog ? <span className="text-red-500 font-bold">{errorLog}</span> : t.connectInstructions}
              </p>
            </div>
            <div className="w-full space-y-6 px-4 flex flex-col items-center">
              <button 
                onClick={() => handleConnect(false)} 
                disabled={isConnecting}
                className="w-full py-6 rounded-[2rem] bg-red-600 font-black text-xl shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Power className="w-6 h-6" /> {t.connect}
              </button>
              
              <button 
                onClick={() => handleConnect(true)} 
                disabled={isConnecting}
                className="text-zinc-600 hover:text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3" /> {t.demo}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {view === 'diagnostic' && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Car className="w-32 h-32" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.vehicleData}</p>
                    <button 
                      onClick={() => handleConnect(diagnostic?.make?.includes('Demo') || false, true)}
                      className="p-2 bg-white/5 rounded-lg border border-white/5 hover:bg-red-600 transition-colors group/refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black italic text-red-500 uppercase leading-none">
                        {diagnostic?.make} {diagnostic?.model}
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2">{t.year} {diagnostic?.year}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">{t.healthTitle}</p>
                       <div className={`text-4xl font-black italic transition-colors duration-500 ${diagnostic!.healthScore > 75 ? 'text-green-500' : diagnostic!.healthScore > 40 ? 'text-yellow-500' : 'text-red-500'}`}>{diagnostic?.healthScore}%</div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 text-[10px] font-mono text-zinc-500 uppercase">VIN: {diagnostic?.vin}</div>
                </div>

                <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.errorCodes}</p>
                    <div className="flex items-center gap-3">
                      {diagnostic!.errors.length > 0 && (
                        <button 
                          onClick={handleClearErrors}
                          disabled={isClearing}
                          className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-[10px] font-black border border-red-600/20 transition-all"
                        >
                          {isClearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          {isClearing ? t.clearing : t.clearErrors}
                        </button>
                      )}
                      <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black">{diagnostic?.errors.length}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {diagnostic?.errors.length === 0 ? (
                      <div className="py-10 text-center space-y-3">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                          <Zap className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-zinc-500 italic text-sm font-bold uppercase tracking-tight">{t.noErrors}</p>
                      </div>
                    ) : (
                      diagnostic?.errors.map((err, i) => {
                        const localDesc = LOCAL_DTC_DATABASE[err.code] ? LOCAL_DTC_DATABASE[err.code][lang] : err.description;
                        return (
                          <button 
                            key={i} 
                            onClick={() => handleSelectError(err)}
                            className={`w-full p-5 rounded-3xl border transition-all text-left flex items-center justify-between group ${selectedError?.code === err.code ? 'bg-red-600 border-red-600' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${err.severity === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {err.severity === 'high' ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                              </div>
                              <div>
                                <p className={`text-xl font-black italic ${selectedError?.code === err.code ? 'text-white' : 'text-red-500'}`}>{err.code}</p>
                                <p className={`text-[10px] font-bold uppercase mt-0.5 line-clamp-1 ${selectedError?.code === err.code ? 'text-red-100' : 'text-zinc-400'}`}>
                                  {localDesc}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${selectedError?.code === err.code ? 'text-white' : 'text-zinc-600'}`} />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <CarVisualizer 
                  errorStats={diagnostic?.errors.reduce((acc, e) => ({ ...acc, [e.system]: (acc[e.system] || 0) + 1 }), {}) || {}} 
                  systemLabels={t.systems}
                  vehicleModel={diagnostic?.model}
                  isClearing={isClearing}
                />
              </div>
            )}

            {view === 'live' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 flex flex-col items-center">
                    <Thermometer className="w-8 h-8 text-red-500 mb-2" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.temp}</span>
                    <span className="text-3xl font-black tabular-nums">{liveData.coolantTemp}°C</span>
                  </div>
                  <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 flex flex-col items-center">
                    <VoltIcon className="w-8 h-8 text-yellow-500 mb-2" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.volt}</span>
                    <span className="text-3xl font-black tabular-nums">{liveData.voltage.toFixed(1)}V</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 space-y-10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.rpm}</p>
                      <h3 className="text-6xl font-black italic tracking-tighter tabular-nums">{liveData.rpm}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.speed}</p>
                      <h3 className="text-6xl font-black italic text-red-500 tracking-tighter tabular-nums">{liveData.speed}</h3>
                      <p className="text-[10px] font-black text-zinc-500">KM/H</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        <span>{t.load}</span>
                        <span>{liveData.load.toFixed(0)}%</span>
                     </div>
                     <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 shadow-[0_0_20px_#ef4444] transition-all duration-1000" style={{ width: `${liveData.load}%` }}></div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'history' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-red-600 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-red-600/20">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">{t.monthlyTotal}</p>
                       <h3 className="text-5xl font-black italic tracking-tighter">{getMonthlyStats()}</h3>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                       <Calendar className="w-8 h-8" />
                    </div>
                 </div>

                 <div className="space-y-4">
                    {history.length === 0 ? (
                       <div className="py-20 text-center space-y-4">
                          <Database className="w-12 h-12 text-zinc-800 mx-auto" />
                          <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">{t.noHistory}</p>
                       </div>
                    ) : (
                       history.map((item) => (
                          <div key={item.id} className="bg-zinc-900/40 p-5 rounded-3xl border border-white/5 flex items-center justify-between group">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                                   <Car className="w-6 h-6 text-red-500" />
                                </div>
                                <div onClick={() => { setDiagnostic(item); setView('report'); }} className="cursor-pointer">
                                   <p className="text-sm font-black uppercase italic tracking-tight">{item.make} {item.model}</p>
                                   <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] font-bold text-zinc-500">{item.timestamp}</span>
                                      <span className={`text-[10px] font-black ${item.errors.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                         {item.errors.length} {t.errorCodes}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <button 
                                onClick={() => deleteHistoryItem(item.id)}
                                className="p-3 bg-red-600/10 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       ))
                    )}
                 </div>
              </div>
            )}

            {view === 'report' && diagnostic && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-white p-8 rounded-[2.5rem] text-black shadow-2xl">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 border-b-2 border-zinc-100 pb-4">{t.reportHeader}</h3>
                    <div className="space-y-4 mb-8">
                       <div className="flex justify-between">
                          <span className="text-[10px] font-black uppercase text-zinc-400">{t.vehicle}</span>
                          <span className="text-sm font-bold uppercase">{diagnostic.make} {diagnostic.model}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[10px] font-black uppercase text-zinc-400">VIN</span>
                          <span className="text-sm font-mono font-bold uppercase">{diagnostic.vin}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-[10px] font-black uppercase text-zinc-400">{t.date}</span>
                          <span className="text-sm font-bold uppercase">{diagnostic.timestamp}</span>
                       </div>
                       <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                          <span className="text-[10px] font-black uppercase text-zinc-400">{t.healthTitle}</span>
                          <span className={`text-xl font-black italic ${diagnostic.healthScore > 75 ? 'text-green-600' : diagnostic.healthScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {diagnostic.healthScore}%
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                       <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">{t.errorCodes}</p>
                       {diagnostic.errors.length === 0 ? (
                         <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                           <p className="text-sm font-bold text-green-600 uppercase flex items-center gap-2"><Zap className="w-4 h-4"/> {t.noErrors}</p>
                         </div>
                       ) : (
                         diagnostic.errors.map((e, idx) => {
                            const desc = LOCAL_DTC_DATABASE[e.code] ? LOCAL_DTC_DATABASE[e.code][lang] : e.description;
                            return (
                              <button 
                                key={idx} 
                                onClick={() => handleSelectError(e)}
                                className="w-full p-4 bg-zinc-50 rounded-2xl flex items-center justify-between border border-zinc-100 text-left hover:bg-zinc-100 transition-colors group"
                              >
                                 <div>
                                    <p className="text-lg font-black italic text-red-600 leading-none">{e.code}</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{desc}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${e.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                      {e.severity === 'high' ? t.critical : t.warning}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                 </div>
                              </button>
                            );
                         })
                       )}
                    </div>

                    <button 
                      onClick={shareReport}
                      className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                    >
                      <Share2 className="w-5 h-5" /> {t.shareReport}
                    </button>
                 </div>
               </div>
            )}
          </div>
        )}

        {/* Global Error Detail Overlay/Panel - Moved outside view logic to ensure it shows up when triggered from any screen */}
        {selectedError && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedError(null)}>
            <div 
              className="w-full max-w-xl bg-white p-8 rounded-[2.5rem] text-black shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500"
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking through to close
            >
              <button 
                onClick={() => setSelectedError(null)} 
                className="absolute top-6 right-6 p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider mb-2 inline-block ${selectedError.severity === 'high' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'}`}>
                  {selectedError.severity === 'high' ? t.critical : t.warning}
                </div>
                <h4 className="text-4xl font-black italic tracking-tighter text-red-600">{selectedError.code}</h4>
                <p className="text-lg font-bold uppercase mt-2 leading-tight">
                  {LOCAL_DTC_DATABASE[selectedError.code] ? LOCAL_DTC_DATABASE[selectedError.code][lang] : selectedError.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <button 
                  onClick={() => openGoogleSearch(selectedError.code)}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-colors"
                >
                  <Search className="w-4 h-4" /> {t.searchOnline}
                </button>
              </div>

              {isLoadingInsight ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-zinc-400">
                  <Loader2 className="animate-spin w-10 h-10 text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {lang === 'az' ? 'AI ANALİZ EDİR...' : 'AI АНАЛИЗИРУЕТ...'}
                  </span>
                </div>
              ) : aiInsight && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase">
                      {lang === 'az' ? 'SƏBƏB VƏ HƏLLİ' : 'ПРИЧИНА И РЕШЕНИЕ'}
                    </p>
                    <p className="text-sm font-medium leading-relaxed">{aiInsight.explanation}</p>
                  </div>
                  <div className="p-5 bg-zinc-100 rounded-2xl flex justify-between items-center border border-zinc-200">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">
                        {lang === 'az' ? 'TƏXMINI TƏMİR XƏRCİ' : 'ПРИМЕРНАЯ ЦЕНА'}
                      </p>
                      <p className="text-2xl font-black tracking-tighter">{aiInsight.estimatedRepairCost}</p>
                    </div>
                    <Activity className="w-8 h-8 text-red-600 opacity-20" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-xl mx-auto w-full px-4 py-12 text-center space-y-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-3 opacity-30">
           <Zap className="w-5 h-5 text-red-600" />
           <p className="text-[10px] font-black uppercase tracking-widest leading-none">{t.title}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{t.footerText}</p>
          <div className="flex items-center justify-center gap-2 text-red-500/80">
            <Gift className="w-3.5 h-3.5" />
            <p className="text-[10px] font-black uppercase tracking-wider italic">{t.gift}</p>
          </div>
        </div>
        <p className="text-[9px] text-zinc-800 font-medium">© 2026 RUFET AUTO ELECTRIC. {t.rights}.</p>
      </footer>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">SETTINGS</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X /></button>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ЯЗЫК / DİL</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setLang('ru'); setShowSettings(false); }} className={`py-5 rounded-2xl border-2 font-black transition-all ${lang === 'ru' ? 'bg-red-600 border-red-600' : 'bg-white/5 border-white/5 text-zinc-400'}`}>RU</button>
                <button onClick={() => { setLang('az'); setShowSettings(false); }} className={`py-5 rounded-2xl border-2 font-black transition-all ${lang === 'az' ? 'bg-red-600 border-red-600' : 'bg-white/5 border-white/5 text-zinc-400'}`}>AZ</button>
              </div>
            </div>
            <button 
              onClick={() => { setIsConnected(false); setDiagnostic(null); setShowSettings(false); }} 
              className="w-full py-5 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-red-600/20"
            >
              <LogOut className="w-4 h-4" /> {lang === 'az' ? 'CİHAZI AYIR' : 'ОТКЛЮЧИТЬ УСТРОЙСТВО'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
