// src/utils/calculations.ts

import {
  CalculatorInputs,
  CalculationResults,
  EnhancedCalculationResults,
  OptimizationResult,
} from '@/types/calculator';
import { validateCalculationResults, getRecommendedValidationTools } from '@/utils/validation';

/* ───────────────────────────── Calibratable Constants ───────────────────────────── */
const μ0 = 4 * Math.PI * 1e-7;      // H/m
const B_SAT = 1.8;                  // Tesla (steel saturation proxy)
const DECAY_N = 2.5;                // Field decay exponent (2–3 typical)
const LEAKAGE_MM = 12;              // mm added to effective gap (leakage/fringe)
const AMBIENT_REF = 25;             // °C reference
const ALT_DERATE_PER_KM = 0.12;     // convective derate per km altitude
const AMB_DERATE_PER_10C = 0.10;    // -10% h per +10°C above ref
const RTH_AIR_BASE = 0.30;          // °C/W (air cooled baseline)
const RTH_OIL_BASE = 0.085;         // °C/W (oil cooled baseline, typical band 0.06–0.10)
const G = 9.80665;                  // m/s²

// NI estimation from geometry proxy (kept for workflows lacking coil data)
const CAL_NI_PER_RATIO_PER_M = 2.2e5; // A·turns per (ratio·meter belt width)

// Coil physics
const RHO_CU_20C = 1.72e-8;         // Ω·m (copper at 20°C)
const TCR_CU = 0.00393;             // 1/°C (copper temp coefficient)
// Defaults used if coil details not provided (tune per family)
const N_EFF_DEFAULT = 600;          // turns
const L_MEAN_DEFAULT = 1.10;        // m per turn
const ACU_DEFAULT = 85e-6;          // m² total copper area across strands

// Capture physics
const DELTA_CHI = 0.003;            // susceptibility delta (ferrous vs. matrix)
const LOGIT_K = 4.0;                // logistic slope
const LOGIT_X0 = 1.0;               // 50% capture at Fm/Fres = 1
const CAPTURE_K = 1.6;              // safety factor on resisting force

// Penalty weights (sum ≈ 1); tune with field data
const W_SPEED = 0.25;
const W_DEPTH = 0.25;
const W_GAP   = 0.20;
const W_WATER = 0.10;
const W_TROUGH= 0.08;
const W_TEMP  = 0.06;
const W_ALT   = 0.06;

/* ────────────────────────────────── Utilities ────────────────────────────────── */
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function roundSig(x: number, sig = 3) {
  if (!isFinite(x) || x === 0) return 0;
  const p = Math.pow(10, sig - 1 - Math.floor(Math.log10(Math.abs(x))));
  return Math.round(x * p) / p;
}
function round3(x: number) { return Math.round(x * 1000) / 1000; }

function gmeanWeighted(pairs: Array<[number, number]>) {
  const sumW = pairs.reduce((s, [, w]) => s + w, 0) || 1;
  const val = Math.exp(pairs.reduce((s, [f, w]) => s + w * Math.log(Math.max(1e-6, f)), 0) / sumW);
  return Math.min(1, Math.max(0.4, val)); // prevent collapse below 0.4
}

/** Tiny getters/setters for optimizer (avoid external deps). */
function getPath(obj: any, path: (string | number)[]) {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj: any, path: (string | number)[], value: any) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
  o[path[path.length - 1]] = value;
}
function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/* ───────────────────────────── Derived Helpers ───────────────────────────── */
function estimateNI(inputs: CalculatorInputs): number {
  const { magnet, conveyor } = inputs;
  const width_m = (conveyor.beltWidth || 1000) / 1000; // m
  return CAL_NI_PER_RATIO_PER_M * Math.max(0, magnet.coreBeltRatio) * Math.max(0.4, width_m);
}

function effectiveGap_m(inputs: CalculatorInputs): number {
  const g_m = (inputs.magnet.gap ?? 100) / 1000;
  return Math.max(0.01, g_m + LEAKAGE_MM / 1000); // >=1 cm for stability
}

/** Coil parameters (use provided values if available; else reasonable defaults). */
function coilParamsFor(inputs: CalculatorInputs) {
  const m: any = inputs.magnet || {};
  const width_m = (inputs.conveyor.beltWidth || 1000) / 1000;

  const N = (m.turns ?? (N_EFF_DEFAULT * Math.max(0.6, m.coreBeltRatio) * Math.max(0.8, width_m)));
  const lMean = (m.meanTurnLength ?? L_MEAN_DEFAULT);
  const Acu = (m.copperArea ?? ACU_DEFAULT);
  const coolingType: 'air' | 'oil' = (m.coolingType === 'oil' ? 'oil' : 'air');

  return { N, lMean, Acu, coolingType };
}

