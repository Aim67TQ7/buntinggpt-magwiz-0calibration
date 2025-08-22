import { CalculatorInputs, CalculationResults, EnhancedCalculationResults, OptimizationResult } from '@/types/calculator';
import { validateCalculationResults, getRecommendedValidationTools } from '@/utils/validation';

/* ------------------------- Calibratable constants ------------------------- */
const μ0 = 4 * Math.PI * 1e-7;          // H/m
const g_grav = 9.80665;                 // m/s^2
const ρ_steel = 7800;                   // kg/m^3 (ferrous tramp)
const B_SAT = 1.8;                      // Tesla, steel saturation proxy
const DECAY_N = 2.5;                    // field decay exponent (2–3 typical)
const CAL_NI_PER_RATIO_PER_M = 2.2e5;   // A·turns per (ratio·meter of belt width)
const LEAKAGE_MM = 12;                  // mm, adds to effective gap
const CAL_KP_W_PER_AT2 = 1.2e-5;        // W / (A·turn)^2  (electrical loss scaling)
const RTH_AIR_BASE = 0.32;              // °C/W (air-cooled baseline)
const ALT_DERATE_PER_KM = 0.12;         // convective loss derate per km
const AMB_REF = 25;                     // °C reference for cooling
const AMB_DERATE_PER_10C = 0.10;        // -10% h per +10°C
const CAPTURE_SAFETY_K = 1.6;           // margin on resisting forces
const LOGIT_STEEPNESS = 4.0;            // mapping force ratio → probability
const LOGIT_CENTER = 1.0;               // 50% at Fm/Fres = 1
/* ------------------------------------------------------------------------- */

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function roundSig(x: number, sig = 3) {
  if (!isFinite(x) || x === 0) return 0;
  const p = Math.pow(10, sig - 1 - Math.floor(Math.log10(Math.abs(x))));
  return Math.round(x * p) / p;
}

/** Estimate NI (ampere-turns) from geometry proxy (core:belt ratio & belt width) */
function estimateNI(inputs: CalculatorInputs): number {
  const { magnet, conveyor } = inputs;
  const width_m = (conveyor.beltWidth || 1000) / 1000; // m
  // Scales linearly with core coverage of belt and magnet family
  return CAL_NI_PER_RATIO_PER_M * magnet.coreBeltRatio * width_m;
}

/** Effective air gap including leakage margin (m) */
function effectiveGap_m(inputs: CalculatorInputs): number {
  const { magnet } = inputs;
  const g_m = (magnet.gap ?? 100) / 1000; // m
  return g_m + LEAKAGE_MM / 1000; // leakage/stray path
}

/** Field at belt and simple decay model */
export function calculateMagneticField(inputs: CalculatorInputs): CalculationResults['magneticFieldStrength'] {
  const NI = estimateNI(inputs);
  const g_eff = effectiveGap_m(inputs);

  // B0 limited by saturation
  const B0 = Math.min((μ0 * NI) / g_eff, B_SAT);

  // Convert
  const tesla = roundSig(B0, 3);
  const gauss = Math.round(tesla * 10000);

  // “Penetration depth”: distance where B(d) = 0.1·B0 from B(d)=B0*(g/(g+d))^n
  // Solve (g/(g+δ))^n = 0.1 ⇒ δ = g*(10^(1/n) - 1)
  const tenPow = Math.pow(10, 1 / DECAY_N);
  const penetrationDepth_m = g_eff * (tenPow - 1);
  const penetrationDepth = Math.max(0, Math.round(penetrationDepth_m * 1000)); // mm, integer display

  return { tesla, gauss, penetrationDepth };
}

