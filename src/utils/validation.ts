import { 
  CalculationResults, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  SafetyThresholds, 
  EquipmentRating,
  EquipmentComplianceStatus,
  ValidationTools
} from '@/types/calculator';

// Safety thresholds configuration
export const SAFETY_THRESHOLDS: SafetyThresholds = {
  maxTemperature: 300, // °C
  maxMagneticField: 2.0, // Tesla
  maxRemovalEfficiency: 100, // %
  warningTemperature: 250, // °C
  warningMagneticField: 1.8, // Tesla
  warningRemovalEfficiency: 95, // %
};

// Equipment rating database
export const EQUIPMENT_RATINGS: Record<string, EquipmentRating> = {
  'PCB (Permanent Magnet)': {
    model: 'PCB',
    maxPowerLoss: 5.0, // kW
    maxOperatingTemp: 200, // °C
    maxMagneticField: 1.5, // Tesla
    thermalRating: 500, // W/m²
  },
  'EMAX (Air Cooled)': {
    model: 'EMAX',
    maxPowerLoss: 15.0, // kW
    maxOperatingTemp: 150, // °C
    maxMagneticField: 2.2, // Tesla
    thermalRating: 800, // W/m²
  },
  'OCW (Oil Cooled)': {
    model: 'OCW',
    maxPowerLoss: 25.0, // kW
    maxOperatingTemp: 120, // °C
    maxMagneticField: 2.5, // Tesla
    thermalRating: 1200, // W/m²
  },
};

// Professional validation tools
export const VALIDATION_TOOLS: ValidationTools = {
  comsol: {
    name: 'COMSOL Multiphysics',
    description: 'Electromagnetic field analysis and thermal modeling',
    exportFormat: '.mph',
    useCase: 'Detailed FEA simulation for magnetic field distribution and thermal analysis',
  },
  ansys: {
    name: 'ANSYS Maxwell',
    description: 'Magnetic circuit optimization and field analysis',
    exportFormat: '.aedtresults',
    useCase: 'Electromagnetic design optimization and performance validation',
  },
  matlab: {
    name: 'MATLAB Magnetic Modeling Toolbox',
    description: 'Algorithm verification and custom modeling',
    exportFormat: '.mat',
    useCase: 'Custom algorithm development and calculation verification',
  },
};

