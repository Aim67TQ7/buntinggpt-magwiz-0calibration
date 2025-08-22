export interface ConveyorParameters {
  beltSpeed: number; // m/s
  troughAngle: number; // degrees 0-45
  beltWidth: number; // mm 450-2400
}

export interface BurdenParameters {
  feedDepth: number; // mm
  throughPut: number; // t/h (feed rate)
  density: number; // t/m³
  waterContent: number; // %
}

export interface ShapeParameters {
  width: number; // mm (tramp metal particle width)
  length: number; // mm (tramp metal particle length) 
  height: number; // mm (tramp metal particle height)
}

export interface MagnetParameters {
  gap: number; // mm (magnet gap)
  coreBeltRatio: number; // ratio 0.1-0.9
  position: number; // mm (position along belt)
}

export interface MiscParameters {
  altitude: number; // m
  ambientTemperature: number; // °C
}

export interface MagneticSystemInputs {
  powerSourceType: 'electromagnetic-air' | 'electromagnetic-oil';
  ampereTurns: number;
  numberOfTurns: number;
  current: number;
  magnetGap: number;
  numberOfPoles: number;
  poleConfiguration: 'alternating' | 'single' | 'focused';
  magnetArrangement: 'linear' | 'drum' | 'cross-belt';
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
  particleDistribution: 'fine' | 'mixed' | 'coarse';
  flowCharacteristics: 'free-flowing' | 'cohesive' | 'sticky';
  contaminationLevel: number; // % of tramp metal in feed
}

export interface EnvironmentalConstraints {
  operatingTemperature: number; // °C
  altitude: number; // m
  dustExposure: 'low' | 'medium' | 'high';
  humidity: number; // %
  vibrationLevel: 'low' | 'medium' | 'high';
  airCurrents: 'none' | 'mild' | 'strong';
  materialPreConditioning: 'none' | 'screening' | 'drying' | 'both';
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

export interface OptimizationResult {
  success: boolean;
  iterations: number;
  targetEfficiency: number;
  achievedEfficiency: number;
  optimizedParameters: {
    gap?: number;
    coreBeltRatio?: number;
    beltSpeed?: number;
    feedDepth?: number;
  };
  parameterChanges: Array<{
    parameter: string;
    originalValue: number;
    optimizedValue: number;
    change: number;
  }>;
}

export interface AdvancedParameters {
  materialProperties: {
    magneticSusceptibility: number;
    particleDistribution: 'uniform' | 'gaussian' | 'bimodal';
    bulkDensity: number;
  };
  environmental: {
    humidity: number;
    dustExposure: 'low' | 'medium' | 'high';
    vibrationLevel: number;
  };
  magneticSystem: {
    ampereTurns: number;
    poleConfiguration: 'single' | 'double' | 'multi';
    magneticArrangement: 'inline' | 'crossbelt' | 'overhead';
  };
}

export interface EnhancedCalculationResults extends CalculationResults {
  validation: ValidationResult;
  recommendedTools: string[];
  optimization?: OptimizationResult;
}

export interface CalculatorInputs {
  conveyor: ConveyorParameters;
  burden: BurdenParameters;
  shape: ShapeParameters;
  magnet: MagnetParameters;
  misc: MiscParameters;
  advanced?: AdvancedParameters;
}