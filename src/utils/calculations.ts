import { CalculatorInputs, CalculationResults, EnhancedCalculationResults } from '@/types/calculator';
import { validateCalculationResults, getRecommendedValidationTools } from '@/utils/validation';

const MU_0 = 4 * Math.PI * 1e-7; // Permeability of free space (H/m)
const COPPER_RESISTIVITY = 1.7e-8; // Ohm·m at 20°C
const STEEL_PERMEABILITY = 4000; // Typical for magnetic steel

export function calculateMagneticField(inputs: CalculatorInputs): CalculationResults['magneticFieldStrength'] {
  const { magnetic, geometric } = inputs;
  
  if (magnetic.powerSourceType === 'permanent') {
    // Permanent magnet field calculation (simplified)
    const magneticFluxDensity = 0.3 + (magnetic.ampereTurns / 10000) * 0.8; // Tesla, typical range 0.3-1.1T
    const fieldStrengthGauss = magneticFluxDensity * 10000;
    const penetrationDepth = Math.sqrt(magneticFluxDensity * 1000) * 15; // mm, empirical formula
    
    return {
      tesla: parseFloat(magneticFluxDensity.toFixed(4)),
      gauss: parseFloat(fieldStrengthGauss.toFixed(2)),
      penetrationDepth: parseFloat(penetrationDepth.toFixed(2))
    };
  } else {
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
}

export function calculateTrampMetalRemoval(inputs: CalculatorInputs): CalculationResults['trampMetalRemoval'] {
  const { magnetic, material, geometric } = inputs;
  const fieldStrength = calculateMagneticField(inputs);
  
  // Physics-based efficiency calculation
  // Magnetic force factor: F ∝ χ × ∇(B²)
  const fieldGradient = fieldStrength.tesla / (magnetic.magnetGap / 1000); // T/m
  const magneticForceFactor = (material.magneticSusceptibility / 1000) * fieldGradient * fieldStrength.tesla;
  
  // Particle size efficiency (larger particles easier to capture)
  const avgParticleSize = (material.trampMetalSize.min + material.trampMetalSize.max) / 2;
  const particleSizeEfficiency = Math.min(1.0, avgParticleSize / 10); // Normalized to 10mm reference
  
  // Belt speed effect (suspension height affects residence time)
  const residenceTimeFactor = Math.max(0.3, 1 - (geometric.suspensionHeight / 800)); // Normalized to max height
  
  // Material property factors
  const bulkDensityFactor = Math.min(1.0, material.bulkDensity / 3.0); // Normalized to 3 t/m³
  const moisturePenalty = Math.max(0.5, 1 - (material.waterContent / 100) * 0.4);
  
  // Base efficiency from empirical data for magnetic separators
  const baseEfficiency = 0.78; // Realistic base efficiency
  
  const overallEfficiency = Math.min(0.98, baseEfficiency * 
    Math.min(1.2, magneticForceFactor) * 
    particleSizeEfficiency * 
    residenceTimeFactor * 
    bulkDensityFactor * 
    moisturePenalty);
  
  // Size-specific efficiencies (fine particles are harder to capture)
  const fineEfficiency = overallEfficiency * 0.65; // < 5mm
  const mediumEfficiency = overallEfficiency * 0.85; // 5-15mm  
  const largeEfficiency = overallEfficiency * 0.95; // > 15mm
  
  return {
    overallEfficiency: parseFloat((overallEfficiency * 100).toFixed(2)),
    fineParticles: parseFloat((fineEfficiency * 100).toFixed(2)),
    mediumParticles: parseFloat((mediumEfficiency * 100).toFixed(2)),
    largeParticles: parseFloat((largeEfficiency * 100).toFixed(2))
  };
}

export function calculateThermalPerformance(inputs: CalculatorInputs): CalculationResults['thermalPerformance'] {
  const { magnetic, environmental, geometric } = inputs;
  
  if (magnetic.powerSourceType === 'permanent') {
    // Permanent magnets have no electrical losses
    return {
      totalPowerLoss: 0,
      temperatureRise: environmental.operatingTemperature - 20, // Ambient rise only
      coolingEfficiency: 1.0
    };
  }
  
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
    'PCB (Permanent Magnet)': {
      score: 0,
      factors: {
        efficiency: efficiency.overallEfficiency, // Already in %
        powerEfficiency: Math.max(0, 100 - thermal.totalPowerLoss), // Inverse of power loss
        maintenance: 95, // Low maintenance score
        reliability: 90, // High reliability
        cost: 75 // Higher initial cost but lower operating cost
      }
    },
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