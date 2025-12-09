import { useState, useMemo, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw, Info, Download, FileText, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { 
  TrampShape, 
  TrampOrientation, 
  BurdenSeverity, 
  TrampGeometry,
  calculateMarginRatioFromGauss,
  marginRatioToConfidence
} from "@/utils/trampPickup";

// Constants for force-based calculations
const CONSTANTS = {
  v0: 2.0,      // reference belt speed (m/s)
  g0: 200,      // reference air gap (mm)
  d0: 100,      // reference burden depth (mm)
  k: 0.5,       // burden → gap conversion factor
  a: 0.4,       // speed exponent
  b: 1.7,       // distance exponent
  c: 0.5        // burden exponent
};

// Scientific decay constants for magnetic field calculations
const DECAY_CONSTANTS = {
  DECAY_GAUSS: 0.00575,   // Gauss decay coefficient (linear)
  DECAY_FF: 0.01150,      // FF decay coefficient (2x Gauss - squared relationship)
  SCALE_A20: 1.000,       // Reference temperature (20°C)
  SCALE_A30: 0.95484,     // A30 Gauss relative to A20 (95.484% strength)
  SCALE_A40: 0.90451      // A40 Gauss relative to A20 (90.451% strength)
};

// Force Factor temperature ratios (FF drops more heavily than Gauss)
const FF_TEMP_RATIOS = {
  20: 1.000,    // Reference (100%)
  30: 0.9117,   // ~91.2% (heavier drop than Gauss)
  40: 0.8181    // ~81.8% (much heavier drop)
};

// Tramp metal item for W×L×H input
interface TrampItem {
  id: string;
  name: string;
  width_mm: number;
  length_mm: number;
  thickness_mm: number;
  orientation: TrampOrientation;
}

const DEFAULT_TRAMP: TrampItem = {
  id: '1',
  name: 'Tramp 1',
  width_mm: 50,
  length_mm: 100,
  thickness_mm: 10,
  orientation: 'flat'
};

const STEEL_DENSITY = 7850; // kg/m³

const SAFETY_FACTOR = 1.5; // 50% margin recommended

// Temperature-specific correlation factors for decay calculations
const TEMP_CONFIGS = {
  20: {
    label: '20°C Ambient',
    ampereTurnsCorrelation: 0.615238,  // OCW Unit <-> Gauss (ampere-turns)
    forceFactorCorrelation: 1.000,      // Gauss scaling (reference)
    ffTemperatureRatio: 1.000,          // FF scaling (reference)
    gaussForceCorrelation: 0.944644,    // Gauss <-> Force Factor
    dbField: 'hot_ampere_turns_A' as const,
    voltageField: 'voltage_A' as const,
    wattsField: 'watts_A' as const
  },
  30: {
    label: '30°C Ambient',
    ampereTurnsCorrelation: 0.627028,
    forceFactorCorrelation: 0.95484,    // Gauss scaling (95.48%)
    ffTemperatureRatio: 0.9117,         // FF scaling (91.17% - heavier drop)
    gaussForceCorrelation: 0.954985,
    dbField: 'hot_ampere_turns_B' as const,
    voltageField: 'voltage_B' as const,
    wattsField: 'watts_B' as const
  },
  40: {
    label: '40°C Ambient',
    ampereTurnsCorrelation: 0.629352,
    forceFactorCorrelation: 0.90451,    // Gauss scaling (90.45%)
    ffTemperatureRatio: 0.8181,         // FF scaling (81.81% - much heavier drop)
    gaussForceCorrelation: 0.959471,
    dbField: 'hot_ampere_turns_C' as const,
    voltageField: 'voltage_C' as const,
    wattsField: 'watts_C' as const
  }
} as const;

type AmbientTemp = keyof typeof TEMP_CONFIGS;
type TempConfig = typeof TEMP_CONFIGS[AmbientTemp];

interface OCWModel {
  model: string;
  Prefix: number;
  Suffix: number;
  surface_gauss: number;
  watts: number;
  force_factor: number;
  width: number;
  frame: string;
}

interface ComparisonDataPoint {
  gap: number;
  requiredForce: number;
  severity: number;
  gauss20C: number | null;
  gauss30C: number | null;
  gauss40C: number | null;
  modelForce20C: number | null;
  modelForce30C: number | null;
  modelForce40C: number | null;
  modelWatts: number | null;
  sufficient: boolean | null;
  margin: number | null;
  confidencePercent: number | null;
}

// Helper to get confidence color class
function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return 'text-green-600';
  if (confidence >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getConfidenceBadgeVariant(confidence: number): 'default' | 'secondary' | 'destructive' {
  if (confidence >= 75) return 'default';
  if (confidence >= 50) return 'secondary';
  return 'destructive';
}

/**
 * Calculate severity factor S(v, g, d)
 */
function severity(v: number, g: number, d: number): number {
  const h = g + CONSTANTS.k * d;
  const h0 = CONSTANTS.g0 + CONSTANTS.k * CONSTANTS.d0;
  
  return (
    Math.pow(v / CONSTANTS.v0, CONSTANTS.a) *
    Math.pow(h / h0, CONSTANTS.b) *
    Math.pow(d / CONSTANTS.d0, CONSTANTS.c)
  );
}

/**
 * Calculate required pull force for a tramp item using physics-based formula
 * Required force = weight × orientationFactor × burdenFactor × safetyFactor
 */
function calculateTrampRequiredForce(
  item: TrampItem, 
  burden: BurdenSeverity, 
  safetyFactor: number = 3.0
): { mass_kg: number; weight_N: number; requiredForce_N: number } {
  const volume_m3 = (item.width_mm / 1000) * (item.length_mm / 1000) * (item.thickness_mm / 1000);
  const mass_kg = volume_m3 * STEEL_DENSITY;
  const weight_N = mass_kg * 9.81;
  
  const oriFactor = item.orientation === 'flat' ? 1.0 
    : item.orientation === 'edge' ? 4.0 
    : item.orientation === 'corner' ? 6.0 
    : 5.0; // unknown
    
  const burFactor = burden === 'none' ? 1.0
    : burden === 'light' ? 1.5
    : burden === 'moderate' ? 2.5
    : burden === 'heavy' ? 4.0
    : burden === 'severe' ? 6.0
    : 3.0;
    
  return {
    mass_kg,
    weight_N,
    requiredForce_N: weight_N * oriFactor * burFactor * safetyFactor
  };
}

/**
 * Get maximum required force from all tramp items (worst case)
 */
function getMaxRequiredForce(
  items: TrampItem[], 
  burden: BurdenSeverity, 
  safetyFactor: number
): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(item => 
    calculateTrampRequiredForce(item, burden, safetyFactor).requiredForce_N
  ));
}

