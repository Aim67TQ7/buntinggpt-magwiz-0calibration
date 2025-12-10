// trampPickup.ts
// Tramp metal pick-up check using lifting physics with geometry/orientation/burden factors.

// Magnetic permeability of free space [H/m]
export const MU0 = 4 * Math.PI * 1e-7;

// -----------------------
// Types
// -----------------------

export type TrampShape = "plate" | "bar" | "cube" | "irregular";

export type TrampOrientation =
  | "flat"        // largest face is toward magnet
  | "edge"        // standing on edge
  | "corner"      // on a corner / very poor presentation
  | "unknown";

export type BurdenSeverity =
  | "none"        // free surface / almost no burden
  | "light"       // shallow, low-density burden
  | "moderate"    // typical burden
  | "heavy"       // deep / dense burden
  | "severe";     // worst-case: deep + compacted

export interface TrampGeometry {
  shape: TrampShape;
  /** Length [mm] */
  length_mm?: number;
  /** Width [mm] */
  width_mm?: number;
  /** Thickness [mm] */
  thickness_mm?: number;
  /** Cube size [mm] */
  cubeSize_mm?: number;
  /** Approx density [kg/m³] (default assumes mild steel) */
  density_kg_m3?: number;
}

export interface TrampPickupInput {
  geometry: TrampGeometry;
  orientation: TrampOrientation;
  burden: BurdenSeverity;
  /** Flux density at tramp location [T] */
  fluxDensity_T: number;
  /** Basic safety factor (typical: 2–4) */
  baseSafetyFactor?: number;
  /** Gravity [m/s²]; default 9.81 */
  gravity_m_s2?: number;
}

export interface TrampPickupResult {
  mass_kg: number;
  weight_N: number;
  effectiveArea_m2: number;
  orientationFactor: number;
  burdenFactor: number;
  baseSafetyFactor: number;
  combinedFactor: number;
  availableMagForce_N: number;
  requiredForce_N: number;
  margin_N: number;
  marginRatio: number;
  isLikelyPickup: boolean;
  confidencePercent: number;
  notes: string[];
}

/**
 * Convert margin ratio to confidence percentage (0-99%)
 * Higher margin ratios = higher confidence in successful pickup
 */
export function marginRatioToConfidence(marginRatio: number): number {
  if (marginRatio <= 0) return 0;
  if (marginRatio < 0.5) return Math.round(marginRatio * 50); // 0-25%
  if (marginRatio < 0.8) return Math.round(25 + (marginRatio - 0.5) * 50); // 25-40%
  if (marginRatio < 1.0) return Math.round(40 + (marginRatio - 0.8) * 50); // 40-50%
  if (marginRatio < 1.5) return Math.round(50 + (marginRatio - 1.0) * 50); // 50-75%
  if (marginRatio < 2.0) return Math.round(75 + (marginRatio - 1.5) * 30); // 75-90%
  if (marginRatio < 3.0) return Math.round(90 + (marginRatio - 2.0) * 8);  // 90-98%
  return 99; // Cap at 99%
}

// -----------------------
// Helpers
// -----------------------

const STEEL_DENSITY_KG_M3 = 7850;

function estimateMassKg(geom: TrampGeometry): number {
  const rho = geom.density_kg_m3 ?? STEEL_DENSITY_KG_M3;
  let volume_m3 = 0;

  if (geom.shape === "cube" && geom.cubeSize_mm) {
    const s_m = geom.cubeSize_mm / 1000;
    volume_m3 = s_m * s_m * s_m;
  } else {
    const L_m = (geom.length_mm ?? 0) / 1000;
    const W_m = (geom.width_mm ?? 0) / 1000;
    const T_m = (geom.thickness_mm ?? 0) / 1000;
    if (L_m > 0 && W_m > 0 && T_m > 0) {
      volume_m3 = L_m * W_m * T_m;
    }
  }
  return volume_m3 * rho;
}

