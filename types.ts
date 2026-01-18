
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

export interface ComparisonResult {
  before: DiagnosticResult;
  after: DiagnosticResult;
  resolvedCodes: string[];
  persistingCodes: string[];
  newCodes: string[];
  healthImprovement: number;
}

export interface AIInsight {
  explanation: string;
  possibleCauses: string[];
  estimatedRepairCost: string;
  severityAdvice: string;
}

export interface MaintenanceRecommendation {
  vehicleType: string;
  nextProcedures: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  generalAdvice: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
