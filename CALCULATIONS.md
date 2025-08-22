# Magnetic Separator Design Calculations

This document provides a detailed explanation of all mathematical calculations used in the magnetic separator design and optimization system.

## Table of Contents

1. [Magnetic Field Calculations](#magnetic-field-calculations)
2. [Tramp Metal Removal Efficiency](#tramp-metal-removal-efficiency)
3. [Thermal Performance](#thermal-performance)
4. [Separator Model Recommendation](#separator-model-recommendation)
5. [Optimization Algorithm](#optimization-algorithm)
6. [Validation and Safety Checks](#validation-and-safety-checks)

---

## Magnetic Field Calculations

### Core Magnetic Field Formula

The magnetic field strength is calculated using a simplified electromagnetic approach:

```
B = (0.1 × Core:Belt Ratio) / (Gap / 1000)
```

Where:
- **B** = Magnetic field strength (Tesla)
- **Core:Belt Ratio** = Ratio of magnet core width to belt width (dimensionless)
- **Gap** = Air gap between magnet and belt surface (mm)

### Unit Conversions

- **Tesla to Gauss**: `Gauss = Tesla × 10,000`
- **Penetration Depth**: 
  ```
  δ = √(2 / (2π × f × μ₀ × σ)) × 1000
  ```
  Where:
  - f = 50 Hz (frequency)
  - μ₀ = 4π × 10⁻⁷ H/m (permeability of free space)
  - σ = 10⁶ S/m (conductivity)

---

## Tramp Metal Removal Efficiency

### Base Magnetic Force

```
F_magnetic = B × χ × 1000
```

Where:
- **χ** = 0.003 (assumed iron susceptibility)
- **B** = Magnetic field strength (Tesla)

### Efficiency Factors

The overall removal efficiency is calculated by applying multiple correction factors:

```
η_overall = η_base × f_speed × f_depth × f_trough × f_temp × f_altitude × f_water × f_gap × f_ratio
```

#### Belt Speed Factor
```
f_speed = max(0.3, 1 - (v_belt - 1) × 0.15)
```
Where v_belt is belt speed in m/s.

#### Feed Depth Factor
```
f_depth = max(0.4, 1 - (d_feed - 50) / 500)
```
Where d_feed is feed depth in mm.

#### Trough Angle Factor
```
f_trough = max(0.8, 1 - (θ_trough - 20) × 0.01)
```
Where θ_trough is trough angle in degrees.

#### Environmental Temperature Factor
```
f_temp = max(0.7, 1 - |T_ambient - 25| / 100)
```
Where T_ambient is ambient temperature in °C.

#### Altitude Factor
```
f_altitude = max(0.9, 1 - altitude / 5000)
```
Where altitude is in meters above sea level.

#### Water Content Factor
```
f_water = max(0.6, 1 - water_content / 50)
```
Where water_content is percentage moisture.

#### Gap Factor
```
f_gap = max(0.5, 1 - (gap - 100) / 400)
```
Where gap is in mm.

#### Core:Belt Ratio Factor
```
f_ratio = 0.5 + ratio × 0.5
```

### Particle Size Efficiency

Efficiency varies by particle size based on average dimensions:

```
avg_size = (width + length + height) / 3
```

**Fine Particles** (< 10mm): 70-90% of base efficiency
**Medium Particles** (10-20mm): 85-95% of base efficiency  
**Large Particles** (> 20mm): 80-95% of base efficiency

---

## Thermal Performance

### Power Loss Calculation

```
P_total = P_base × f_throughput × f_speed
```

Where:
- **P_base** = Core:Belt Ratio × 10 kW
- **f_throughput** = 1 + (Throughput / 100) × 0.1
- **f_speed** = 1 + (Belt Speed / 5) × 0.2

### Temperature Rise

```
ΔT = P_total × R_thermal
```

Where:
```
R_thermal = 1 / η_cooling_effective
```

### Effective Cooling Efficiency

```
η_cooling_effective = η_cooling_base × f_altitude × f_temp
```

Where:
- **η_cooling_base** = 0.65 (assumed air cooling)
- **f_altitude** = max(0.7, 1 - altitude / 3000)
- **f_temp** = max(0.6, 1 - (T_ambient - 20) / 50)

---

## Separator Model Recommendation

### Scoring Algorithm

Each separator model is assigned a base score and adjusted based on operating conditions:

| Model | Base Score |
|-------|------------|
| OCW (Oil Cooled) | 90 |
| EMAX (Air Cooled) | 85 |
| Cross-Belt Separator | 82 |
| Suspended Electromagnet | 80 |
| Drum Separator | 75 |

### Score Adjustments

- **Belt Width > 1800mm + Cross-Belt**: +5 points
- **Throughput > 500 TPH + Oil Cooled**: +8 points
- **Gap < 100mm + Drum**: +6 points
- **Temperature > 35°C + Oil Cooled**: +6 points
- **Core:Belt Ratio > 0.7 + EMAX**: +8 points

---

## Optimization Algorithm

### Objective Function

Maximize tramp metal removal efficiency by iteratively adjusting parameters:

```
maximize: η_overall(gap, ratio, speed, depth)
subject to: bounds constraints
```

### Parameter Bounds

| Parameter | Minimum | Maximum | Step Size |
|-----------|---------|---------|-----------|
| Gap (mm) | 50 | 300 | 5 |
| Core:Belt Ratio | 0.3 | 0.9 | 0.05 |
| Belt Speed (m/s) | 0.5 | 4.0 | 0.1 |
| Feed Depth (mm) | 10 | 200 | 10 |

### Optimization Strategy

1. **Reduce Gap**: Stronger magnetic field with smaller air gap
2. **Increase Core:Belt Ratio**: Higher magnetic field strength
3. **Reduce Belt Speed**: More collection time for particles
4. **Reduce Feed Depth**: Better magnetic field penetration

### Convergence Criteria

- Target efficiency achieved: `η ≥ η_target`
- Maximum iterations reached: `i ≥ 100`

---

## Validation and Safety Checks

### Critical Safety Thresholds

| Parameter | Warning | Critical |
|-----------|---------|----------|
| Temperature (°C) | 120 | 180 |
| Magnetic Field (Tesla) | 1.2 | 1.5 |
| Removal Efficiency (%) | 90 | 98 |

### Equipment Rating Validation

Equipment compliance is checked against manufacturer specifications:

- **Power Loss**: P_total ≤ P_max_rated
- **Operating Temperature**: T_operating ≤ T_max_rated  
- **Magnetic Field**: B ≤ B_max_rated

### Validation Formula

```
Compliance = Power_OK AND Thermal_OK AND Magnetic_OK
```

---

## Mathematical Constants

- **μ₀** (Permeability of free space): 4π × 10⁻⁷ H/m
- **Iron Susceptibility**: 0.003
- **Frequency**: 50 Hz
- **Base Cooling Efficiency**: 65%
- **Tesla to Gauss Conversion**: 10,000

---

## References

1. Electromagnetic field theory for magnetic separator design
2. Industrial magnetic separation performance data
3. Thermal management in electromagnetic systems
4. Optimization algorithms for multi-parameter systems

---

*This document provides the mathematical foundation for all calculations performed by the magnetic separator design system. For implementation details, refer to the source code in `/src/utils/calculations.ts`.*