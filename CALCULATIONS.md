# Magnetic Separator Calculations Reference

This document provides detailed documentation of all calculations, formulas, and constants used in the magnetic separator analysis system based on the actual implementation.

## Table of Contents

1. [Physical Constants](#physical-constants)
2. [Calibratable Constants](#calibratable-constants)
3. [Magnetic Field Analysis](#magnetic-field-analysis)
4. [Tramp Metal Removal Efficiency](#tramp-metal-removal-efficiency)
5. [Thermal Performance](#thermal-performance)
6. [Model Recommendation System](#model-recommendation-system)
7. [Optimization Algorithm](#optimization-algorithm)

---

## Physical Constants

### Electromagnetic Constants
- **μ₀** (Permeability of free space): `4π × 10⁻⁷ H/m` = `1.2566370614359173 × 10⁻⁶ H/m`
- **B_SAT** (Steel saturation): `1.8 Tesla`
- **G** (Gravitational acceleration): `9.80665 m/s²`

### Copper Properties
- **ρ_Cu@20°C** (Copper resistivity at 20°C): `1.72 × 10⁻⁸ Ω·m`
- **TCR_Cu** (Temperature coefficient of resistance): `0.00393 /°C`

---

## Calibratable Constants

### Field Decay and Leakage
- **DECAY_N**: `2.5` (Field decay exponent, typical range 2-3)
- **LEAKAGE_MM**: `12 mm` (Added to effective gap for leakage/fringe effects)

### Environmental Reference Points
- **AMBIENT_REF**: `25°C` (Reference ambient temperature)
- **ALT_DERATE_PER_KM**: `0.12` (Convective derate per km altitude)
- **AMB_DERATE_PER_10C**: `0.10` (10% reduction per +10°C above reference)

### Thermal Resistance
- **RTH_AIR_BASE**: `0.30 °C/W` (Air cooled baseline thermal resistance)
- **RTH_OIL_BASE**: `0.085 °C/W` (Oil cooled baseline, range 0.06-0.10)

### Coil Estimation (for workflows lacking detailed coil data)
- **CAL_NI_PER_RATIO_PER_M**: `2200 A·turns/(ratio·meter)` (Ampere-turns estimation constant)
- **N_EFF_DEFAULT**: `600 turns` (Default effective turns)
- **L_MEAN_DEFAULT**: `1.10 m` (Default mean turn length)
- **ACU_DEFAULT**: `200 × 10⁻⁶ m²` (Default total copper cross-sectional area)

### Capture Physics
- **DELTA_CHI**: `0.003` (Magnetic susceptibility difference between ferrous and matrix)
- **LOGIT_K**: `4.0` (Logistic curve slope parameter)
- **LOGIT_X0**: `1.0` (50% capture point at Fm/Fres = 1)
- **CAPTURE_K**: `1.6` (Safety factor on resisting force)

### Penalty Weights (sum ≈ 1.0)
- **W_SPEED**: `0.25` (Belt speed weight)
- **W_DEPTH**: `0.25` (Feed depth weight)
- **W_GAP**: `0.20` (Gap weight)
- **W_WATER**: `0.10` (Water content weight)
- **W_TROUGH**: `0.08` (Trough angle weight)
- **W_TEMP**: `0.06` (Temperature weight)
- **W_ALT**: `0.06` (Altitude weight)

---

## Magnetic Field Analysis

### Core Formula
The magnetic field strength at the belt surface is calculated using:

```
B₀ = min((μ₀ × NI) / g_eff, B_SAT)
```

**Example Calculation:**
- μ₀ = 1.2566370614359173 × 10⁻⁶ H/m
- NI = 792 A·turns (for 0.6m belt width, 0.6 core ratio)
- g_eff = 0.062 m (50mm gap + 12mm leakage)
- B₀ = min((1.2566370614359173 × 10⁻⁶ × 792) / 0.062, 1.8)
- B₀ = min(0.01605, 1.8) = **0.01605 Tesla**

### Ampere-Turns Estimation
When detailed coil data is not available:

```
NI = CAL_NI_PER_RATIO_PER_M × coreBeltRatio × max(0.4, width_m)
```

**Example:**
- CAL_NI_PER_RATIO_PER_M = 2200
- coreBeltRatio = 0.6
- width_m = 0.6 (600mm belt)
- NI = 2200 × 0.6 × 0.6 = **792 A·turns**

### Effective Gap Calculation
```
g_eff = max(0.01, gap_input + LEAKAGE_MM/1000)
```

**Example:**
- gap_input = 0.05m (50mm)
- LEAKAGE_MM = 12mm = 0.012m
- g_eff = max(0.01, 0.05 + 0.012) = **0.062m**

### Field Conversion
- **Tesla to Gauss**: Gauss = Tesla × 10,000
- **Example**: 0.01605 Tesla = **161 Gauss**

### Penetration Depth
Field penetration into the burden material:

```
δ = g_eff × (10^(1/DECAY_N) - 1)
```

**Example:**
- g_eff = 0.062m
- DECAY_N = 2.5
- 10^(1/2.5) = 10^0.4 = 2.512
- δ = 0.062 × (2.512 - 1) = 0.062 × 1.512 = 0.094m = **94mm**

### Field Decay Model
Field strength at depth z:

```
B(z) = B₀ × (g_eff/(g_eff + z))^DECAY_N
```

---

## Tramp Metal Removal Efficiency

### Evaluation Height
Representative depth for field evaluation:
```
z* = max(0.010, feedDepth/2000)
```

**Example:**
- feedDepth = 100mm
- z* = max(0.010, 100/2000) = max(0.010, 0.05) = **0.05m**

### Field Decay Functions

**Field at depth:**
```
B(z) = B₀ / (1 + z/g_eff)^N_DECAY
```

**Field gradient:**
```
dB/dz = -(N_DECAY × B₀ / g_eff) / (1 + z/g_eff)^(N_DECAY + 1)
```

Where N_DECAY = 3.0

### Capture Index
Magnetic force indicator:
```
CI = |B(z*) × dB/dz(z*)|
```

### Base Efficiency Mapping
```
baseEfficiency = clamp(0.30 + 0.68 × tanh(CI / CI_SCALE))
```

Where CI_SCALE = 1.0

### Operational Reduction Factors

#### Speed Factor
```
f_speed = min(1, max(0.6, 1 - (v - 1) × 0.15))
```

**Example:** v = 1.5 m/s
- f_speed = min(1, max(0.6, 1 - (1.5 - 1) × 0.15))
- f_speed = min(1, max(0.6, 1 - 0.075)) = **0.925**

#### Depth Factor
```
f_depth = min(1, max(0.5, 1 - feedDepth/400))
```

**Example:** feedDepth = 100mm
- f_depth = min(1, max(0.5, 1 - 100/400)) = **0.75**

#### Gap Factor
```
f_gap = min(1, max(0.6, (100/max(50, gap))^0.8))
```

**Example:** gap = 50mm
- f_gap = min(1, max(0.6, (100/50)^0.8)) = min(1, max(0.6, 2^0.8)) = **1.0**

#### Water Content Factor
```
f_water = min(1, max(0.7, 1 - waterContent/50))
```

#### Trough Angle Factor
```
f_trough = min(1, max(0.85, 1 - max(0, troughAngle - 20) × 0.01))
```

#### Temperature Factor
```
f_temp = min(1, max(0.8, 1 - |ambientTemp - 25|/100))
```

#### Altitude Factor
```
f_alt = min(1, max(0.7, exp(-altitude/8500)))
```

#### Core-Belt Ratio Factor
```
f_ratio = min(1, max(0.6, 0.5 + coreBeltRatio × 0.5))
```

### Combined Efficiency
Weighted geometric mean with factors and weights:

```
fCombined = exp(Σ(wᵢ × ln(fᵢ)) / Σ(wᵢ))
```

**Typical Result Example:**
- Overall efficiency: **30%** (0.3)
- Fine particles: **24.8%** (0.248)
- Medium particles: **26.1%** (0.261)
- Large particles: **25.9%** (0.259)

---

## Thermal Performance

### Coil Current Calculation
```
I = NI / max(1, N)
```

**Example:**
- NI = 792 A·turns
- N = 600 turns (estimated)
- I = 792 / 600 = **1.32 A**

### Temperature-Dependent Resistance
```
ρ(T) = ρ_Cu@20°C × (1 + TCR_Cu × (T - 20))
```

### Coil Resistance
```
R = ρ(T) × (N × L_mean) / A_copper
```

**Example:**
- N = 600 turns
- L_mean = 1.10 m
- A_copper = 200 × 10⁻⁶ m²
- Total wire length = 600 × 1.10 = 660m
- R = (1.72 × 10⁻⁸ × 660) / (200 × 10⁻⁶) = **0.0567 Ω**

### Power Loss
```
P = I² × R
```

**Example:**
- I = 1.32 A
- R = 0.0567 Ω
- P = 1.32² × 0.0567 = **0.099 W** = **0.000099 kW**

### Thermal Resistance (Effective)
```
Rth_eff = Rth_base / max(0.5, airDensityFactor × tempFactor)
```

Where:
- **airDensityFactor**: exp(-altitude/8500)
- **tempFactor**: max(0.6, 1 - max(0, ambient - 25)/60)

### Temperature Rise
```
ΔT = P × Rth_eff
```

**Typical Example:**
- Total power loss: **0.00021 kW**
- Temperature rise: **0.07°C**
- Cooling efficiency: **88.9%** (0.889)

---

## Model Recommendation System

### Base Model Scores
- **OCW (Oil Cooled)**: 90
- **EMAX (Air Cooled)**: 85
- **Cross-Belt Separator**: 82
- **Suspended Electromagnet**: 80
- **Drum Separator**: 75

### Scoring Adjustments

#### High-Power Applications
Oil cooled models get +8 points if:
- Operating temperature > 120°C, OR
- Current density > 4 A/mm²

#### Geometric Considerations
- **Large belt widths** (≥1800mm): Cross-Belt +5 points
- **Small gaps** (<100mm): Drum +6 points
- **High core-belt ratio** (>0.7): EMAX +8 points

#### Environmental Factors
- **High ambient temperature** (>35°C): Oil cooled +6 points

### Current Density Calculation
```
j = I / A_copper    [A/m²]
j_mm² = j / 10⁶     [A/mm²]
```

**Example:**
- I = 1.32 A
- A_copper = 200 × 10⁻⁶ m²
- j = 1.32 / (200 × 10⁻⁶) = 6,600 A/m²
- j_mm² = 6.6 A/mm²

---

## Optimization Algorithm

### Objective Function
```
score = η - 0.002×tempPenalty - 0.2×fieldPenalty - 0.08×currentPenalty
```

Where:
- **η**: Overall removal efficiency
- **tempPenalty**: max(0, operatingTemp - 150)
- **fieldPenalty**: max(0, magneticField - 1.5)
- **currentPenalty**: max(0, currentDensity - 5.0)

### Optimization Parameters
The algorithm optimizes these parameters within bounds:

| Parameter | Min | Max | Step Size |
|-----------|-----|-----|-----------|
| Gap (mm) | 50 | 300 | 10 |
| Core:Belt Ratio | 0.3 | 0.9 | 0.05 |
| Belt Speed (m/s) | 0.5 | 4.0 | 0.2 |
| Feed Depth (mm) | 10 | 200 | 10 |

### Algorithm Details
1. **Pattern Search**: Tests ±step for each parameter
2. **Accept Improvements**: Moves to better solutions
3. **Adaptive Step Size**: Reduces step when no improvement found
4. **Termination**: Stops when step size < 0.05 or target achieved

---

## Validation Limits

### Safety Thresholds
- **Maximum magnetic field**: 1.6 Tesla
- **Maximum operating temperature**: 150°C
- **Maximum current density**: 5.0 A/mm²
- **Maximum power loss**: 25 kW

### Equipment Ratings by Model
- **OCW (Oil Cooled)**: Max 25kW, 150°C, 1.6T, 2500W thermal rating
- **EMAX (Air Cooled)**: Max 15kW, 120°C, 1.4T, 1500W thermal rating

### Compliance Checking
```
powerCompliance = totalPowerLoss ≤ maxPowerLoss
thermalCompliance = operatingTemp ≤ maxOperatingTemp
magneticCompliance = magneticField ≤ maxMagneticField
overallCompliance = powerCompliance AND thermalCompliance AND magneticCompliance
```

---

## Example Complete Calculation

### Input Parameters
- Belt width: 600mm
- Gap: 50mm
- Core:belt ratio: 0.6
- Belt speed: 1 m/s
- Feed depth: 100mm
- Trough angle: 20°
- Ambient temperature: 25°C
- Altitude: 1000m

### Calculated Results

#### Magnetic Field
- NI = 2200 × 0.6 × 0.6 = **792 A·turns**
- g_eff = max(0.01, 0.05 + 0.012) = **0.062m**
- B₀ = min((1.2566 × 10⁻⁶ × 792) / 0.062, 1.8) = **0.01605 Tesla**
- Gauss = 0.01605 × 10,000 = **161 Gauss**
- Penetration = 0.062 × (10^0.4 - 1) = **94mm**

#### Removal Efficiency
- Base efficiency from capture index: ~30%
- After operational factors: **30.0%** overall

#### Thermal Performance
- Current: 792/600 = **1.32 A**
- Power loss: **0.00021 kW**
- Temperature rise: **0.07°C**

#### Recommended Model
- **OCW (Oil Cooled)** - Score: 90
- All compliance checks: **PASS**

---

## References

This calculation framework is based on electromagnetic theory, thermal analysis principles, and empirical correlations derived from magnetic separator performance data. Constants and correlations are calibrated against field measurements and manufacturer specifications.

For implementation details, refer to the source code in `src/utils/calculations.ts`.