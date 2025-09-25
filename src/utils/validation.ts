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

/* -------------------------- Global assumptions --------------------------- */
// Use the same ambient reference as the calc layer when inputs aren't available.
const AMBIENT_REF_C = 25; // °C

/* --------------------------- Safety thresholds --------------------------- */
/** NOTE: efficiencies are FRACTIONS (0..1), not percentages */
export const SAFETY_THRESHOLDS: SafetyThresholds = {
  maxTemperature: 180,       // °C absolute operating limit
  maxMagneticField: 1.5,     // Tesla
  maxRemovalEfficiency: 0.98,// fraction
  warningTemperature: 120,   // °C absolute
  warningMagneticField: 1.2, // Tesla
  warningRemovalEfficiency: 0.90 // fraction
};

/* -------------------------- Equipment ratings --------------------------- */
export const EQUIPMENT_RATINGS: Record<string, EquipmentRating> = {
  'EMAX (Air Cooled)': {
    model: 'EMAX (Air Cooled)', 
    maxPowerLoss: 8,      // kW (air-cooled envelope)
    maxOperatingTemp: 120,// °C absolute
    maxMagneticField: 1.4,// Tesla
    thermalRating: 800,   // W/m² (informational)
  },
  'OCW (Oil Cooled)': {
    model: 'OCW (Oil Cooled)',
    maxPowerLoss: 25,     // kW
    maxOperatingTemp: 150,// °C absolute
    maxMagneticField: 1.6,// Tesla
    thermalRating: 2500,  // W/m²
  },
  'OCW + Process Optimization': {
    model: 'OCW + Process Optimization',
    maxPowerLoss: 30,     // kW (upsized for optimization)
    maxOperatingTemp: 160,// °C absolute
    maxMagneticField: 1.7,// Tesla
    thermalRating: 3000,  // W/m²
  },
  'OCW Upsized (Oil Cooled)': {
    model: 'OCW Upsized (Oil Cooled)',
    maxPowerLoss: 35,     // kW (larger capacity)
    maxOperatingTemp: 155,// °C absolute
    maxMagneticField: 1.65,// Tesla
    thermalRating: 2800,  // W/m²
  },
  'Cross-Belt Separator': {
    model: 'Cross-Belt Separator',
    maxPowerLoss: 15,     // kW
    maxOperatingTemp: 140,// °C absolute
    maxMagneticField: 1.5,// Tesla
    thermalRating: 1500,  // W/m²
  },
  'Permanent Magnet Separator': {
    model: 'Permanent Magnet Separator',
    maxPowerLoss: 0,      // kW (no power consumption)
    maxOperatingTemp: 80, // °C absolute
    maxMagneticField: 0.8,// Tesla
    thermalRating: 0,     // W/m²
  },
  'Large Permanent Magnet': {
    model: 'Large Permanent Magnet',
    maxPowerLoss: 0,      // kW (no power consumption)
    maxOperatingTemp: 80, // °C absolute
    maxMagneticField: 1.0,// Tesla
    thermalRating: 0,     // W/m²
  },
  'Suspended Electromagnet': {
    model: 'Suspended Electromagnet',
    maxPowerLoss: 20,     // kW
    maxOperatingTemp: 130,// °C absolute
    maxMagneticField: 1.3,// Tesla
    thermalRating: 1800,  // W/m²
  },
  'Drum Separator': {
    model: 'Drum Separator',
    maxPowerLoss: 5,      // kW
    maxOperatingTemp: 100,// °C absolute
    maxMagneticField: 1.1,// Tesla
    thermalRating: 600,   // W/m²
  },
};

/* ------------------------- Professional tools list ---------------------- */
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

/* ------------------------------ Utilities -------------------------------- */
function pct(x: number) { return (x * 100).toFixed(1) + '%'; }
function fmt(x: number, digits = 2) { return Number.isFinite(x) ? x.toFixed(digits) : String(x); }

