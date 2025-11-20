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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RotateCcw, Info, Download, Eye, EyeOff, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const TRAMP_SIZE_MAP = {
  small: { baseForce: 800, label: "Small", description: "Bolts, nails, small plate" },
  medium: { baseForce: 2500, label: "Medium", description: "Small rebar, tooling fragments" },
  large: { baseForce: 8000, label: "Large", description: "Full rebar, bucket teeth" },
  veryLarge: { baseForce: 15000, label: "Very Large", description: "Big tools, clusters" }
} as const;

type TrampSize = keyof typeof TRAMP_SIZE_MAP;

const SAFETY_FACTOR = 1.5; // 50% margin recommended

// Temperature-specific correlation factors for decay calculations
const TEMP_CONFIGS = {
  20: {
    label: '20°C Ambient',
    ampereTurnsCorrelation: 0.615238,  // OCW Unit <-> Gauss (ampere-turns)
    forceFactorCorrelation: 0.771332,   // OCW Unit <-> Force Factor
    gaussForceCorrelation: 0.944644,    // Gauss <-> Force Factor
    dbField: 'hot_ampere_turns_A' as const,
    voltageField: 'voltage_A' as const,
    wattsField: 'watts_A' as const
  },
  30: {
    label: '30°C Ambient',
    ampereTurnsCorrelation: 0.627028,
    forceFactorCorrelation: 0.769676,
    gaussForceCorrelation: 0.954985,
    dbField: 'hot_ampere_turns_B' as const,
    voltageField: 'voltage_B' as const,
    wattsField: 'watts_B' as const
  },
  40: {
    label: '40°C Ambient',
    ampereTurnsCorrelation: 0.629352,
    forceFactorCorrelation: 0.770255,
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
  modelForce: number | null;
  modelWatts: number | null;
  modelAmpereTurns: number | null;
  sufficient: boolean | null;
  margin: number | null;
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
 * Calculate required pull force for given conditions and tramp size
 */
function requiredForce(v: number, g: number, d: number, trampSize: TrampSize): number {
  const S = severity(v, g, d);
  const F0 = TRAMP_SIZE_MAP[trampSize].baseForce;
  return F0 * S; // Newtons
}

/**
 * Calculate model's available force at a given gap
 * Uses temperature-specific magnetic field decay
 */
function calculateModelForceAtGap(baseForce: number, gap: number, tempConfig: TempConfig): number {
  const decayRatio = Math.pow(tempConfig.gaussForceCorrelation, gap / 25);
  return baseForce * decayRatio;
}

/**
 * Calculate model's ampere turns at a given gap
 * Uses temperature-specific magnetic field decay
 */
function calculateAmpereTurnsAtGap(baseAT: number, gap: number, tempConfig: TempConfig): number {
  const decayRatio = Math.pow(tempConfig.ampereTurnsCorrelation, gap / 25);
  return baseAT * decayRatio;
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
  const [trampSize, setTrampSize] = useState<TrampSize>('small');
  const [ambientTemp, setAmbientTemp] = useState<AmbientTemp>(20);
  const [selectedModel, setSelectedModel] = useState<OCWModel | null>(null);
  const [ocwModels, setOcwModels] = useState<OCWModel[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [showSpecsDialog, setShowSpecsDialog] = useState(false);
  const [detailedOCWData, setDetailedOCWData] = useState<any>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

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
    const reqForce = requiredForce(beltSpeed, airGap, burdenDepth, trampSize);
    return {
      severity: S,
      requiredForce: reqForce
    };
  }, [beltSpeed, airGap, burdenDepth, trampSize]);

  const comparisonData = useMemo(() => {
    const tempConfig = TEMP_CONFIGS[ambientTemp];
    const data: ComparisonDataPoint[] = [];
    
    for (let g = 0; g <= 800; g += 25) {
      const S = severity(beltSpeed, g, burdenDepth);
      const reqForce = requiredForce(beltSpeed, g, burdenDepth, trampSize);
      
      const modelForce = selectedModel 
        ? calculateModelForceAtGap(selectedModel.force_factor, g, tempConfig)
        : null;
      
      const baseAT = detailedOCWData?.[tempConfig.dbField];
      const modelAT = baseAT 
        ? calculateAmpereTurnsAtGap(baseAT, g, tempConfig)
        : null;
      
      data.push({
        gap: g,
        severity: Math.round(S * 100) / 100,
        requiredForce: Math.round(reqForce),
        modelForce: modelForce ? Math.round(modelForce) : null,
        modelWatts: selectedModel?.watts || null,
        modelAmpereTurns: modelAT ? Math.round(modelAT) : null,
        sufficient: modelForce ? modelForce >= reqForce : null,
        margin: modelForce 
          ? ((modelForce - reqForce) / reqForce * 100)
          : null
      });
    }
    return data;
  }, [beltSpeed, burdenDepth, trampSize, selectedModel, detailedOCWData, ambientTemp]);

  const currentGapComparison = useMemo(() => {
    if (!selectedModel) return null;
    
    const tempConfig = TEMP_CONFIGS[ambientTemp];
    const modelForce = calculateModelForceAtGap(selectedModel.force_factor, airGap, tempConfig);
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
    setTrampSize('small');
    setAmbientTemp(20);
    setSelectedModel(null);
  };

  const exportToCSV = () => {
    const headers = ['Gap (mm)', 'Severity', 'Required Force (N)', 'Model Force (N)', 'Ampere Turns', 'Margin %', 'Model Watts', 'Status', 'Ambient Temp'];
    const rows = comparisonData.map(row => [
      row.gap,
      row.severity,
      row.requiredForce,
      row.modelForce || '',
      row.modelAmpereTurns || '',
      row.margin?.toFixed(1) || '',
      row.modelWatts || '',
      row.sufficient ? 'OK' : 'INSUFFICIENT',
      `${ambientTemp}°C`
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocw-comparison-${selectedModel?.model || 'requirements'}-${ambientTemp}C-belt${beltWidth}mm-${Date.now()}.csv`;
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

        {/* Temperature Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Ambient Temperature</CardTitle>
            <CardDescription>Select operating temperature for decay calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={ambientTemp === 20 ? "default" : "outline"}
                onClick={() => setAmbientTemp(20)}
                className="flex-1"
              >
                20°C
              </Button>
              <Button
                variant={ambientTemp === 30 ? "default" : "outline"}
                onClick={() => setAmbientTemp(30)}
                className="flex-1"
              >
                30°C
              </Button>
              <Button
                variant={ambientTemp === 40 ? "default" : "outline"}
                onClick={() => setAmbientTemp(40)}
                className="flex-1"
              >
                40°C
              </Button>
            </div>
          </CardContent>
        </Card>

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

              {/* Tramp Size */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Tramp Size / Severity</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TRAMP_SIZE_MAP).map(([key, data]) => (
                    <Button
                      key={key}
                      variant={trampSize === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTrampSize(key as TrampSize)}
                      className="flex flex-col h-auto py-2"
                    >
                      <span className="font-semibold">{data.label}</span>
                      <span className="text-xs opacity-70">{data.baseForce}N</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {TRAMP_SIZE_MAP[trampSize].description}
                </p>
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
                    <span className="text-muted-foreground">Required Force:</span>
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

                {/* Chart */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="gap" 
                        label={{ value: 'Air Gap (mm)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Pull Force (N)', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Ampere Turns (AT)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip />
                      <Legend />
                      
                      {/* Requirements Line */}
                      <Line 
                        yAxisId="left"
                        type="monotone"
                        dataKey="requiredForce"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        name="Required Force"
                        dot={false}
                      />
                      
                      {/* Model Capability Line */}
                      {selectedModel && (
                        <Line 
                          yAxisId="left"
                          type="monotone"
                          dataKey="modelForce"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name={`${selectedModel.model} Available`}
                          dot={false}
                          strokeDasharray="5 5"
                        />
                      )}
                      
                      {/* Ampere Turns Line */}
                      {selectedModel && detailedOCWData && (
                        <Line 
                          yAxisId="right"
                          type="monotone"
                          dataKey="modelAmpereTurns"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Ampere Turns"
                          dot={false}
                        />
                      )}
                      
                      {/* Current gap reference line */}
                      <ReferenceLine 
                        yAxisId="left"
                        x={airGap} 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="3 3"
                        label="Current"
                      />
                    </LineChart>
                  </ResponsiveContainer>
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

        {/* Data Table */}
        {selectedModel && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detailed Comparison Table</CardTitle>
                  <CardDescription>Gap-by-gap performance analysis</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportToCSV}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowTable(!showTable)}
                  >
                    {showTable ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showTable ? 'Hide' : 'Show'} Table
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showTable && (
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gap (mm)</TableHead>
                        <TableHead className="text-right">Severity</TableHead>
                        <TableHead className="text-right">Required Force (N)</TableHead>
                        <TableHead className="text-right">Model Force (N)</TableHead>
                        <TableHead className="text-right">Ampere Turns</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">Model Watts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.map((row) => (
                        <TableRow 
                          key={row.gap}
                          className={row.gap === airGap ? 'bg-muted/50 font-medium' : ''}
                        >
                          <TableCell>{row.gap}</TableCell>
                          <TableCell className="text-right">{row.severity}</TableCell>
                          <TableCell className="text-right">{row.requiredForce.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.modelForce?.toLocaleString() || '-'}</TableCell>
                          <TableCell className="text-right">{row.modelAmpereTurns?.toLocaleString() || '-'}</TableCell>
                          <TableCell className="text-center">
                            {row.sufficient !== null && (
                              <Badge variant={row.sufficient ? 'default' : 'destructive'}>
                                {row.sufficient ? '✓' : '✗'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.margin !== null && (
                              <span className={
                                row.margin > 50 ? 'text-green-600 font-medium' : 
                                row.margin > 0 ? 'text-yellow-600' : 
                                'text-red-600 font-medium'
                              }>
                                {row.margin > 0 ? '+' : ''}{row.margin.toFixed(1)}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{row.modelWatts?.toLocaleString() || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
