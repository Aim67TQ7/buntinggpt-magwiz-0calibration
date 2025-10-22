import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOCWList } from "@/contexts/OCWListContext";
import { Separator } from "@/components/ui/separator";

interface MagnetModel {
  name: string;
  G0: number;
  k: number;
  width: number;
  thickness: number;
  beltWidth: number;
  magnetDimension?: string;
  prefix?: number;
  suffix?: number;
  frame?: string;
}

interface TrampObject {
  name: string;
  threshold: number;
  icon: string;
}

export default function MagneticFieldSimulator() {
  const location = useLocation();
  const { recommendations, hasActiveList, inputParameters } = useOCWList();
  const [models, setModels] = useState<MagnetModel[]>([]);
  const [trampObjects, setTrampObjects] = useState<TrampObject[]>([]);
  const [selectedModel, setSelectedModel] = useState<MagnetModel | null>(null);
  const [burdenDepth, setBurdenDepth] = useState(50);
  const [airGap, setAirGap] = useState(50);
  const [loading, setLoading] = useState(true);
  const [ocwBeltWidth, setOcwBeltWidth] = useState<number | null>(null);
  const [ocwMagnetDimension, setOcwMagnetDimension] = useState<string | null>(null);
  const [userBeltWidth, setUserBeltWidth] = useState<number>(1200); // User-controlled belt width
  const [troughingAngle, setTroughingAngle] = useState(20); // degrees, typically 20-45
  
  // Material stream properties
  const [includeMaterialEffects, setIncludeMaterialEffects] = useState(false);
  const [density, setDensity] = useState(1.6); // t/m³
  const [waterContent, setWaterContent] = useState(5); // %

  // Fetch magnet models from Supabase Edge function
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('magnet-models');
        
        if (error) throw error;
        
        setModels(data.models);
        setTrampObjects(data.tramps);
        
        // Check if we have state from OCW page or context
        const state = location.state as { 
          model?: string; 
          beltWidth?: number; 
          magnetDimension?: string;
          density?: number;
          waterContent?: number;
          airGap?: number;
          burdenDepth?: number;
          beltTroughingAngle?: number;
        } | null;
        
        if (state?.model) {
          // First check if it's from the OCW recommendations list
          const ocwUnit = recommendations.find(r => `${r.Prefix} OCW ${r.Suffix}` === state.model);
          
          if (ocwUnit) {
            // Use OCW unit data
            const matchedModel = data.models.find((m: MagnetModel) => m.name === state.model);
            setSelectedModel(matchedModel || data.models[0]);
      setOcwBeltWidth(ocwUnit.belt_width || state.beltWidth || null);
      setUserBeltWidth(ocwUnit.belt_width || state.beltWidth || 1200);
            setOcwMagnetDimension(matchedModel?.magnetDimension || state.magnetDimension || null);
            
            // Set material properties if available
            if (ocwUnit.density || state.density) {
              setDensity(ocwUnit.density || state.density || 1.6);
              setIncludeMaterialEffects(true);
            }
            if (ocwUnit.waterContent || state.waterContent) {
              setWaterContent(ocwUnit.waterContent || state.waterContent || 5);
              setIncludeMaterialEffects(true);
            }
            
            // Initialize installation parameters from state or context
            if (state?.airGap !== undefined) {
              setAirGap(state.airGap);
            } else if (inputParameters?.airGap !== undefined) {
              setAirGap(inputParameters.airGap);
            }
            if (state?.burdenDepth !== undefined) {
              setBurdenDepth(state.burdenDepth);
            } else if (inputParameters?.burdenDepth !== undefined) {
              setBurdenDepth(inputParameters.burdenDepth);
            }
            if (state?.beltTroughingAngle !== undefined) {
              setTroughingAngle(state.beltTroughingAngle);
            } else if (inputParameters?.beltTroughingAngle !== undefined) {
              setTroughingAngle(inputParameters.beltTroughingAngle);
            }
          } else {
            // Standard model from BMR_magwiz
            const matchedModel = data.models.find((m: MagnetModel) => m.name === state.model);
            setSelectedModel(matchedModel || data.models[0]);
            
            if (state.beltWidth) {
              setOcwBeltWidth(state.beltWidth);
              setUserBeltWidth(state.beltWidth);
            }
            if (state.magnetDimension) {
              setOcwMagnetDimension(state.magnetDimension);
            }
            if (state.density) {
              setDensity(state.density);
              setIncludeMaterialEffects(true);
            }
            if (state.waterContent) {
              setWaterContent(state.waterContent);
              setIncludeMaterialEffects(true);
            }
            
            // Initialize installation parameters from state or context
            if (state?.airGap !== undefined) {
              setAirGap(state.airGap);
            } else if (inputParameters?.airGap !== undefined) {
              setAirGap(inputParameters.airGap);
            }
            if (state?.burdenDepth !== undefined) {
              setBurdenDepth(state.burdenDepth);
            } else if (inputParameters?.burdenDepth !== undefined) {
              setBurdenDepth(inputParameters.burdenDepth);
            }
            if (state?.beltTroughingAngle !== undefined) {
              setTroughingAngle(state.beltTroughingAngle);
            } else if (inputParameters?.beltTroughingAngle !== undefined) {
              setTroughingAngle(inputParameters.beltTroughingAngle);
            }
          }
          } else {
            setSelectedModel(data.models[0]);
            setUserBeltWidth(data.models[0]?.beltWidth || 1200);
          }
      } catch (error) {
        console.error('Error fetching magnet models:', error);
        toast.error('Failed to load magnet models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [location, recommendations, inputParameters]);

  if (loading || !selectedModel) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading magnet models...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate material attenuation factor η
  const eta = includeMaterialEffects 
    ? 1 + (0.1 * density) + (0.02 * waterContent)
    : 1;
  
  const effectiveK = selectedModel ? selectedModel.k * eta : 0;

  const calculateFieldStrength = (depth: number): number => {
    return selectedModel.G0 * Math.exp(-effectiveK * depth);
  };

  // Calculate capture probability using field strength ratio
  const calculateCaptureProbability = (depth: number, threshold: number, n: number = 1.8): number => {
    const fieldStrength = calculateFieldStrength(depth);
    const ratio = fieldStrength / threshold;
    const probability = Math.min(1, Math.pow(ratio, n));
    return probability * 100; // Return as percentage
  };

  const getTrampStatus = (tramp: TrampObject): { 
    probability: number; 
    fieldStrength: number; 
    fieldAtCaptureDepth: number;
    captureDepth: number;
    status: 'captured' | 'partial' | 'missed';
    effectiveThreshold: number;
  } => {
    const depth = airGap + burdenDepth;
    const fieldAtBurdenSurface = calculateFieldStrength(depth);
    const probability = calculateCaptureProbability(depth, tramp.threshold);
    
    // Calculate maximum depth where this tramp can be captured: d = ln(G₀/G_req) / (k × η)
    const captureDepth = tramp.threshold < selectedModel.G0 
      ? Math.log(selectedModel.G0 / tramp.threshold) / effectiveK
      : 0;
    
    // Field strength at the capture depth should equal the threshold
    const fieldAtCaptureDepth = calculateFieldStrength(captureDepth);
    
    // Calculate effective threshold accounting for material attenuation
    // Higher η means stronger field needed at surface to achieve same field at depth
    const effectiveThreshold = includeMaterialEffects 
      ? Math.round(tramp.threshold * (1 + (eta - 1) * 0.5))
      : tramp.threshold;
    
    let status: 'captured' | 'partial' | 'missed';
    if (probability >= 95) status = 'captured';
    else if (probability >= 50) status = 'partial';
    else status = 'missed';
    
    return {
      probability: Math.round(probability),
      fieldStrength: Math.round(fieldAtBurdenSurface),
      fieldAtCaptureDepth: Math.round(fieldAtCaptureDepth),
      captureDepth: Math.round(captureDepth),
      effectiveThreshold,
      status
    };
  };

  // Generate capture zones for each tramp type
  const generateCaptureZones = (): Array<{
    tramp: TrampObject;
    startDepth: number;
    endDepth: number;
    color: string;
    gaussAtEnd: number;
  }> => {
    const zones = [];
    const zoneColors = [
      "#22c55e", // Green for strongest
      "#84cc16", // Lime
      "#eab308", // Yellow
      "#f97316", // Orange
      "#ef4444", // Red for weakest
    ];

    // Sort tramps by threshold (highest to lowest)
    const sortedTrampObjects = [...trampObjects].sort((a, b) => b.threshold - a.threshold);

    let previousDepth = 0;
    sortedTrampObjects.forEach((tramp, idx) => {
      if (tramp.threshold < selectedModel.G0) {
        // Calculate depth where field strength equals this tramp's threshold: d = ln(G₀/G_req) / (k × η)
        const captureDepth = Math.log(selectedModel.G0 / tramp.threshold) / effectiveK;
        
        zones.push({
          tramp,
          startDepth: previousDepth,
          endDepth: captureDepth,
          color: zoneColors[idx] || zoneColors[zoneColors.length - 1],
          gaussAtEnd: tramp.threshold,
        });
        
        previousDepth = captureDepth;
      }
    });

    // Add a "Dead Zone" beyond the last tramp
    if (zones.length > 0) {
      const lastZone = zones[zones.length - 1];
      zones.push({
        tramp: { name: "Dead Zone", threshold: 0, icon: "💀" },
        startDepth: lastZone.endDepth,
        endDepth: 200, // Extend to 200mm
        color: "#64748b",
        gaussAtEnd: 0,
      });
    }

    return zones;
  };

  // Gauss contour levels to overlay
  const contourLevels = [200, 300, 400, 700, 1000, 1500, 2000];
  
  const captureZones = generateCaptureZones();
  const totalDepthToShow = Math.min(200, Math.max(150, (airGap + burdenDepth) + 50));
  
  // Physical scaling: 1mm = 2px for optimal visibility
  const scale = 2;
  const beltHeight = 20;
  
  // Calculate SVG dimensions based on real proportions
  const magnetWidth = selectedModel.width * scale;
  const magnetHeight = selectedModel.thickness * scale;
  const beltWidth = userBeltWidth * scale;
  const totalDepth = (airGap + burdenDepth) * scale;
  
  const svgWidth = beltWidth + 200; // Extra space for labels
  const svgHeight = magnetHeight + totalDepth + beltHeight + 150;
  
  // Center magnet over belt
  const magnetX = (svgWidth - magnetWidth) / 2 - 50; // -50 to account for left margin
  const beltX = (svgWidth - beltWidth) / 2 - 50;
  
  // Calculate troughing geometry
  const leftEdgeWidth = beltWidth * 0.2;
  const centerWidth = beltWidth * 0.6;
  const rightEdgeWidth = beltWidth * 0.2;
  const edgeRise = troughingAngle > 0 
    ? (leftEdgeWidth * Math.tan(troughingAngle * Math.PI / 180)) 
    : 0;
  
  // Calculate trough depth (depth from belt top to trough bottom)
  const troughDepth = edgeRise / scale; // Convert back to mm
  
  // Calculate effective burden and air gap
  // If burden is deeper than trough, it rises above trough edges
  const burdenAboveTrough = Math.max(0, burdenDepth - troughDepth);
  const burdenWithinTrough = Math.min(burdenDepth, troughDepth);
  
  // Corrected air gap: measure from magnet bottom to top of trough OR top of burden (whichever is higher)
  const effectiveAirGap = airGap - burdenAboveTrough;
  
  // Helper function to calculate burden surface curve
  const calculateBurdenSurface = (xPosition: number): number => {
    // Returns Y offset from belt top at given X position
    const relX = xPosition - beltX;
    const beltCenter = beltWidth / 2;
    
    if (burdenDepth === 0) return 0;
    
    // Calculate how deep the burden goes at this X position based on trough shape
    let troughDepthAtX = 0;
    if (troughingAngle > 0) {
      if (relX < leftEdgeWidth) {
        // Left slope
        const ratio = relX / leftEdgeWidth;
        troughDepthAtX = edgeRise * ratio;
      } else if (relX >= leftEdgeWidth && relX <= leftEdgeWidth + centerWidth) {
        // Flat center
        troughDepthAtX = edgeRise;
      } else {
        // Right slope
        const ratio = (beltWidth - relX) / rightEdgeWidth;
        troughDepthAtX = edgeRise * ratio;
      }
    }
    
    // If burden is shallow (within trough), create elliptical surface
    if (burdenDepth <= troughDepth) {
      // Ellipse filling trough bottom
      const distFromCenter = Math.abs(relX - beltCenter);
      const maxRadius = beltWidth / 2;
      if (distFromCenter > maxRadius) return troughDepthAtX / scale;
      
      const ellipseDepth = burdenDepth * scale * Math.sqrt(1 - Math.pow(distFromCenter / maxRadius, 2));
      return troughDepthAtX + ellipseDepth;
    } else {
      // Burden fills trough and rises above
      const overflow = (burdenDepth - troughDepth) * scale;
      const distFromCenter = Math.abs(relX - beltCenter);
      const maxRadius = beltWidth / 2;
      
      // Create dome shape for overflow
      const domeHeight = overflow * (1 - Math.pow(distFromCenter / maxRadius, 1.5));
      return troughDepthAtX + overflow + Math.max(0, domeHeight * 0.3);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/ocw">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to OCW
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Magnetic Field Penetration Simulator</h1>
          </div>
          <p className="text-muted-foreground">
            Proportionally accurate visualization of magnetic field decay through burden layers
          </p>
          {ocwBeltWidth && (
            <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20">
              <p className="text-sm font-medium">
                OCW Data: Belt Width = {ocwBeltWidth}mm
                {ocwMagnetDimension && ` · Magnet Dimension: ${ocwMagnetDimension}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Magnet Model</Label>
              <Select
                value={selectedModel.name}
                onValueChange={(value) => {
                  // Check if it's from OCW list
                  const ocwUnit = recommendations.find(r => `${r.Prefix} OCW ${r.Suffix}` === value);
                  
                  if (ocwUnit) {
                    // Find or create model for this OCW unit
                    const model = models.find((m) => m.name === value);
                    if (model) {
                      setSelectedModel(model);
                      setOcwBeltWidth(ocwUnit.width);
                      setUserBeltWidth(ocwUnit.width);
                      setOcwMagnetDimension(model.magnetDimension || null);
                      
                      // Set material properties if available
                      if (ocwUnit.density) {
                        setDensity(ocwUnit.density);
                        setIncludeMaterialEffects(true);
                      }
                      if (ocwUnit.waterContent) {
                        setWaterContent(ocwUnit.waterContent);
                        setIncludeMaterialEffects(true);
                      }
                    }
                  } else {
                    // Standard model
                    const model = models.find((m) => m.name === value);
                    if (model) {
                      setSelectedModel(model);
                      setOcwBeltWidth(null);
                      setUserBeltWidth(model.beltWidth);
                      setOcwMagnetDimension(null);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {hasActiveList && recommendations.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">From OCW List</div>
                      {recommendations.map((ocw) => (
                        <SelectItem key={`ocw-${ocw.Prefix}-${ocw.Suffix}`} value={`${ocw.Prefix} OCW ${ocw.Suffix}`}>
                          {ocw.Prefix} OCW {ocw.Suffix}
                        </SelectItem>
                      ))}
                      <Separator className="my-2" />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Standard Models</div>
                    </>
                  )}
              {models
                .filter((model) => {
                  // If we have recommendations, exclude models that are already in the recommendations list
                  if (hasActiveList && recommendations.length > 0) {
                    return !recommendations.some(ocw => `${ocw.Prefix} OCW ${ocw.Suffix}` === model.name);
                  }
                  return true;
                })
                .map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Physical Dimensions</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magnet Width:</span>
                  <span className="font-mono">{selectedModel.width} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magnet Thickness:</span>
                  <span className="font-mono">{selectedModel.thickness} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Belt Width:</span>
                  <span className="font-mono">{userBeltWidth} mm</span>
                </div>
                {selectedModel.frame && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frame:</span>
                    <span className="font-mono text-primary">{selectedModel.frame}</span>
                  </div>
                )}
                {ocwMagnetDimension && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Magnet Dimension:</span>
                    <span className="font-mono text-primary">{ocwMagnetDimension}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Magnetic Properties</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surface Gauss (G₀):</span>
                  <span className="font-mono font-bold">{selectedModel.G0} G</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decay Constant (k):</span>
                  <span className="font-mono">{selectedModel.k.toFixed(4)}</span>
                </div>
                {includeMaterialEffects && (
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">Effective k × η:</span>
                    <span className="font-mono font-bold text-orange-600">{effectiveK.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Installation Parameters</h3>
              <div>
                <Label htmlFor="airGap">Air Gap: {airGap} mm</Label>
                <Input
                  id="airGap"
                  type="range"
                  min="10"
                  max="500"
                  value={airGap}
                  onChange={(e) => setAirGap(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="burdenDepth">Burden Depth: {burdenDepth} mm</Label>
                <Input
                  id="burdenDepth"
                  type="range"
                  min="10"
                  max="500"
                  value={burdenDepth}
                  onChange={(e) => setBurdenDepth(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="troughingAngle">Belt Troughing Angle: {troughingAngle}°</Label>
                <Input
                  id="troughingAngle"
                  type="range"
                  min="0"
                  max="45"
                  step="5"
                  value={troughingAngle}
                  onChange={(e) => setTroughingAngle(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Common: 20° (shallow), 35° (standard), 45° (deep)
                </div>
                
                {/* Trough depth and air gap info */}
                {troughingAngle > 0 && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trough Depth:</span>
                      <span className="font-mono font-semibold">{Math.round(troughDepth)} mm</span>
                    </div>
                    {burdenDepth > troughDepth && (
                      <div className="flex justify-between text-orange-600">
                        <span>Burden above trough:</span>
                        <span className="font-mono font-semibold">{Math.round(burdenAboveTrough)} mm</span>
                      </div>
                    )}
                    {effectiveAirGap !== airGap && (
                      <div className="flex justify-between text-blue-600">
                        <span>Effective air gap:</span>
                        <span className="font-mono font-semibold">{Math.round(effectiveAirGap)} mm</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-semibold">Total Depth to Tramps:</div>
                <div className="text-2xl font-bold">{airGap + burdenDepth} mm</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Field at depth: {Math.round(calculateFieldStrength(airGap + burdenDepth))} G
                </div>
              </div>
            </div>

            {/* Material Stream Effects */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="material-effects" className="text-base font-semibold">
                  Material Stream Effects
                </Label>
                <input
                  id="material-effects"
                  type="checkbox"
                  checked={includeMaterialEffects}
                  onChange={(e) => setIncludeMaterialEffects(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              
              {includeMaterialEffects && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="density">Bulk Density: {density.toFixed(1)} t/m³</Label>
                    <Input
                      id="density"
                      type="range"
                      min="0.8"
                      max="3.0"
                      step="0.1"
                      value={density}
                      onChange={(e) => setDensity(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground">
                      Typical: Sand 1.6-1.9, Coal 1.2, Iron ore 2.5
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="water">Water Content: {waterContent}%</Label>
                    <Input
                      id="water"
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={waterContent}
                      onChange={(e) => setWaterContent(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground">
                      Typical: Dry 2-4%, Moderate 5-8%, Wet 10-15%
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg space-y-1 border border-orange-200 dark:border-orange-800">
                    <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                      Attenuation Factor: η = {eta.toFixed(3)}
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Effective decay: k × η = {(effectiveK * 1000).toFixed(2)} × 10⁻³
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Field reach reduced by {((eta - 1) * 100).toFixed(0)}%
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tramp Capture Zones</h3>
              <div className="space-y-2">
                {trampObjects.map((tramp) => {
                  const status = getTrampStatus(tramp);
                  const statusColor = 
                    status.status === 'captured' ? 'bg-green-100 dark:bg-green-950 border-green-500' :
                    status.status === 'partial' ? 'bg-yellow-100 dark:bg-yellow-950 border-yellow-500' :
                    'bg-red-100 dark:bg-red-950 border-red-500';
                  
                  // Calculate material attenuation impact
                  const attenuationImpact = includeMaterialEffects 
                    ? `η = ${eta.toFixed(2)}×`
                    : null;
                  const etaColor = eta < 1.2 ? 'text-green-600 dark:text-green-400' :
                                   eta < 1.5 ? 'text-yellow-600 dark:text-yellow-400' :
                                   'text-red-600 dark:text-red-400';
                  
                  return (
                    <div
                      key={tramp.name}
                      className={`p-3 rounded-lg border-2 space-y-2 ${statusColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tramp.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{tramp.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Limit: {status.captureDepth} mm @ {status.fieldAtCaptureDepth} G
                            </div>
                            {includeMaterialEffects && (
                              <div className="text-xs font-semibold mt-0.5">
                                Required: <span className={etaColor}>{status.effectiveThreshold} G</span> (with material)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {status.probability}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Field at burden: {status.fieldStrength} G
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            status.status === 'captured' ? 'bg-green-500' :
                            status.status === 'partial' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${status.probability}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {status.status === 'captured' && '✅ Highly likely to capture'}
                          {status.status === 'partial' && '⚠️ Marginal capture zone'}
                          {status.status === 'missed' && '❌ Field too weak'}
                        </div>
                        {attenuationImpact && (
                          <div className={`text-xs font-bold ${etaColor}`}>
                            {attenuationImpact}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Layered Capture Zones — Which Tramps Can We Recover?</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedModel.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-x-auto"
              >
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full border rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
                  style={{ minHeight: "700px" }}
                >
                  {/* Depth Scale on Left */}
                  <g>
                    <line 
                      x1="50" 
                      y1={magnetHeight} 
                      x2="50" 
                      y2={magnetHeight + totalDepth} 
                      stroke="#64748b" 
                      strokeWidth="2" 
                    />
                    {[0, 25, 50, 75, 100, 150, 200].filter(d => d <= totalDepthToShow).map((depth) => (
                      <g key={depth}>
                        <line
                          x1="45"
                          y1={magnetHeight + depth * scale}
                          x2="55"
                          y2={magnetHeight + depth * scale}
                          stroke="#64748b"
                          strokeWidth="2"
                        />
                        <text 
                          x="40" 
                          y={magnetHeight + depth * scale + 4} 
                          textAnchor="end" 
                          fontSize="11" 
                          fill="#475569" 
                          fontWeight="bold"
                        >
                          {depth}mm
                        </text>
                      </g>
                    ))}
                    <text 
                      x="50" 
                      y={magnetHeight + totalDepth / 2} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="#64748b"
                      transform={`rotate(-90, 50, ${magnetHeight + totalDepth / 2})`}
                    >
                      DEPTH BELOW MAGNET
                    </text>
                  </g>

                  {/* MAGNET BLOCK - Centered over belt */}
                  <motion.rect 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 10, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    x={magnetX} 
                    y="10" 
                    width={magnetWidth} 
                    height={magnetHeight} 
                    fill="#3b82f6" 
                    stroke="#1e3a8a" 
                    strokeWidth="3" 
                    rx="4" 
                  />
                  <text 
                    x={magnetX + magnetWidth / 2} 
                    y={10 + magnetHeight / 2 - 8} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="16" 
                    fontWeight="bold"
                  >
                    🧲 {selectedModel.name}
                  </text>
                  <text 
                    x={magnetX + magnetWidth / 2} 
                    y={10 + magnetHeight / 2 + 8} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="13"
                  >
                    {selectedModel.G0} G · {selectedModel.width}×{selectedModel.thickness} mm
                  </text>

                  {/* TRAMP CAPTURE ZONES - Layered by capture depth */}
                  {captureZones.map((zone, idx) => {
                    const y1 = magnetHeight + zone.startDepth * scale;
                    const y2 = magnetHeight + Math.min(zone.endDepth, totalDepthToShow) * scale;
                    const zoneHeight = y2 - y1;
                    
                    if (zoneHeight <= 0) return null;
                    
                    const isDeadZone = zone.tramp.name === "Dead Zone";
                    const totalTrampDepth = airGap + burdenDepth;
                    const isCaptured = totalTrampDepth <= zone.endDepth;
                    
                    return (
                      <g key={idx}>
                        {/* Zone background with sequential reveal animation */}
                        <motion.rect
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: isDeadZone ? 0.15 : (isCaptured ? 0.5 : 0.2), scaleY: 1 }}
                          transition={{ duration: 0.6, delay: idx * 0.15 }}
                          x={beltX}
                          y={y1}
                          width={beltWidth}
                          height={zoneHeight}
                          fill={zone.color}
                          stroke={isDeadZone ? "#374151" : "#fff"}
                          strokeWidth={isDeadZone ? "1" : "3"}
                          strokeDasharray={isDeadZone ? "4,4" : "none"}
                          style={{ transformOrigin: `${beltX}px ${y1}px` }}
                        />
                        
                        {/* Zone label */}
                        {!isDeadZone && (
                          <>
                            <text 
                              x={beltX + 15} 
                              y={y1 + 20} 
                              fontSize="16" 
                              fontWeight="bold" 
                              fill="#1e293b"
                            >
                              {zone.tramp.icon} {zone.tramp.name}
                            </text>
                            <text 
                              x={beltX + 15} 
                              y={y1 + 36} 
                              fontSize="13" 
                              fill="#475569"
                              fontWeight="bold"
                            >
                              Requires ≥ {zone.tramp.threshold} G
                            </text>
                          </>
                        )}
                        
                        {isDeadZone && (
                          <text 
                            x={beltX + beltWidth / 2} 
                            y={y1 + zoneHeight / 2} 
                            textAnchor="middle"
                            fontSize="16" 
                            fontWeight="bold" 
                            fill="#475569"
                            opacity="0.6"
                          >
                            {zone.tramp.icon} DEAD ZONE — Field Too Weak
                          </text>
                        )}
                        
                        {/* Horizontal depth marker at zone limit */}
                        {!isDeadZone && (
                          <>
                            <line
                              x1={beltX - 15}
                              y1={y2}
                              x2={beltX + beltWidth + 15}
                              y2={y2}
                              stroke={isCaptured ? "#22c55e" : "#64748b"}
                              strokeWidth="4"
                              strokeDasharray="10,5"
                            />
                            <circle
                              cx={beltX - 15}
                              cy={y2}
                              r="5"
                              fill={isCaptured ? "#22c55e" : "#64748b"}
                            />
                            <circle
                              cx={beltX + beltWidth + 15}
                              cy={y2}
                              r="5"
                              fill={isCaptured ? "#22c55e" : "#64748b"}
                            />
                            {/* Depth limit label */}
                            <rect
                              x={beltX + beltWidth + 25}
                              y={y2 - 12}
                              width="140"
                              height="24"
                              fill={isCaptured ? "#22c55e" : "#ef4444"}
                              opacity="0.9"
                              rx="4"
                            />
                            <text 
                              x={beltX + beltWidth + 32} 
                              y={y2 + 5} 
                              fontSize="13" 
                              fontWeight="bold" 
                              fill="white"
                            >
                              {zone.tramp.icon} Limit: {Math.round(zone.endDepth)}mm
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Gauss contour overlay lines */}
                  {contourLevels.filter(g => g < selectedModel.G0).map((gauss, idx) => {
                    const depth = Math.log(selectedModel.G0 / gauss) / selectedModel.k;
                    if (depth > totalDepthToShow) return null;
                    
                    const y = magnetHeight + depth * scale;
                    
                    return (
                      <g key={idx}>
                        <line
                          x1={beltX}
                          y1={y}
                          x2={beltX + beltWidth}
                          y2={y}
                          stroke="#fff"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                          opacity="0.6"
                        />
                        <text
                          x={beltX + beltWidth + 10}
                          y={y + 4}
                          fontSize="12"
                          fill="#64748b"
                          fontWeight="bold"
                        >
                          {gauss}G @ {Math.round(depth)}mm
                        </text>
                      </g>
                    );
                  })}

                  {/* AIR GAP - Troughed Belt Profile */}
                  <g>
                    {/* Air gap zone - troughed profile */}
                    {troughingAngle > 0 ? (
                      <polygon
                        points={`
                          ${beltX},${magnetHeight - edgeRise}
                          ${beltX + leftEdgeWidth},${magnetHeight}
                          ${beltX + leftEdgeWidth + centerWidth},${magnetHeight}
                          ${beltX + beltWidth},${magnetHeight - edgeRise}
                          ${beltX + beltWidth},${magnetHeight + airGap * scale}
                          ${beltX + leftEdgeWidth + centerWidth},${magnetHeight + airGap * scale}
                          ${beltX + leftEdgeWidth},${magnetHeight + airGap * scale}
                          ${beltX},${magnetHeight + airGap * scale}
                        `}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                      />
                    ) : (
                      <rect 
                        x={beltX} 
                        y={magnetHeight} 
                        width={beltWidth} 
                        height={airGap * scale} 
                        fill="none" 
                        stroke="#0ea5e9" 
                        strokeWidth="3" 
                        strokeDasharray="8,4" 
                      />
                    )}
                    
                    {/* Trough edge indicators */}
                    {troughingAngle > 0 && (
                      <>
                        {/* Left edge angle line */}
                        <line
                          x1={beltX}
                          y1={magnetHeight - edgeRise}
                          x2={beltX + leftEdgeWidth}
                          y2={magnetHeight}
                          stroke="#3b82f6"
                          strokeWidth="4"
                        />
                        {/* Right edge angle line */}
                        <line
                          x1={beltX + leftEdgeWidth + centerWidth}
                          y1={magnetHeight}
                          x2={beltX + beltWidth}
                          y2={magnetHeight - edgeRise}
                          stroke="#3b82f6"
                          strokeWidth="4"
                        />
                        {/* Left angle indicator */}
                        <path
                          d={`M ${beltX + 30} ${magnetHeight - edgeRise} 
                              L ${beltX + 30} ${magnetHeight}
                              L ${beltX + leftEdgeWidth} ${magnetHeight}`}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                        />
                        <text
                          x={beltX + 40}
                          y={magnetHeight - edgeRise / 2}
                          fontSize="11"
                          fill="#3b82f6"
                          fontWeight="bold"
                        >
                          {troughingAngle}°
                        </text>
                      </>
                    )}
                    
                    <text 
                      x={beltX - 180} 
                      y={magnetHeight + (airGap * scale) / 2 + 5} 
                      fontSize="14" 
                      fontWeight="bold" 
                      fill="#0ea5e9"
                    >
                      Air Gap: {airGap}mm →
                    </text>
                    
                    {/* Show effective air gap if different */}
                    {effectiveAirGap !== airGap && (
                      <>
                        <text 
                          x={beltX - 180} 
                          y={magnetHeight + (airGap * scale) / 2 + 25} 
                          fontSize="12" 
                          fill="#0ea5e9"
                          opacity="0.8"
                        >
                          (Effective: {Math.round(effectiveAirGap)}mm)
                        </text>
                        
                        {/* Visual indicator for effective measurement point */}
                        <line
                          x1={magnetX + magnetWidth / 2 - 40}
                          y1={magnetHeight}
                          x2={magnetX + magnetWidth / 2 - 40}
                          y2={magnetHeight + effectiveAirGap * scale}
                          stroke="#0ea5e9"
                          strokeWidth="3"
                          strokeDasharray="8,4"
                          opacity="0.6"
                        />
                        <text
                          x={magnetX + magnetWidth / 2 - 100}
                          y={magnetHeight + effectiveAirGap * scale - 10}
                          fontSize="11"
                          fill="#0ea5e9"
                          fontWeight="bold"
                        >
                          ↑ Top of burden
                        </text>
                      </>
                    )}

                    {/* Burden depth zone - realistic oval filling trough */}
                    {burdenDepth > 0 && (
                      <>
                        {/* Create burden shape with gradient for depth perception */}
                        <defs>
                          <radialGradient id="burdenGradient" cx="50%" cy="30%">
                            <stop offset="0%" stopColor="#92400e" stopOpacity="0.4" />
                            <stop offset="70%" stopColor="#78350f" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#451a03" stopOpacity="0.35" />
                          </radialGradient>
                        </defs>
                        
                        {/* Burden fill - realistic settled material shape */}
                        <path
                          d={(() => {
                            const beltTopY = magnetHeight + airGap * scale;
                            const steps = 80;
                            let pathD = '';
                            
                            // Draw top surface curve (burden surface)
                            for (let i = 0; i <= steps; i++) {
                              const x = beltX + (i / steps) * beltWidth;
                              const surfaceY = beltTopY - calculateBurdenSurface(x);
                              pathD += `${i === 0 ? 'M' : 'L'} ${x},${surfaceY} `;
                            }
                            
                            // Draw right edge following trough
                            pathD += `L ${beltX + beltWidth},${beltTopY - edgeRise} `;
                            
                            // Draw bottom following trough profile
                            pathD += `L ${beltX + leftEdgeWidth + centerWidth},${beltTopY} `;
                            pathD += `L ${beltX + leftEdgeWidth},${beltTopY} `;
                            
                            // Draw left edge
                            pathD += `L ${beltX},${beltTopY - edgeRise} Z`;
                            
                            return pathD;
                          })()}
                          fill="url(#burdenGradient)"
                          stroke="#78350f"
                          strokeWidth="2"
                        />
                        
                        {/* Burden surface line for clarity */}
                        <path
                          d={(() => {
                            const beltTopY = magnetHeight + airGap * scale;
                            const steps = 60;
                            let pathD = '';
                            
                            for (let i = 0; i <= steps; i++) {
                              const x = beltX + (i / steps) * beltWidth;
                              const surfaceY = beltTopY - calculateBurdenSurface(x);
                              pathD += `${i === 0 ? 'M' : 'L'} ${x},${surfaceY} `;
                            }
                            
                            return pathD;
                          })()}
                          fill="none"
                          stroke="#92400e"
                          strokeWidth="3"
                          opacity="0.8"
                        />
                      </>
                    )}
                    
                    {/* Material particles following realistic burden surface */}
                    {burdenDepth > 0 && Array.from({ length: 100 }).map((_, i) => {
                      const col = i % 50;
                      const row = Math.floor(i / 50);
                      const xPos = beltX + 20 + col * (beltWidth / 50);
                      const beltTopY = magnetHeight + airGap * scale;
                      
                      // Calculate position along burden depth
                      const depthRatio = (row + 0.5) / 3; // Distribute through burden depth
                      const maxSurface = calculateBurdenSurface(xPos);
                      const particleY = beltTopY - (maxSurface * depthRatio);
                      
                      // Only show particles within the burden volume
                      if (maxSurface > 0) {
                        return (
                          <circle
                            key={i}
                            cx={xPos}
                            cy={particleY}
                            r="2"
                            fill="#451a03"
                            opacity="0.5"
                          />
                        );
                      }
                      return null;
                    })}
                    
                    <text 
                      x={beltX - 180} 
                      y={magnetHeight + airGap * scale + (burdenDepth * scale) / 2 + 5} 
                      fontSize="14" 
                      fontWeight="bold" 
                      fill="#78350f"
                    >
                      Burden: {burdenDepth}mm →
                    </text>

                    {/* CRITICAL: Burden Bottom Line - This is where tramps are located */}
                    <line
                      x1={beltX - 30}
                      y1={magnetHeight + (airGap + burdenDepth) * scale}
                      x2={beltX + beltWidth + 30}
                      y2={magnetHeight + (airGap + burdenDepth) * scale}
                      stroke="#000"
                      strokeWidth="8"
                    />
                    <line
                      x1={beltX - 30}
                      y1={magnetHeight + (airGap + burdenDepth) * scale}
                      x2={beltX + beltWidth + 30}
                      y2={magnetHeight + (airGap + burdenDepth) * scale}
                      stroke="#fbbf24"
                      strokeWidth="5"
                    />
                    
                    {/* Burden line label box */}
                    <rect
                      x={beltX + beltWidth / 2 - 140}
                      y={magnetHeight + (airGap + burdenDepth) * scale - 35}
                      width="280"
                      height="26"
                      fill="#000"
                      opacity="0.85"
                      rx="4"
                    />
                    <text
                      x={beltX + beltWidth / 2}
                      y={magnetHeight + (airGap + burdenDepth) * scale - 16}
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="bold"
                      fill="#fbbf24"
                    >
                      ▼ BURDEN BOTTOM: {airGap + burdenDepth}mm ▼
                    </text>
                    
                    {/* Field strength at tramp depth */}
                    <rect
                      x={beltX + beltWidth / 2 - 120}
                      y={magnetHeight + (airGap + burdenDepth) * scale + 10}
                      width="240"
                      height="22"
                      fill="#dc2626"
                      opacity="0.9"
                      rx="4"
                    />
                    <text
                      x={beltX + beltWidth / 2}
                      y={magnetHeight + (airGap + burdenDepth) * scale + 25}
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="bold"
                      fill="white"
                    >
                      Field at Tramp: {Math.round(calculateFieldStrength(airGap + burdenDepth))} G
                    </text>
                    
                    {/* CONVEYOR BELT - Troughed cross-section */}
                    {troughingAngle > 0 ? (
                      <polygon
                        points={`
                          ${beltX},${magnetHeight + totalDepth - edgeRise}
                          ${beltX + leftEdgeWidth},${magnetHeight + totalDepth}
                          ${beltX + leftEdgeWidth + centerWidth},${magnetHeight + totalDepth}
                          ${beltX + beltWidth},${magnetHeight + totalDepth - edgeRise}
                          ${beltX + beltWidth},${magnetHeight + totalDepth + beltHeight}
                          ${beltX},${magnetHeight + totalDepth + beltHeight}
                        `}
                        fill="#1f2937"
                        stroke="#111827"
                        strokeWidth="3"
                      />
                    ) : (
                      <rect 
                        x={beltX - 20} 
                        y={magnetHeight + totalDepth} 
                        width={beltWidth + 40} 
                        height={beltHeight} 
                        fill="#1f2937" 
                        stroke="#111827" 
                        strokeWidth="3" 
                      />
                    )}
                    <text 
                      x={beltX + beltWidth / 2} 
                      y={magnetHeight + totalDepth + 14} 
                      textAnchor="middle" 
                      fill="#9ca3af" 
                      fontSize="14" 
                      fontWeight="bold"
                    >
                      CONVEYOR BELT ({userBeltWidth}mm)
                      {troughingAngle > 0 && ` · ${troughingAngle}° Trough`}
                    </text>
                  </g>

                  {/* TRAMP ICONS AT BOTTOM - Show if in capture zone */}
                  {trampObjects.map((tramp, idx) => {
                    const status = getTrampStatus(tramp);
                    const spacing = beltWidth / (trampObjects.length + 1);
                    const trampX = beltX + spacing * (idx + 1);
                    const trampY = magnetHeight + totalDepth + beltHeight + 35;

                    return (
                      <g key={idx}>
                        {/* Capture zone indicator for this specific tramp - opacity based on probability */}
                        {status.probability >= 50 && (
                          <>
                            <circle
                              cx={trampX}
                              cy={trampY}
                              r="30"
                              fill={
                                status.status === 'captured' ? '#22c55e' :
                                status.status === 'partial' ? '#eab308' :
                                '#ef4444'
                              }
                              opacity={status.probability / 300} // Scale opacity by probability
                            >
                              <animate
                                attributeName="r"
                                values="30;35;30"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                            {/* Line from tramp to its zone */}
                            <line
                              x1={trampX}
                              y1={trampY - 25}
                              x2={trampX}
                              y2={magnetHeight + (airGap + burdenDepth) * scale}
                              stroke={
                                status.status === 'captured' ? '#22c55e' :
                                status.status === 'partial' ? '#eab308' :
                                '#ef4444'
                              }
                              strokeWidth="2"
                              strokeDasharray="4,2"
                              opacity="0.6"
                            />
                          </>
                        )}
                        
                        <rect
                          x={trampX - 24}
                          y={trampY - 24}
                          width="48"
                          height="48"
                          fill={
                            status.status === 'captured' ? '#22c55e' :
                            status.status === 'partial' ? '#eab308' :
                            '#ef4444'
                          }
                          stroke="#fff"
                          strokeWidth="3"
                          rx="8"
                          opacity={status.probability >= 50 ? "0.95" : "0.5"}
                        />
                        <text
                          x={trampX}
                          y={trampY + 4}
                          textAnchor="middle"
                          fontSize="24"
                          dominantBaseline="middle"
                        >
                          {tramp.icon}
                        </text>
                        
                        <text
                          x={trampX}
                          y={trampY + 38}
                          textAnchor="middle"
                          fontSize="13"
                          fill={
                            status.status === 'captured' ? '#166534' :
                            status.status === 'partial' ? '#854d0e' :
                            '#991b1b'
                          }
                          fontWeight="bold"
                        >
                          {status.probability}%
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 52}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#64748b"
                        >
                          {tramp.name}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 65}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#475569"
                          fontWeight="bold"
                        >
                          Limit: {status.captureDepth}mm
                        </text>
                      </g>
                    );
                  })}

                  {/* Width dimension markers */}
                  <g>
                    {/* Magnet width indicator */}
                    <line
                      x1={magnetX}
                      y1="5"
                      x2={magnetX + magnetWidth}
                      y2="5"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    <line x1={magnetX} y1="0" x2={magnetX} y2="10" stroke="#3b82f6" strokeWidth="2" />
                    <line x1={magnetX + magnetWidth} y1="0" x2={magnetX + magnetWidth} y2="10" stroke="#3b82f6" strokeWidth="2" />
                  </g>
                </svg>
              </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Capture Depth Formula</h3>
                  <div className="font-mono text-sm p-2 bg-background rounded border">
                    d<sub>limit</sub> = ln(G₀ / G<sub>req</sub>) / k
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Each horizontal zone shows the maximum depth where that tramp type can be captured.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Current Setup</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Air Gap:</span>
                      <span className="font-mono font-bold text-sky-600">{airGap} mm</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Burden Depth:</span>
                      <span className="font-mono font-bold text-amber-700">{burdenDepth} mm</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-600 text-white rounded font-bold">
                      <span>Total Depth to Tramps:</span>
                      <span className="font-mono">{airGap + burdenDepth} mm</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-500 text-black rounded font-bold">
                      <span>Field at Tramp Depth:</span>
                      <span className="font-mono">{Math.round(calculateFieldStrength(airGap + burdenDepth))} G</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-sm">Capture Zone Limits</h3>
                <div className="grid grid-cols-2 gap-2">
                  {captureZones.filter(z => z.tramp.name !== "Dead Zone").map((zone, idx) => {
                    const totalTrampDepth = airGap + burdenDepth;
                    const isCaptured = totalTrampDepth <= zone.endDepth;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2 p-2 border-2 rounded ${isCaptured ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}
                      >
                        <span className="text-lg">{zone.tramp.icon}</span>
                        <div className="text-xs flex-1">
                          <div className="font-semibold">{zone.tramp.name}</div>
                          <div className={isCaptured ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                            Limit: {Math.round(zone.endDepth)}mm
                          </div>
                        </div>
                        <span className="text-lg">
                          {isCaptured ? '✅' : '❌'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-background rounded border-l-4 border-l-blue-500">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How to read this:</strong> The bold black/yellow line shows your burden bottom ({airGap + burdenDepth}mm). 
                  Tramps with depth limits above this line (green markers) can be captured. 
                  Tramps with limits below this line (gray markers) are too deep and will be missed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
