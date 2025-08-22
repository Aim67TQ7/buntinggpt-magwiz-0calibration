export interface GeometricParameters {
  beltWidth: number; // 450-2400mm
  suspensionHeight: number; // 0-800mm
  elementLength: number;
  elementWidth: number;
  elementHeight: number;
}

export interface MagneticSystemInputs {
  powerSourceType: 'permanent' | 'electromagnetic-air' | 'electromagnetic-oil';
  ampereTurns: number;
  numberOfTurns: number;
  current: number;
  magnetGap: number;
}

export interface MaterialSeparationMetrics {
  materialType: string;
  bulkDensity: number; // t/m³
  waterContent: number; // %
  trampMetalSize: {
    min: number;
    max: number;
  };
  magneticSusceptibility: number;
  particleDistribution: string;
}

export interface EnvironmentalConstraints {
  operatingTemperature: number; // °C
  altitude: number; // m
  dustExposure: 'low' | 'medium' | 'high';
  humidity: number; // %
  atexRating?: string;
}

export interface CalculationResults {
  magneticFieldStrength: {
    tesla: number;
    gauss: number;
    penetrationDepth: number;
  };
  trampMetalRemoval: {
    overallEfficiency: number;
    fineParticles: number;
    mediumParticles: number;
    largeParticles: number;
  };
  thermalPerformance: {
    totalPowerLoss: number;
    temperatureRise: number;
    coolingEfficiency: number;
  };
  recommendedModel: {
    model: string;
    score: number;
    alternatives: Array<{
      model: string;
      score: number;
    }>;
  };
}

export interface ValidationResult {
  isValid: boolean;
  severity: 'critical' | 'warning' | 'info';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  equipmentCompliance: EquipmentComplianceStatus;
}

export interface ValidationError {
  field: string;
  message: string;
  value: number;
  threshold: number;
  recommendation: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: number;
  threshold: number;
  suggestion: string;
}

export interface SafetyThresholds {
  maxTemperature: number; // 300°C
  maxMagneticField: number; // 2 Tesla
  maxRemovalEfficiency: number; // 100%
  warningTemperature: number; // 250°C
  warningMagneticField: number; // 1.8 Tesla
  warningRemovalEfficiency: number; // 95%
}

export interface EquipmentRating {
  model: string;
  maxPowerLoss: number; // kW
  maxOperatingTemp: number; // °C
  maxMagneticField: number; // Tesla
  thermalRating: number; // W/m²
}

export interface EquipmentComplianceStatus {
  powerCompliance: boolean;
  thermalCompliance: boolean;
  magneticCompliance: boolean;
  overallCompliance: boolean;
  rating: EquipmentRating;
}

export interface ValidationTools {
  comsol: {
    name: string;
    description: string;
    exportFormat: string;
    useCase: string;
  };
  ansys: {
    name: string;
    description: string;
    exportFormat: string;
    useCase: string;
  };
  matlab: {
    name: string;
    description: string;
    exportFormat: string;
    useCase: string;
  };
}

export interface EnhancedCalculationResults extends CalculationResults {
  validation: ValidationResult;
  recommendedTools: string[];
}

export interface CalculatorInputs {
  geometric: GeometricParameters;
  magnetic: MagneticSystemInputs;
  material: MaterialSeparationMetrics;
  environmental: EnvironmentalConstraints;
}