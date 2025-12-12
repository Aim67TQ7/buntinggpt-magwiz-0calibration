// trampPickup.ts
// Tramp metal pick-up check using lifting physics with geometry/orientation/burden factors.
// UPDATED: Now uses geometry-based decay constants derived from empirical regression analysis.

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

export type MagnetGrade = "A20" | "A30" | "A40" | "A45";

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

export interface MagnetGeometry {
  /** Core diameter [mm] - first number in model name (e.g., 70 in "70 OCW 30") */
  core_mm: number;
  /** Backplate thickness [mm] - second number in model name (e.g., 30 in "70 OCW 30") */
  backplate_mm: number;
  /** Magnet grade based on operating environment */
  grade: MagnetGrade;
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

// -----------------------
// Grade Multipliers
// Based on operating environment (temperature/altitude derating)
// -----------------------

export const GRADE_MULTIPLIERS: Record<MagnetGrade, number> = {
  A20: 1.000,  // Standard conditions
  A30: 0.949,  // Moderate derating
  A40: 0.893,  // High temperature / altitude
  A45: 0.865,  // Severe conditions
};

// -----------------------
// Legacy Constants (for backwards compatibility)
// -----------------------
export const DECAY_GAUSS_LEGACY = 0.00575;
export const DECAY_FORCE_FACTOR = 0.0115;

// -----------------------
// Geometry-Based Magnetic Field Calculations
// Derived from empirical regression (R² > 0.999)
// -----------------------

/**
 * Calculate decay constant for Gauss based on backplate thickness
 * Formula: K_gauss = 0.1485 / Backplate^0.95
 * @param backplate_mm - Backplate thickness in mm
 * @returns Decay constant K for Gauss calculations
 */
export function getDecayGauss(backplate_mm: number): number {
  if (backplate_mm <= 0) {
    return DECAY_GAUSS_LEGACY; // Fallback to legacy
  }
  return 0.1485 / Math.pow(backplate_mm, 0.95);
}

/**
 * Calculate decay constant for Force Factor based on backplate thickness
 * Formula: K_ff = 0.3438 / Backplate
 * Note: This is NOT simply 2×K_gauss - it has its own regression-derived formula
 * @param backplate_mm - Backplate thickness in mm
 * @returns Decay constant K for Force Factor calculations
 */
export function getDecayForceFactor(backplate_mm: number): number {
  if (backplate_mm <= 0) {
    return DECAY_FORCE_FACTOR; // Fallback to legacy
  }
  return 0.3438 / backplate_mm;
}

/**
 * Calculate surface Gauss (G₀) from magnet geometry
 * Formula: G₀ = 2701 × Core^0.88 / Backplate^1.08 × GradeMult
 * @param magnet - Magnet geometry including core, backplate, and grade
 * @returns Surface Gauss value at gap = 0
 */
export function calculateSurfaceGauss(magnet: MagnetGeometry): number {
  const { core_mm, backplate_mm, grade } = magnet;
  if (core_mm <= 0 || backplate_mm <= 0) {
    throw new Error("Core and backplate dimensions must be > 0");
  }
  const gradeMult = GRADE_MULTIPLIERS[grade];
  return 2701 * Math.pow(core_mm, 0.88) / Math.pow(backplate_mm, 1.08) * gradeMult;
}

/**
 * Calculate surface Force Factor (FF₀) from surface Gauss and backplate
 * Formula: FF₀ = 1.725 × G₀² / Backplate
 * @param surfaceGauss - Surface Gauss value (G₀)
 * @param backplate_mm - Backplate thickness in mm
 * @returns Surface Force Factor at gap = 0
 */
export function calculateSurfaceForceFactor(surfaceGauss: number, backplate_mm: number): number {
  if (backplate_mm <= 0) {
    throw new Error("Backplate thickness must be > 0");
  }
  return 1.725 * Math.pow(surfaceGauss, 2) / backplate_mm;
}

// -----------------------
// Material Difficulty Factors
// For tramp extraction calculation
// -----------------------
export const MATERIAL_FACTORS: Record<string, number> = {
  "coal": 0.90,
  "limestone": 0.75,
  "gravel": 0.70,
  "sand": 0.55,
  "slag": 0.50,
  "wood": 0.85,
  "aggregate": 0.70,
  "glass": 0.60,
  "c&d": 0.65,
  "compost": 0.60,
  "msw": 0.50,
};

export interface TrampExtractionInput {
  width_mm: number;
  length_mm: number;
  height_mm: number;
  beltSpeed_mps?: number;      // default 1.5
  burden_mm?: number;          // default 0 (embedding depth)
  waterPercent?: number;       // default 0
  material?: string;           // default "coal"
  description?: string;        // for nut/bolt detection
  partType?: 'generic' | 'nut' | 'bolt' | 'plate';  // explicit part type (takes precedence over name detection)
}

export interface TrampExtractionResult {
  requiredForceFactor: number;  // Primary metric for extraction calculation
  momentFactor: number;         // Debug: mass × √volume
  difficultyMultiplier: number; // Debug: composite difficulty from conditions
  stabilityFactor: number;      // Debug: contact stability (nut/bolt/plate)
  effectiveType: 'generic' | 'nut' | 'bolt' | 'plate';  // Debug: detected or specified type
}

/**
 * Calculate baseline required Gauss for tramp metal pickup using engineering heuristic model.
 * This is a baseline value independent of air gap - compare with gap-adjusted Model Gauss.
 * Uses material factors, speed loss, embedding loss, water penalty, and shape penalty.
 * @param input - Tramp extraction input parameters
 * @returns Baseline Required Gauss (integer)
 */
/**
 * Calculate Required Force Factor for tramp metal pickup.
 * This is the PRIMARY metric for extraction calculation.
 * Formula: requiredFF = momentFactor × difficultyMultiplier × stabilityFactor
 * 
 * Extraction ratio = modelForceFactorAtGap / requiredForceFactor
 * 
 * @param input - Tramp extraction input parameters
 * @returns TrampExtractionResult with requiredForceFactor and debug info
 */
export function calculateRequiredForceFactor(input: TrampExtractionInput): TrampExtractionResult {
  // Clamp/default inputs
  const width_mm = Math.max(input.width_mm, 0.001);
  const length_mm = Math.max(input.length_mm, 0.001);
  const height_mm = Math.max(input.height_mm, 0.001);
  const beltSpeed_mps = Math.max(input.beltSpeed_mps ?? 1.5, 0);
  const burden_mm = Math.max(input.burden_mm ?? 0, 0);
  const waterPercent = Math.min(Math.max(input.waterPercent ?? 0, 0), 100);
  const material = (input.material ?? "coal").toLowerCase();

  // Step 1: Material factor
  const materialFactor = MATERIAL_FACTORS[material] ?? 0.75;

  // Step 2: Loss factors (adjusted caps/bases for responsive slider ranges)
  const speedLoss = 1 - Math.min(beltSpeed_mps / 8.0, 0.50);
  const embeddingLoss = 1 - Math.min(Math.pow(burden_mm / 800, 0.7), 0.50);
  const waterPenalty = 1 - Math.min(waterPercent / 50, 0.40);

  // Step 3: Shape penalty
  const major = Math.max(width_mm, length_mm);
  const minor = Math.min(width_mm, length_mm);
  const aspectRatio = major / Math.max(1, minor);
  const thinness = height_mm / Math.max(1, minor);
  
  let shapePenalty = 0.9 
    - 0.25 * (aspectRatio - 1) 
    - 0.3 * (thinness < 0.2 ? (0.2 - thinness) : 0);
  shapePenalty = Math.max(0.25, Math.min(1.0, shapePenalty));

  // Step 4: Magnetic moment proxy
  const volume_cm3 = (width_mm * length_mm * height_mm) / 1000;
  const mass_g = volume_cm3 * 7.85;
  const momentFactor = mass_g * Math.sqrt(Math.max(0.0001, volume_cm3));

  // Step 5: Composite difficulty - INVERT ease factors to get difficulty
  const easeFactor = shapePenalty * materialFactor * embeddingLoss * speedLoss * waterPenalty;
  const difficultyMultiplier = 1 / Math.max(easeFactor, 0.05);

  // Step 6: Contact Stability Factors
  // Use explicit partType if provided, otherwise fall back to name detection
  const partType = input.partType ?? 'generic';
  const descLower = (input.description ?? "").toLowerCase();
  const minFace = Math.min(width_mm, length_mm);
  const isThinPlate = height_mm < 0.15 * minFace;

  // Determine effective type: explicit partType takes precedence
  let effectiveType: 'generic' | 'nut' | 'bolt' | 'plate' = partType;
  if (partType === 'generic') {
    // Fall back to name detection for backwards compat
    if (descLower.includes("nut")) effectiveType = 'nut';
    else if (descLower.includes("bolt")) effectiveType = 'bolt';
    else if (isThinPlate) effectiveType = 'plate';
  }

  // Apply contact stability factor based on effective type
  let stabilityFactor = 1.0;
  switch (effectiveType) {
    case 'nut': stabilityFactor = 1.8; break;
    case 'bolt': stabilityFactor = 1.3; break;
    case 'plate': stabilityFactor = 1.5; break;
    // 'generic' = 1.0, no penalty
  }

  // Step 7: Calculate Required Force Factor (no calibration constant - set to 1.0)
  // requiredFF = momentFactor × difficultyMultiplier × stabilityFactor
  const requiredForceFactor = momentFactor * difficultyMultiplier * stabilityFactor;

  return {
    requiredForceFactor,
    momentFactor,
    difficultyMultiplier,
    stabilityFactor,
    effectiveType
  };
}

/**
 * @deprecated Use calculateRequiredForceFactor instead - this function outputs Gauss which is NOT used for extraction.
 * Kept for legacy display purposes only.
 */
export function calculateRequiredGaussV2(input: TrampExtractionInput): number {
  // Clamp/default inputs
  const width_mm = Math.max(input.width_mm, 0.001);
  const length_mm = Math.max(input.length_mm, 0.001);
  const height_mm = Math.max(input.height_mm, 0.001);
  const beltSpeed_mps = Math.max(input.beltSpeed_mps ?? 1.5, 0);
  const burden_mm = Math.max(input.burden_mm ?? 0, 0);
  const waterPercent = Math.min(Math.max(input.waterPercent ?? 0, 0), 100);
  const material = (input.material ?? "coal").toLowerCase();

  // Step 1: Material factor
  const materialFactor = MATERIAL_FACTORS[material] ?? 0.75;

  // Step 2: Loss factors (adjusted caps/bases for responsive slider ranges)
  // Speed: max 50% penalty at 4+ m/s (previously capped at 1.05 m/s)
  const speedLoss = 1 - Math.min(beltSpeed_mps / 8.0, 0.50);
  // Embedding loss: max 50% penalty at ~400mm+ burden (previously capped at ~90mm)
  const embeddingLoss = 1 - Math.min(Math.pow(burden_mm / 800, 0.7), 0.50);
  // Water: max 40% penalty at 20%+ moisture
  const waterPenalty = 1 - Math.min(waterPercent / 50, 0.40);

  // Step 3: Shape penalty
  const major = Math.max(width_mm, length_mm);
  const minor = Math.min(width_mm, length_mm);
  const aspectRatio = major / Math.max(1, minor);
  const thinness = height_mm / Math.max(1, minor);
  
  let shapePenalty = 0.9 
    - 0.25 * (aspectRatio - 1) 
    - 0.3 * (thinness < 0.2 ? (0.2 - thinness) : 0);
  shapePenalty = Math.max(0.25, Math.min(1.0, shapePenalty)); // clamp

  // Step 4: Magnetic moment proxy
  const volume_cm3 = (width_mm * length_mm * height_mm) / 1000;
  const mass_g = volume_cm3 * 7.85;
  const momentFactor = mass_g * Math.sqrt(Math.max(0.0001, volume_cm3));

  // Step 5: Composite difficulty - INVERT ease factors to get difficulty
  // easeFactor represents how easy it is to pick up (lower = harder)
  const easeFactor = shapePenalty * materialFactor * embeddingLoss * speedLoss * waterPenalty;
  
  // Invert to get difficulty multiplier (higher = harder to pick up)
  // Clamped at 0.05 to avoid extreme values (max 20x multiplier)
  // Lower clamp ensures sliders remain responsive for all shapes
  const difficultyMultiplier = 1 / Math.max(easeFactor, 0.05);
  
  // forceFactor now INCREASES when conditions are harder
  const forceFactor = momentFactor * difficultyMultiplier;

  // Step 6: Map to baseline Required Gauss (no gap distance scaling)
  const gradientReq = forceFactor > 0 ? Math.pow(forceFactor, 0.33) : 0;
  let baselineRequiredGauss = 30 * gradientReq + 70;

  // ===== Contact Stability Factors =====
  // Discrete heuristic to match legacy behavior:
  // - Solid cubes: easiest (no penalty)
  // - Nuts: hollow geometry, poor contact (×1.8)
  // - Bolts: elongated, rolling (×1.3)
  // - Thin plates: flat, poor grip (×1.5)
  const descLower = (input.description ?? "").toLowerCase();
  const minFace = Math.min(width_mm, length_mm);
  const isThinPlate = height_mm < 0.15 * minFace;

  if (descLower.includes("nut")) {
    // Hollow geometry + poor magnetic contact
    baselineRequiredGauss *= 1.8;
  } else if (descLower.includes("bolt")) {
    // Elongated shape, tends to roll
    baselineRequiredGauss *= 1.3;
  } else if (isThinPlate) {
    // Flat pieces have poor magnetic grip
    baselineRequiredGauss *= 1.5;
  }
  // Solid cubes: no additional factor (easiest to pick up)

  return Math.round(baselineRequiredGauss);
}

/**
 * @deprecated Use calculateRequiredGaussV2 instead - this is the legacy force-based calculation
 */
export function calculateRequiredGaussForPickup(
  widthMm: number,
  lengthMm: number,
  heightMm: number,
  orientation: TrampOrientation,
  burden: BurdenSeverity,
  gap_mm: number,
  backplate_mm: number,
  safetyFactor: number = 3.0
): number {
  const STEEL_DENSITY = 7850; // kg/m³
  const g = 9.81;
  
  // Calculate required force
  const volume_m3 = (widthMm / 1000) * (lengthMm / 1000) * (heightMm / 1000);
  const mass_kg = volume_m3 * STEEL_DENSITY;
  const weight_N = mass_kg * g;
  
  const oriFactor = orientationFactor(orientation);
  const burFactor = burdenFactor(burden);
  const requiredForce = weight_N * oriFactor * burFactor * safetyFactor;
  
  // Get decay constants
  const kFF = getDecayForceFactor(backplate_mm);
  const kGauss = getDecayGauss(backplate_mm);
  
  // Required FF at surface = requiredForce / e^(-k * gap)
  const requiredSurfaceFF = requiredForce / Math.exp(-kFF * gap_mm);
  
  // Reverse the FF formula: FF₀ = 1.725 × G₀² / BP → G₀ = √(FF₀ × BP / 1.725)
  const requiredSurfaceGauss = Math.sqrt(requiredSurfaceFF * backplate_mm / 1.725);
  
  // Gauss at gap using decay
  const requiredGaussAtGap = requiredSurfaceGauss * Math.exp(-kGauss * gap_mm);
  
  return requiredGaussAtGap;
}

/**
 * Calculate Gauss at a specific gap distance
 * Formula: Gauss(gap) = G₀ × e^(-K_gauss × gap)
 * @param surfaceGauss - Surface Gauss value (G₀)
 * @param gap_mm - Gap distance in mm
 * @param backplate_mm - Backplate thickness in mm (for K calculation)
 * @returns Gauss value at specified gap
 */
export function calculateGaussAtGap(
  surfaceGauss: number,
  gap_mm: number,
  backplate_mm: number
): number {
  const k = getDecayGauss(backplate_mm);
  return surfaceGauss * Math.exp(-k * gap_mm);
}

/**
 * Calculate Force Factor at a specific gap distance
 * Formula: FF(gap) = FF₀ × e^(-K_ff × gap)
 * @param surfaceForceFactor - Surface Force Factor (FF₀)
 * @param gap_mm - Gap distance in mm
 * @param backplate_mm - Backplate thickness in mm (for K calculation)
 * @returns Force Factor at specified gap
 */
export function calculateForceFactorAtGap(
  surfaceForceFactor: number,
  gap_mm: number,
  backplate_mm: number
): number {
  const k = getDecayForceFactor(backplate_mm);
  return surfaceForceFactor * Math.exp(-k * gap_mm);
}

/**
 * Calculate all magnetic field values from magnet geometry and gap
 * Convenience function that returns both Gauss and FF at surface and at gap
 */
export interface MagneticFieldValues {
  surfaceGauss: number;
  surfaceForceFactor: number;
  gaussAtGap: number;
  forceFactorAtGap: number;
  decayConstantGauss: number;
  decayConstantFF: number;
  fiftyPercentReachGauss_mm: number;
  fiftyPercentReachFF_mm: number;
}

export function calculateMagneticFieldValues(
  magnet: MagnetGeometry,
  gap_mm: number
): MagneticFieldValues {
  const surfaceGauss = calculateSurfaceGauss(magnet);
  const surfaceForceFactor = calculateSurfaceForceFactor(surfaceGauss, magnet.backplate_mm);
  
  const kGauss = getDecayGauss(magnet.backplate_mm);
  const kFF = getDecayForceFactor(magnet.backplate_mm);
  
  const gaussAtGap = surfaceGauss * Math.exp(-kGauss * gap_mm);
  const forceFactorAtGap = surfaceForceFactor * Math.exp(-kFF * gap_mm);
  
  return {
    surfaceGauss,
    surfaceForceFactor,
    gaussAtGap,
    forceFactorAtGap,
    decayConstantGauss: kGauss,
    decayConstantFF: kFF,
    fiftyPercentReachGauss_mm: Math.log(2) / kGauss,
    fiftyPercentReachFF_mm: Math.log(2) / kFF,
  };
}

/**
 * Parse model name to extract core and backplate dimensions
 * Handles formats like "70 OCW 30", "70-30", "70OCW30"
 * @param modelName - Model name string
 * @returns Object with core_mm and backplate_mm, or null if parsing fails
 */
export function parseModelName(modelName: string): { core_mm: number; backplate_mm: number } | null {
  // Try various patterns
  const patterns = [
    /(\d+)\s*OCW\s*(\d+)/i,      // "70 OCW 30" or "70OCW30"
    /(\d+)\s*-\s*(\d+)/,         // "70-30"
    /(\d+)\s+(\d+)/,             // "70 30"
  ];
  
  for (const pattern of patterns) {
    const match = modelName.match(pattern);
    if (match) {
      return {
        core_mm: parseInt(match[1], 10),
        backplate_mm: parseInt(match[2], 10),
      };
    }
  }
  
  return null;
}

// -----------------------
// Confidence Calculation
// -----------------------

/**
 * Convert margin ratio to confidence percentage (0-99%)
 * Higher margin ratios = higher confidence in successful pickup
 */
export function marginRatioToConfidence(marginRatio: number): number {
  if (marginRatio <= 0) return 0;
  if (marginRatio < 0.5) return Math.round(marginRatio * 50); // 0-25%
  if (marginRatio < 0.8) return Math.round(25 + (marginRatio - 0.5) * 50); // 25-40%
  if (marginRatio < 1.0) return Math.round(40 + (marginRatio - 1.0) * 50); // 40-50%
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
// Main function (original)
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
 * Calculate margin ratio from Gauss reading using geometry-based decay
 * @param surfaceGauss - Surface Gauss reading (at 0 gap)
 * @param gapMm - Air gap in mm
 * @param backplate_mm - Backplate thickness for decay calculation
 * @param geometry - Tramp geometry
 * @param orientation - Tramp orientation
 * @param burden - Burden severity
 * @param safetyFactor - Safety factor (default 3.0)
 */
export function calculateMarginRatioFromGauss(
  surfaceGauss: number,
  gapMm: number,
  backplate_mm: number,
  geometry: TrampGeometry,
  orientation: TrampOrientation = "unknown",
  burden: BurdenSeverity = "moderate",
  safetyFactor: number = 3.0
): TrampPickupResult {
  // Convert Gauss to Tesla (1 Gauss = 0.0001 Tesla)
  const surfaceTesla = surfaceGauss * 0.0001;
  
  // Apply geometry-based decay
  const decayK = getDecayGauss(backplate_mm);
  const fluxAtGap_T = surfaceTesla * Math.exp(-decayK * gapMm);
  
  return evaluateTrampPickup({
    geometry,
    orientation,
    burden,
    fluxDensity_T: fluxAtGap_T,
    baseSafetyFactor: safetyFactor,
  });
}

/**
 * Calculate margin ratio from Force Factor using geometry-based decay
 * This is the PREFERRED method for tramp pickup evaluation
 * @param surfaceForceFactor - Surface Force Factor (at 0 gap)
 * @param gapMm - Air gap in mm
 * @param backplate_mm - Backplate thickness for decay calculation
 * @param geometry - Tramp geometry
 * @param orientation - Tramp orientation
 * @param burden - Burden severity
 * @param safetyFactor - Safety factor (default 3.0)
 */
export function calculateMarginRatioFromForce(
  surfaceForceFactor: number,
  gapMm: number,
  backplate_mm: number,
  geometry: TrampGeometry,
  orientation: TrampOrientation = "unknown",
  burden: BurdenSeverity = "moderate",
  safetyFactor: number = 3.0
): TrampPickupResult {
  const g = 9.81;
  const baseSF = safetyFactor;

  // Calculate mass and weight from geometry
  const mass_kg = estimateMassKg(geometry);
  const weight_N = mass_kg * g;

  // Get effective contact area
  const A_eff = effectiveContactArea_m2(geometry, orientation);

  if (A_eff <= 0) {
    throw new Error("Effective contact area is zero or invalid; check geometry.");
  }
  if (surfaceForceFactor <= 0) {
    throw new Error("surfaceForceFactor must be > 0 for tramp pickup evaluation.");
  }

  // Apply geometry-based FF decay
  const decayK = getDecayForceFactor(backplate_mm);
  const forceAtGap = surfaceForceFactor * Math.exp(-decayK * gapMm);

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
  notes.push(`Available F ≈ ${forceAtGap.toFixed(1)} N, required ≈ ${required.toFixed(1)} N (margin ratio ≈ ${marginRatio.toFixed(2)}).`);
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

/**
 * Evaluate tramp pickup from first principles using magnet geometry
 * Complete calculation starting from model name and operating conditions
 */
export interface TrampEvaluationInput {
  magnet: MagnetGeometry;
  gap_mm: number;
  tramp: TrampGeometry;
  orientation?: TrampOrientation;
  burden?: BurdenSeverity;
  safetyFactor?: number;
}

export interface TrampEvaluationResult extends TrampPickupResult {
  magneticFieldValues: MagneticFieldValues;
}

export function evaluateTrampPickupFromGeometry(
  input: TrampEvaluationInput
): TrampEvaluationResult {
  const orientation = input.orientation ?? "unknown";
  const burden = input.burden ?? "moderate";
  const safetyFactor = input.safetyFactor ?? 3.0;

  // Calculate all magnetic field values
  const fieldValues = calculateMagneticFieldValues(input.magnet, input.gap_mm);

  // Use Force Factor method for pickup evaluation
  const pickupResult = calculateMarginRatioFromForce(
    fieldValues.surfaceForceFactor,
    input.gap_mm,
    input.magnet.backplate_mm,
    input.tramp,
    orientation,
    burden,
    safetyFactor
  );

  return {
    ...pickupResult,
    magneticFieldValues: fieldValues,
  };
}
