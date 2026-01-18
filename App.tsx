
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, AlertTriangle, Cpu, Power, 
  Bluetooth, ShieldAlert, Loader2, Zap, 
  ScanSearch, History, ArrowLeft, 
  Gauge, MessageSquare, Send, Sparkles, Battery,
  FileText, Settings, X, Car, LogOut, Trash, Globe, HelpCircle, Waves, ChevronRight
} from 'lucide-react';
import { CarSystem, DTC, DiagnosticResult, AIInsight, ChatMessage, ScanType } from './types';
import { CarVisualizer } from './components/CarVisualizer';
import { getDTCInsight, decodeVin, chatWithMechanic } from './services/gemini';
import { localDecodeVin } from './services/localData';

type Language = 'ru' | 'az';
type ViewMode = 'diagnostic' | 'live' | 'chat' | 'report' | 'history';

const TRANSLATIONS = {
  ru: {
    title: 'RUFET AUTO ELECTRIC',
    connect: 'ПОДКЛЮЧИТЬ',
    connected: 'ПОДКЛЮЧЕНО',
    disconnected: 'ОТКЛЮЧЕНО',
    startScan: 'СКАНЕР',
    liveData: 'ДАННЫЕ',
    aiMechanic: 'ЧАТ ИИ',
    historyTitle: 'ИСТОРИЯ',
    report: 'ОТЧЕТ',
    vehicleData: 'ДАННЫЕ АВТОМОБИЛЯ',
    healthTitle: 'ЗДОРОВЬЕ АВТО',
    errorCodes: 'КОДЫ ОШИБОК',
    year: 'ГОД ВЫПУСКА:',
    placeholder: 'Спросите ИИ о ремонте...',
    connectInstructions: 'Подключите OBD2 сканер ELM327 для диагностики систем автомобиля.',
    noErrors: 'Ошибок не обнаружено',
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
    connect: 'QOŞUL',
    connected: 'QOŞULDU',
    disconnected: 'BAĞLI DEYİL',
    startScan: 'SKANER',
    liveData: 'CANLI',
    aiMechanic: 'AI ÇAT',
    historyTitle: 'TARİXÇƏ',
    report: 'HESABAT',
    vehicleData: 'AVTOMOBİL MƏLUMATLARI',
    healthTitle: 'SAĞLAMLIQ',
    errorCodes: 'XƏTA KODLARI',
    year: 'BURAXILIŞ İLİ:',
    placeholder: 'Təmir haqqında soruşun...',
    connectInstructions: 'İşə başlamaq üçün OBD2 skaneri avtomobilə qoşun.',
    noErrors: 'Xəta tapılmadı',
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
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [selectedError, setSelectedError] = useState<DTC | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<{ make: string; model: string; year?: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const mockVin = "WBA7C210X0R" + Math.random().toString(10).slice(2, 8);
      const errors: DTC[] = [
        { code: 'P0300', description: 'Random Misfire Detected', system: CarSystem.ENGINE, severity: 'high' },
        { code: 'P0171', description: 'System Too Lean Bank 1', system: CarSystem.FUEL, severity: 'medium' }
      ];
      setDiagnostic({
        id: Date.now().toString(),
        vin: mockVin,
        year: 2024,
        timestamp: new Date().toLocaleString(),
        errors: errors,
        healthScore: 78,
        scanType: 'initial',
        make: 'BMW',
        model: '5 SERIES'
      });
      setVehicleInfo({ make: 'BMW', model: '5 SERIES', year: 2024 });
      setIsConnected(true);
      setIsConnecting(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    try {
      const res = await chatWithMechanic(messages, msg, diagnostic?.vin || "", lang);
      setMessages(prev => [...prev, { role: 'model', text: res }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Service error" }]);
    }
  };

  const handleSelectError = async (err: DTC) => {
    setSelectedError(err);
    setIsLoadingInsight(true);
    try {
      const insight = await getDTCInsight(err, lang);
      setAiInsight(insight);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans bg-[#070709] selection:bg-red-500/30">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black italic tracking-tighter leading-none">{t.title}</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">OBD2 INTELLIGENCE</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected && (
               <button 
                 onClick={() => setView('chat')} 
                 className={`p-2.5 rounded-xl border transition-all ${view === 'chat' ? 'bg-red-600/10 border-red-600/20 text-red-500' : 'bg-white/5 border-white/5'}`}
               >
                 <MessageSquare className="w-5 h-5" />
               </button>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 rounded-xl border border-white/5"><Settings className="w-5 h-5" /></button>
          </div>
        </div>

        {isConnected && (
          <nav className="max-w-xl mx-auto px-4 flex justify-between border-t border-white/5">
            {[
              { id: 'diagnostic', icon: ScanSearch, label: t.startScan },
              { id: 'live', icon: Gauge, label: t.liveData },
              { id: 'report', icon: FileText, label: t.report },
              { id: 'history', icon: History, label: t.historyTitle }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setView(tab.id as ViewMode)}
                className={`flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${view === tab.id ? 'text-red-500' : 'text-zinc-500'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                {view === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444]"></div>}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-xl mx-auto p-4 pb-24 space-y-6">
        {!isConnected ? (
          <div className="py-20 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative w-28 h-28 bg-zinc-900 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
                <Bluetooth className={`w-12 h-12 ${isConnecting ? 'text-red-500 animate-pulse' : 'text-zinc-700'}`} />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">{t.connect}</h2>
              <p className="text-zinc-500 text-sm max-w-[280px] mx-auto leading-relaxed">{t.connectInstructions}</p>
            </div>
            <button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full py-6 rounded-[2rem] bg-red-600 font-black text-xl shadow-xl shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isConnecting ? <Loader2 className="animate-spin" /> : <><Power className="w-6 h-6" /> {t.connect}</>}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {view === 'diagnostic' && (
              <div className="space-y-6">
                <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Car className="w-32 h-32" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{t.vehicleData}</p>
                  <h3 className="text-2xl font-black font-mono tracking-tighter mb-6">{diagnostic?.vin}</h3>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div>
                      <p className="text-2xl font-black italic text-red-500 uppercase leading-none">{vehicleInfo?.make} {vehicleInfo?.model}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-wider">{t.year} {vehicleInfo?.year}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">{t.healthTitle}</p>
                       <div className="text-4xl font-black italic">{diagnostic?.healthScore}%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.errorCodes}</p>
                    <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-red-600/20">{diagnostic?.errors.length}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {diagnostic?.errors.length === 0 ? (
                      <p className="py-8 text-center text-zinc-500 italic text-sm">{t.noErrors}</p>
                    ) : (
                      diagnostic?.errors.map((err, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleSelectError(err)}
                          className={`w-full p-5 rounded-3xl border transition-all text-left flex items-center justify-between group ${selectedError?.code === err.code ? 'bg-red-600 border-red-600' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        >
                          <div>
                            <p className={`text-xl font-black italic ${selectedError?.code === err.code ? 'text-white' : 'text-red-500'}`}>{err.code}</p>
                            <p className={`text-[10px] font-bold uppercase mt-1 line-clamp-1 ${selectedError?.code === err.code ? 'text-red-100' : 'text-zinc-400'}`}>{err.description}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${selectedError?.code === err.code ? 'text-white' : 'text-zinc-600'}`} />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <CarVisualizer 
                  errorStats={diagnostic?.errors.reduce((acc, e) => ({ ...acc, [e.system]: (acc[e.system] || 0) + 1 }), {}) || {}} 
                  accentColor="#ef4444"
                  systemLabels={t.systems}
                />

                {selectedError && (
                  <div className="bg-white p-8 rounded-[2.5rem] text-black animate-in slide-in-from-bottom-6 duration-500">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-4xl font-black italic tracking-tighter text-red-600">{selectedError.code}</h4>
                      <button onClick={() => setSelectedError(null)} className="p-2 bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <p className="text-lg font-bold uppercase mb-8 leading-tight">{selectedError.description}</p>
                    
                    {isLoadingInsight ? (
                      <div className="flex items-center gap-3 text-zinc-400 py-4">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">AI Анализ...</span>
                      </div>
                    ) : aiInsight && (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-zinc-400 uppercase">Заключение механика</p>
                          <p className="text-sm font-medium leading-relaxed">{aiInsight.explanation}</p>
                        </div>
                        <div className="p-5 bg-zinc-100 rounded-2xl">
                          <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Примерная стоимость ремонта</p>
                          <p className="text-2xl font-black">{aiInsight.estimatedRepairCost}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {view === 'chat' && (
              <div className="flex flex-col h-[65vh] bg-zinc-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/5">
                   <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                     <MessageSquare className="w-4 h-4 text-white" />
                   </div>
                   <h3 className="font-black italic uppercase tracking-widest text-xs">AI ASSISTANT</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm shadow-sm ${m.role === 'user' ? 'bg-red-600 font-bold' : 'bg-zinc-800 italic border border-white/5'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                  <input 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.placeholder}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-red-600 transition-colors"
                  />
                  <button onClick={handleSendMessage} className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">SETTINGS</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X /></button>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">APP LANGUAGE</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setLang('ru'); setShowSettings(false); }} className={`py-5 rounded-2xl border-2 font-black transition-all ${lang === 'ru' ? 'bg-red-600 border-red-600' : 'bg-white/5 border-white/5 text-zinc-400'}`}>RU</button>
                <button onClick={() => { setLang('az'); setShowSettings(false); }} className={`py-5 rounded-2xl border-2 font-black transition-all ${lang === 'az' ? 'bg-red-600 border-red-600' : 'bg-white/5 border-white/5 text-zinc-400'}`}>AZ</button>
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
