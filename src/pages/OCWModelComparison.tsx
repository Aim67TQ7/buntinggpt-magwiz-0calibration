import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateGaussAtGap,
  calculateRequiredGaussV2,
  MATERIAL_FACTORS
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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

// Material options with display names
const MATERIAL_OPTIONS = [
  { value: "coal", label: "Coal" },
  { value: "limestone", label: "Limestone" },
  { value: "gravel", label: "Gravel" },
  { value: "sand", label: "Sand" },
  { value: "slag", label: "Slag" },
  { value: "wood", label: "Wood" },
  { value: "aggregate", label: "Aggregate" },
  { value: "glass", label: "Glass" },
  { value: "c&d", label: "C&D" },
  { value: "compost", label: "Compost" },
  { value: "msw", label: "MSW" },
];

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
}

// Get confidence badge variant based on ratio
function getConfidenceBadgeVariant(ratio: number): 'default' | 'secondary' | 'destructive' {
  if (ratio >= 1.5) return 'default';
  if (ratio >= 1.0) return 'secondary';
  return 'destructive';
}

// Get extraction percentage from ratio
function getExtractionPercent(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio >= 2) return 99;
  if (ratio >= 1.5) return Math.min(99, Math.round(75 + (ratio - 1.5) * 48));
  if (ratio >= 1.0) return Math.round(50 + (ratio - 1.0) * 50);
  return Math.max(0, Math.round(ratio * 50));
}

export default function OCWModelComparison() {
  const location = useLocation();
  const { toast } = useToast();
  const passedParams = location.state as OCWSelectorState | undefined;
  
  // Parameters from OCW Selector
  const airGap = passedParams?.airGap ?? 200;
  const passedBeltSpeed = passedParams?.beltSpeed ?? 1.5;
  const passedBurdenDepth = passedParams?.burdenDepth ?? 0;
  
  // Local state for extraction parameters
  const [beltSpeed, setBeltSpeed] = useState(passedBeltSpeed);
  const [burdenMm, setBurdenMm] = useState(passedBurdenDepth);
  const [waterPercent, setWaterPercent] = useState(0);
  const [material, setMaterial] = useState("coal");
  
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  // Custom tramps
  const [customTramps, setCustomTramps] = useState<TrampPreset[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTramp, setNewTramp] = useState({ name: '', w: 50, l: 50, h: 10 });
  
  // Combine standard and custom tramps
  const allTramps = useMemo(() => [...STANDARD_TRAMPS, ...customTramps], [customTramps]);
  
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
    
    const gaussAtGap = calculateGaussAtGap(surfaceGauss, airGap, backplate);
    
    return {
      gaussAtGap: Math.round(gaussAtGap)
    };
  }, [selectedModel, airGap]);
  
  // Calculate extraction results for each tramp
  const trampResults = useMemo(() => {
    if (!selectedModel || !modelValues) return [];
    
    return allTramps.map(tramp => {
      const requiredGauss = calculateRequiredGaussV2({
        width_mm: tramp.w,
        length_mm: tramp.l,
        height_mm: tramp.h,
        beltSpeed_mps: beltSpeed,
        burden_mm: burdenMm,
        waterPercent: waterPercent,
        material: material
      });
      
      const ratio = requiredGauss > 0 ? modelValues.gaussAtGap / requiredGauss : 0;
      const extractionPercent = getExtractionPercent(ratio);
      
      return {
        ...tramp,
        requiredGauss,
        ratio,
        extractionPercent
      };
    });
  }, [selectedModel, modelValues, allTramps, beltSpeed, burdenMm, waterPercent, material]);
  
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
          {/* Left Panel - Saved Models + Parameters */}
          <div className="lg:col-span-4 space-y-4">
            {/* Saved Models */}
            <Card>
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
            
            {/* Extraction Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Extraction Parameters</CardTitle>
                <CardDescription className="text-xs">
                  Adjust conditions for tramp pickup calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Material Type</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label} ({((MATERIAL_FACTORS[opt.value] || 0.75) * 100).toFixed(0)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Belt Speed</Label>
                    <span className="text-xs text-muted-foreground">{beltSpeed.toFixed(1)} m/s</span>
                  </div>
                  <Slider
                    value={[beltSpeed]}
                    onValueChange={([v]) => setBeltSpeed(v)}
                    min={0.5}
                    max={4.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Burden Depth</Label>
                    <span className="text-xs text-muted-foreground">{burdenMm} mm</span>
                  </div>
                  <Slider
                    value={[burdenMm]}
                    onValueChange={([v]) => setBurdenMm(v)}
                    min={0}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Water Content</Label>
                    <span className="text-xs text-muted-foreground">{waterPercent}%</span>
                  </div>
                  <Slider
                    value={[waterPercent]}
                    onValueChange={([v]) => setWaterPercent(v)}
                    min={0}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Tramp Extraction Table */}
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
                        Model Gauss @ {airGap}mm: <span className="font-semibold text-foreground">{modelValues.gaussAtGap.toLocaleString()}</span>
                        {' | '}
                        Material: <span className="capitalize">{material}</span>
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
                            <TableHead className="w-[160px] text-xs font-semibold">Description</TableHead>
                            <TableHead className="w-[120px] text-xs font-semibold">Dimension (W×L×H)</TableHead>
                            <TableHead className="w-[100px] text-xs font-semibold text-right">Reqd Gauss</TableHead>
                            <TableHead className="w-[100px] text-xs font-semibold text-right">Model Gauss</TableHead>
                            <TableHead className="w-[100px] text-xs font-semibold text-right">Extraction</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trampResults.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell className="text-sm font-medium">
                                {result.name}
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {result.w} × {result.l} × {result.h}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono text-muted-foreground">
                                {result.requiredGauss.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-sm font-mono font-medium">
                                {modelValues?.gaussAtGap.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant={getConfidenceBadgeVariant(result.ratio)}
                                  className="text-xs font-mono min-w-[50px] justify-center"
                                >
                                  {result.extractionPercent}%
                                </Badge>
                              </TableCell>
                              <TableCell className="p-1">
                                {result.id.startsWith('custom-') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveCustomTramp(result.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="text-[10px] px-1.5">≥150%</Badge>
                        <span>Reliable pickup</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5">100-149%</Badge>
                        <span>Marginal</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="destructive" className="text-[10px] px-1.5">&lt;100%</Badge>
                        <span>Unlikely</span>
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
