# Magnetic Separator Calculator - Calculations Reference

## Overview
This document provides a comprehensive reference of all calculations used in the magnetic separator design calculator, including formulas, inputs, and output values.

## File Structure

### `src/utils/calculations.ts`
Main calculation engine containing all physics and engineering formulas.

### `src/types/calculator.ts`
TypeScript interfaces defining input parameters and calculation results.

---

## Constants and Parameters

### Physical Constants
```typescript
const μ0 = 4 * Math.PI * 1e-7;      // Permeability of free space (H/m)
const B_SAT = 1.8;                  // Steel saturation field (Tesla)
const G = 9.80665;                  // Gravitational acceleration (m/s²)
```

### Electromagnetic Constants
```typescript
const RHO_CU_20C = 1.72e-8;         // Copper resistivity at 20°C (Ω·m)
const TCR_CU = 0.00393;             // Copper temperature coefficient (1/°C)
const N_EFF_DEFAULT = 600;          // Default effective turns
const L_MEAN_DEFAULT = 1.10;        // Default mean turn length (m)
const ACU_DEFAULT = 85e-6;          // Default copper area (m²)
```

### Thermal Constants
```typescript
const AMBIENT_REF = 25;             // Reference ambient temperature (°C)
const RTH_AIR_BASE = 0.30;          // Air cooling thermal resistance (°C/W)
const RTH_OIL_BASE = 0.085;         // Oil cooling thermal resistance (°C/W)
```

---

## Core Calculations

### 1. Magnetic Field Strength Calculation
**File:** `calculateMagneticField()`

**Formula:**
```
B₀ = min((μ₀ × NI) / g_eff, B_SAT)
```

**Inputs:**
- `NI`: Ampere-turns (estimated from geometry)
- `g_eff`: Effective air gap (mm)
- `μ₀`: Permeability of free space
- `B_SAT`: Saturation field limit

**Outputs:**
- `tesla`: Magnetic field strength (T)
- `gauss`: Magnetic field strength (G) = tesla × 10,000
- `penetrationDepth`: Field penetration depth (mm)

**Penetration Depth Formula:**
```
δ = g_eff × (10^(1/DECAY_N) - 1)
```
Where `DECAY_N = 2.5`

### 2. Ampere-Turns Estimation
**Formula:**
```
NI = CAL_NI_PER_RATIO_PER_M × max(0, coreBeltRatio) × max(0.4, width_m)
```

**Constants:**
- `CAL_NI_PER_RATIO_PER_M = 2.2e5`: A·turns per (ratio·meter belt width)

**Inputs:**
- `coreBeltRatio`: Core to belt width ratio
- `width_m`: Belt width in meters

### 3. Effective Gap Calculation
**Formula:**
```
g_eff = max(0.01, gap_mm/1000 + LEAKAGE_MM/1000)
```

**Constants:**
- `LEAKAGE_MM = 12`: Additional gap for magnetic leakage (mm)

---

## Tramp Metal Removal Efficiency

### Base Efficiency Calculation
**Formula:**
```
baseEfficiency = min(0.98, max(0.4, (B - 0.1) / 1.2))
```
Scales magnetic field from 0.1-1.3T to 40-98% efficiency.

### Operational Factors
Each factor reduces efficiency based on operating conditions:

**Speed Factor:**
```
f_speed = max(0.6, 1 - (v - 1) × 0.15)
```

**Depth Factor:**
```
f_depth = max(0.5, 1 - feedDepth / 400)
```

**Gap Factor:**
```
f_gap = max(0.6, (100 / max(50, gap))^0.8)
```

**Water Content Factor:**
```
f_water = max(0.7, 1 - waterContent / 50)
```

**Trough Angle Factor:**
```
f_trough = max(0.85, 1 - max(0, troughAngle - 20) × 0.01)
```

**Temperature Factor:**
```
f_temp = max(0.8, 1 - |ambientTemp - 25| / 100)
```

**Altitude Factor:**
```
f_alt = max(0.9, 1 - altitude / 5000)
```

**Core-Belt Ratio Factor:**
```
f_ratio = max(0.6, 0.5 + coreBeltRatio × 0.5)
```

### Combined Efficiency
**Formula:**
```
overallEfficiency = baseEfficiency × geometricMean(factors)
```

### Particle Size Efficiency
Based on average particle size `avgSize = (width + length + height) / 3`:

```typescript
const fineMult = avgSize < 10 ? 0.85 : avgSize < 20 ? 0.88 : 0.92;
const medMult = avgSize < 10 ? 0.92 : avgSize < 20 ? 0.95 : 0.97;
const largeMult = avgSize < 10 ? 0.88 : avgSize < 20 ? 0.93 : 0.96;
```

