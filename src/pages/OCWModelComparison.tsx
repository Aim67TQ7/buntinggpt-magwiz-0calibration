import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BurdenSeverity, 
  marginRatioToConfidence,
  calculateForceFactorAtGap,
  calculateGaussAtGap
} from "@/utils/trampPickup";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Temperature scaling for Force Factor
const FF_TEMP_RATIOS: Record<number, number> = {
  20: 1.000,
  30: 0.9117,
  40: 0.8181
};

// Steel density for mass calculation
const STEEL_DENSITY = 7850; // kg/m³

// Standard tramp metal presets
interface TrampPreset {
  id: string;
  name: string;
  w: number;
  l: number;
  h: number;
}

const STANDARD_TRAMPS: TrampPreset[] = [
  { id: "cube-25", name: "25mm Cube", w: 25, l: 25, h: 25 },
  { id: "m12-nut", name: "M12 Nut", w: 19, l: 19, h: 6 },
  { id: "m16-bolt", name: "M16×75mm Bolt", w: 24, l: 24, h: 75 },
  { id: "m18-nut", name: "M18 Nut", w: 27, l: 27, h: 9 },
  { id: "plate-6mm", name: "6mm Plate", w: 100, l: 100, h: 6 },
];

// Orientation types
type Orientation = 'flat' | 'edge' | 'corner';

interface OrientedTramp {
  name: string;
  orientation: Orientation;
  w: number;
  l: number;
  h: number;
  isFirstOfGroup: boolean;
  groupRowSpan: number;
}

// Generate all orientation variants for a tramp item
function generateOrientations(tramp: TrampPreset): OrientedTramp[] {
  const orientations: OrientedTramp[] = [];
  
  // Flat: original W × L × H
  orientations.push({
    name: tramp.name,
    orientation: 'flat',
    w: tramp.w,
    l: tramp.l,
    h: tramp.h,
    isFirstOfGroup: true,
    groupRowSpan: 3
  });
  
  // Edge: W × H × L (swap L and H)
  orientations.push({
    name: tramp.name,
    orientation: 'edge',
    w: tramp.w,
    l: tramp.h,
    h: tramp.l,
    isFirstOfGroup: false,
    groupRowSpan: 0
  });
  
  // Corner: H × L × W (rotate all)
  orientations.push({
    name: tramp.name,
    orientation: 'corner',
    w: tramp.h,
    l: tramp.l,
    h: tramp.w,
    isFirstOfGroup: false,
    groupRowSpan: 0
  });
  
  return orientations;
}

// Interface for saved configuration from database
interface SavedConfiguration {
  id: string;
  name: string;
  prefix: number;
  suffix: number;
  surface_gauss: number | null;
  force_factor: number | null;
  watts: number | null;
  width: number | null;
  frame: string | null;
}

// Interface for location state from OCW Selector
interface OCWSelectorState {
  beltSpeed?: number;
  beltWidth?: number;
  burdenDepth?: number;
  airGap?: number;
  ambientTemp?: number;
  burdenSeverity?: BurdenSeverity;
  trampWidth?: number;
  trampLength?: number;
  trampHeight?: number;
}

// Calculate Force Factor at gap with temperature adjustment
function calculateFFAtGapWithTemp(surfaceFF: number, gap: number, backplate: number, temp: number): number {
  const ffAtGap = calculateForceFactorAtGap(surfaceFF, gap, backplate);
  const tempRatio = FF_TEMP_RATIOS[temp] || 1.0;
  return ffAtGap * tempRatio;
}

// Calculate required force for tramp pickup with orientation
function calculateRequiredForce(
  widthMm: number,
  lengthMm: number,
  heightMm: number,
  orientation: Orientation,
  burdenSeverity: BurdenSeverity,
  safetyFactor: number = 3.0
): number {
  const volume_m3 = (widthMm / 1000) * (lengthMm / 1000) * (heightMm / 1000);
  const mass_kg = volume_m3 * STEEL_DENSITY;
  const weight_N = mass_kg * 9.81;
  
  // Orientation factor
  const oriFactor = orientation === 'flat' ? 1.0 
    : orientation === 'edge' ? 4.0 
    : 6.0; // corner
  
  // Burden factor
  const burFactor = burdenSeverity === 'none' ? 1.0
    : burdenSeverity === 'light' ? 1.5
    : burdenSeverity === 'moderate' ? 2.5
    : burdenSeverity === 'heavy' ? 4.0
    : burdenSeverity === 'severe' ? 6.0
    : 3.0;
    
  return weight_N * oriFactor * burFactor * safetyFactor;
}

