import { CalculatorInputs, CalculationResults, EnhancedCalculationResults } from '@/types/calculator';
import { validateCalculationResults, getRecommendedValidationTools } from '@/utils/validation';

const MU_0 = 4 * Math.PI * 1e-7; // Permeability of free space

export function calculateMagneticField(inputs: CalculatorInputs): CalculationResults['magneticFieldStrength'] {
  const { magnetic } = inputs;
  
  // Relative permeability based on power source type
  const muR = magnetic.powerSourceType === 'permanent' ? 1.05 : 
              magnetic.powerSourceType === 'electromagnetic-air' ? 2000 : 3000;
  
  // Magnetic field strength calculation
  const B = (MU_0 * muR * magnetic.numberOfTurns * magnetic.current) / (magnetic.magnetGap / 1000);
  const fieldStrengthGauss = B * 10000;
  
  // Penetration depth estimation (simplified model)
  const penetrationDepth = Math.sqrt(B * 100) * 50; // mm
  
  return {
    tesla: parseFloat(B.toFixed(4)),
    gauss: parseFloat(fieldStrengthGauss.toFixed(2)),
    penetrationDepth: parseFloat(penetrationDepth.toFixed(2))
  };
}

export function calculateTrampMetalRemoval(inputs: CalculatorInputs): CalculationResults['trampMetalRemoval'] {
  const { magnetic, material } = inputs;
  const fieldStrength = calculateMagneticField(inputs);
  
  // Base efficiency factors
  const magneticFieldFactor = Math.min(fieldStrength.tesla / 0.5, 1.0);
  const particleSizeFactor = (material.trampMetalSize.max - material.trampMetalSize.min) / 100;
  const materialCompositionFactor = material.magneticSusceptibility / 1000;
  const waterContentPenalty = 1 - (material.waterContent / 100) * 0.3;
  
  const baseEfficiency = 0.85;
  const overallEfficiency = baseEfficiency * magneticFieldFactor * 
                           Math.min(particleSizeFactor, 1.0) * 
                           Math.min(materialCompositionFactor, 1.0) * 
                           waterContentPenalty;
  
  return {
    overallEfficiency: parseFloat((overallEfficiency * 100).toFixed(2)),
    fineParticles: parseFloat((overallEfficiency * 0.6 * 100).toFixed(2)),
    mediumParticles: parseFloat((overallEfficiency * 0.8 * 100).toFixed(2)),
    largeParticles: parseFloat((overallEfficiency * 1.0 * 100).toFixed(2))
  };
}

export function calculateThermalPerformance(inputs: CalculatorInputs): CalculationResults['thermalPerformance'] {
  const { magnetic, environmental } = inputs;
  
  // Power loss calculations
  const copperLosses = Math.pow(magnetic.current, 2) * 0.02 * magnetic.numberOfTurns; // Simplified resistance
  const coreLosses = magnetic.powerSourceType === 'permanent' ? 0 : 
                     magnetic.ampereTurns * 0.001; // Simplified core losses
  
  const totalPowerLoss = copperLosses + coreLosses;
  
  // Cooling efficiency
  const coolingEfficiency = magnetic.powerSourceType === 'permanent' ? 1.0 :
                           magnetic.powerSourceType === 'electromagnetic-air' ? 0.7 : 0.9;
  
  // Temperature rise calculation
  const ambientTempFactor = environmental.operatingTemperature / 25;
  const altitudeFactor = 1 + (environmental.altitude / 10000) * 0.1;
  const temperatureRise = (totalPowerLoss / coolingEfficiency) * ambientTempFactor * altitudeFactor;
  
  return {
    totalPowerLoss: parseFloat(totalPowerLoss.toFixed(2)),
    temperatureRise: parseFloat(temperatureRise.toFixed(2)),
    coolingEfficiency: parseFloat(coolingEfficiency.toFixed(2))
  };
}

export function recommendSeparatorModel(inputs: CalculatorInputs): CalculationResults['recommendedModel'] {
  const fieldStrength = calculateMagneticField(inputs);
  const efficiency = calculateTrampMetalRemoval(inputs);
  const thermal = calculateThermalPerformance(inputs);
  
  // Model scoring algorithm
  const models = {
    'PCB (Permanent Magnet)': {
      score: 0,
      factors: {
        efficiency: efficiency.overallEfficiency * 0.4,
        powerEfficiency: (100 - thermal.totalPowerLoss) * 0.3,
        maintenance: 95 * 0.2, // Low maintenance
        cost: 70 * 0.1 // Higher initial cost
      }
    },
    'EMAX (Air Cooled)': {
      score: 0,
      factors: {
        efficiency: efficiency.overallEfficiency * 0.4,
        powerEfficiency: (100 - thermal.totalPowerLoss * 0.8) * 0.3,
        maintenance: 80 * 0.2,
        cost: 85 * 0.1
      }
    },
    'OCW (Oil Cooled)': {
      score: 0,
      factors: {
        efficiency: efficiency.overallEfficiency * 1.1 * 0.4, // Better cooling allows higher field
        powerEfficiency: (100 - thermal.totalPowerLoss * 0.6) * 0.3,
        maintenance: 70 * 0.2, // Higher maintenance
        cost: 60 * 0.1 // Highest initial cost
      }
    }
  };
  
  // Calculate total scores
  Object.keys(models).forEach(modelName => {
    const model = models[modelName as keyof typeof models];
    model.score = Object.values(model.factors).reduce((sum, factor) => sum + factor, 0);
  });
  
  // Find best model
  const sortedModels = Object.entries(models)
    .map(([name, data]) => ({ model: name, score: parseFloat(data.score.toFixed(2)) }))
    .sort((a, b) => b.score - a.score);
  
  return {
    model: sortedModels[0].model,
    score: sortedModels[0].score,
    alternatives: sortedModels.slice(1)
  };
}

export function performCompleteCalculation(inputs: CalculatorInputs): CalculationResults {
  return {
    magneticFieldStrength: calculateMagneticField(inputs),
    trampMetalRemoval: calculateTrampMetalRemoval(inputs),
    thermalPerformance: calculateThermalPerformance(inputs),
    recommendedModel: recommendSeparatorModel(inputs)
  };
}

export function performEnhancedCalculation(inputs: CalculatorInputs): EnhancedCalculationResults {
  const baseResults = performCompleteCalculation(inputs);
  const validation = validateCalculationResults(baseResults);
  const recommendedTools = getRecommendedValidationTools(baseResults);
  
  return {
    ...baseResults,
    validation,
    recommendedTools,
  };
}