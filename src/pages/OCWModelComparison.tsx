import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Info, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BurdenSeverity, 
  marginRatioToConfidence,
  calculateForceFactorAtGap
} from "@/utils/trampPickup";
import { useToast } from "@/hooks/use-toast";

// Temperature scaling for Force Factor
const FF_TEMP_RATIOS: Record<number, number> = {
  20: 1.000,
  30: 0.9117,
  40: 0.8181
};

// Steel density for mass calculation
const STEEL_DENSITY = 7850; // kg/m³

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

// Calculate Force Factor at gap with temperature adjustment (uses backplate-based decay)
function calculateFFAtGapWithTemp(surfaceFF: number, gap: number, backplate: number, temp: number): number {
  const ffAtGap = calculateForceFactorAtGap(surfaceFF, gap, backplate);
  const tempRatio = FF_TEMP_RATIOS[temp] || 1.0;
  return ffAtGap * tempRatio;
}

// Calculate required force for tramp pickup
function calculateRequiredForce(
  widthMm: number,
  lengthMm: number,
  heightMm: number,
  burdenSeverity: BurdenSeverity,
  safetyFactor: number = 3.0
): number {
  const volume_m3 = (widthMm / 1000) * (lengthMm / 1000) * (heightMm / 1000);
  const mass_kg = volume_m3 * STEEL_DENSITY;
  const weight_N = mass_kg * 9.81;
  
  // Orientation factor (flat = 1.0)
  const oriFactor = 1.0;
  
  // Burden factor
  const burFactor = burdenSeverity === 'none' ? 1.0
    : burdenSeverity === 'light' ? 1.5
    : burdenSeverity === 'moderate' ? 2.5
    : burdenSeverity === 'heavy' ? 4.0
    : burdenSeverity === 'severe' ? 6.0
    : 3.0;
    
  return weight_N * oriFactor * burFactor * safetyFactor;
}

// Get confidence badge color
function getConfidenceBadgeVariant(confidence: number): 'default' | 'secondary' | 'destructive' {
  if (confidence >= 75) return 'default';
  if (confidence >= 50) return 'secondary';
  return 'destructive';
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return 'text-green-600';
  if (confidence >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export default function OCWModelComparison() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const passedParams = location.state as OCWSelectorState | undefined;
  
  // Parameters from OCW Selector (read-only)
  const beltSpeed = passedParams?.beltSpeed ?? 2.0;
  const beltWidth = passedParams?.beltWidth ?? 1200;
  const burdenDepth = passedParams?.burdenDepth ?? 100;
  const airGap = passedParams?.airGap ?? 200;
  const ambientTemp = passedParams?.ambientTemp ?? 20;
  const burdenSeverity = passedParams?.burdenSeverity ?? 'moderate';
  const trampWidth = passedParams?.trampWidth ?? 50;
  const trampLength = passedParams?.trampLength ?? 150;
  const trampHeight = passedParams?.trampHeight ?? 10;
  
  const hasPassedParams = !!passedParams;
  
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch saved configurations from database
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
  
  // Remove a saved configuration
  const handleRemoveConfig = async (config: SavedConfiguration) => {
    try {
      const { error } = await supabase
        .from('saved_ocw_configurations')
        .delete()
        .eq('id', config.id);
      
      if (error) throw error;
      
      setSavedConfigs(prev => prev.filter(c => c.id !== config.id));
      
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
  
  // Calculate required force for tramp pickup
  const requiredForce = useMemo(() => {
    return calculateRequiredForce(trampWidth, trampLength, trampHeight, burdenSeverity, 3.0);
  }, [trampWidth, trampLength, trampHeight, burdenSeverity]);
  
  // Calculate confidence for each saved configuration
  const configsWithConfidence = useMemo(() => {
    return savedConfigs.map(config => {
      const ff = config.force_factor || 0;
      // Backplate is the suffix value (e.g., 30 from "70 OCW 30")
      const backplate = config.suffix || 30;
      const availableForce = calculateFFAtGapWithTemp(ff, airGap, backplate, ambientTemp);
      const marginRatio = requiredForce > 0 ? availableForce / requiredForce : 0;
      const confidence = marginRatioToConfidence(marginRatio);
      
      return {
        ...config,
        availableForce,
        marginRatio,
        confidence
      };
    });
  }, [savedConfigs, airGap, ambientTemp, requiredForce]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/ocw">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to OCW Selector
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">OCW Model Comparison</h1>
              <p className="text-muted-foreground mt-1">
                Compare saved models for tramp pickup capability
                {hasPassedParams && <Badge variant="secondary" className="ml-2 text-xs">Parameters from OCW Selector</Badge>}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameters Panel (Read-Only) */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Parameters</CardTitle>
              <CardDescription>
                {hasPassedParams ? 'From OCW Selector' : 'Default values - go to OCW Selector to adjust'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Belt Speed:</span>
                  <span className="font-medium">{beltSpeed.toFixed(2)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Belt Width:</span>
                  <span className="font-medium">{beltWidth} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Burden Depth:</span>
                  <span className="font-medium">{burdenDepth} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Air Gap:</span>
                  <span className="font-medium">{airGap} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambient Temp:</span>
                  <span className="font-medium">{ambientTemp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Burden Severity:</span>
                  <span className="font-medium capitalize">{burdenSeverity}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm mb-2">Tramp Metal Dimensions</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <span className="text-muted-foreground block text-xs">Width</span>
                    <span className="font-medium">{trampWidth} mm</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block text-xs">Length</span>
                    <span className="font-medium">{trampLength} mm</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block text-xs">Height</span>
                    <span className="font-medium">{trampHeight} mm</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Required Force:</span>
                  <span className="font-bold text-primary">{requiredForce.toLocaleString(undefined, { maximumFractionDigits: 0 })} N</span>
                </div>
              </div>
              
              {!hasPassedParams && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Go to OCW Selector, configure parameters, and click "Compare" to pass your settings here.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Saved Models List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Saved Models for Comparison</CardTitle>
                    <CardDescription>
                      {savedConfigs.length} model{savedConfigs.length !== 1 ? 's' : ''} saved - toggle checkboxes in OCW Selector to add more
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Loading saved configurations...
                  </div>
                ) : savedConfigs.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">No models saved for comparison</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Go to OCW Selector and check the boxes next to models you want to compare.
                    </p>
                    <Link to="/ocw">
                      <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go to OCW Selector
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {configsWithConfidence.map((config) => (
                      <div 
                        key={config.id}
                        className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{config.name}</h3>
                              <Badge 
                                variant={getConfidenceBadgeVariant(config.confidence)}
                                className="text-sm"
                              >
                                {config.confidence}% Confidence
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Gauss:</span>
                                <span className="ml-2 font-medium">{config.surface_gauss?.toLocaleString() || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Force Factor:</span>
                                <span className="ml-2 font-medium">{config.force_factor?.toLocaleString() || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Watts:</span>
                                <span className="ml-2 font-medium">{config.watts?.toLocaleString() || '-'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Width:</span>
                                <span className="ml-2 font-medium">{config.width} mm</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Available Force @ {airGap}mm:</span>
                                <span className="ml-2 font-bold">{config.availableForce.toLocaleString(undefined, { maximumFractionDigits: 0 })} N</span>
                              </div>
                              <div className={getConfidenceColor(config.confidence)}>
                                {config.confidence >= 75 ? '✓ High confidence' :
                                 config.confidence >= 50 ? '⚠ Moderate confidence' :
                                 '✗ Low confidence'}
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveConfig(config)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
