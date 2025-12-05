import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Info } from "lucide-react";
import { 
  TrampShape, 
  TrampOrientation, 
  BurdenSeverity, 
  TrampGeometry,
  calculateMarginRatioFromGauss,
  TrampPickupResult
} from "@/utils/trampPickup";

interface TrampItem {
  id: string;
  name: string;
  shape: TrampShape;
  length: number;
  width: number;
  thickness: number;
  orientation: TrampOrientation;
}

interface TrampSizeSectionProps {
  surfaceGauss: number;
  airGap: number;
  burden: BurdenSeverity;
  onBurdenChange: (burden: BurdenSeverity) => void;
}

const DEFAULT_TRAMPS: TrampItem[] = [
  { id: "1", name: "Small Bolt", shape: "bar", length: 50, width: 10, thickness: 10, orientation: "unknown" },
  { id: "2", name: "Medium Plate", shape: "plate", length: 100, width: 50, thickness: 8, orientation: "flat" },
  { id: "3", name: "Large Rod", shape: "bar", length: 200, width: 25, thickness: 25, orientation: "edge" },
];

function getConfidenceColor(confidence: number): string {
  if (confidence < 25) return "text-red-500";
  if (confidence < 50) return "text-orange-500";
  if (confidence < 75) return "text-yellow-500";
  if (confidence < 90) return "text-lime-500";
  return "text-green-500";
}

function getConfidenceProgressColor(confidence: number): string {
  if (confidence < 25) return "bg-red-500";
  if (confidence < 50) return "bg-orange-500";
  if (confidence < 75) return "bg-yellow-500";
  if (confidence < 90) return "bg-lime-500";
  return "bg-green-500";
}