/**
 * Calculate Gauss value at a given gap using linear decay
 * Formula: startGauss × e^(-DECAY_GAUSS × gap) × temperatureRatio
 */
function calculateGaussAtGap(startGauss: number, gap: number, tempConfig: TempConfig): number {
  const decayFactor = Math.exp(-DECAY_CONSTANTS.DECAY_GAUSS * gap);
  return startGauss * decayFactor * tempConfig.forceFactorCorrelation;
}

/**
 * Calculate Force Factor at a given gap using steeper decay
 * Formula: startFF × e^(-DECAY_FF × gap) × ffTemperatureRatio
 * FF decays twice as fast as Gauss (squared relationship)
 */
function calculateFFAtGap(startFF: number, gap: number, tempConfig: TempConfig): number {
  const decayFactor = Math.exp(-DECAY_CONSTANTS.DECAY_FF * gap);
  return startFF * decayFactor * tempConfig.ffTemperatureRatio;
}

/**
 * Calculate Gauss value from Force Factor (optional helper for future use)
 * Formula: FF = k × Gauss², so Gauss = sqrt(FF / k)
 */
function calculateGaussFromFF(forceFactorAtGap: number, startGauss: number, startFF: number): number {
  const k = startFF / Math.pow(startGauss, 2);
  return Math.sqrt(forceFactorAtGap / k);
}

/**
 * Calculate model's ampere turns at a given gap
 * Ampere turns (NI) is a property of the coil and doesn't decay with gap
 * Only the magnetic field decays with distance, not the ampere turns themselves
 */
function calculateAmpereTurnsAtGap(baseAT: number, gap: number, tempConfig: TempConfig): number {
  // Ampere turns don't decay with gap - they're constant for a given coil
  return baseAT;
}

