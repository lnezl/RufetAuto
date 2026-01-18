
export enum CarSystem {
  ENGINE = 'ENGINE',
  TRANSMISSION = 'TRANSMISSION',
  EXHAUST = 'EXHAUST',
  BRAKES = 'BRAKES',
  ELECTRONICS = 'ELECTRONICS',
  FUEL = 'FUEL',
  AIRBAGS = 'AIRBAGS'
}

export interface DTC {
  code: string;
  description: string;
  system: CarSystem;
  severity: 'low' | 'medium' | 'high';
}

export type ScanType = 'initial' | 'post-repair';

export interface DiagnosticResult {
  id: string;
  vin: string;
  year: number;
  make?: string;
  model?: string;
  timestamp: string;
  errors: DTC[];
  healthScore: number;
  scanType: ScanType;
}

export interface AIInsight {
  explanation: string;
  possibleCauses: string[];
  estimatedRepairCost: string;
  severityAdvice: string;
}

export interface LiveData {
  rpm: number;
  speed: number;
  coolantTemp: number;
  load: number;
  voltage: number;
  intakeTemp: number;
  throttle: number;
  maf: number;
  timing: number;
  fuelTrimShort: number;
  fuelTrimLong: number;
  fuelStatus: string;
}