/* ----------------------------- Validation -------------------------------- */
export function validateCalculationResults(results: CalculationResults): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Equipment rating for recommended model
  const equipmentRating = EQUIPMENT_RATINGS[results.recommendedModel.model];

  if (!equipmentRating) {
    errors.push({
      field: 'recommendedModel',
      message: 'CRITICAL: Equipment rating not found for recommended model',
      value: 0,
      threshold: 0,
      recommendation: 'Check equipment database configuration for the selected model.',
    });
    return {
      isValid: false,
      severity: 'critical',
      errors,
      warnings,
      equipmentCompliance: {
        powerCompliance: false,
        thermalCompliance: false,
        magneticCompliance: false,
        overallCompliance: false,
        rating: {
          model: 'Unknown',
          maxPowerLoss: 0,
          maxOperatingTemp: 0,
          maxMagneticField: 0,
          thermalRating: 0,
        },
      },
    };
  }

  /* ---------- Derived values (use ambient reference if not provided) -------- */
  const deltaT = results.thermalPerformance.temperatureRise;       // °C
  const totalPowerLoss_kW = results.thermalPerformance.totalPowerLoss; // kW
  const B_T = results.magneticFieldStrength.tesla;                 // Tesla
  const eta = results.trampMetalRemoval.overallEfficiency;         // fraction 0..1

  // Absolute operating temperature assumed = ambient_ref + ΔT
  const operatingTemp_C = AMBIENT_REF_C + deltaT;

  /* ------------------------------ Criticals -------------------------------- */
  if (operatingTemp_C > SAFETY_THRESHOLDS.maxTemperature) {
    errors.push({
      field: 'temperature',
      message: 'CRITICAL: Operating temperature exceeds safe limit',
      value: operatingTemp_C,
      threshold: SAFETY_THRESHOLDS.maxTemperature,
      recommendation: 'Reduce ampere-turns, enhance cooling (higher airflow or oil), or change configuration.',
    });
  }

  if (B_T > SAFETY_THRESHOLDS.maxMagneticField) {
    errors.push({
      field: 'magneticField',
      message: 'CRITICAL: Magnetic field exceeds design limit',
      value: B_T,
      threshold: SAFETY_THRESHOLDS.maxMagneticField,
      recommendation: 'Reduce NI (current/turns) or increase effective gap.',
    });
  }

  if (eta > SAFETY_THRESHOLDS.maxRemovalEfficiency) {
    errors.push({
      field: 'removalEfficiency',
      message: 'CRITICAL: Calculated efficiency exceeds physical limit',
      value: eta,
      threshold: SAFETY_THRESHOLDS.maxRemovalEfficiency,
      recommendation: 'Recheck inputs; cross-validate with test data. Clamp η to ≤98%.',
    });
  }

  if (totalPowerLoss_kW > equipmentRating.maxPowerLoss) {
    errors.push({
      field: 'powerLoss',
      message: 'CRITICAL: Power loss exceeds equipment rating',
      value: totalPowerLoss_kW,
      threshold: equipmentRating.maxPowerLoss,
      recommendation: 'Select higher-rated equipment or reduce NI / duty cycle.',
    });
  }

  /* -------------------------------- Warnings ------------------------------- */
  if (operatingTemp_C > SAFETY_THRESHOLDS.warningTemperature && operatingTemp_C <= SAFETY_THRESHOLDS.maxTemperature) {
    warnings.push({
      field: 'temperature',
      message: 'WARNING: Operating temperature nearing limit',
      value: operatingTemp_C,
      threshold: SAFETY_THRESHOLDS.warningTemperature,
      suggestion: 'Consider improved cooling, verify ambient assumptions, or derate throughput.',
    });
  }

  if (B_T > SAFETY_THRESHOLDS.warningMagneticField && B_T <= SAFETY_THRESHOLDS.maxMagneticField) {
    warnings.push({
      field: 'magneticField',
      message: 'WARNING: Magnetic field approaching limit',
      value: B_T,
      threshold: SAFETY_THRESHOLDS.warningMagneticField,
      suggestion: 'Maintain margin; validate against pole material saturation.',
    });
  }

  if (eta > SAFETY_THRESHOLDS.warningRemovalEfficiency && eta <= SAFETY_THRESHOLDS.maxRemovalEfficiency) {
    warnings.push({
      field: 'removalEfficiency',
      message: 'WARNING: Very high efficiency — verify realism',
      value: eta,
      threshold: SAFETY_THRESHOLDS.warningRemovalEfficiency,
      suggestion: 'Cross-check with historical capture data or a pilot run.',
    });
  }

  /* --------------------------- Compliance matrix --------------------------- */
  const equipmentCompliance: EquipmentComplianceStatus = {
    powerCompliance: totalPowerLoss_kW <= equipmentRating.maxPowerLoss,
    thermalCompliance: operatingTemp_C <= equipmentRating.maxOperatingTemp,
    magneticCompliance: B_T <= equipmentRating.maxMagneticField,
    overallCompliance: true,
    rating: equipmentRating,
  };
  equipmentCompliance.overallCompliance =
    equipmentCompliance.powerCompliance &&
    equipmentCompliance.thermalCompliance &&
    equipmentCompliance.magneticCompliance;

  /* -------------------------------- Severity -------------------------------- */
  const severity = errors.length > 0 ? 'critical' : (warnings.length > 0 ? 'warning' : 'info');

  return {
    isValid: errors.length === 0,
    severity,
    errors,
    warnings,
    equipmentCompliance,
  };
}

/* -------------------- Tool suggestions based on results ------------------- */
export function getRecommendedValidationTools(results: CalculationResults): string[] {
  const tools: string[] = [];

  // Always recommend COMSOL for full-stack EM + thermal correlation
  tools.push('comsol');

  // Near/over magnetic limits → ANSYS/Maxwell beneficial
  if (results.magneticFieldStrength.tesla >= SAFETY_THRESHOLDS.warningMagneticField) {
    tools.push('ansys');
  }

  // Complex or extreme scenarios → MATLAB for algorithm sanity checks
  if (results.trampMetalRemoval.overallEfficiency >= SAFETY_THRESHOLDS.warningRemovalEfficiency ||
      (AMBIENT_REF_C + results.thermalPerformance.temperatureRise) >= SAFETY_THRESHOLDS.warningTemperature) {
    tools.push('matlab');
  }

  return tools;
}

/* ---------------------- Structured export for reports --------------------- */
export function generateValidationExportData(results: CalculationResults, validation: ValidationResult) {
  const operatingTemp_C = AMBIENT_REF_C + results.thermalPerformance.temperatureRise;

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
      temperatureCheck: operatingTemp_C <= SAFETY_THRESHOLDS.maxTemperature,
      magneticFieldCheck: results.magneticFieldStrength.tesla <= SAFETY_THRESHOLDS.maxMagneticField,
      efficiencyCheck: results.trampMetalRemoval.overallEfficiency <= SAFETY_THRESHOLDS.maxRemovalEfficiency,
    },
    keyNumbers: {
      operatingTemperature: fmt(operatingTemp_C, 1) + ' °C',
      magneticField: fmt(results.magneticFieldStrength.tesla, 3) + ' T',
      overallEfficiency: pct(results.trampMetalRemoval.overallEfficiency),
      powerLoss: fmt(results.thermalPerformance.totalPowerLoss, 2) + ' kW',
    },
    recommendations: [
      ...validation.errors.map(e => e.recommendation),
      ...validation.warnings.map(w => w.suggestion),
    ].filter(Boolean),
  };
}
