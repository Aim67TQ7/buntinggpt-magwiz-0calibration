import { CalculatorInputs, CalculationResults, EnhancedCalculationResults } from '@/types/calculator';
import { validateCalculationResults, getRecommendedValidationTools } from '@/utils/validation';

const MU_0 = 4 * Math.PI * 1e-7; // Permeability of free space (H/m)
const COPPER_RESISTIVITY = 1.7e-8; // Ohm·m at 20°C
const STEEL_PERMEABILITY = 4000; // Typical for magnetic steel

export function calculateMagneticField(inputs: CalculatorInputs): CalculationResults['magneticFieldStrength'] {
  const { magnetic, geometric } = inputs;
  
  // Electromagnetic field calculation using reluctance circuit model
  const airGapReluctance = (magnetic.magnetGap / 1000) / (MU_0 * (geometric.elementWidth * geometric.elementLength) / 1e6);
  const coreLength = 2 * (geometric.elementWidth + geometric.elementLength + geometric.elementHeight) / 1000; // Estimate core path length
  const coreReluctance = coreLength / (MU_0 * STEEL_PERMEABILITY * (geometric.elementWidth * geometric.elementHeight) / 1e6);
  
  const totalReluctance = airGapReluctance + coreReluctance;
  const magneticFlux = (magnetic.numberOfTurns * magnetic.current) / totalReluctance;
  const magneticFluxDensity = magneticFlux / ((geometric.elementWidth * geometric.elementLength) / 1e6);
  
  const fieldStrengthGauss = magneticFluxDensity * 10000;
  const penetrationDepth = Math.sqrt(magneticFluxDensity * 1000) * 12; // mm, adjusted for electromagnets
  
  return {
    tesla: parseFloat(magneticFluxDensity.toFixed(4)),
    gauss: parseFloat(fieldStrengthGauss.toFixed(2)),
    penetrationDepth: parseFloat(penetrationDepth.toFixed(2))
  };
}

export function calculateTrampMetalRemoval(inputs: CalculatorInputs): CalculationResults['trampMetalRemoval'] {
  const { magnetic, material, geometric, environmental } = inputs;
  const fieldStrength = calculateMagneticField(inputs);
  
  // Enhanced physics-based efficiency calculation
  
  // 1. Magnetic force factor: F ∝ χ × ∇(B²) with field gradient optimization
  const fieldGradient = fieldStrength.tesla / (magnetic.magnetGap / 1000); // T/m
  const poleConfigurationFactor = magnetic.poleConfiguration === 'focused' ? 1.3 : 
                                  magnetic.poleConfiguration === 'alternating' ? 1.1 : 1.0;
  const magneticForceFactor = (material.magneticSusceptibility / 1000) * 
                              fieldGradient * fieldStrength.tesla * poleConfigurationFactor;
  
  // 2. Belt speed and residence time effects
  const residenceTime = (geometric.elementLength / 1000) / geometric.beltSpeed; // seconds
  const optimalResidenceTime = 0.5; // seconds for optimal capture
  const residenceTimeFactor = Math.min(1.0, residenceTime / optimalResidenceTime);
  
  // 3. Material flow and distribution effects
  const feedRateNormalized = geometric.feedRate / (geometric.beltWidth * geometric.beltSpeed * 3.6); // Normalize to belt capacity
  const layerThicknessFactor = Math.max(0.4, 1 - (geometric.materialLayerThickness / 100) * 0.6); // Thicker layers reduce efficiency
  const flowCharacteristicsFactor = material.flowCharacteristics === 'free-flowing' ? 1.0 :
                                   material.flowCharacteristics === 'cohesive' ? 0.85 : 0.7;
  
  // 4. Particle size efficiency with distribution consideration
  const avgParticleSize = (material.trampMetalSize.min + material.trampMetalSize.max) / 2;
  const particleSizeBaseFactor = Math.min(1.0, avgParticleSize / 10); // Normalized to 10mm reference
  const distributionFactor = material.particleDistribution === 'coarse' ? 1.1 :
                            material.particleDistribution === 'mixed' ? 1.0 : 0.8; // Fine particles harder
  const particleSizeEfficiency = particleSizeBaseFactor * distributionFactor;
  
  // 5. Competitive forces (gravity, momentum, centrifugal)
  const gravitationalForce = material.bulkDensity * 9.81; // N/m³
  const momentumForce = material.bulkDensity * Math.pow(geometric.beltSpeed, 2); // Simplified momentum
  const magneticForceStrength = magneticForceFactor * 1000; // Convert to comparable units
  const forceRatio = magneticForceStrength / (gravitationalForce + momentumForce);
  const competitiveForceFactor = Math.min(1.0, forceRatio / 2.0); // Magnetic force should dominate
  
  // 6. Equipment configuration optimization
  const numberOfPolesFactor = Math.min(1.2, 1 + (magnetic.numberOfPoles - 2) * 0.05); // More poles help
  const arrangementFactor = magnetic.magnetArrangement === 'cross-belt' ? 1.15 :
                           magnetic.magnetArrangement === 'drum' ? 1.1 : 1.0;
  
  // 7. Environmental and operational factors
  const moisturePenalty = Math.max(0.5, 1 - (material.waterContent / 100) * 0.4);
  const vibrationFactor = environmental.vibrationLevel === 'low' ? 1.0 :
                         environmental.vibrationLevel === 'medium' ? 0.95 : 0.9;
  const airCurrentFactor = environmental.airCurrents === 'none' ? 1.0 :
                          environmental.airCurrents === 'mild' ? 0.98 : 0.95;
  const preConditioningFactor = environmental.materialPreConditioning === 'both' ? 1.15 :
                               environmental.materialPreConditioning === 'screening' ? 1.08 :
                               environmental.materialPreConditioning === 'drying' ? 1.05 : 1.0;
  
  // 8. Contamination level effect (higher contamination can reduce efficiency due to overloading)
  const contaminationFactor = Math.max(0.8, 1 - (material.contaminationLevel / 100) * 0.3);
  
  // Base efficiency from empirical data for magnetic separators
  const baseEfficiency = 0.82; // Slightly higher base with proper configuration
  
  // Calculate overall efficiency with all factors
  const overallEfficiency = Math.min(0.99, baseEfficiency * 
    Math.min(1.5, magneticForceFactor) * 
    residenceTimeFactor * 
    layerThicknessFactor * 
    flowCharacteristicsFactor * 
    particleSizeEfficiency * 
    competitiveForceFactor * 
    numberOfPolesFactor * 
    arrangementFactor * 
    moisturePenalty * 
    vibrationFactor * 
    airCurrentFactor * 
    preConditioningFactor * 
    contaminationFactor);
  
  // Size-specific efficiencies with enhanced modeling
  const fineEfficiency = overallEfficiency * 0.7; // < 5mm - improved from 0.65
  const mediumEfficiency = overallEfficiency * 0.9; // 5-15mm - improved from 0.85
  const largeEfficiency = overallEfficiency * 0.98; // > 15mm - improved from 0.95
  
  return {
    overallEfficiency: parseFloat((overallEfficiency * 100).toFixed(2)),
    fineParticles: parseFloat((fineEfficiency * 100).toFixed(2)),
    mediumParticles: parseFloat((mediumEfficiency * 100).toFixed(2)),
    largeParticles: parseFloat((largeEfficiency * 100).toFixed(2))
  };
}