/* ────────────────────────── Magnetic Field Calculation ───────────────────────── */
export function calculateMagneticField(
  inputs: CalculatorInputs
): CalculationResults['magneticFieldStrength'] {
  const NI = estimateNI(inputs);
  const g_eff = effectiveGap_m(inputs);

  const B0 = Math.min((μ0 * NI) / g_eff, B_SAT);

  const tesla = roundSig(B0, 3);
  const gauss = Math.round(tesla * 10000);

  // Penetration depth: B(d) = 0.1*B0 for B(d)=B0*(g/(g+d))^n ⇒ δ = g*(10^(1/n)-1)
  const tenPow = Math.pow(10, 1 / DECAY_N);
  const penetrationDepth_m = g_eff * (tenPow - 1);
  const penetrationDepth = Math.max(0, Math.round(penetrationDepth_m * 1000)); // mm

  return { tesla, gauss, penetrationDepth };
}

/* ─────────────────────── Tramp Metal Removal Efficiency ─────────────────────── */
export function calculateTrampMetalRemoval(
  inputs: CalculatorInputs
): CalculationResults['trampMetalRemoval'] {
  const { conveyor, burden, shape, misc, magnet } = inputs;

  // Simplified but more realistic approach based on magnetic field strength
  const magneticField = calculateMagneticField(inputs);
  const B = magneticField.tesla;
  
  // Base efficiency from magnetic field strength
  let baseEfficiency = Math.min(0.98, Math.max(0.4, (B - 0.1) / 1.2)); // Scale 0.1-1.3T to 40-98%
  
  // Apply operational factors
  const v = Math.max(0.1, conveyor.beltSpeed);
  const f_speed = Math.max(0.6, 1 - (v - 1) * 0.15);
  const f_depth = Math.max(0.5, 1 - (burden.feedDepth || 50) / 400);
  const f_gap = Math.max(0.6, Math.pow(100 / Math.max(50, magnet.gap || 100), 0.8));
  const f_water = Math.max(0.7, 1 - (burden.waterContent || 0) / 50);
  const f_trough = Math.max(0.85, 1 - Math.max(0, (conveyor.troughAngle || 20) - 20) * 0.01);
  const f_temp = Math.max(0.8, 1 - Math.abs((misc.ambientTemperature ?? AMBIENT_REF) - AMBIENT_REF) / 100);
  const f_alt = Math.max(0.9, 1 - (misc.altitude || 0) / 5000);
  const f_ratio = Math.max(0.6, 0.5 + (magnet.coreBeltRatio || 0.6) * 0.5);

  // Combined factor using geometric mean for stability
  const factors = [f_speed, f_depth, f_gap, f_water, f_trough, f_temp, f_alt, f_ratio];
  const fCombined = Math.pow(factors.reduce((prod, f) => prod * f, 1), 1 / factors.length);
  
  // Apply combined factors
  const overall = baseEfficiency * fCombined;

  // Size-class scaling based on particle size
  const avgSize = (shape.width + shape.length + shape.height) / 3;
  const fineMult = avgSize < 10 ? 0.85 : avgSize < 20 ? 0.88 : 0.92;
  const medMult = avgSize < 10 ? 0.92 : avgSize < 20 ? 0.95 : 0.97;
  const largeMult = avgSize < 10 ? 0.88 : avgSize < 20 ? 0.93 : 0.96;

  return {
    overallEfficiency: round3(Math.min(0.99, Math.max(0.3, overall))),
    fineParticles: round3(Math.min(0.98, Math.max(0.25, overall * fineMult))),
    mediumParticles: round3(Math.min(0.99, Math.max(0.3, overall * medMult))),
    largeParticles: round3(Math.min(0.995, Math.max(0.28, overall * largeMult))),
  };
}

/* ────────────────────────────── Thermal Performance ───────────────────────────── */
export function calculateThermalPerformance(
  inputs: CalculatorInputs
): CalculationResults['thermalPerformance'] {
  const { misc, magnet, conveyor, burden } = inputs;

  // Simplified power calculation based on magnetic system size and loading
  const beltWidth_m = (conveyor.beltWidth || 1000) / 1000;
  const throughput = burden.throughPut || 100;
  const coreBeltRatio = magnet.coreBeltRatio || 0.6;
  
  // Base power scales with magnet size and field strength
  const magneticField = calculateMagneticField(inputs);
  const basePower = Math.pow(magneticField.tesla, 2) * beltWidth_m * coreBeltRatio * 8; // kW
  
  // Loading factors
  const throughputFactor = 1 + (throughput / 500) * 0.3;
  const speedFactor = 1 + ((conveyor.beltSpeed || 2) / 4) * 0.2;
  
  const totalPowerLoss = roundSig(basePower * throughputFactor * speedFactor, 2);

  // Realistic thermal resistance based on cooling type
  const ambient = misc.ambientTemperature ?? AMBIENT_REF;
  const altitude = misc.altitude ?? 0;
  
  const { coolingType } = coilParamsFor(inputs);
  
  // More realistic thermal resistance values
  const baseRth = coolingType === 'oil' ? 0.8 : 2.5; // °C/kW
  
  // Environmental derating
  const altitudeFactor = Math.max(0.7, 1 - altitude / 4000);
  const tempFactor = Math.max(0.8, 1 - Math.max(0, ambient - 25) / 40);
  
  const effectiveRth = baseRth / (altitudeFactor * tempFactor);
  
  // Temperature rise in realistic range
  const temperatureRise = roundSig(totalPowerLoss * effectiveRth, 1);
  
  // Cooling efficiency as percentage
  const coolingEfficiency = roundSig(Math.min(0.95, baseRth / effectiveRth), 2);

  return { 
    totalPowerLoss, 
    temperatureRise: Math.min(150, temperatureRise), // Cap at reasonable value
    coolingEfficiency 
  };
}