export function validateCalculationResults(results: CalculationResults): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Get equipment rating for recommended model
  const equipmentRating = EQUIPMENT_RATINGS[results.recommendedModel.model];
  
  // Critical error checks
  if (results.thermalPerformance.temperatureRise > SAFETY_THRESHOLDS.maxTemperature) {
    errors.push({
      field: 'temperatureRise',
      message: 'CRITICAL: Temperature exceeds safe operating limit',
      value: results.thermalPerformance.temperatureRise,
      threshold: SAFETY_THRESHOLDS.maxTemperature,
      recommendation: 'Reduce current, increase cooling, or select different magnet configuration',
    });
  }
  
  if (results.magneticFieldStrength.tesla > SAFETY_THRESHOLDS.maxMagneticField) {
    errors.push({
      field: 'magneticField',
      message: 'CRITICAL: Magnetic field exceeds design limit',
      value: results.magneticFieldStrength.tesla,
      threshold: SAFETY_THRESHOLDS.maxMagneticField,
      recommendation: 'Reduce ampere-turns or increase magnet gap',
    });
  }
  
  if (results.trampMetalRemoval.overallEfficiency > SAFETY_THRESHOLDS.maxRemovalEfficiency) {
    errors.push({
      field: 'removalEfficiency',
      message: 'CRITICAL: Calculated efficiency exceeds physical limit',
      value: results.trampMetalRemoval.overallEfficiency,
      threshold: SAFETY_THRESHOLDS.maxRemovalEfficiency,
      recommendation: 'Review input parameters - calculation may be invalid',
    });
  }
  
  // Equipment rating violations
  if (results.thermalPerformance.totalPowerLoss > equipmentRating.maxPowerLoss) {
    errors.push({
      field: 'powerLoss',
      message: 'CRITICAL: Power loss exceeds equipment rating',
      value: results.thermalPerformance.totalPowerLoss,
      threshold: equipmentRating.maxPowerLoss,
      recommendation: `Select higher rated equipment or reduce power requirements`,
    });
  }
  
  // Warning checks
  if (results.thermalPerformance.temperatureRise > SAFETY_THRESHOLDS.warningTemperature) {
    warnings.push({
      field: 'temperatureRise',
      message: 'WARNING: Temperature approaching safe limit',
      value: results.thermalPerformance.temperatureRise,
      threshold: SAFETY_THRESHOLDS.warningTemperature,
      suggestion: 'Consider enhanced cooling or reduced operating parameters',
    });
  }
  
  if (results.magneticFieldStrength.tesla > SAFETY_THRESHOLDS.warningMagneticField) {
    warnings.push({
      field: 'magneticField',
      message: 'WARNING: Magnetic field approaching design limit',
      value: results.magneticFieldStrength.tesla,
      threshold: SAFETY_THRESHOLDS.warningMagneticField,
      suggestion: 'Monitor field strength and consider safety margins',
    });
  }
  
  if (results.trampMetalRemoval.overallEfficiency > SAFETY_THRESHOLDS.warningRemovalEfficiency) {
    warnings.push({
      field: 'removalEfficiency',
      message: 'WARNING: High efficiency - verify calculation accuracy',
      value: results.trampMetalRemoval.overallEfficiency,
      threshold: SAFETY_THRESHOLDS.warningRemovalEfficiency,
      suggestion: 'Cross-validate with empirical data or field testing',
    });
  }
  
  // Equipment compliance status
  const equipmentCompliance: EquipmentComplianceStatus = {
    powerCompliance: results.thermalPerformance.totalPowerLoss <= equipmentRating.maxPowerLoss,
    thermalCompliance: results.thermalPerformance.temperatureRise <= equipmentRating.maxOperatingTemp,
    magneticCompliance: results.magneticFieldStrength.tesla <= equipmentRating.maxMagneticField,
    overallCompliance: true,
    rating: equipmentRating,
  };
  
  equipmentCompliance.overallCompliance = 
    equipmentCompliance.powerCompliance && 
    equipmentCompliance.thermalCompliance && 
    equipmentCompliance.magneticCompliance;
  
  // Determine severity
  const severity = errors.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'info';
  
  return {
    isValid: errors.length === 0,
    severity,
    errors,
    warnings,
    equipmentCompliance,
  };
}

export function getRecommendedValidationTools(results: CalculationResults): string[] {
  const tools: string[] = [];
  
  // Always recommend COMSOL for comprehensive analysis
  tools.push('comsol');
  
  // Recommend ANSYS for high magnetic field applications
  if (results.magneticFieldStrength.tesla > 1.5) {
    tools.push('ansys');
  }
  
  // Recommend MATLAB for complex calculations or unusual parameters
  if (results.trampMetalRemoval.overallEfficiency > 90 || 
      results.thermalPerformance.temperatureRise > 200) {
    tools.push('matlab');
  }
  
  return tools;
}

export function generateValidationExportData(results: CalculationResults, validation: ValidationResult) {
  return {
    calculationResults: results,
    validation: {
      status: validation.isValid ? 'PASS' : 'FAIL',
      severity: validation.severity.toUpperCase(),
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      equipmentCompliance: validation.equipmentCompliance.overallCompliance ? 'COMPLIANT' : 'NON-COMPLIANT',
    },
    safetyChecks: {
      temperatureCheck: results.thermalPerformance.temperatureRise <= SAFETY_THRESHOLDS.maxTemperature,
      magneticFieldCheck: results.magneticFieldStrength.tesla <= SAFETY_THRESHOLDS.maxMagneticField,
      efficiencyCheck: results.trampMetalRemoval.overallEfficiency <= SAFETY_THRESHOLDS.maxRemovalEfficiency,
    },
    recommendations: [
      ...validation.errors.map(e => e.recommendation),
      ...validation.warnings.map(w => w.suggestion),
    ],
  };
}