function validateModel(requiredForce: number, modelForce: number): {
  status: 'excellent' | 'adequate' | 'marginal' | 'insufficient',
  message: string
} {
  const ratio = modelForce / requiredForce;
  
  if (ratio >= SAFETY_FACTOR * 1.2) {
    return { status: 'excellent', message: 'Exceeds requirements with excellent margin' };
  } else if (ratio >= SAFETY_FACTOR) {
    return { status: 'adequate', message: 'Meets requirements with adequate safety factor' };
  } else if (ratio >= 1.0) {
    return { status: 'marginal', message: 'Barely meets requirements - consider larger model' };
  } else {
    return { status: 'insufficient', message: 'Insufficient for requirements' };
  }
}

export default function OCWModelComparison() {
  const [beltSpeed, setBeltSpeed] = useState(2.0);
  const [airGap, setAirGap] = useState(200);
  const [burdenDepth, setBurdenDepth] = useState(100);
  const [beltWidth, setBeltWidth] = useState(1200);
  const [trampItems, setTrampItems] = useState<TrampItem[]>([DEFAULT_TRAMP]);
  const [burdenSeverity, setBurdenSeverity] = useState<BurdenSeverity>('moderate');
  const [trampSafetyFactor, setTrampSafetyFactor] = useState(3.0);
  const [ambientTemp, setAmbientTemp] = useState<AmbientTemp>(20);
  const [selectedModel, setSelectedModel] = useState<OCWModel | null>(null);
  const [ocwModels, setOcwModels] = useState<OCWModel[]>([]);
  const [showTable, setShowTable] = useState(true);
  const [showSpecsDialog, setShowSpecsDialog] = useState(false);
  const [detailedOCWData, setDetailedOCWData] = useState<any>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  
  // Tramp item management functions
  const addTrampItem = () => {
    const newId = String(Date.now());
    setTrampItems(prev => [...prev, {
      id: newId,
      name: `Tramp ${prev.length + 1}`,
      width_mm: 50,
      length_mm: 100,
      thickness_mm: 10,
      orientation: 'flat' as TrampOrientation
    }]);
  };
  
  const removeTrampItem = (id: string) => {
    if (trampItems.length > 1) {
      setTrampItems(prev => prev.filter(item => item.id !== id));
    }
  };
  
  const updateTrampItem = (id: string, updates: Partial<TrampItem>) => {
    setTrampItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('BMR_Top')
        .select('*')
        .order('Prefix', { ascending: true })
        .order('Suffix', { ascending: true });
      
      if (data) setOcwModels(data);
    };
    fetchModels();
  }, []);

  // Fetch detailed OCW data when model is selected
  useEffect(() => {
    const fetchDetailedData = async () => {
      if (!selectedModel) {
        setDetailedOCWData(null);
        return;
      }
      
      try {
        setLoadingSpecs(true);
        const { data, error } = await supabase
          .from('BMR_magwiz')
          .select('*')
          .eq('prefix', selectedModel.Prefix)
          .eq('suffix', selectedModel.Suffix)
          .single();
        
        if (error) throw error;
        setDetailedOCWData(data);
      } catch (error) {
        console.error('Error fetching detailed OCW data:', error);
        setDetailedOCWData(null);
      } finally {
        setLoadingSpecs(false);
      }
    };
    
    fetchDetailedData();
  }, [selectedModel]);

  const filteredModels = useMemo(() => {
    const minWidth = beltWidth * 0.8;  // -20%
    const maxWidth = beltWidth * 1.3;  // +30%
    
    return ocwModels.filter(model => 
      model.width >= minWidth && model.width <= maxWidth
    );
  }, [ocwModels, beltWidth]);

  useEffect(() => {
    if (selectedModel && !filteredModels.find(m => m.model === selectedModel.model)) {
      setSelectedModel(null);
    }
  }, [filteredModels, selectedModel]);

  const currentResults = useMemo(() => {
    const S = severity(beltSpeed, airGap, burdenDepth);
    const reqForce = getMaxRequiredForce(trampItems, burdenSeverity, trampSafetyFactor);
    return {
      severity: S,
      requiredForce: reqForce
    };
  }, [beltSpeed, airGap, burdenDepth, trampItems, burdenSeverity, trampSafetyFactor]);

  const comparisonData = useMemo(() => {
    const data: ComparisonDataPoint[] = [];
    
    for (let g = 0; g <= 800; g += 25) {
      const S = severity(beltSpeed, g, burdenDepth);
      const reqForce = getMaxRequiredForce(trampItems, burdenSeverity, trampSafetyFactor);
      
      // Calculate Gauss at all three temperatures
      const gauss20C = selectedModel 
        ? calculateGaussAtGap(selectedModel.surface_gauss, g, TEMP_CONFIGS[20])
        : null;
      
      const gauss30C = selectedModel 
        ? calculateGaussAtGap(selectedModel.surface_gauss, g, TEMP_CONFIGS[30])
        : null;
      
      const gauss40C = selectedModel 
        ? calculateGaussAtGap(selectedModel.surface_gauss, g, TEMP_CONFIGS[40])
        : null;
      
      // Calculate force at all three temperatures using FF-specific decay
      const modelForce20C = selectedModel 
        ? calculateFFAtGap(selectedModel.force_factor, g, TEMP_CONFIGS[20])
        : null;
      
      const modelForce30C = selectedModel 
        ? calculateFFAtGap(selectedModel.force_factor, g, TEMP_CONFIGS[30])
        : null;
      
      const modelForce40C = selectedModel 
        ? calculateFFAtGap(selectedModel.force_factor, g, TEMP_CONFIGS[40])
        : null;
      
      // Use current temperature for sufficient check
      const tempConfig = TEMP_CONFIGS[ambientTemp];
      const currentTempForce = selectedModel 
        ? calculateFFAtGap(selectedModel.force_factor, g, tempConfig)
        : null;
      
      // Calculate confidence percentage (available/required ratio)
      const confidencePercent = (currentTempForce && reqForce > 0) 
        ? marginRatioToConfidence(currentTempForce / reqForce)
        : null;
      
      data.push({
        gap: g,
        severity: Math.round(S * 100) / 100,
        requiredForce: Math.round(reqForce),
        gauss20C: gauss20C ? Math.round(gauss20C) : null,
        gauss30C: gauss30C ? Math.round(gauss30C) : null,
        gauss40C: gauss40C ? Math.round(gauss40C) : null,
        modelForce20C: modelForce20C ? Math.round(modelForce20C) : null,
        modelForce30C: modelForce30C ? Math.round(modelForce30C) : null,
        modelForce40C: modelForce40C ? Math.round(modelForce40C) : null,
        modelWatts: selectedModel?.watts || null,
        sufficient: currentTempForce ? currentTempForce >= reqForce : null,
        margin: currentTempForce 
          ? ((currentTempForce - reqForce) / reqForce * 100)
          : null,
        confidencePercent
      });
    }
    return data;
  }, [beltSpeed, burdenDepth, trampItems, burdenSeverity, trampSafetyFactor, selectedModel, ambientTemp]);

  const currentGapComparison = useMemo(() => {
    if (!selectedModel) return null;
    
    const tempConfig = TEMP_CONFIGS[ambientTemp];
    const modelForce = calculateFFAtGap(
      selectedModel.force_factor, 
      airGap, 
      tempConfig
    );
    const validation = validateModel(currentResults.requiredForce, modelForce);
    const margin = ((modelForce - currentResults.requiredForce) / currentResults.requiredForce * 100);
    
    return {
      modelForce: Math.round(modelForce),
      margin,
      validation
    };
  }, [selectedModel, airGap, currentResults, ambientTemp]);

  const handleReset = () => {
    setBeltSpeed(2.0);
    setAirGap(200);
    setBurdenDepth(100);
    setBeltWidth(1200);
    setTrampItems([DEFAULT_TRAMP]);
    setBurdenSeverity('moderate');
    setTrampSafetyFactor(3.0);
    setAmbientTemp(20);
    setSelectedModel(null);
  };

  const exportToCSV = () => {
    const headers = ['Gap (mm)', 'Gauss @ 20°C', 'Gauss @ 30°C', 'Gauss @ 40°C', 'Force @ 20°C (N)', 'Force @ 30°C (N)', 'Force @ 40°C (N)', 'Required Force (N)', 'Margin %', 'Confidence %', 'Status'];
    const rows = comparisonData.map(row => [
      row.gap,
      row.gauss20C || '',
      row.gauss30C || '',
      row.gauss40C || '',
      row.modelForce20C || '',
      row.modelForce30C || '',
      row.modelForce40C || '',
      row.requiredForce,
      row.margin?.toFixed(1) || '',
      row.confidencePercent ?? '',
      row.sufficient ? 'OK' : 'INSUFFICIENT'
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocw-gauss-table-${selectedModel?.model || 'model'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">OCW Model Comparison</h1>
            <p className="text-muted-foreground mt-2">
              Compare operating requirements against actual OCW model capabilities
            </p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Parameters</CardTitle>
              <CardDescription>Adjust conditions to see requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Belt Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Belt Speed</label>
                  <Badge variant="secondary">{beltSpeed.toFixed(2)} m/s</Badge>
                </div>
                <Slider
                  value={[beltSpeed]}
                  onValueChange={(val) => setBeltSpeed(val[0])}
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Air Gap */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Air Gap</label>
                  <Badge variant="secondary">{airGap} mm</Badge>
                </div>
                <Slider
                  value={[airGap]}
                  onValueChange={(val) => setAirGap(val[0])}
                  min={100}
                  max={800}
                  step={25}
                  className="w-full"
                />
              </div>

              {/* Burden Depth */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Burden Depth</label>
                  <Badge variant="secondary">{burdenDepth} mm</Badge>
                </div>
                <Slider
                  value={[burdenDepth]}
                  onValueChange={(val) => setBurdenDepth(val[0])}
                  min={0}
                  max={300}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Belt Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Belt Width</label>
                  <Badge variant="secondary">{beltWidth} mm</Badge>
                </div>
                <Slider
                  value={[beltWidth]}
                  onValueChange={(val) => setBeltWidth(val[0])}
                  min={150}
                  max={3000}
                  step={50}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Showing models from {Math.round(beltWidth * 0.8)}mm to {Math.round(beltWidth * 1.3)}mm
                </p>
              </div>

              {/* Tramp Metal Configuration */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Tramp Metal Configuration</label>
                  <Button variant="outline" size="sm" onClick={addTrampItem}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                
                {/* Burden Severity */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Burden:</span>
                  <Select value={burdenSeverity} onValueChange={(v) => setBurdenSeverity(v as BurdenSeverity)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Safety Factor */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Safety:</span>
                  <Input
                    type="number"
                    value={trampSafetyFactor}
                    onChange={(e) => setTrampSafetyFactor(parseFloat(e.target.value) || 1)}
                    className="h-8 w-20 text-xs"
                    min={1}
                    max={10}
                    step={0.5}
                  />
                </div>
                
                {/* Tramp Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trampItems.map((item, index) => {
                    const result = calculateTrampRequiredForce(item, burdenSeverity, trampSafetyFactor);
                    
                    // Calculate confidence if model is selected
                    let itemConfidence: number | null = null;
                    if (selectedModel) {
                      const tempConfig = TEMP_CONFIGS[ambientTemp];
                      const modelForceAtGap = calculateFFAtGap(selectedModel.force_factor, airGap, tempConfig);
                      const marginRatio = result.requiredForce_N > 0 ? modelForceAtGap / result.requiredForce_N : 0;
                      itemConfidence = marginRatioToConfidence(marginRatio);
                    }
                    
                    return (
                      <div key={item.id} className="bg-muted/50 rounded-md p-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTrampItem(item.id)}
                            disabled={trampItems.length === 1}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Dimensions W × L × H */}
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <span className="text-[10px] text-muted-foreground">W (mm)</span>
                            <Input
                              type="number"
                              value={item.width_mm}
                              onChange={(e) => updateTrampItem(item.id, { width_mm: parseFloat(e.target.value) || 0 })}
                              className="h-7 text-xs"
                              min={1}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground">L (mm)</span>
                            <Input
                              type="number"
                              value={item.length_mm}
                              onChange={(e) => updateTrampItem(item.id, { length_mm: parseFloat(e.target.value) || 0 })}
                              className="h-7 text-xs"
                              min={1}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground">H (mm)</span>
                            <Input
                              type="number"
                              value={item.thickness_mm}
                              onChange={(e) => updateTrampItem(item.id, { thickness_mm: parseFloat(e.target.value) || 0 })}
                              className="h-7 text-xs"
                              min={1}
                            />
                          </div>
                        </div>
                        
                        {/* Orientation */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Orient:</span>
                          <Select 
                            value={item.orientation} 
                            onValueChange={(v) => updateTrampItem(item.id, { orientation: v as TrampOrientation })}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat (1.0×)</SelectItem>
                              <SelectItem value="edge">Edge (4.0×)</SelectItem>
                              <SelectItem value="corner">Corner (6.0×)</SelectItem>
                              <SelectItem value="unknown">Unknown (5.0×)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Calculated Force & Confidence */}
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-border/50">
                          <span className="text-muted-foreground">Mass: {(result.mass_kg * 1000).toFixed(0)}g</span>
                          <span className="font-medium text-primary">Req: {result.requiredForce_N.toFixed(0)}N</span>
                        </div>
                        
                        {/* Per-item Confidence */}
                        {itemConfidence !== null && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Pickup Confidence:</span>
                            <Badge variant={getConfidenceBadgeVariant(itemConfidence)} className="text-[10px] px-1.5 py-0">
                              {itemConfidence}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Requirements */}
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-semibold text-sm">Required at Current Gap:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity Index:</span>
                    <span className="font-medium">{currentResults.severity.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Required Force:</span>
                    <span className="font-medium">{currentResults.requiredForce.toLocaleString()} N</span>
                  </div>
                </div>
              </div>

              {/* Model Comparison at Current Gap */}
              {currentGapComparison && (
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-semibold text-sm">Model at Current Gap:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Force:</span>
                      <span className="font-medium">{currentGapComparison.modelForce.toLocaleString()} N</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className={`font-medium ${currentGapComparison.margin > 50 ? 'text-green-600' : currentGapComparison.margin > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {currentGapComparison.margin > 0 ? '+' : ''}{currentGapComparison.margin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="pt-2">
                      <Badge variant={
                        currentGapComparison.validation.status === 'excellent' ? 'default' :
                        currentGapComparison.validation.status === 'adequate' ? 'default' :
                        currentGapComparison.validation.status === 'marginal' ? 'secondary' :
                        'destructive'
                      }>
                        {currentGapComparison.validation.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tramp Pickup Summary */}
              {selectedModel && currentResults.requiredForce > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-semibold text-sm">Tramp Pickup Summary</h4>
                  {(() => {
                    const tempConfig = TEMP_CONFIGS[ambientTemp];
                    const modelForceAtGap = calculateFFAtGap(selectedModel.force_factor, airGap, tempConfig);
                    const worstMarginRatio = currentResults.requiredForce > 0 
                      ? modelForceAtGap / currentResults.requiredForce 
                      : 0;
                    const worstConfidence = marginRatioToConfidence(worstMarginRatio);
                    
                    return (
                      <div className="bg-muted/30 rounded-md p-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">At {airGap}mm gap ({ambientTemp}°C):</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Model Force:</span>
                          <span className="font-medium">{modelForceAtGap.toLocaleString(undefined, { maximumFractionDigits: 0 })} N</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Max Required:</span>
                          <span className="font-medium">{currentResults.requiredForce.toLocaleString(undefined, { maximumFractionDigits: 0 })} N</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                          <span className="font-medium">Worst Case Confidence:</span>
                          <Badge 
                            variant={getConfidenceBadgeVariant(worstConfidence)} 
                            className="text-sm px-2"
                          >
                            {worstConfidence}%
                          </Badge>
                        </div>
                        <p className={`text-xs ${worstConfidence >= 75 ? 'text-green-600' : worstConfidence >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {worstConfidence >= 75 ? '✓ High confidence all tramp will be removed' :
                           worstConfidence >= 50 ? '⚠ Moderate confidence - consider larger model' :
                           '✗ Low confidence - larger model recommended'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graph Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Comparison - {TEMP_CONFIGS[ambientTemp].label}</CardTitle>
                    <CardDescription>Requirements vs Model Capability</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Select OCW Model to Compare:</label>
                    <Badge variant="outline">
                      {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedModel?.model || ""}
                      onValueChange={(value) => {
                        const model = filteredModels.find(m => m.model === value);
                        setSelectedModel(model || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model to compare..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredModels.length > 0 ? (
                          filteredModels.map((model) => (
                            <SelectItem key={model.model} value={model.model}>
                              {model.model} - {model.surface_gauss.toLocaleString()}G @ {model.watts.toLocaleString()}W (Width: {model.width}mm)
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No models match the selected belt width
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    {selectedModel && (
                      <Dialog open={showSpecsDialog} onOpenChange={setShowSpecsDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="default" className="shrink-0">
                            <FileText className="mr-2 h-4 w-4" />
                            View Specifications
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>OCW Specifications - {selectedModel.Prefix} OCW {selectedModel.Suffix}</DialogTitle>
                          </DialogHeader>
                          
                          {loadingSpecs ? (
                            <div className="py-8 text-center text-muted-foreground">
                              Loading detailed specifications...
                            </div>
                          ) : detailedOCWData ? (
                            <div className="space-y-6">
                              {/* Performance Specifications */}
                              <div>
                                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Performance Specifications</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <div>
                                    <div className="text-sm text-muted-foreground">Surface Gauss</div>
                                    <div className="text-2xl font-bold">{selectedModel.surface_gauss}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Force Factor</div>
                                    <div className="text-2xl font-bold">{selectedModel.force_factor?.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Watts</div>
                                    <div className="text-2xl font-bold">{selectedModel.watts}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Width (mm)</div>
                                    <div className="text-2xl font-bold">{selectedModel.width}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Frame</div>
                                    <div className="text-2xl font-bold">{selectedModel.frame}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Component Breakdown */}
                              <div>
                                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Component Breakdown</h3>
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Component</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Material</TableHead>
                                        <TableHead>Dimension</TableHead>
                                        <TableHead className="text-right">Mass (kg)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {[
                                        { name: "Core", amount: 1, material: "Mild Steel", dimension: detailedOCWData.core_dimension, mass: detailedOCWData.core_mass },
                                        { name: "Winding", amount: 1, material: "Aluminium Nomex", dimension: detailedOCWData.winding_dimension, mass: detailedOCWData.winding_mass },
                                        { name: "Backbar", amount: 1, material: "Mild Steel", dimension: detailedOCWData.backbar_dimension, mass: detailedOCWData.backbar_mass },
                                        { name: "Core Backbar", amount: 1, material: "Mild Steel", dimension: detailedOCWData.core_backbar_dimension, mass: detailedOCWData.core_backbar_mass },
                                        { name: "Side Pole", amount: 4, material: "Mild Steel", dimension: detailedOCWData.side_pole_dimension, mass: detailedOCWData.side_pole_mass },
                                        { name: "Sealing Plate", amount: 1, material: "Manganese Steel", dimension: detailedOCWData.sealing_plate_dimension, mass: detailedOCWData.sealing_plate_mass ? parseFloat(detailedOCWData.sealing_plate_mass) : undefined },
                                        { name: "Core Insulator", amount: 1, material: "Elephantide", dimension: detailedOCWData.core_insulator_dimension, mass: detailedOCWData.core_insulator_mass ? parseFloat(detailedOCWData.core_insulator_mass) : undefined },
                                        { name: "Conservator", amount: 1, material: "Mild Steel", dimension: detailedOCWData.conservator_dimension, mass: detailedOCWData.conservator_mass },
                                        { name: "Coolant", amount: 7563, material: "Oil", dimension: "-", mass: detailedOCWData.coolant_mass }
                                      ].filter(item => item.mass !== undefined && item.mass !== null).map((item, index) => (
                                        <TableRow key={index}>
                                          <TableCell className="font-medium">{item.name}</TableCell>
                                          <TableCell>{item.amount}</TableCell>
                                          <TableCell>{item.material}</TableCell>
                                          <TableCell className="font-mono text-xs">{item.dimension || '-'}</TableCell>
                                          <TableCell className="text-right">{typeof item.mass === 'number' ? item.mass.toFixed(2) : '-'}</TableCell>
                                        </TableRow>
                                      ))}
                                      <TableRow className="font-bold bg-muted/50">
                                        <TableCell colSpan={4}>Total Mass</TableCell>
                                        <TableCell className="text-right">{detailedOCWData.total_mass?.toFixed(2)}</TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* Winding Information and Temperature Side by Side */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Winding Information */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Winding Information</h3>
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell className="font-medium">Number of Sections</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.number_of_sections}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Radial Depth (mm)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.radial_depth}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Coil Height (mm)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.coil_height?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Diameter (mm)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.diameter?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Mean Length of Turn (mm)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.mean_length_of_turn?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Number of Turns</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.number_of_turns}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Surface Area (m²)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.surface_area?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Wires in Parallel</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.wires_in_parallel}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>

                                {/* Temperature & Electrical Properties */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Temperature & Electrical Properties</h3>
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Property</TableHead>
                                          <TableHead className="text-right">A20</TableHead>
                                          <TableHead className="text-right">A30</TableHead>
                                          <TableHead className="text-right">A40</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell className="font-medium">Voltage (V)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.voltage_A}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.voltage_B}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.voltage_C}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Resistance (Ω)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.resistance_A?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.resistance_B?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.resistance_C?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Watts (W)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.watts_A}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.watts_B}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.watts_C}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Cold Current (A)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.cold_current_A?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.cold_current_B?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.cold_current_C?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Hot Current (A)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.hot_current_A?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.hot_current_B?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.hot_current_C?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Cold AT</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.cold_ampere_turns_A}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.cold_ampere_turns_B}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.cold_ampere_turns_C}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Hot AT</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.hot_ampere_turns_A}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.hot_ampere_turns_B}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.hot_ampere_turns_C}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Ambient (°C)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.ambient_temperature_A}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.ambient_temperature_B}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.ambient_temperature_C}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Rise (°C)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.temperature_rise_A?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.temperature_rise_B?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.temperature_rise_C?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Maximum (°C)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.maximum_rise_A?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.maximum_rise_B?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.maximum_rise_C?.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell className="font-medium">Expected (°C)</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.expected_rise_A?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.expected_rise_B?.toFixed(2)}</TableCell>
                                          <TableCell className="text-right">{detailedOCWData.expected_rise_C?.toFixed(2)}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              Detailed specifications not available for this model
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  {selectedModel && (
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>Width: {selectedModel.width}mm</span>
                      <span className={
                        selectedModel.width >= beltWidth * 0.95 && selectedModel.width <= beltWidth * 1.05 
                          ? 'text-green-600 font-medium' 
                          : ''
                      }>
                        {((selectedModel.width / beltWidth - 1) * 100).toFixed(1)}% of belt width
                      </span>
                      <span>Frame: {selectedModel.frame}</span>
                      <span>Force Factor: {selectedModel.force_factor.toLocaleString()}</span>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Alert Messages */}
            {!selectedModel && filteredModels.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>No models available:</strong> Adjust the belt width slider to see compatible OCW models. 
                  Current range: {Math.round(beltWidth * 0.8)}mm - {Math.round(beltWidth * 1.3)}mm
                </AlertDescription>
              </Alert>
            )}

            {!selectedModel && filteredModels.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Select a model above to see if it meets your requirements across all gap distances.
                </AlertDescription>
              </Alert>
            )}

            {selectedModel && currentGapComparison && currentGapComparison.validation.status === 'insufficient' && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> {currentGapComparison.validation.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Gauss Table */}
        {selectedModel && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gauss Table</CardTitle>
                  <CardDescription>Gauss values at each gap distance for all three operating temperatures</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToCSV}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gap (mm)</TableHead>
                      <TableHead className="text-right">Gauss @ 20°C</TableHead>
                      <TableHead className="text-right">Gauss @ 30°C</TableHead>
                      <TableHead className="text-right">Gauss @ 40°C</TableHead>
                      <TableHead className="text-right">Force @ 20°C (N)</TableHead>
                      <TableHead className="text-right">Force @ 30°C (N)</TableHead>
                      <TableHead className="text-right">Force @ 40°C (N)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row) => (
                      <TableRow 
                        key={row.gap}
                        className={row.gap === airGap ? 'bg-muted/50 font-medium' : ''}
                      >
                        <TableCell>{row.gap}</TableCell>
                        <TableCell className="text-right">{row.gauss20C?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-right">{row.gauss30C?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-right">{row.gauss40C?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-right">{row.modelForce20C?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-right">{row.modelForce30C?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-right">{row.modelForce40C?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-center">
                          {row.sufficient !== null && (
                            <Badge variant={row.sufficient ? 'default' : 'destructive'}>
                              {row.sufficient ? '✓' : '✗'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.confidencePercent !== null && (
                            <Badge 
                              variant={getConfidenceBadgeVariant(row.confidencePercent)}
                              className="text-xs"
                            >
                              {row.confidencePercent}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