export function calculateThermalPerformance(inputs: CalculatorInputs): CalculationResults['thermalPerformance'] {
  const { magnetic, environmental, geometric } = inputs;
  
  // All systems are now electromagnetic, so calculate power losses
  
  // Copper loss calculation: P = I²R
  const wireLength = magnetic.numberOfTurns * 2 * (geometric.elementWidth + geometric.elementHeight) / 1000; // meters
  const wireCrossSection = 2.5e-6; // 2.5 mm² typical magnet wire cross-section
  const resistance = COPPER_RESISTIVITY * wireLength / wireCrossSection; // Ohms
  const copperLosses = Math.pow(magnetic.current, 2) * resistance; // Watts
  
  // Core losses (hysteresis and eddy current) - Steinmetz equation approximation
  const fieldStrength = calculateMagneticField(inputs);
  const coreVolume = (geometric.elementWidth * geometric.elementLength * geometric.elementHeight) / 1e9; // m³
  const coreLosses = magnetic.powerSourceType === 'electromagnetic-oil' ? 
    coreVolume * 1000 * Math.pow(fieldStrength.tesla, 1.6) : // W/m³ for laminated core
    coreVolume * 2000 * Math.pow(fieldStrength.tesla, 1.6); // Higher losses for air-cooled
  
  const totalPowerLoss = copperLosses + coreLosses;
  
  // Thermal resistance calculation
  const surfaceArea = 2 * (geometric.elementWidth * geometric.elementLength + 
                          geometric.elementWidth * geometric.elementHeight + 
                          geometric.elementLength * geometric.elementHeight) / 1e6; // m²
  
  const thermalResistance = magnetic.powerSourceType === 'electromagnetic-oil' ? 
    0.1 / surfaceArea : // Oil cooling: 0.1 K·m²/W
    0.05 / surfaceArea; // Air cooling: 0.05 K·m²/W (forced convection)
  
  // Temperature rise calculation
  const altitudeDeratingFactor = 1 + (environmental.altitude / 1000) * 0.02; // 2% per 1000m
  const ambientTempFactor = 1 + (environmental.operatingTemperature - 25) / 100;
  
  const temperatureRise = totalPowerLoss * thermalResistance * altitudeDeratingFactor * ambientTempFactor;
  
  const coolingEfficiency = magnetic.powerSourceType === 'electromagnetic-oil' ? 0.92 : 0.78;
  
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
  
  // Normalized scoring factors (0-100 scale)
  const models = {
    'EMAX (Air Cooled)': {
      score: 0,
      factors: {
        efficiency: efficiency.overallEfficiency * 1.05, // Slightly better magnetic circuit
        powerEfficiency: Math.max(0, 100 - thermal.totalPowerLoss * 0.1), // Better power efficiency than oil
        maintenance: 80, // Moderate maintenance
        reliability: 85, // Good reliability  
        cost: 85 // Moderate cost
      }
    },
    'OCW (Oil Cooled)': {
      score: 0,
      factors: {
        efficiency: efficiency.overallEfficiency * 1.15, // Best magnetic performance due to cooling
        powerEfficiency: Math.max(0, 100 - thermal.totalPowerLoss * 0.05), // Best thermal management
        maintenance: 70, // Higher maintenance due to oil system
        reliability: 75, // More complex system
        cost: 65 // Highest initial and operating cost
      }
    }
  };
  
  // Calculate weighted scores (efficiency 40%, power 25%, maintenance 20%, reliability 10%, cost 5%)
  const weights = { efficiency: 0.4, powerEfficiency: 0.25, maintenance: 0.2, reliability: 0.1, cost: 0.05 };
  
  Object.keys(models).forEach(modelName => {
    const model = models[modelName as keyof typeof models];
    model.score = Object.entries(model.factors).reduce((sum, [factor, value]) => {
      const weight = weights[factor as keyof typeof weights] || 0;
      return sum + (value * weight);
    }, 0);
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