function effectiveContactArea_m2(geom: TrampGeometry, orientation: TrampOrientation): number {
  if (geom.shape === "cube" && geom.cubeSize_mm) {
    const s_m = geom.cubeSize_mm / 1000;
    const faceArea = s_m * s_m;
    if (orientation === "flat") return faceArea;
    if (orientation === "edge") return faceArea * 0.75;
    if (orientation === "corner") return faceArea * 0.5;
    return faceArea * 0.6;
  }

  const L_m = (geom.length_mm ?? 0) / 1000;
  const W_m = (geom.width_mm ?? 0) / 1000;
  const T_m = (geom.thickness_mm ?? 0) / 1000;

  if (L_m <= 0 || (W_m <= 0 && T_m <= 0)) return 0;

  const largeFaceArea = L_m * Math.max(W_m, T_m);
  const smallEdgeArea = L_m * Math.min(W_m, T_m);

  switch (orientation) {
    case "flat": return largeFaceArea;
    case "edge": return smallEdgeArea;
    case "corner": return smallEdgeArea * 0.6;
    case "unknown":
    default: return smallEdgeArea * 0.8;
  }
}

function orientationFactor(orientation: TrampOrientation): number {
  switch (orientation) {
    case "flat": return 1.0;
    case "edge": return 4.0;
    case "corner": return 6.0;
    case "unknown":
    default: return 5.0;
  }
}

function burdenFactor(burden: BurdenSeverity): number {
  switch (burden) {
    case "none": return 1.0;
    case "light": return 1.5;
    case "moderate": return 2.5;
    case "heavy": return 4.0;
    case "severe": return 6.0;
    default: return 3.0;
  }
}

function availableMagForce_N(B_T: number, A_m2: number): number {
  return (B_T * B_T * A_m2) / (2 * MU0);
}

// -----------------------
// Main function
// -----------------------

export function evaluateTrampPickup(input: TrampPickupInput): TrampPickupResult {
  const g = input.gravity_m_s2 ?? 9.81;
  const baseSF = input.baseSafetyFactor ?? 3.0;

  const mass_kg = estimateMassKg(input.geometry);
  const weight_N = mass_kg * g;

  const A_eff = effectiveContactArea_m2(input.geometry, input.orientation);

  if (A_eff <= 0) {
    throw new Error("Effective contact area is zero or invalid; check geometry.");
  }
  if (input.fluxDensity_T <= 0) {
    throw new Error("fluxDensity_T must be > 0 for tramp pickup evaluation.");
  }

  const oriFactor = orientationFactor(input.orientation);
  const burFactor = burdenFactor(input.burden);

  const available = availableMagForce_N(input.fluxDensity_T, A_eff);
  const combinedFactor = baseSF * oriFactor * burFactor;
  const required = weight_N * combinedFactor;

  const margin_N = available - required;
  const marginRatio = required > 0 ? available / required : Infinity;
  const isLikelyPickup = marginRatio >= 1.0;
  const confidencePercent = marginRatioToConfidence(marginRatio);

  const notes: string[] = [];
  notes.push(`Mass ≈ ${mass_kg.toFixed(3)} kg, effective area ≈ ${(A_eff * 1e4).toFixed(2)} cm².`);
  notes.push(`Orientation factor = ${oriFactor.toFixed(2)}, burden factor = ${burFactor.toFixed(2)}, base SF = ${baseSF.toFixed(2)}.`);
  notes.push(`Available F ≈ ${available.toFixed(1)} N, required ≈ ${required.toFixed(1)} N (margin ratio ≈ ${marginRatio.toFixed(2)}).`);
  if (!isLikelyPickup) {
    notes.push("Result: NOT LIKELY to reliably pull this tramp through burden.");
  } else {
    notes.push("Result: Likely to pull this tramp under the assumed conditions.");
  }

  return {
    mass_kg,
    weight_N,
    effectiveArea_m2: A_eff,
    orientationFactor: oriFactor,
    burdenFactor: burFactor,
    baseSafetyFactor: baseSF,
    combinedFactor,
    availableMagForce_N: available,
    requiredForce_N: required,
    margin_N,
    marginRatio,
    isLikelyPickup,
    confidencePercent,
    notes,
  };
}

/**
 * Calculate margin ratio directly from Gauss reading and tramp geometry
 * @param surfaceGauss - Surface Gauss reading (at 0 gap)
 * @param gapMm - Air gap in mm
 * @param geometry - Tramp geometry
 * @param orientation - Tramp orientation
 * @param burden - Burden severity
 * @param safetyFactor - Safety factor (default 3.0)
 * @deprecated Use calculateMarginRatioFromForce for more accurate results
 */