/* ─────────────────────────── Model Recommendation ─────────────────────────── */
export function recommendSeparatorModel(
  inputs: CalculatorInputs
): CalculationResults['recommendedModel'] {
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
    if (burden.throughPut > 500 && model.name.includes('Oil'))         score += 8;
    if (magnet.gap < 100 && model.name.includes('Drum'))               score += 6;
    if (misc.ambientTemperature > 35 && model.name.includes('Oil'))    score += 6;
    if (magnet.coreBeltRatio > 0.7 && model.name.includes('EMAX'))     score += 8;

    return { model: model.name, score: Math.min(100, score) };
  }).sort((a, b) => b.score - a.score);

  return {
    model: scoredModels[0].model,
    score: scoredModels[0].score,
    alternatives: scoredModels.slice(1, 4)
  };
}

/* ─────────────────────────── Complete + Enhanced Calcs ─────────────────────────── */
export function performCompleteCalculation(inputs: CalculatorInputs): CalculationResults {
  console.log('Starting calculation with inputs:', inputs);
  try {
    const results = {
      magneticFieldStrength: calculateMagneticField(inputs),
      trampMetalRemoval:     calculateTrampMetalRemoval(inputs),
      thermalPerformance:    calculateThermalPerformance(inputs),
      recommendedModel:      recommendSeparatorModel(inputs),
    };
    console.log('Calculation results:', results);
    return results;
  } catch (error) {
    console.error('Error in performCompleteCalculation:', error);
    throw error;
  }
}

/* ─────────────────────────────── Optimizer (Improved) ───────────────────────────────
   Pattern search / coordinate descent:
   • Tests ± step per parameter; accepts improvements.
   • Shrinks step size when no improvement.
   • Soft penalties for safety violations (B, temperature).
   • Same API and return shape as before. */
export function optimizeForEfficiency(
  inputs: CalculatorInputs,
  targetEfficiency: number = 0.95,
  maxIterations: number = 100
): OptimizationResult {
  const originalInputs = deepClone(inputs);
  let currentInputs = deepClone(inputs);
  let bestInputs = deepClone(inputs);
  let bestScore = -1e9;
  let iterations = 0;

  const PARAMS: Array<{
    path: (string | number)[];
    step0: number;
    min: number;
    max: number;
  }> = [
    { path: ['magnet','gap'],           step0: 10,   min: 50,  max: 300 },
    { path: ['magnet','coreBeltRatio'], step0: 0.05, min: 0.3, max: 0.9 },
    { path: ['conveyor','beltSpeed'],   step0: 0.2,  min: 0.5, max: 4.0 },
    { path: ['burden','feedDepth'],     step0: 10,   min: 10,  max: 200 },
  ];

  function scoreInputs(x: CalculatorInputs): number {
    const res = performCompleteCalculation(x);
    const η = res.trampMetalRemoval.overallEfficiency;

    // Soft safety penalties
    const operatingTemp = (x.misc.ambientTemperature ?? AMBIENT_REF) + res.thermalPerformance.temperatureRise;
    const tempOver = Math.max(0, operatingTemp - 150);     // °C over soft limit
    const Bover    = Math.max(0, res.magneticFieldStrength.tesla - 1.5); // T over soft limit

    return η - 0.002 * tempOver - 0.2 * Bover; // tune weights as needed
  }

  // Initialize score
  bestScore = scoreInputs(currentInputs);

  let stepScale = 1.0;
  while (iterations < maxIterations) {
    let improved = false;

    for (const p of PARAMS) {
      const baseVal = getPath(currentInputs, p.path) as number;
      const step = p.step0 * stepScale;

      // Try both directions
      for (const dir of [-1, +1]) {
        const trial = deepClone(currentInputs);
        const nv = Math.min(p.max, Math.max(p.min, baseVal + dir * step));
        setPath(trial, p.path, nv);

        const sc = scoreInputs(trial);
        if (sc > bestScore) {
          bestScore = sc;
          currentInputs = trial;
          bestInputs = deepClone(trial);
          improved = true;
          break; // move to next parameter
        }
      }
    }

    if (!improved) stepScale *= 0.5;  // shrink steps if no gains
    if (stepScale < 0.05) break;      // termination
    iterations++;
    if (bestScore >= targetEfficiency) break; // early exit if already great
  }

  const finalRes = performCompleteCalculation(bestInputs);
  const bestEfficiency = finalRes.trampMetalRemoval.overallEfficiency;

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

/* ─────────────────────────────── Enhanced Wrapper ─────────────────────────────── */
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
