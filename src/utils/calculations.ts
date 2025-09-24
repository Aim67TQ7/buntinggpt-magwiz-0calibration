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

// NI estimation from geometry proxy (kept for workflows lacking coil data) - SCALED DOWN
const CAL_NI_PER_RATIO_PER_M = 2200; // A·turns per (ratio·meter belt width) - reduced by 100x

// Coil physics
const RHO_CU_20C = 1.72e-8;         // Ω·m (copper at 20°C)
const TCR_CU = 0.00393;             // 1/°C (copper temp coefficient)
// Defaults used if coil details not provided (tune per family)
const N_EFF_DEFAULT = 600;          // turns
const L_MEAN_DEFAULT = 1.10;        // m per turn
const ACU_DEFAULT = 200e-6;          // m² total copper area across strands - increased from 85e-6

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
  const last = path[path.length - 1];
  const parent = getPath(obj, path.slice(0, -1));
  if (parent != null) parent[last] = value;
}
function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/* ───────────────────────────── Derived Helpers ───────────────────────────── */
function estimateNI(inputs: CalculatorInputs): number {
  const { magnet, conveyor } = inputs;
  const width_m = (conveyor.beltWidth || 1000) / 1000; // m
  const result = CAL_NI_PER_RATIO_PER_M * Math.max(0, magnet.coreBeltRatio) * Math.max(0.4, width_m);
  
  console.log('estimateNI calculation:', {
    CAL_NI_PER_RATIO_PER_M,
    coreBeltRatio: magnet.coreBeltRatio,
    beltWidth_mm: conveyor.beltWidth,
    width_m,
    formula: `${CAL_NI_PER_RATIO_PER_M} * ${Math.max(0, magnet.coreBeltRatio)} * ${Math.max(0.4, width_m)}`,
    result
  });
  
  return result;
}

function effectiveGap_m(inputs: CalculatorInputs): number {
  const g_m = (inputs.magnet.gap ?? 100) / 1000;
  const result = Math.max(0.01, g_m + LEAKAGE_MM / 1000); // >=1 cm for stability
  
  console.log('effectiveGap_m calculation:', {
    gap_input_mm: inputs.magnet.gap,
    g_m,
    LEAKAGE_MM,
    formula: `max(0.01, ${g_m} + ${LEAKAGE_MM / 1000})`,
    result
  });
  
  return result;
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
  // Debug logging: Log all input values
  console.log('=== MAGNETIC FIELD CALCULATION DEBUG ===');
  console.log('Input values:', {
    gap: inputs.magnet.gap,
    coreBeltRatio: inputs.magnet.coreBeltRatio,
    beltWidth: inputs.conveyor.beltWidth,
    position: inputs.magnet.position,
    ampereTurns: inputs.advanced?.magneticSystem?.ampereTurns
  });

  const NI = estimateNI(inputs);
  const g_eff = effectiveGap_m(inputs);

  const B0 = Math.min((μ0 * NI) / g_eff, B_SAT);

  // Debug logging: Show intermediate calculations with high precision
  console.log('Intermediate calculations:', {
    NI: NI,
    g_eff_meters: g_eff,
    g_eff_mm: g_eff * 1000,
    μ0: μ0,
    B_SAT: B_SAT,
    B0_unrounded: B0,
    formula: `B0 = min((${μ0} * ${NI}) / ${g_eff}, ${B_SAT}) = ${B0}`
  });

  // Use higher precision for debugging
  const tesla = roundSig(B0, 6); // Increased from 3 to 6 significant figures
  const gauss = Math.round(tesla * 10000);

  // Penetration depth: B(d) = 0.1*B0 for B(d)=B0*(g/(g+d))^n ⇒ δ = g*(10^(1/n)-1)
  const tenPow = Math.pow(10, 1 / DECAY_N);
  const penetrationDepth_m = g_eff * (tenPow - 1);
  const penetrationDepth = Math.max(0, Math.round(penetrationDepth_m * 1000)); // mm

  const result = { tesla, gauss, penetrationDepth };
  console.log('Final magnetic field result:', result);
  console.log('=== END MAGNETIC FIELD DEBUG ===');

  return result;
}