export function calculateMarginRatioFromGauss(
  surfaceGauss: number,
  gapMm: number,
  geometry: TrampGeometry,
  orientation: TrampOrientation = "unknown",
  burden: BurdenSeverity = "moderate",
  safetyFactor: number = 3.0
): TrampPickupResult {
  // Convert Gauss to Tesla (1 Gauss = 0.0001 Tesla)
  const surfaceTesla = surfaceGauss * 0.0001;
  
  // Apply decay based on gap (using same decay constant as OCWModelComparison)
  const DECAY_GAUSS = 0.00575;
  const fluxAtGap_T = surfaceTesla * Math.exp(-DECAY_GAUSS * gapMm);
  
  return evaluateTrampPickup({
    geometry,
    orientation,
    burden,
    fluxDensity_T: fluxAtGap_T,
    baseSafetyFactor: safetyFactor,
  });
}

// Force Factor decay constant (2× Gauss decay rate due to squared relationship)
export const DECAY_FORCE_FACTOR = 0.0115;

/**
 * Calculate margin ratio from Force Factor - preferred method for tramp pickup evaluation
 * Force Factor directly represents lifting capability and decays at 2× the Gauss rate
 * @param surfaceForceFactor - Surface Force Factor (at 0 gap) in Newtons
 * @param gapMm - Air gap in mm
 * @param geometry - Tramp geometry
 * @param orientation - Tramp orientation
 * @param burden - Burden severity
 * @param safetyFactor - Safety factor (default 3.0)
 */
export function calculateMarginRatioFromForce(
  surfaceForceFactor: number,
  gapMm: number,
  geometry: TrampGeometry,
  orientation: TrampOrientation = "unknown",
  burden: BurdenSeverity = "moderate",
  safetyFactor: number = 3.0
): TrampPickupResult {
  const g = 9.81;
  const baseSF = safetyFactor;

  // Calculate mass and weight from geometry
  const mass_kg = estimateMassKgExported(geometry);
  const weight_N = mass_kg * g;

  // Get effective contact area
  const A_eff = effectiveContactAreaExported(geometry, orientation);

  if (A_eff <= 0) {
    throw new Error("Effective contact area is zero or invalid; check geometry.");
  }
  if (surfaceForceFactor <= 0) {
    throw new Error("surfaceForceFactor must be > 0 for tramp pickup evaluation.");
  }

  // Apply FF decay based on gap
  const forceAtGap = surfaceForceFactor * Math.exp(-DECAY_FORCE_FACTOR * gapMm);

  const oriFactor = orientationFactor(orientation);
  const burFactor = burdenFactor(burden);

  const combinedFactor = baseSF * oriFactor * burFactor;
  const required = weight_N * combinedFactor;

  const margin_N = forceAtGap - required;
  const marginRatio = required > 0 ? forceAtGap / required : Infinity;
  const isLikelyPickup = marginRatio >= 1.0;
  const confidencePercent = marginRatioToConfidence(marginRatio);

  const notes: string[] = [];
  notes.push(`Mass ≈ ${mass_kg.toFixed(3)} kg, effective area ≈ ${(A_eff * 1e4).toFixed(2)} cm².`);
  notes.push(`Orientation factor = ${oriFactor.toFixed(2)}, burden factor = ${burFactor.toFixed(2)}, base SF = ${baseSF.toFixed(2)}.`);
  notes.push(`Available F ≈ ${forceAtGap.toFixed(1)} N (from FF), required ≈ ${required.toFixed(1)} N (margin ratio ≈ ${marginRatio.toFixed(2)}).`);
  if (!isLikelyPickup) {
    notes.push("Result: NOT LIKELY to reliably pull this tramp through burden.");
  } else {
    notes.push("Result: Likely to pull this tramp under the assumed conditions.");
  }

  return {
    mass_kg,
    weight_N,
    effectiveArea_m2: A_eff,
    orientationFactor: oriFactor,
    burdenFactor: burFactor,
    baseSafetyFactor: baseSF,
    combinedFactor,
    availableMagForce_N: forceAtGap,
    requiredForce_N: required,
    margin_N,
    marginRatio,
    isLikelyPickup,
    confidencePercent,
    notes,
  };
}

// Export helper functions for use in calculateMarginRatioFromForce
function estimateMassKgExported(geom: TrampGeometry): number {
  return estimateMassKg(geom);
}

function effectiveContactAreaExported(geom: TrampGeometry, orientation: TrampOrientation): number {
  return effectiveContactArea_m2(geom, orientation);
}
