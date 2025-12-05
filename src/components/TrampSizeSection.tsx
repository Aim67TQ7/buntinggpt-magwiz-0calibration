import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
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

export function TrampSizeSection({ surfaceGauss, airGap, burden, onBurdenChange }: TrampSizeSectionProps) {
  const [trampItems, setTrampItems] = useState<TrampItem[]>(DEFAULT_TRAMPS);
  const [safetyFactor, setSafetyFactor] = useState<number>(3.0);

  const results = useMemo(() => {
    if (!surfaceGauss || surfaceGauss <= 0) return [];
    
    return trampItems.map(item => {
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
        return { item, result, error: null };
      } catch (e: any) {
        return { item, result: null, error: e.message };
      }
    });
  }, [trampItems, surfaceGauss, airGap, burden, safetyFactor]);

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
  };

  const updateTrampItem = (id: string, updates: Partial<TrampItem>) => {
    setTrampItems(trampItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const getStatusBadge = (result: TrampPickupResult | null, error: string | null) => {
    if (error) return <Badge variant="outline" className="text-muted-foreground">Invalid</Badge>;
    if (!result) return null;
    
    if (result.marginRatio >= 2.0) {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Strong ({result.marginRatio.toFixed(1)}x)</Badge>;
    } else if (result.marginRatio >= 1.0) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Marginal ({result.marginRatio.toFixed(1)}x)</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Fail ({result.marginRatio.toFixed(2)}x)</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tramp Metal Pickup Check</CardTitle>
          <Badge variant="outline">Gauss: {surfaceGauss || "N/A"}</Badge>
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
        <div className="space-y-2">
          {results.map(({ item, result, error }) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
              <div className="flex-1 grid grid-cols-6 gap-2 items-center">
                <Input
                  value={item.name}
                  onChange={(e) => updateTrampItem(item.id, { name: e.target.value })}
                  placeholder="Name"
                  className="h-7 text-xs"
                />
                <Select value={item.shape} onValueChange={(v) => updateTrampItem(item.id, { shape: v as TrampShape })}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plate">Plate</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="cube">Cube</SelectItem>
                    <SelectItem value="irregular">Irregular</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={item.length}
                  onChange={(e) => updateTrampItem(item.id, { length: parseFloat(e.target.value) || 0 })}
                  placeholder="L"
                  className="h-7 text-xs"
                  title="Length (mm)"
                />
                <Input
                  type="number"
                  value={item.width}
                  onChange={(e) => updateTrampItem(item.id, { width: parseFloat(e.target.value) || 0 })}
                  placeholder="W"
                  className="h-7 text-xs"
                  title="Width (mm)"
                />
                <Input
                  type="number"
                  value={item.thickness}
                  onChange={(e) => updateTrampItem(item.id, { thickness: parseFloat(e.target.value) || 0 })}
                  placeholder="T"
                  className="h-7 text-xs"
                  title="Thickness (mm)"
                />
                <Select value={item.orientation} onValueChange={(v) => updateTrampItem(item.id, { orientation: v as TrampOrientation })}>
                  <SelectTrigger className="h-7 text-xs">
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
              <div className="w-32 flex justify-end">
                {getStatusBadge(result, error)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeTrampItem(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addTrampItem} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Tramp Item
        </Button>

        {/* Summary */}
        {results.length > 0 && surfaceGauss > 0 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-lg">
            <p className="font-medium mb-1">Pickup Formula: F = (B² × A) / (2 × μ₀)</p>
            <p>Required = Weight × SF × Orientation Factor × Burden Factor</p>
            <p>Margin Ratio = Available Force / Required Force (≥1.0 = pickup likely)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