/* ─────────────────────── Tramp Metal Removal Efficiency ─────────────────────── */
export function calculateTrampMetalRemoval(
  inputs: CalculatorInputs
): CalculationResults['trampMetalRemoval'] {
  const { conveyor, burden, shape, misc, magnet } = inputs;

  // Base field at effective gap
  const magneticField = calculateMagneticField(inputs);
  const B0 = magneticField.tesla;
  const g_eff = effectiveGap_m(inputs); // [m]

  // Power-law field decay and gradient (calibratable exponent)
  const N_DECAY = 3.0;
  const B_at = (z_m: number) => B0 / Math.pow(1 + z_m / g_eff, N_DECAY);
  const dBdz_at = (z_m: number) => -(N_DECAY * B0 / g_eff) / Math.pow(1 + z_m / g_eff, N_DECAY + 1);

  // Representative evaluation height: half the burden depth, at least 10 mm
  const zStar_m = Math.max(0.010, (burden.feedDepth || 50) / 2000);

  // Capture index proportional to magnetic force ~ B * dB/dz (T^2/m)
  const CI = Math.abs(B_at(zStar_m) * dBdz_at(zStar_m));

  // Map CI to base capture efficiency via logistic curve; scale fit needed from test data
  const CI_SCALE = 1.0; // tuning constant; set from back-tests
  const baseEfficiency = clamp01(0.30 + 0.68 * Math.tanh(CI / CI_SCALE));

  // Operational reduction factors (each ≤ 1.0, with floors)
  const v = Math.max(0.1, conveyor.beltSpeed || 2);
  const f_speed  = Math.min(1, Math.max(0.6, 1 - (v - 1) * 0.15));
  const f_depth  = Math.min(1, Math.max(0.5, 1 - (burden.feedDepth || 50) / 400));
  const f_gap    = Math.min(1, Math.max(0.6, Math.pow(100 / Math.max(50, magnet.gap || 100), 0.8)));
  const f_water  = Math.min(1, Math.max(0.7, 1 - (burden.waterContent || 0) / 50));
  const f_trough = Math.min(1, Math.max(0.85, 1 - Math.max(0, (conveyor.troughAngle || 20) - 20) * 0.01));
  const f_temp   = Math.min(1, Math.max(0.8, 1 - Math.abs((misc.ambientTemperature ?? 25) - 25) / 100));
  const f_alt    = Math.min(1, Math.max(0.7, Math.exp(- (misc.altitude || 0) / 8500))); // air density effect
  const f_ratio  = Math.min(1, Math.max(0.6, 0.5 + (magnet.coreBeltRatio || 0.6) * 0.5));

  // Weighted geometric mean of factors
  const factors: Array<[number, number]> = [
    [f_speed,  W_SPEED],
    [f_depth,  W_DEPTH],
    [f_gap,    W_GAP],
    [f_water,  W_WATER],
    [f_trough, W_TROUGH],
    [f_temp,   W_TEMP],
    [f_alt,    W_ALT],
    [f_ratio,  0.10],
  ];
  const fCombined = gmeanWeighted(factors);

  const overall = clamp01(baseEfficiency * fCombined);

  // Size-class scaling based on particle size
  const avgSize = ((shape.width || 20) + (shape.length || 20) + (shape.height || 10)) / 3;
  const fineMult = avgSize < 10 ? 0.85 : avgSize < 20 ? 0.88 : 0.92;
  const medMult  = avgSize < 10 ? 0.92 : avgSize < 20 ? 0.95 : 0.97;
  const largeMult= avgSize < 10 ? 0.88 : avgSize < 20 ? 0.93 : 0.96;

  return {
    overallEfficiency: round3(Math.min(0.99, Math.max(0.3, overall))),
    fineParticles: round3(clamp01(overall * fineMult)),
    mediumParticles: round3(clamp01(overall * medMult)),
    largeParticles: round3(clamp01(overall * largeMult)),
  };
}

/* ────────────────────────────── Thermal Performance ───────────────────────────── */
export function calculateThermalPerformance(
  inputs: CalculatorInputs
): CalculationResults['thermalPerformance'] {
  const { misc } = inputs;
  const ambient = misc.ambientTemperature ?? AMBIENT_REF;
  const altitude = misc.altitude ?? 0;

  // Coil parameters and NI
  const { N, lMean, Acu, coolingType } = coilParamsFor(inputs);
  const NI = estimateNI(inputs);
  const I = NI / Math.max(1, N); // [A]

  // Fixed-point iteration because copper resistance depends on temperature
  let Tcoil = ambient;
  let P_W = 0;
  const MAX_IT = 15;
  for (let k = 0; k < MAX_IT; k++) {
    const rho = RHO_CU_20C * (1 + TCR_CU * (Tcoil - 20));
    const Lwire = N * lMean;               // [m]
    const R = rho * Lwire / Acu;           // [Ω]
    P_W = I * I * R;                       // [W]

    // Thermal path (unified in °C/W)
    const Rth_base = (coolingType === 'oil' ? RTH_OIL_BASE : RTH_AIR_BASE); // °C/W
    const airDensityFactor = Math.exp(-altitude / 8500); // convection degrades with altitude
    const tempFactor = Math.max(0.6, 1 - Math.max(0, ambient - AMBIENT_REF) / 60);
    const Rth_eff = Rth_base / Math.max(0.5, airDensityFactor * tempFactor);
    const Tnext = ambient + P_W * Rth_eff;
    if (Math.abs(Tnext - Tcoil) < 0.5) { Tcoil = Tnext; break; }
    Tcoil = 0.5 * (Tcoil + Tnext); // damping
  }

  const totalPowerLoss = roundSig(P_W / 1000, 3); // kW
  // Recompute effective Rth at converged T
  const Rth_base2 = (coolingType === 'oil' ? RTH_OIL_BASE : RTH_AIR_BASE);
  const Rth_eff2 = Rth_base2 / Math.max(0.5, Math.exp(-altitude / 8500) * Math.max(0.6, 1 - Math.max(0, ambient - AMBIENT_REF) / 60));
  const temperatureRise = roundSig((Tcoil - ambient), 1);
  const coolingEfficiency = Math.min(0.95, Rth_base2 / Rth_eff2);

  return {
    totalPowerLoss: totalPowerLoss,
    temperatureRise,
    coolingEfficiency: round3(coolingEfficiency),
  };
}