/** Capture physics + calibrated factors */
export function calculateTrampMetalRemoval(inputs: CalculatorInputs): CalculationResults['trampMetalRemoval'] {
  const { conveyor, burden, shape, misc, magnet } = inputs;

  // Field model
  const NI = estimateNI(inputs);
  const g_eff = effectiveGap_m(inputs);
  const B0 = Math.min((μ0 * NI) / g_eff, B_SAT);

  // Evaluate at mid-burden depth (cap to 150 mm for fines relevance)
  const d_mid_m = 0.5 * Math.min((burden.feedDepth || 50) / 1000, 0.15);
  const B_at_d = B0 * Math.pow(g_eff / (g_eff + d_mid_m), DECAY_N);

  // Gradient of B^2 from decay model (analytic derivative)
  // B(d) = B0*(g/(g+d))^n
  // dB/dd = -n * B0 * g^n * (g+d)^(-n-1)
  const g = g_eff, n = DECAY_N;
  const dB_dd = -n * B0 * Math.pow(g, n) * Math.pow(g + d_mid_m, -n - 1);
  const dB2_dd = 2 * B_at_d * dB_dd; // derivative of B^2

  // Particle volume & mass from user “shape” (mm → m)
  const w = Math.max(1, shape.width) / 1000;
  const l = Math.max(1, shape.length) / 1000;
  const h = Math.max(1, shape.height) / 1000;
  const Vp = w * l * h;                // m^3
  const mp = Vp * ρ_steel;             // kg
  const dChi = 0.003;                  // susceptibility delta

  // Magnetic force (point-particle approximation)
  const Fm = (Vp * dChi / (2 * μ0)) * Math.abs(dB2_dd); // N

  // Resisting force proxy: gravity + motion penalty with belt speed
  const v = Math.max(0.1, conveyor.beltSpeed);
  const F_resist = CAPTURE_SAFETY_K * (mp * g_grav) * (1 + 0.25 * (v - 1)); // N

  // Base capture probability via logistic map on force ratio
  const ratio = Fm / Math.max(1e-9, F_resist);
  const p_capture = 1 / (1 + Math.exp(-LOGIT_STEEPNESS * (ratio - LOGIT_CENTER)));

  // Environmental/operational penalties (clamped 0..1)
  const f_speed = clamp01(1 - 0.15 * Math.max(0, v - 1));
  const f_depth = clamp01(1 - (burden.feedDepth || 0) / 500);
  const f_trough = clamp01(1 - Math.max(0, (conveyor.troughAngle || 20) - 20) * 0.01);
  const f_temp = clamp01(1 - Math.abs((misc.ambientTemperature ?? AMB_REF) - AMB_REF) / 100);
  const f_alt = clamp01(1 - (misc.altitude || 0) / 5000);
  const f_water = clamp01(1 - (burden.waterContent || 0) / 50);
  const f_gap = clamp01(Math.pow((magnet.gap > 0 ? (100 / magnet.gap) : 1), 1.0)); // relative to 100 mm
  const f_env = clamp01(f_temp * f_alt * f_water);

  // Overall base efficiency
  const η_base = clamp01(p_capture * f_speed * f_depth * f_trough * f_env * f_gap);

  // Size-class mapping (kept compatible with your UI expectations)
  const avgSize_mm = (shape.width + shape.length + shape.height) / 3;
  const fineMult   = avgSize_mm < 10 ? 0.85 : avgSize_mm < 20 ? 0.75 : 0.65;
  const medMult    = avgSize_mm < 10 ? 0.90 : avgSize_mm < 20 ? 0.92 : 0.85;
  const largeMult  = avgSize_mm < 10 ? 0.88 : avgSize_mm < 20 ? 0.90 : 0.92;

  const overall = clamp01(η_base);
  const fine = clamp01(overall * fineMult);
  const medium = clamp01(overall * medMult);
  const large = clamp01(overall * largeMult);

  return {
    overallEfficiency: roundSig(Math.min(0.99, Math.max(0.05, overall)), 3),
    fineParticles:      roundSig(Math.min(0.98, Math.max(0.05, fine)), 3),
    mediumParticles:    roundSig(Math.min(0.99, Math.max(0.05, medium)), 3),
    largeParticles:     roundSig(Math.min(0.995, Math.max(0.05, large)), 3),
  };
}