---

## Thermal Performance

### Power Loss Calculation
**Formula:**
```
basePower = B² × beltWidth_m × coreBeltRatio × 8
totalPowerLoss = basePower × throughputFactor × speedFactor
```

**Loading Factors:**
```
throughputFactor = 1 + (throughput / 500) × 0.3
speedFactor = 1 + (beltSpeed / 4) × 0.2
```

### Temperature Rise
**Formula:**
```
temperatureRise = totalPowerLoss × effectiveRth
```

**Thermal Resistance:**
```
baseRth = coolingType === 'oil' ? 0.8 : 2.5  // °C/kW
effectiveRth = baseRth / (altitudeFactor × tempFactor)
```

**Environmental Derating:**
```
altitudeFactor = max(0.7, 1 - altitude / 4000)
tempFactor = max(0.8, 1 - max(0, ambient - 25) / 40)
```

### Cooling Efficiency
**Formula:**
```
coolingEfficiency = min(0.95, baseRth / effectiveRth)
```

---

## Model Recommendation

### Scoring Algorithm
Base scores for different separator types:
- EMAX (Air Cooled): 85
- OCW (Oil Cooled): 90
- Suspended Electromagnet: 80
- Drum Separator: 75
- Cross-Belt Separator: 82

### Adjustment Factors
```typescript
if (beltWidth > 1800 && model.includes('Cross-Belt')) score += 5;
if (throughput > 500 && model.includes('Oil')) score += 8;
if (gap < 100 && model.includes('Drum')) score += 6;
if (ambientTemp > 35 && model.includes('Oil')) score += 6;
if (coreBeltRatio > 0.7 && model.includes('EMAX')) score += 8;
```

---

## Optimization Algorithm

### Pattern Search Method
The optimizer uses coordinate descent with pattern search:

1. **Parameters Optimized:**
   - Gap (50-300 mm)
   - Core:Belt Ratio (0.3-0.9)
   - Belt Speed (0.5-4.0 m/s)
   - Feed Depth (10-200 mm)

2. **Objective Function:**
```
score = efficiency - 0.002 × tempPenalty - 0.2 × fieldPenalty
```

3. **Safety Penalties:**
```
tempPenalty = max(0, operatingTemp - 150)
fieldPenalty = max(0, magneticField - 1.5)
```

4. **Step Size Adaptation:**
   - Initial step scale: 1.0
   - Shrink by 0.5 when no improvement found
   - Terminate when step scale < 0.05

---

## Input Parameters

### Conveyor Parameters
- `beltSpeed`: Belt speed (m/s)
- `troughAngle`: Trough angle (degrees, 0-45)
- `beltWidth`: Belt width (mm, 450-2400)

### Burden Parameters
- `feedDepth`: Material depth (mm)
- `throughPut`: Feed rate (t/h)
- `density`: Material density (t/m³)
- `waterContent`: Water content (%)

### Shape Parameters
- `width`: Particle width (mm)
- `length`: Particle length (mm)
- `height`: Particle height (mm)

### Magnet Parameters
- `gap`: Magnet gap (mm)
- `coreBeltRatio`: Core to belt width ratio (0.1-0.9)
- `position`: Magnet position type

### Environmental Parameters
- `altitude`: Operating altitude (m)
- `ambientTemperature`: Ambient temperature (°C)

---

## Output Results

### Magnetic Field Strength
- `tesla`: Field strength in Tesla
- `gauss`: Field strength in Gauss
- `penetrationDepth`: Penetration depth in mm

### Tramp Metal Removal
- `overallEfficiency`: Overall removal efficiency (0-1)
- `fineParticles`: Fine particle efficiency (0-1)
- `mediumParticles`: Medium particle efficiency (0-1)
- `largeParticles`: Large particle efficiency (0-1)

### Thermal Performance
- `totalPowerLoss`: Total power consumption (kW)
- `temperatureRise`: Temperature rise above ambient (°C)
- `coolingEfficiency`: Cooling system efficiency (0-1)

### Recommended Model
- `model`: Recommended separator model name
- `score`: Model suitability score (0-100)
- `alternatives`: Alternative model options

---

## Validation and Safety

### Safety Thresholds
- Maximum operating temperature: 150°C
- Maximum magnetic field: 1.5T for warnings, 2.0T critical
- Minimum efficiency: 30%

### Equipment Compliance
Validates results against manufacturer specifications and industry standards for safe operation.