/* ───────────────────────────── Model Recommendation ───────────────────────────── */
export function recommendSeparatorModel(
  inputs: CalculatorInputs
): CalculationResults['recommendedModel'] {
  const magneticField = calculateMagneticField(inputs);
  const B = magneticField.tesla;
  const { conveyor, burden, magnet, misc } = inputs;

  // Base scores
  const models = [
    { name: 'EMAX (Air Cooled)', base: 85 },
    { name: 'OCW (Oil Cooled)', base: 90 },
    { name: 'Suspended Electromagnet', base: 80 },
    { name: 'Drum Separator', base: 75 },
    { name: 'Cross-Belt Separator', base: 82 },
  ];

  const scoredModels = models.map(model => {
    let score = model.base;

    // Physics-tied nudges
    if (conveyor.beltWidth >= 1800 && model.name.includes('Cross-Belt')) score += 5;

    // Favor oil if air coil temp would run hot or current density high
    const therm = calculateThermalPerformance(inputs);
    const { N, Acu } = coilParamsFor(inputs);
    const I = estimateNI(inputs) / Math.max(1, N);
    const jAmm2 = (I / Acu) / 1e6;

    if ((therm.temperatureRise + (misc.ambientTemperature ?? AMBIENT_REF) > 120 || jAmm2 > 4) && model.name.includes('Oil')) score += 8;

    if (magnet.gap < 100 && model.name.includes('Drum')) score += 6;
    if ((misc.ambientTemperature ?? 25) > 35 && model.name.includes('Oil')) score += 6;
    if (magnet.coreBeltRatio > 0.7 && model.name.includes('EMAX')) score += 8;

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
  const magneticFieldStrength = calculateMagneticField(inputs);
  const trampMetalRemoval = calculateTrampMetalRemoval(inputs);
  const thermalPerformance = calculateThermalPerformance(inputs);
  const recommendedModel = recommendSeparatorModel(inputs);

  return {
    magneticFieldStrength,
    trampMetalRemoval,
    thermalPerformance,
    recommendedModel
  };
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

    // Current density penalty (A/mm²)
    const { N, lMean, Acu } = coilParamsFor(x);
    const NI = estimateNI(x);
    const I = NI / Math.max(1, N);
    const j_Am2 = I / Acu;            // A/m²
    const j_Ammsq = j_Am2 / 1e6;      // A/mm²
    const jPenalty = Math.max(0, j_Ammsq - 5.0);  // >~5 A/mm² continuous is risky

    return η - 0.002 * tempOver - 0.2 * Bover - 0.08 * jPenalty;
  }

  // Initialize score
  bestScore = scoreInputs(currentInputs);

  let stepScale = 1.0;
  while (iterations < maxIterations) {
    let improved = false;

    for (const p of PARAMS) {
      const baseVal = getPath(currentInputs, p.path);
      if (typeof baseVal !== 'number') continue;

      const steps = [+1, -1];
      for (const s of steps) {
        const trial = deepClone(currentInputs);
        const step = p.step0 * stepScale * s;
        const nextVal = Math.min(p.max, Math.max(p.min, baseVal + step));
        setPath(trial, p.path, nextVal);

        const sc = scoreInputs(trial);
        if (sc > bestScore + 1e-6) {
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

  const changes = [
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
    parameterChanges: changes,
    changes: changes.reduce((acc, item) => {
      acc[item.parameter] = {
        originalValue: item.originalValue,
        optimizedValue: item.optimizedValue,
        change: item.change
      };
      return acc;
    }, {} as { [key: string]: { originalValue: number; optimizedValue: number; change: number } }),
  };
}

/* ───────────────────────── Enhanced wrapper for UI/validation ───────────────────────── */
export async function performEnhancedCalculation(
  inputs: CalculatorInputs,
  optimizeMode?: boolean,
  targetEfficiency?: number
): Promise<EnhancedCalculationResults> {
  try {
    const baseResults = performCompleteCalculation(inputs);

    // Validation
    const validation = validateCalculationResults(baseResults);
    const recommendedTools = getRecommendedValidationTools(baseResults);

    // Optional optimization
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
