import { CalculatorInputs, CalculationResults, EnhancedCalculationResults } from '@/types/calculator';
import { validateCalculationResults, getRecommendedValidationTools } from '@/utils/validation';

export function calculateMagneticField(inputs: CalculatorInputs): CalculationResults['magneticFieldStrength'] {
  const { magnet, conveyor } = inputs;
  
  // Core magnetic field calculation using simplified approach
  const permeability = 4 * Math.PI * 1e-7; // μ₀ in H/m
  const effectiveLength = conveyor.beltWidth / 1000; // Convert to meters
  
  // Simplified magnetic field calculation based on gap and core:belt ratio
  const magneticField = (0.1 * magnet.coreBeltRatio) / (magnet.gap / 1000);
  
  // Convert to practical units
  const tesla = magneticField;
  const gauss = tesla * 10000;
  
  // Calculate penetration depth (simplified model)
  const penetrationDepth = Math.sqrt(2 / (2 * Math.PI * 50 * 4 * Math.PI * 1e-7 * 1e6)) * 1000; // mm
  
  return {
    tesla,
    gauss,
    penetrationDepth
  };
}

export function calculateTrampMetalRemoval(inputs: CalculatorInputs): CalculationResults['trampMetalRemoval'] {
  const { magnet, conveyor, burden, shape, misc } = inputs;
  
  // Base magnetic force calculation
  const magneticFieldStrength = calculateMagneticField(inputs);
  const magneticForce = magneticFieldStrength.tesla * 0.003 * 1000; // Assuming iron susceptibility
  
  // Belt speed factor - higher speeds reduce collection efficiency
  const beltSpeedFactor = Math.max(0.3, 1 - (conveyor.beltSpeed - 1) * 0.15);
  
  // Feed depth factor - thicker layers reduce efficiency
  const depthFactor = Math.max(0.4, 1 - (burden.feedDepth - 50) / 500);
  
  // Trough angle factor - affects material distribution
  const troughFactor = Math.max(0.8, 1 - (conveyor.troughAngle - 20) * 0.01);
  
  // Environmental factors
  const tempFactor = Math.max(0.7, 1 - Math.abs(misc.ambientTemperature - 25) / 100);
  const altitudeFactor = Math.max(0.9, 1 - misc.altitude / 5000);
  
  // Water content impact
  const waterFactor = Math.max(0.6, 1 - burden.waterContent / 50);
  
  // Gap factor - smaller gaps improve efficiency
  const gapFactor = Math.max(0.5, 1 - (magnet.gap - 100) / 400);
  
  // Core:Belt ratio factor
  const ratioFactor = 0.5 + magnet.coreBeltRatio * 0.5;
  
  // Particle size factors based on shape dimensions
  const avgSize = (shape.width + shape.length + shape.height) / 3;
  const particleSizeFactors = {
    fine: avgSize < 10 ? 0.7 : avgSize < 20 ? 0.8 : 0.9,
    medium: avgSize < 10 ? 0.9 : avgSize < 20 ? 0.95 : 0.85,
    large: avgSize < 10 ? 0.95 : avgSize < 20 ? 0.9 : 0.8
  };
  
  // Calculate base efficiency
  const baseEfficiency = Math.min(0.98, magneticForce * 0.15);
  
  // Apply all factors
  const overallEfficiency = baseEfficiency * 
    beltSpeedFactor * depthFactor * troughFactor * tempFactor * 
    altitudeFactor * waterFactor * gapFactor * ratioFactor;
  
  return {
    overallEfficiency: Math.min(0.99, Math.max(0.1, overallEfficiency)),
    fineParticles: Math.min(0.95, Math.max(0.05, overallEfficiency * particleSizeFactors.fine)),
    mediumParticles: Math.min(0.98, Math.max(0.1, overallEfficiency * particleSizeFactors.medium)),
    largeParticles: Math.min(0.99, Math.max(0.15, overallEfficiency * particleSizeFactors.large))
  };
}

export function calculateThermalPerformance(inputs: CalculatorInputs): CalculationResults['thermalPerformance'] {
  const { magnet, conveyor, burden, misc } = inputs;
  
  // Simplified power calculation based on core:belt ratio
  const basePower = magnet.coreBeltRatio * 10; // kW base power
  
  // Throughput factor
  const throughputFactor = 1 + (burden.throughPut / 100) * 0.1;
  
  // Belt speed factor
  const speedFactor = 1 + (conveyor.beltSpeed / 5) * 0.2;
  
  // Total power loss
  const totalPowerLoss = basePower * throughputFactor * speedFactor;
  
  // Cooling efficiency (assuming air cooling)
  const coolingEfficiency = 0.65;
  
  // Environmental factors affecting cooling
  const altitudeFactor = Math.max(0.7, 1 - misc.altitude / 3000);
  const tempFactor = Math.max(0.6, 1 - (misc.ambientTemperature - 20) / 50);
  
  const effectiveCoolingEfficiency = coolingEfficiency * altitudeFactor * tempFactor;
  
  // Temperature rise calculation
  const thermalResistance = 1 / effectiveCoolingEfficiency;
  const temperatureRise = totalPowerLoss * thermalResistance;
  
  return {
    totalPowerLoss,
    temperatureRise,
    coolingEfficiency: effectiveCoolingEfficiency
  };
}

export function recommendSeparatorModel(inputs: CalculatorInputs): CalculationResults['recommendedModel'] {
  const { magnet, conveyor, burden, misc } = inputs;
  
  const models = [
    { name: 'EMAX Air Cooled', baseScore: 85 },
    { name: 'OCW Oil Cooled', baseScore: 90 },
    { name: 'Suspended Electromagnet', baseScore: 80 },
    { name: 'Drum Separator', baseScore: 75 },
    { name: 'Cross-Belt Separator', baseScore: 82 }
  ];
  
  const scoredModels = models.map(model => {
    let score = model.baseScore;
    
    // Adjust based on belt width
    if (conveyor.beltWidth > 1800 && model.name.includes('Cross-Belt')) {
      score += 5;
    }
    
    // Adjust based on throughput
    if (burden.throughPut > 500 && model.name.includes('Oil')) {
      score += 8;
    }
    
    // Adjust based on gap size
    if (magnet.gap < 100 && model.name.includes('Drum')) {
      score += 6;
    }
    
    // Adjust based on environmental conditions
    if (misc.ambientTemperature > 35 && model.name.includes('Oil')) {
      score += 6;
    }
    
    // Adjust based on core:belt ratio
    if (magnet.coreBeltRatio > 0.7 && model.name.includes('EMAX')) {
      score += 8;
    }
    
    return { model: model.name, score: Math.min(100, score) };
  });
  
  scoredModels.sort((a, b) => b.score - a.score);
  
  return {
    model: scoredModels[0].model,
    score: scoredModels[0].score,
    alternatives: scoredModels.slice(1, 4)
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