// Get confidence badge variant
function getConfidenceBadgeVariant(confidence: number): 'default' | 'secondary' | 'destructive' {
  if (confidence >= 75) return 'default';
  if (confidence >= 50) return 'secondary';
  return 'destructive';
}

// Get confidence color class
function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return 'text-green-600';
  if (confidence >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// Get extraction percentage display
function getExtractionDisplay(confidence: number): string {
  return `${confidence}%`;
}

export default function OCWModelComparison() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const passedParams = location.state as OCWSelectorState | undefined;
  
  // Parameters from OCW Selector
  const airGap = passedParams?.airGap ?? 200;
  const ambientTemp = passedParams?.ambientTemp ?? 20;
  const burdenSeverity = passedParams?.burdenSeverity ?? 'moderate';
  
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  // Custom tramps
  const [customTramps, setCustomTramps] = useState<TrampPreset[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTramp, setNewTramp] = useState({ name: '', w: 50, l: 50, h: 10 });
  
  // Combine standard and custom tramps
  const allTramps = useMemo(() => [...STANDARD_TRAMPS, ...customTramps], [customTramps]);
  
  // Generate all oriented tramps
  const orientedTramps = useMemo(() => {
    return allTramps.flatMap(tramp => generateOrientations(tramp));
  }, [allTramps]);
  
  // Fetch saved configurations
  useEffect(() => {
    const fetchSavedConfigs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('saved_ocw_configurations')
          .select('id, name, prefix, suffix, surface_gauss, force_factor, watts, width, frame')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSavedConfigs(data || []);
        
        // Auto-select first model if available
        if (data && data.length > 0 && !selectedModelId) {
          setSelectedModelId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching saved configurations:', error);
        toast({
          title: "Error",
          description: "Failed to load saved configurations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedConfigs();
  }, [toast]);
  
  // Get selected model
  const selectedModel = useMemo(() => {
    return savedConfigs.find(c => c.id === selectedModelId) || null;
  }, [savedConfigs, selectedModelId]);
  
  // Calculate gap-adjusted values for selected model
  const modelValues = useMemo(() => {
    if (!selectedModel) return null;
    
    const backplate = selectedModel.suffix || 30;
    const surfaceGauss = selectedModel.surface_gauss || 0;
    const surfaceFF = selectedModel.force_factor || 0;
    
    const gaussAtGap = calculateGaussAtGap(surfaceGauss, airGap, backplate);
    const ffAtGap = calculateFFAtGapWithTemp(surfaceFF, airGap, backplate, ambientTemp);
    
    return {
      gaussAtGap: Math.round(gaussAtGap),
      ffAtGap: Math.round(ffAtGap)
    };
  }, [selectedModel, airGap, ambientTemp]);
  
  // Calculate extraction percentages for each oriented tramp
  const trampResults = useMemo(() => {
    if (!selectedModel || !modelValues) return [];
    
    const backplate = selectedModel.suffix || 30;
    const surfaceFF = selectedModel.force_factor || 0;
    const availableForce = calculateFFAtGapWithTemp(surfaceFF, airGap, backplate, ambientTemp);
    
    return orientedTramps.map(tramp => {
      const requiredForce = calculateRequiredForce(
        tramp.w, tramp.l, tramp.h,
        tramp.orientation,
        burdenSeverity,
        3.0
      );
      
      const marginRatio = requiredForce > 0 ? availableForce / requiredForce : 0;
      const confidence = marginRatioToConfidence(marginRatio);
      
      return {
        ...tramp,
        requiredForce,
        confidence
      };
    });
  }, [selectedModel, modelValues, orientedTramps, airGap, ambientTemp, burdenSeverity]);
  
  // Remove a saved configuration
  const handleRemoveConfig = async (config: SavedConfiguration) => {
    try {
      const { error } = await supabase
        .from('saved_ocw_configurations')
        .delete()
        .eq('id', config.id);
      
      if (error) throw error;
      
      setSavedConfigs(prev => prev.filter(c => c.id !== config.id));
      
      // Select next model if removing selected
      if (selectedModelId === config.id) {
        const remaining = savedConfigs.filter(c => c.id !== config.id);
        setSelectedModelId(remaining.length > 0 ? remaining[0].id : null);
      }
      
      toast({
        title: "Removed",
        description: `${config.name} removed from comparison`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Add custom tramp
  const handleAddCustomTramp = () => {
    if (!newTramp.name.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }
    
    const id = `custom-${Date.now()}`;
    setCustomTramps(prev => [...prev, { ...newTramp, id }]);
    setNewTramp({ name: '', w: 50, l: 50, h: 10 });
    setShowAddForm(false);
  };
  
  // Remove custom tramp
  const handleRemoveCustomTramp = (id: string) => {
    setCustomTramps(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/ocw">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to OCW Selector
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">OCW Model Comparison</h1>
              <p className="text-sm text-muted-foreground">
                Tramp metal extraction analysis at {airGap}mm gap
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Saved Models (35%) */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Saved Models</CardTitle>
                <CardDescription className="text-xs">
                  Select a model to view extraction analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Loading...
                  </div>
                ) : savedConfigs.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No models saved</p>
                    <Link to="/ocw">
                      <Button variant="outline" size="sm">
                        Go to OCW Selector
                      </Button>
                    </Link>
                  </div>
                ) : (
                  savedConfigs.map((config) => {
                    const backplate = config.suffix || 30;
                    const gaussAtGap = Math.round(calculateGaussAtGap(config.surface_gauss || 0, airGap, backplate));
                    const ffAtGap = Math.round(calculateFFAtGapWithTemp(config.force_factor || 0, airGap, backplate, ambientTemp));
                    
                    return (
                      <div 
                        key={config.id}
                        className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedModelId === config.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedModelId(config.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{config.name}</h3>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>Gauss @ {airGap}mm: <span className="font-medium text-foreground">{gaussAtGap.toLocaleString()}</span></div>
                              <div>FF @ {airGap}mm: <span className="font-medium text-foreground">{ffAtGap.toLocaleString()}</span></div>
                              <div>{config.watts?.toLocaleString()} W | {config.width}mm | Frame {config.frame}</div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveConfig(config);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Tramp Extraction Table (65%) */}
          <div className="lg:col-span-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedModel ? `${selectedModel.name} - Tramp Metal Extraction` : 'Tramp Metal Extraction'}
                    </CardTitle>
                    {modelValues && (
                      <CardDescription className="text-xs mt-1">
                        Gauss @ {airGap}mm: <span className="font-semibold text-foreground">{modelValues.gaussAtGap.toLocaleString()}</span>
                        {' | '}
                        Force Factor @ {airGap}mm: <span className="font-semibold text-foreground">{modelValues.ffAtGap.toLocaleString()}</span>
                        {' | '}
                        Burden: <span className="capitalize">{burdenSeverity}</span>
                      </CardDescription>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Custom
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedModel ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Select a model from the left panel to view extraction analysis
                  </div>
                ) : (
                  <>
                    {/* Add Custom Tramp Form */}
                    {showAddForm && (
                      <div className="mb-4 p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={newTramp.name}
                              onChange={(e) => setNewTramp(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Custom Item"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">W (mm)</Label>
                            <Input
                              type="number"
                              value={newTramp.w}
                              onChange={(e) => setNewTramp(prev => ({ ...prev, w: Number(e.target.value) }))}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">L (mm)</Label>
                            <Input
                              type="number"
                              value={newTramp.l}
                              onChange={(e) => setNewTramp(prev => ({ ...prev, l: Number(e.target.value) }))}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="w-20">
                            <Label className="text-xs">H (mm)</Label>
                            <Input
                              type="number"
                              value={newTramp.h}
                              onChange={(e) => setNewTramp(prev => ({ ...prev, h: Number(e.target.value) }))}
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button size="sm" onClick={handleAddCustomTramp}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Extraction Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[180px] text-xs font-semibold">Description</TableHead>
                            <TableHead className="w-[140px] text-xs font-semibold">Dimension (W×L×H)</TableHead>
                            <TableHead className="w-[100px] text-xs font-semibold text-right">Extraction %</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trampResults.map((result, idx) => (
                            <TableRow 
                              key={`${result.name}-${result.orientation}-${idx}`}
                              className={result.isFirstOfGroup ? 'border-t-2' : ''}
                            >
                              {result.isFirstOfGroup && (
                                <TableCell 
                                  rowSpan={result.groupRowSpan} 
                                  className="text-sm font-medium align-top pt-3"
                                >
                                  {result.name}
                                </TableCell>
                              )}
                              <TableCell className="text-sm font-mono">
                                {result.w} × {result.l} × {result.h}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant={getConfidenceBadgeVariant(result.confidence)}
                                  className="text-xs font-mono min-w-[50px] justify-center"
                                >
                                  {getExtractionDisplay(result.confidence)}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-1">
                                {result.name.startsWith('custom-') || customTramps.some(t => t.name === result.name) ? (
                                  result.isFirstOfGroup && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        const tramp = customTramps.find(t => t.name === result.name);
                                        if (tramp) handleRemoveCustomTramp(tramp.id);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="text-[10px] px-1.5">75%+</Badge>
                        <span>High confidence</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5">50-74%</Badge>
                        <span>Moderate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="destructive" className="text-[10px] px-1.5">&lt;50%</Badge>
                        <span>Low confidence</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
