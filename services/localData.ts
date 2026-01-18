
import { CarSystem, DTC, AIInsight } from "../types";

export const LOCAL_DTC_DATABASE: Record<string, { system: CarSystem; severity: 'low' | 'medium' | 'high'; ru: string; az: string; cost: string }> = {
  'P0300': {
    system: CarSystem.ENGINE,
    severity: 'high',
    ru: 'Обнаружены множественные пропуски зажигания',
    az: 'Çoxsaylı alışdırma buraxılışları aşkar edildi',
    cost: '50 - 250 AZN'
  },
  'P0171': {
    system: CarSystem.FUEL,
    severity: 'medium',
    ru: 'Слишком бедная смесь (Банк 1)',
    az: 'Həddindən artıq kasıb qarışıq (Bank 1)',
    cost: '40 - 120 AZN'
  },
  'P0420': {
    system: CarSystem.EXHAUST,
    severity: 'medium',
    ru: 'Эффективность катализатора ниже порога',
    az: 'Katalizatorun səmərəliliyi həddindən aşağıdır',
    cost: '300 - 1500 AZN'
  },
  'P0101': {
    system: CarSystem.ENGINE,
    severity: 'medium',
    ru: 'Проблема с диапазоном/работой датчика MAF',
    az: 'MAF sensorunun diapazonu/işində problem',
    cost: '80 - 300 AZN'
  },
  'P0505': {
    system: CarSystem.ENGINE,
    severity: 'low',
    ru: 'Неисправность системы управления холостым ходом',
    az: 'Boş gediş idarəetmə sisteminin nasazlığı',
    cost: '30 - 100 AZN'
  },
  'C0034': {
    system: CarSystem.BRAKES,
    severity: 'high',
    ru: 'Датчик скорости правого переднего колеса',
    az: 'Sağ ön təkər sürət sensoru',
    cost: '45 - 150 AZN'
  },
  'B0001': {
    system: CarSystem.AIRBAGS,
    severity: 'high',
    ru: 'Управление развертыванием подушки безопасности водителя',
    az: 'Sürücü hava yastığının açılma idarəetməsi',
    cost: '100 - 400 AZN'
  }
};

export const WMI_MAP: Record<string, string> = {
  'WBA': 'BMW',
  'WBS': 'BMW M',
  'WDC': 'Mercedes-Benz',
  'WDD': 'Mercedes-Benz',
  'WVW': 'Volkswagen',
  'WAU': 'Audi',
  'VIN': 'Volkswagen',
  '1G1': 'Chevrolet',
  '2G1': 'Chevrolet',
  '5YJ': 'Tesla',
  'JTD': 'Toyota',
  'JNK': 'Infiniti',
  'JHM': 'Honda',
  'KMH': 'Hyundai',
  'KNA': 'Kia',
  'SAL': 'Land Rover'
};

export const getLocalInsight = (code: string, lang: 'ru' | 'az'): AIInsight => {
  const data = LOCAL_DTC_DATABASE[code];
  if (!data) {
    return {
      explanation: lang === 'ru' ? "Описание кода отсутствует в локальной базе." : "Kodun təsviri lokal bazada yoxdur.",
      possibleCauses: [lang === 'ru' ? "Требуется онлайн проверка" : "Onlayn yoxlama tələb olunur"],
      estimatedRepairCost: "??? AZN",
      severityAdvice: lang === 'ru' ? "Соблюдайте осторожность." : "Ehtiyatlı olun."
    };
  }

  return {
    explanation: data[lang],
    possibleCauses: lang === 'ru' 
      ? ["Свечи зажигания", "Катушки", "Подсос воздуха", "Датчики"]
      : ["Alışdırma şamları", "Makaralar", "Hava sızması", "Sensorlar"],
    estimatedRepairCost: data.cost,
    severityAdvice: data.severity === 'high' 
      ? (lang === 'ru' ? "Критическая ошибка! Рекомендуется немедленный ремонт." : "Kritik xəta! Təcili təmir tövsiyə olunur.")
      : (lang === 'ru' ? "Ошибка влияет на расход и динамику." : "Xəta yanacaq sərfiyyatına və dinamikaya təsir edir.")
  };
};

export const localDecodeVin = (vin: string, lang: 'ru' | 'az') => {
  if (!vin || vin.length < 3) return null;
  
  const wmi = vin.substring(0, 3);
  const make = WMI_MAP[wmi];
  if (!make) return null;

  const yearCode = vin.charAt(9);
  const yearMap: Record<string, number> = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
    'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
    'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
  };

  return {
    make,
    model: lang === 'az' ? "Model qeyd olunmayıb" : "Модель не указана",
    year: yearMap[yearCode] || 2024
  };
};
