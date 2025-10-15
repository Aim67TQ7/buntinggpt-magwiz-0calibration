# Magnetic Separator Calculations Reference

This document provides a complete reference for all calculations used in the Magnetic Separator Analysis System.

## Table of Contents
1. [Constants and Parameters](#constants-and-parameters)
2. [Magnetic Field Calculations](#magnetic-field-calculations)
3. [Tramp Metal Removal Efficiency](#tramp-metal-removal-efficiency)
4. [Thermal Performance](#thermal-performance)
5. [Recommendation Engine](#recommendation-engine)
6. [Model Recommendation](#model-recommendation)
7. [Optimization Algorithm](#optimization-algorithm)
8. [Validation and Safety](#validation-and-safety)

---

## Constants and Parameters

### Physical Constants
| Constant | Symbol | Value | Unit | Description |
|----------|--------|-------|------|-------------|
| Magnetic Permeability | μ₀ | 4π × 10⁻⁷ | H/m | Permeability of free space |
| Steel Saturation | B_SAT | 1.8 | Tesla | Steel saturation field proxy |
| Gravity | G | 9.80665 | m/s² | Gravitational acceleration |

### Calibratable Constants
| Constant | Value | Unit | Description |
|----------|-------|------|-------------|
| DECAY_N | 2.5 | - | Field decay exponent (2-3 typical) |
| LEAKAGE_MM | 12 | mm | Added to effective gap (leakage/fringe) |
| AMBIENT_REF | 25 | °C | Reference ambient temperature |
| ALT_DERATE_PER_KM | 0.12 | - | Convective derate per km altitude |
| AMB_DERATE_PER_10C | 0.10 | - | -10% heat transfer per +10°C above ref |
| RTH_AIR_BASE | 0.30 | °C/W | Air-cooled baseline thermal resistance |
| RTH_OIL_BASE | 0.085 | °C/W | Oil-cooled baseline thermal resistance |

### Coil Constants
| Constant | Value | Unit | Description |
|----------|-------|------|-------------|
| CAL_NI_PER_RATIO_PER_M | 220,000 | A·turns/(ratio·m) | NI estimation coefficient |
| RHO_CU_20C | 1.72 × 10⁻⁸ | Ω·m | Copper resistivity at 20°C |
| TCR_CU | 0.00393 | 1/°C | Copper temperature coefficient |
| N_EFF_DEFAULT | 600 | turns | Default effective turns |
| L_MEAN_DEFAULT | 1.10 | m | Default mean turn length |
| ACU_DEFAULT | 200 × 10⁻⁶ | m² | Default copper cross-sectional area |

### Capture Physics Constants
| Constant | Value | Description |
|----------|-------|-------------|
| DELTA_CHI | 0.003 | Susceptibility delta (ferrous vs. matrix) |
| LOGIT_K | 4.0 | Logistic slope |
| LOGIT_X0 | 1.0 | 50% capture at Fm/Fres = 1 |
| CAPTURE_K | 1.6 | Safety factor on resisting force |

### Penalty Weights (for efficiency calculation)
| Weight | Value | Description |
|--------|-------|-------------|
| W_SPEED | 0.25 | Belt speed weight |
| W_DEPTH | 0.25 | Burden depth weight |
| W_GAP | 0.20 | Magnet gap weight |
| W_WATER | 0.10 | Water content weight |
| W_TROUGH | 0.08 | Trough angle weight |
| W_TEMP | 0.06 | Temperature weight |
| W_ALT | 0.06 | Altitude weight |

---

## Magnetic Field Calculations

### 1. Ampere-Turns Estimation (NI)

**Function:** `estimateNI(inputs: CalculatorInputs)`

**Input Fields:**
- `magnet.coreBeltRatio` (number, ratio 0.1-0.9)
- `conveyor.beltWidth` (number, mm)

**Formula:**
```
NI = CAL_NI_PER_RATIO_PER_M × coreBeltRatio × width_m

where:
  width_m = max(0.4, beltWidth / 1000)  [meters]
  CAL_NI_PER_RATIO_PER_M = 220,000
```

**Result Posted To:**
- Used internally in `calculateMagneticField()`
- Used in `calculateThermalPerformance()`
- Not directly displayed in UI

**Example:**
```
Input: beltWidth = 1200mm, coreBeltRatio = 0.6
width_m = 1200 / 1000 = 1.2 m
NI = 220,000 × 0.6 × 1.2 = 158,400 Ampere-turns
```

---

### 2. Effective Gap Calculation

**Function:** `effectiveGap_m(inputs: CalculatorInputs)`

**Input Fields:**
- `magnet.gap` (number, mm)

**Formula:**
```
g_eff = max(0.01, gap/1000 + LEAKAGE_MM/1000)

where:
  LEAKAGE_MM = 12 mm
  Minimum effective gap = 10mm (0.01m) for stability
```

**Result Posted To:**
- Used internally in field calculations
- Not directly displayed (but gap is shown in inputs)

**Example:**
```
Input: gap = 150mm
g_eff = max(0.01, 150/1000 + 12/1000)
     = max(0.01, 0.162)
     = 0.162 meters
```

---

### 3. Magnetic Field Strength

**Function:** `calculateMagneticField(inputs: CalculatorInputs)`

**Input Fields:**
- `magnet.coreBeltRatio`
- `magnet.gap`
- `magnet.position` (overhead/crossbelt/inline/drum)
- `conveyor.beltWidth`

**Formulas:**

**3.1 Pole Geometry:**
```
poleRadius = (beltWidth × coreBeltRatio × 0.4) / 1000  [meters]
poleArea = π × poleRadius²  [m²]
```

**3.2 Fringing Correction:**
```
aspectRatio = poleRadius / (gap / 1000)
fringingDelta = poleRadius × (0.308 + 0.1 × aspectRatio)
effectiveGap = (gap / 1000) + fringingDelta  [meters]
```

**3.3 Air-Gap Limit:**
```
airGapLimit = (μ₀ × NI) / effectiveGap  [Tesla]
```

**3.4 Geometry Factor:**
```
z = gap / 1000  [meters from pole face]
geometryFactor = (1 + (z / poleRadius)²)^(-1.5)
```

**3.5 Field at Distance:**
```
poleFaceField = min(airGapLimit, 2.0)  [Tesla, capped at practical limit]
fieldAtDistance = poleFaceField × geometryFactor
```

**3.6 Model-Specific Leakage:**
```
leakageFactor = {
  'overhead': 0.85,
  'crossbelt': 0.78,
  'inline': 0.82,
  'drum': 0.90,
  'suspended': 0.75,
  default: 0.80
}

effectiveField = fieldAtDistance × leakageFactor[position]
```

**3.7 Penetration Depth:**
```
fieldGradient = poleFaceField / effectiveGap  [T/m]
skinDepth = √(2 / (μ₀ × 10⁶ × fieldGradient))
penetrationDepth = min(skinDepth × 1000, gap × 0.8, 200)  [mm]
```

**Results Posted To:**
- `magneticFieldStrength.tesla` → ResultsDisplay component
- `magneticFieldStrength.gauss` → ResultsDisplay component (Tesla × 10,000)
- `magneticFieldStrength.penetrationDepth` → ResultsDisplay component

**Example:**
```
Input: beltWidth=1200mm, gap=150mm, coreBeltRatio=0.6, position='overhead'

poleRadius = (1200 × 0.6 × 0.4) / 1000 = 0.288 m
aspectRatio = 0.288 / 0.15 = 1.92
fringingDelta = 0.288 × (0.308 + 0.1 × 1.92) = 0.144 m
effectiveGap = 0.15 + 0.144 = 0.294 m
NI = 158,400 A·turns
airGapLimit = (4π×10⁻⁷ × 158,400) / 0.294 = 0.677 T
geometryFactor = (1 + (0.15/0.288)²)^(-1.5) = 0.789
fieldAtDistance = 0.677 × 0.789 = 0.534 T
effectiveField = 0.534 × 0.85 = 0.454 Tesla
gauss = 0.454 × 10,000 = 4,540 Gauss
```

---

## Tramp Metal Removal Efficiency

### Function: `calculateTrampMetalRemoval(inputs: CalculatorInputs)`

**Input Fields:**
- All magnetic field inputs (see above)
- `burden.feedDepth` (mm)
- `conveyor.beltSpeed` (m/s)
- `conveyor.troughAngle` (degrees)
- `burden.waterContent` (%)
- `misc.ambientTemperature` (°C)
- `misc.altitude` (m)
- `shape.width`, `shape.length`, `shape.height` (mm)

**Formulas:**

**1. Field Decay Model:**
```
B(z) = B₀ / (1 + z/g_eff)^N_DECAY

dB/dz = -(N_DECAY × B₀ / g_eff) / (1 + z/g_eff)^(N_DECAY + 1)

where:
  B₀ = magnetic field at pole face (Tesla)
  z = depth into burden (meters)
  g_eff = effective gap (meters)
  N_DECAY = 2.5 (decay exponent)
```

**2. Evaluation Depth:**
```
z* = max(0.010, feedDepth / 2000)  [meters]
```

**3. Capture Index (CI):**
```
CI = |B(z*) × (dB/dz)|  [T²/m]

Proportional to magnetic force on tramp metal
```

**4. Base Efficiency:**
```
CI_SCALE = 1.0  (tuning constant)
baseEfficiency = clamp(0.30 + 0.68 × tanh(CI / CI_SCALE), 0, 1)
```

**5. Operational Reduction Factors:**

Each factor ranges from minimum floor to 1.0:

```
f_speed = clamp(1 - (v - 1) × 0.15, 0.6, 1)
  where v = max(0.1, beltSpeed)

f_depth = clamp(1 - feedDepth / 400, 0.5, 1)

f_gap = clamp((100 / max(50, gap))^0.8, 0.6, 1)

f_water = clamp(1 - waterContent / 50, 0.7, 1)

f_trough = clamp(1 - max(0, troughAngle - 20) × 0.01, 0.85, 1)

f_temp = clamp(1 - |ambientTemperature - 25| / 100, 0.8, 1)

f_alt = clamp(exp(-altitude / 8500), 0.7, 1)

f_ratio = clamp(0.5 + coreBeltRatio × 0.5, 0.6, 1)
```

**6. Combined Factor (Weighted Geometric Mean):**
```
factors = [
  (f_speed, 0.25),
  (f_depth, 0.25),
  (f_gap, 0.20),
  (f_water, 0.10),
  (f_trough, 0.08),
  (f_temp, 0.06),
  (f_alt, 0.06),
  (f_ratio, 0.10)
]

sumWeights = Σ weights = 1.0
fCombined = exp(Σ(weight × ln(factor)) / sumWeights)
fCombined = clamp(fCombined, 0.4, 1)  [prevent collapse]
```

**7. Overall Efficiency:**
```
overall = baseEfficiency × fCombined
overall = clamp(overall, 0.3, 0.99)
```

**8. Particle Size Multipliers:**
```
avgSize = (width + length + height) / 3  [mm]

fineMult = {
  avgSize < 10:  0.85,
  avgSize < 20:  0.88,
  else:          0.92
}

mediumMult = {
  avgSize < 10:  0.92,
  avgSize < 20:  0.95,
  else:          0.97
}

largeMult = {
  avgSize < 10:  0.88,
  avgSize < 20:  0.93,
  else:          0.96
}

fineParticles = overall × fineMult
mediumParticles = overall × medMult
largeParticles = overall × largeMult
```

**Results Posted To:**
- `trampMetalRemoval.overallEfficiency` → ResultsDisplay (as percentage)
- `trampMetalRemoval.fineParticles` → ResultsDisplay
- `trampMetalRemoval.mediumParticles` → ResultsDisplay
- `trampMetalRemoval.largeParticles` → ResultsDisplay

---

## Thermal Performance

### Function: `calculateThermalPerformance(inputs: CalculatorInputs)`

**Input Fields:**
- `misc.ambientTemperature` (°C)
- `misc.altitude` (m)
- `magnet.coolingType` ('air' | 'oil')
- `magnet.turns` (optional)
- `magnet.meanTurnLength` (optional, m)
- `magnet.copperArea` (optional, m²)

**Formulas:**

**1. Coil Parameters (with defaults):**
```
N = turns ?? (N_EFF_DEFAULT × max(0.6, coreBeltRatio) × max(0.8, width_m))
lMean = meanTurnLength ?? L_MEAN_DEFAULT
Acu = copperArea ?? ACU_DEFAULT

Defaults:
  N_EFF_DEFAULT = 600
  L_MEAN_DEFAULT = 1.10 m
  ACU_DEFAULT = 200 × 10⁻⁶ m²
```

**2. Current:**
```
I = NI / max(1, N)  [Amperes]
```

**3. Fixed-Point Iteration (for temperature-dependent resistance):**

Initialize: `Tcoil = ambient`

Iterate up to 15 times:
```
ρ(T) = RHO_CU_20C × (1 + TCR_CU × (Tcoil - 20))
  where:
    RHO_CU_20C = 1.72 × 10⁻⁸ Ω·m
    TCR_CU = 0.00393 1/°C

Lwire = N × lMean  [meters total wire length]

R = ρ(T) × Lwire / Acu  [Ohms]

P_W = I² × R  [Watts]

Rth_base = {
  'oil': RTH_OIL_BASE = 0.085 °C/W,
  'air': RTH_AIR_BASE = 0.30 °C/W
}

airDensityFactor = exp(-altitude / 8500)
tempFactor = max(0.6, 1 - max(0, ambient - 25) / 60)
Rth_eff = Rth_base / max(0.5, airDensityFactor × tempFactor)

T_next = ambient + P_W × Rth_eff

if |T_next - Tcoil| < 0.5:
  Tcoil = T_next
  break

Tcoil = 0.5 × (Tcoil + T_next)  [damping]
```

**4. Final Results:**
```
totalPowerLoss = P_W / 1000  [kW]
temperatureRise = Tcoil - ambient  [°C]
coolingEfficiency = min(0.95, Rth_base / Rth_eff)
```

**Results Posted To:**
- `thermalPerformance.totalPowerLoss` → ResultsDisplay (kW)
- `thermalPerformance.temperatureRise` → ResultsDisplay (°C)
- `thermalPerformance.coolingEfficiency` → ResultsDisplay (%)

---

## Recommendation Engine

### Function: `generateRecommendationEngine(inputs: CalculatorInputs)`

**Input Fields:**
- `conveyor.beltWidth`, `conveyor.beltSpeed`, `conveyor.troughAngle`
- `burden.throughPut` (or `burden.throughput`), `burden.density`
- `magnet.gap`, `magnet.position`
- `shape.width`, `shape.length`, `shape.height`

**Formulas:**

**1. Derived Values:**
```
beltArea = (beltWidth / 1000) × sin(troughAngle × π/180)  [m²]

volumetricFlow = (throughput_tph / 3.6) / bulk_density_kg_per_m3  [m³/s]

burdenDepth_m = volumetricFlow / (beltSpeed × beltArea)  [m]

burialAllowance = burdenDepth_mm × 0.5  [mm, 50% burial assumption]

effectivePickupDistance = gap + burialAllowance  [mm]

trampMinDimension = min(width, length, height)  [mm]
```

**2. UI Autofill:**
```
faceWidthFactor = 1.20
faceWidth = beltWidth × faceWidthFactor  [mm]
magnetLengthMin = faceWidth + 160  [mm, additional for mounting]
```

**3. Classification Matrix:**

Based on `effectivePickupDistance` (r) and `trampMinDimension`:

| r (mm) | Tramp (mm) | Base Recommendation |
|--------|------------|---------------------|
| 200+ | any | OIL_COOLED_ELECTRO_PLUS_PROCESS_CHANGE |
| 150-200 | any | OIL_COOLED_ELECTRO_UPSIZED |
| 120-170 | any | OIL_COOLED_ELECTRO |
| 80-120 | any | AIR_COOLED_ELECTRO |
| 50-80 | any | PERMANENT |

**Modifiers:**
- If `trampMinDimension < 5mm` and base is PERMANENT → upgrade to AIR_COOLED_ELECTRO
- If `beltSpeed > 3.0 m/s` → upgrade one class
- If thin material (≤8mm) at long distance (>150mm) → add warning notes

**Results Posted To:**
- `recommendationEngine.derived` → Internal use
- `recommendationEngine.ui_autofill` → Configurator suggestions
- `recommendationEngine.recommendation_engine` → Model selection
- `recommendationEngine.field_replacement` → Documentation

---

## Model Recommendation

### Function: `recommendSeparatorModel(inputs: CalculatorInputs)`

**Input Fields:**
- All inputs (uses recommendation engine)
- Magnetic field results
- Thermal performance results

**Formulas:**

**1. Base Model Mapping:**
```
modelMapping = {
  'PERMANENT': 'Permanent Magnet Separator',
  'LARGE_PERMANENT': 'Large Permanent Magnet',
  'AIR_COOLED_ELECTRO': 'EMAX (Air Cooled)',
  'OIL_COOLED_ELECTRO': 'OCW (Oil Cooled)',
  'OIL_COOLED_ELECTRO_UPSIZED': 'OCW Upsized (Oil Cooled)',
  'OIL_COOLED_ELECTRO_PLUS_PROCESS_CHANGE': 'OCW + Process Optimization'
}
```

**2. Scoring System:**

Base scores:
- Primary recommended model: 95 + 10 boost = 105
- EMAX (Air Cooled): 85
- OCW (Oil Cooled): 90
- Suspended Electromagnet: 80
- Drum Separator: 75
- Cross-Belt Separator: 82

**Adjustments:**
```
if beltWidth ≥ 1800 and model includes 'Cross-Belt':
  score += 5

if (tempRise + ambient > 120) OR (currentDensity > 4 A/mm²):
  if model includes 'Oil': score += 8

if gap < 100 and model includes 'Drum':
  score += 6

if ambient > 35°C and model includes 'Oil':
  score += 6

if coreBeltRatio > 0.7 and model includes 'EMAX':
  score += 8

score = min(100, score)
```

**Results Posted To:**
- `recommendedModel.model` → ResultsDisplay (top recommendation)
- `recommendedModel.score` → ResultsDisplay
- `recommendedModel.alternatives` → ResultsDisplay (top 3 alternatives)

---

## Optimization Algorithm

### Function: `optimizeForEfficiency(inputs, targetEfficiency, maxIterations)`

**Input Parameters:**
- `inputs`: Base calculator inputs
- `targetEfficiency`: Target removal efficiency (default 0.95)
- `maxIterations`: Maximum iterations (default 100)

**Optimized Parameters:**

| Parameter | Path | Initial Step | Min | Max | Unit |
|-----------|------|--------------|-----|-----|------|
| Gap | magnet.gap | 10 | 50 | 300 | mm |
| Core:Belt Ratio | magnet.coreBeltRatio | 0.05 | 0.3 | 0.9 | - |
| Belt Speed | conveyor.beltSpeed | 0.2 | 0.5 | 4.0 | m/s |
| Feed Depth | burden.feedDepth | 10 | 10 | 200 | mm |

**Objective Function:**
```
score(inputs) = η - penalties

where:
  η = trampMetalRemoval.overallEfficiency
  
  tempOver = max(0, operatingTemp - 150)  [°C]
  Bover = max(0, fieldStrength - 1.5)  [Tesla]
  j_Ammsq = currentDensity  [A/mm²]
  jPenalty = max(0, j_Ammsq - 5.0)
  
  penalties = 0.002×tempOver + 0.2×Bover + 0.08×jPenalty
```

**Algorithm (Pattern Search):**
```
1. Initialize: bestScore = score(currentInputs), stepScale = 1.0

2. For each iteration (up to maxIterations):
   
   For each parameter:
     For each direction (+1, -1):
       trial = currentInputs
       trial[param] = clamp(currentValue + step × stepScale, min, max)
       
       if score(trial) > bestScore + 1e-6:
         bestScore = score(trial)
         currentInputs = trial
         improved = true
         break  // next parameter
   
   if not improved:
     stepScale × 0.5  // shrink steps
   
   if stepScale < 0.05:
     break  // termination
   
   if bestScore ≥ targetEfficiency:
     break  // early exit

3. Return optimized parameters and changes
```

**Results Posted To:**
- `optimization.success` → ResultsDisplay (boolean)
- `optimization.iterations` → ResultsDisplay
- `optimization.achievedEfficiency` → ResultsDisplay
- `optimization.optimizedParameters` → Applied to inputs
- `optimization.parameterChanges` → ResultsDisplay (shows delta)

---

## Validation and Safety

### Function: `validateCalculationResults(results: CalculationResults)`

**Safety Thresholds:**

| Parameter | Warning | Critical | Unit |
|-----------|---------|----------|------|
| Operating Temperature | 120 | 180 | °C |
| Magnetic Field | 1.2 | 1.5 | Tesla |
| Removal Efficiency | 90 | 98 | % |

**Equipment Ratings:**

| Model | Max Power | Max Temp | Max Field |
|-------|-----------|----------|-----------|
| EMAX (Air Cooled) | 8 kW | 120°C | 1.4 T |
| OCW (Oil Cooled) | 25 kW | 150°C | 1.6 T |
| OCW Upsized | 35 kW | 155°C | 1.65 T |
| OCW + Process Opt | 30 kW | 160°C | 1.7 T |
| Cross-Belt | 15 kW | 140°C | 1.5 T |
| Permanent Magnet | 0 kW | 80°C | 0.8 T |
| Large Permanent | 0 kW | 80°C | 1.0 T |
| Suspended Electro | 20 kW | 130°C | 1.3 T |
| Drum Separator | 5 kW | 100°C | 1.1 T |

**Validation Checks:**

```
operatingTemp = AMBIENT_REF + temperatureRise  [°C]

CRITICAL ERRORS (isValid = false):
- operatingTemp > 180°C
- magneticField > 1.5 T
- efficiency > 0.98 (98%)
- powerLoss > equipmentRating.maxPowerLoss

WARNINGS:
- operatingTemp > 120°C
- magneticField > 1.2 T
- efficiency > 0.90 (90%)
```

**Compliance Matrix:**
```
powerCompliance = powerLoss ≤ maxPowerLoss
thermalCompliance = operatingTemp ≤ maxOperatingTemp
magneticCompliance = field ≤ maxMagneticField
overallCompliance = ALL three compliant
```

**Results Posted To:**
- `validation.isValid` → ResultsDisplay (pass/fail indicator)
- `validation.severity` → ResultsDisplay ('critical', 'warning', 'info')
- `validation.errors[]` → ResultsDisplay (critical issues)
- `validation.warnings[]` → ResultsDisplay (warnings)
- `validation.equipmentCompliance` → ResultsDisplay (compliance status)

**Recommended Tools:**

Based on proximity to limits:
- Always: COMSOL Multiphysics (EM + thermal)
- If field ≥ 1.2T: ANSYS Maxwell
- If efficiency ≥ 90% OR temp ≥ 120°C: MATLAB

Posted to: `recommendedTools[]` → ValidationToolsRecommendation component

---

## Summary of Result Flow

```
User Inputs → Calculator Functions → Results Object → UI Display

Inputs:
├─ conveyor (beltWidth, beltSpeed, troughAngle)
├─ burden (feedDepth, throughPut, density, waterContent)
├─ shape (width, length, height)
├─ magnet (gap, coreBeltRatio, position, coolingType, ...)
└─ misc (altitude, ambientTemperature)

Calculations:
├─ calculateMagneticField() → magneticFieldStrength
├─ calculateTrampMetalRemoval() → trampMetalRemoval
├─ calculateThermalPerformance() → thermalPerformance
├─ generateRecommendationEngine() → recommendationEngine
└─ recommendSeparatorModel() → recommendedModel

Validation:
└─ validateCalculationResults() → validation

Results Display:
├─ ResultsDisplay.tsx (main results)
├─ ValidationToolsRecommendation.tsx (tools)
└─ MagneticSeparatorCalculator.tsx (optimization)
```

---

## Units Summary

| Quantity | Input Unit | Calculation Unit | Display Unit |
|----------|------------|------------------|--------------|
| Belt Width | mm | m | mm |
| Belt Speed | m/s | m/s | m/s |
| Gap | mm | m | mm |
| Feed Depth | mm | m | mm |
| Throughput | t/h | t/h | t/h |
| Density | t/m³ | kg/m³ | t/m³ |
| Temperature | °C | °C | °C |
| Altitude | m | m | m |
| Magnetic Field | - | Tesla | Tesla, Gauss |
| Power | - | W | kW |
| Efficiency | - | fraction (0-1) | % (0-100) |

---

**Document Version:** 1.0  
**Last Updated:** Based on `src/utils/calculations.ts` and `src/utils/validation.ts`  
**Maintained By:** Engineering Team