/** Thermal losses from NI proxy and ΔT via thermal resistance */
export function calculateThermalPerformance(inputs: CalculatorInputs): CalculationResults['thermalPerformance'] {
  const { misc } = inputs;

  const NI = estimateNI(inputs);

  // Electrical copper loss proxy (covers I^2R without needing coil geometry)
  const totalPowerLoss_W = (NI * NI) * CAL_KP_W_PER_AT2;
  const totalPowerLoss = roundSig(totalPowerLoss_W / 1000, 3); // kW

  // Thermal resistance (air-cooled baseline, derated by ambient & altitude)
  const altitude_km = (misc.altitude || 0) / 1000;
  const f_alt = Math.max(0.5, 1 - ALT_DERATE_PER_KM * altitude_km);
  const amb = misc.ambientTemperature ?? AMB_REF;
  const f_amb = Math.max(0.5, 1 - AMB_DERATE_PER_10C * Math.max(0, (amb - AMB_REF) / 10));

  const Rth = RTH_AIR_BASE / (f_alt * f_amb); // °C/W
  const temperatureRise_C = (totalPowerLoss_W) * Rth;

  const temperatureRise = Math.max(0, roundSig(temperatureRise_C, 3));
  const coolingEfficiency = clamp01((RTH_AIR_BASE / Rth)); // 0..1 notion for UI

  return {
    totalPowerLoss,
    temperatureRise,
    coolingEfficiency
  };
}

/* ------------------------ Model recommendation (kept) --------------------- */
/* Left mostly as-is, but this now aligns better with plausible losses.      */
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

    if (conveyor.beltWidth > 1800 && model.name.includes('Cross-Belt')) score += 5;
    if (burden.throughPut > 500 && model.name.includes('Oil')) score += 8;
    if (magnet.gap < 100 && model.name.includes('Drum')) score += 6;
    if (misc.ambientTemperature > 35 && model.name.includes('Oil')) score += 6;
    if (magnet.coreBeltRatio > 0.7 && model.name.includes('EMAX')) score += 8;

    return { model: model.name, score: Math.min(100, score) };
  }).sort((a, b) => b.score - a.score);

  return {
    model: scoredModels[0].model,
    score: scoredModels[0].score,
    alternatives: scoredModels.slice(1, 4)
  };
}

/* ----------------------- No changes below this line ----------------------- */
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
    if (currentEfficiency >= targetEfficiency) break;

    // Heuristics aligned with corrected physics
    if (currentInputs.magnet.gap > bounds.gap.min) {
      currentInputs.magnet.gap = Math.max(bounds.gap.min, currentInputs.magnet.gap - bounds.gap.step);
    }
    if (currentInputs.magnet.coreBeltRatio < bounds.coreBeltRatio.max) {
      currentInputs.magnet.coreBeltRatio = Math.min(bounds.coreBeltRatio.max, currentInputs.magnet.coreBeltRatio + bounds.coreBeltRatio.step);
    }
    if (currentInputs.conveyor.beltSpeed > bounds.beltSpeed.min) {
      currentInputs.conveyor.beltSpeed = Math.max(bounds.beltSpeed.min, currentInputs.conveyor.beltSpeed - bounds.beltSpeed.step);
    }
    if (currentInputs.burden.feedDepth > bounds.feedDepth.min) {
      currentInputs.burden.feedDepth = Math.max(bounds.feedDepth.min, currentInputs.burden.feedDepth - bounds.feedDepth.step);
    }
    iterations++;
  }

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
  ].filter(c => Math.abs(c.change) > 0.1);

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

    const finalResults = { ...baseResults, validation, recommendedTools, optimization };
    console.log('Enhanced calculation completed:', finalResults);
    return finalResults;
  } catch (error) {
    console.error('Error in performEnhancedCalculation:', error);
    throw error;
  }
}
