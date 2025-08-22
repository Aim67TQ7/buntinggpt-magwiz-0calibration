import { CalculatorInputs, CalculationResults, EnhancedCalculationResults, OptimizationResult } from '@/types/calculator';
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
    { name: 'EMAX (Air Cooled)', baseScore: 85 },
    { name: 'OCW (Oil Cooled)', baseScore: 90 },
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
  console.log('Starting calculation with inputs:', inputs);
  
  try {
    const results = {
      magneticFieldStrength: calculateMagneticField(inputs),
      trampMetalRemoval: calculateTrampMetalRemoval(inputs),
      thermalPerformance: calculateThermalPerformance(inputs),
      recommendedModel: recommendSeparatorModel(inputs)
    };
    
    console.log('Calculation results:', results);
    return results;
  } catch (error) {
    console.error('Error in performCompleteCalculation:', error);
    throw error;
  }
}

export function optimizeForEfficiency(
  inputs: CalculatorInputs,
  targetEfficiency: number = 0.95,
  maxIterations: number = 100
): OptimizationResult {
  const originalInputs = { ...inputs };
  let currentInputs = { ...inputs };
  let bestInputs = { ...inputs };
  let bestEfficiency = 0;
  let iterations = 0;

  // Define optimization bounds
  const bounds = {
    gap: { min: 50, max: 300, step: 5 },
    coreBeltRatio: { min: 0.3, max: 0.9, step: 0.05 },
    beltSpeed: { min: 0.5, max: 4.0, step: 0.1 },
    feedDepth: { min: 10, max: 200, step: 10 }
  };

  while (iterations < maxIterations) {
    const results = calculateTrampMetalRemoval(currentInputs);
    const currentEfficiency = results.overallEfficiency;

    if (currentEfficiency > bestEfficiency) {
      bestEfficiency = currentEfficiency;
      bestInputs = { ...currentInputs };
    }

    if (currentEfficiency >= targetEfficiency) {
      break;
    }

    // Optimize parameters that most directly affect efficiency
    if (currentEfficiency < targetEfficiency) {
      // Reduce gap to improve magnetic field strength
      if (currentInputs.magnet.gap > bounds.gap.min) {
        currentInputs.magnet.gap = Math.max(
          bounds.gap.min,
          currentInputs.magnet.gap - bounds.gap.step
        );
      }
      
      // Increase core:belt ratio for stronger field
      if (currentInputs.magnet.coreBeltRatio < bounds.coreBeltRatio.max) {
        currentInputs.magnet.coreBeltRatio = Math.min(
          bounds.coreBeltRatio.max,
          currentInputs.magnet.coreBeltRatio + bounds.coreBeltRatio.step
        );
      }
      
      // Reduce belt speed for more collection time
      if (currentInputs.conveyor.beltSpeed > bounds.beltSpeed.min) {
        currentInputs.conveyor.beltSpeed = Math.max(
          bounds.beltSpeed.min,
          currentInputs.conveyor.beltSpeed - bounds.beltSpeed.step
        );
      }
      
      // Reduce feed depth for better accessibility
      if (currentInputs.burden.feedDepth > bounds.feedDepth.min) {
        currentInputs.burden.feedDepth = Math.max(
          bounds.feedDepth.min,
          currentInputs.burden.feedDepth - bounds.feedDepth.step
        );
      }
    }

    iterations++;
  }

  // Calculate parameter changes
  const parameterChanges = [
    {
      parameter: 'Gap (mm)',
      originalValue: originalInputs.magnet.gap,
      optimizedValue: bestInputs.magnet.gap,
      change: ((bestInputs.magnet.gap - originalInputs.magnet.gap) / originalInputs.magnet.gap) * 100
    },
    {
      parameter: 'Core:Belt Ratio',
      originalValue: originalInputs.magnet.coreBeltRatio,
      optimizedValue: bestInputs.magnet.coreBeltRatio,
      change: ((bestInputs.magnet.coreBeltRatio - originalInputs.magnet.coreBeltRatio) / originalInputs.magnet.coreBeltRatio) * 100
    },
    {
      parameter: 'Belt Speed (m/s)',
      originalValue: originalInputs.conveyor.beltSpeed,
      optimizedValue: bestInputs.conveyor.beltSpeed,
      change: ((bestInputs.conveyor.beltSpeed - originalInputs.conveyor.beltSpeed) / originalInputs.conveyor.beltSpeed) * 100
    },
    {
      parameter: 'Feed Depth (mm)',
      originalValue: originalInputs.burden.feedDepth,
      optimizedValue: bestInputs.burden.feedDepth,
      change: ((bestInputs.burden.feedDepth - originalInputs.burden.feedDepth) / originalInputs.burden.feedDepth) * 100
    }
  ].filter(change => Math.abs(change.change) > 0.1);

  return {
    success: bestEfficiency >= targetEfficiency,
    iterations,
    targetEfficiency,
    achievedEfficiency: bestEfficiency,
    optimizedParameters: {
      gap: bestInputs.magnet.gap,
      coreBeltRatio: bestInputs.magnet.coreBeltRatio,
      beltSpeed: bestInputs.conveyor.beltSpeed,
      feedDepth: bestInputs.burden.feedDepth
    },
    parameterChanges
  };
}

export function performEnhancedCalculation(
  inputs: CalculatorInputs, 
  optimizeMode: boolean = false,
  targetEfficiency?: number
): EnhancedCalculationResults {
  console.log('Starting enhanced calculation:', { optimizeMode, targetEfficiency });
  
  try {
    const baseResults = performCompleteCalculation(inputs);
    console.log('Base results completed');
    
    const validation = validateCalculationResults(baseResults);
    console.log('Validation completed:', validation);
    
    const recommendedTools = getRecommendedValidationTools(baseResults);
    console.log('Recommended tools:', recommendedTools);
    
    let optimization: OptimizationResult | undefined;
    
    if (optimizeMode && targetEfficiency) {
      console.log('Starting optimization for target:', targetEfficiency);
      optimization = optimizeForEfficiency(inputs, targetEfficiency);
      console.log('Optimization completed:', optimization);
    }
    
    const finalResults = {
      ...baseResults,
      validation,
      recommendedTools,
      optimization
    };
    
    console.log('Enhanced calculation completed:', finalResults);
    return finalResults;
  } catch (error) {
    console.error('Error in performEnhancedCalculation:', error);
    throw error;
  }
}