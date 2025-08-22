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

export interface CalculatorInputs {
  geometric: GeometricParameters;
  magnetic: MagneticSystemInputs;
  material: MaterialSeparationMetrics;
  environmental: EnvironmentalConstraints;
}