export function TrampSizeSection({ surfaceGauss, airGap, burden, onBurdenChange }: TrampSizeSectionProps) {
  const [trampItems, setTrampItems] = useState<TrampItem[]>(DEFAULT_TRAMPS);
  const [safetyFactor, setSafetyFactor] = useState<number>(3.0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getResultForItem = (item: TrampItem): { result: TrampPickupResult | null; error: string | null } => {
    if (!surfaceGauss || surfaceGauss <= 0) {
      return { result: null, error: "No surface Gauss value" };
    }
    
    const geometry: TrampGeometry = {
      shape: item.shape,
      length_mm: item.length,
      width_mm: item.width,
      thickness_mm: item.thickness,
    };
    
    try {
      const result = calculateMarginRatioFromGauss(
        surfaceGauss,
        airGap,
        geometry,
        item.orientation,
        burden,
        safetyFactor
      );
      return { result, error: null };
    } catch (e: any) {
      return { result: null, error: e.message };
    }
  };

  const addTrampItem = () => {
    const newItem: TrampItem = {
      id: Date.now().toString(),
      name: `Tramp ${trampItems.length + 1}`,
      shape: "bar",
      length: 100,
      width: 20,
      thickness: 10,
      orientation: "unknown",
    };
    setTrampItems([...trampItems, newItem]);
  };

  const removeTrampItem = (id: string) => {
    setTrampItems(trampItems.filter(item => item.id !== id));
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateTrampItem = (id: string, updates: Partial<TrampItem>) => {
    setTrampItems(trampItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tramp Metal Pickup Check</CardTitle>
          <Badge variant="outline">Surface Gauss: {surfaceGauss || "N/A"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Burden Severity</Label>
            <Select value={burden} onValueChange={(v) => onBurdenChange(v as BurdenSeverity)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Free Surface)</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="heavy">Heavy</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Air Gap (mm)</Label>
            <Input type="number" value={airGap} disabled className="h-8 bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Safety Factor</Label>
            <Input 
              type="number" 
              value={safetyFactor} 
              onChange={(e) => setSafetyFactor(parseFloat(e.target.value) || 3.0)}
              step="0.5"
              min="1"
              max="10"
              className="h-8" 
            />
          </div>
        </div>

        {/* Tramp Items */}
        <div className="space-y-3">
          {trampItems.map((item) => {
            const { result, error } = getResultForItem(item);
            return (
            <Collapsible 
              key={item.id} 
              open={expandedItems.has(item.id)}
              onOpenChange={() => toggleExpanded(item.id)}
            >
              <div className="border rounded-lg overflow-hidden">
                {/* Main Row */}
                <div className="p-3 bg-muted/30">
                  <div className="flex items-start gap-3">
                    {/* Name & Shape */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateTrampItem(item.id, { name: e.target.value })}
                          placeholder="Name"
                          className="h-8 text-sm font-medium flex-1"
                        />
                        <Select value={item.shape} onValueChange={(v) => updateTrampItem(item.id, { shape: v as TrampShape })}>
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plate">Plate</SelectItem>
                            <SelectItem value="bar">Bar</SelectItem>
                            <SelectItem value="cube">Cube</SelectItem>
                            <SelectItem value="irregular">Irregular</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* W × L × H Inputs */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground w-6">W:</span>
                          <Input
                            type="number"
                            value={item.width}
                            onChange={(e) => updateTrampItem(item.id, { width: parseFloat(e.target.value) || 0 })}
                            className="h-7 w-16 text-xs"
                          />
                        </div>
                        <span className="text-muted-foreground">×</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground w-5">L:</span>
                          <Input
                            type="number"
                            value={item.length}
                            onChange={(e) => updateTrampItem(item.id, { length: parseFloat(e.target.value) || 0 })}
                            className="h-7 w-16 text-xs"
                          />
                        </div>
                        <span className="text-muted-foreground">×</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground w-5">H:</span>
                          <Input
                            type="number"
                            value={item.thickness}
                            onChange={(e) => updateTrampItem(item.id, { thickness: parseFloat(e.target.value) || 0 })}
                            className="h-7 w-16 text-xs"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">mm</span>
                        
                        <Select value={item.orientation} onValueChange={(v) => updateTrampItem(item.id, { orientation: v as TrampOrientation })}>
                          <SelectTrigger className="h-7 w-24 ml-2 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="edge">Edge</SelectItem>
                            <SelectItem value="corner">Corner</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Results Display */}
                    <div className="flex flex-col items-end gap-1 min-w-[160px]">
                      {error ? (
                        <Badge variant="outline" className="text-muted-foreground">Invalid</Badge>
                      ) : result ? (
                        <>
                          {/* Confidence Display */}
                          <div className="text-right">
                            <span className={`text-2xl font-bold ${getConfidenceColor(result.confidencePercent)}`}>
                              {result.confidencePercent}%
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">confidence</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getConfidenceProgressColor(result.confidencePercent)}`}
                              style={{ width: `${result.confidencePercent}%` }}
                            />
                          </div>
                          {/* Force Values */}
                          <div className="flex gap-3 text-xs">
                            <span className="text-muted-foreground">
                              Req: <span className="text-foreground font-medium">{result.requiredForce_N.toFixed(1)} N</span>
                            </span>
                            <span className="text-muted-foreground">
                              Avail: <span className="text-foreground font-medium">{result.availableMagForce_N.toFixed(1)} N</span>
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedItems.has(item.id) ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeTrampItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <CollapsibleContent>
                  {result && (
                    <div className="p-3 bg-muted/10 border-t text-xs space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <span className="text-muted-foreground">Mass</span>
                          <p className="font-medium">{result.mass_kg.toFixed(3)} kg</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight</span>
                          <p className="font-medium">{result.weight_N.toFixed(2)} N</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Effective Area</span>
                          <p className="font-medium">{(result.effectiveArea_m2 * 1e4).toFixed(2)} cm²</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Margin Ratio</span>
                          <p className="font-medium">{result.marginRatio.toFixed(2)}x</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
                        <div>
                          <span className="text-muted-foreground">Orientation Factor</span>
                          <p className="font-medium">{result.orientationFactor.toFixed(1)}x</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Burden Factor</span>
                          <p className="font-medium">{result.burdenFactor.toFixed(1)}x</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Combined Factor</span>
                          <p className="font-medium">{result.combinedFactor.toFixed(1)}x</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
            );
          })}
        </div>

        <Button variant="outline" size="sm" onClick={addTrampItem} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Tramp Item
        </Button>

        {/* Formula Reference */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p><strong>Required Lift</strong> = Weight × Safety Factor × Orientation Factor × Burden Factor</p>
            <p><strong>Available Force</strong> = (B² × Area) / (2 × μ₀)</p>
            <p><strong>Confidence</strong> based on Available / Required ratio</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
