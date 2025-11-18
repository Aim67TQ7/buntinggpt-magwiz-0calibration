import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Plus, Trash2, GitCompare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface OCWRecommendation {
  model: string;
  Prefix: number;
  Suffix: number;
  surface_gauss: number;
  force_factor: number;
  watts: number;
  width: number;
  frame: string;
}

interface TrampMetal {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
}

const STANDARD_TRAMP_METALS: Omit<TrampMetal, 'id'>[] = [
  { name: "25mm Cube", width: 25, length: 25, height: 25 },
  { name: "25mm Cube Alt 1", width: 19, length: 19, height: 6 },
  { name: "25mm Cube Alt 2", width: 19, length: 6, height: 19 },
  { name: "25mm Cube Alt 3", width: 6, length: 19, height: 19 },
  { name: "M12 Nut", width: 24, length: 24, height: 75 },
  { name: "M16x75mm Bolt", width: 24, length: 75, height: 24 },
  { name: "M16x75mm Bolt Alt", width: 75, length: 24, height: 24 },
  { name: "M18 Nut", width: 27, length: 27, height: 9 },
  { name: "M18 Nut Alt 1", width: 27, length: 9, height: 27 },
  { name: "M18 Nut Alt 2", width: 9, length: 27, height: 27 },
  { name: "6mm Plate", width: 100, length: 100, height: 6 },
  { name: "6mm Plate Alt 1", width: 100, length: 6, height: 100 },
  { name: "6mm Plate Alt 2", width: 6, length: 100, height: 100 },
];

export function MagneticSeparatorCalculator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Process Parameters
  const [beltSpeed, setBeltSpeed] = useState<number>(2.5);
  const [beltWidth, setBeltWidth] = useState<number>(1200);
  const [feedDepth, setFeedDepth] = useState<number>(100);
  const [throughput, setThroughput] = useState<number>(500);
  
  // Magnet & Shape
  const [magnetGap, setMagnetGap] = useState<number>(150);
  const [coreBeltRatio, setCoreBeltRatio] = useState<number>(0.7);
  const [magnetPosition, setMagnetPosition] = useState<string>("overhead");
  
  // Material Stream
  const [bulkDensity, setBulkDensity] = useState<number>(1.8);
  const [waterContent, setWaterContent] = useState<number>(8);
  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  
  // Tramp Metal
  const [trampMetals, setTrampMetals] = useState<TrampMetal[]>([
    { id: '1', name: "Custom", width: 50, length: 100, height: 25 }
  ]);
  
  const [recommendations, setRecommendations] = useState<OCWRecommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<number>>(new Set());

  const handleAddStandard = () => {
    const newMetals = STANDARD_TRAMP_METALS.map((metal, index) => ({
      ...metal,
      id: `std-${Date.now()}-${index}`
    }));
    setTrampMetals([...trampMetals, ...newMetals]);
    toast({
      title: "Standard Shapes Added",
      description: `Added ${STANDARD_TRAMP_METALS.length} standard tramp metal shapes.`,
    });
  };

  const handleDeleteTrampMetal = (id: string) => {
    setTrampMetals(trampMetals.filter(metal => metal.id !== id));
  };

  const handleUpdateTrampMetal = (id: string, field: 'width' | 'length' | 'height', value: number) => {
    setTrampMetals(trampMetals.map(metal => 
      metal.id === id ? { ...metal, [field]: value } : metal
    ));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Fetch OCW data from BMR_Top table
      const { data, error } = await supabase
        .from('BMR_Top')
        .select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: "No Data Available",
          description: "No OCW units found in BMR_Top table.",
          variant: "destructive",
        });
        setIsCalculating(false);
        return;
      }
      
      // Calculate minimum suffix: (beltWidth * coreBeltRatio) / 10
      const minSuffix = Math.round((beltWidth * coreBeltRatio) / 10);
      
      // Calculate belt width tolerance range (-10% to +20%)
      const widthMin = beltWidth * 0.9;  // -10%
      const widthMax = beltWidth * 1.2;  // +20%
      
      console.log('=== OCW Calculation Debug ===');
      console.log('Input Parameters:', { beltWidth, coreBeltRatio });
      console.log('Calculated minSuffix:', minSuffix);
      console.log('Width range:', { widthMin, widthMax });
      console.log('Total units in database:', data.length);
      
      // Filter units where Suffix >= minSuffix AND width is within tolerance
      const filtered = data.filter((unit: any) => {
        const suffixMatch = unit.Suffix >= minSuffix;
        const widthMatch = unit.width >= widthMin && unit.width <= widthMax;
        
        if (suffixMatch && widthMatch) {
          console.log('Match found:', { 
            model: `${unit.Prefix} OCW ${unit.Suffix}`, 
            width: unit.width,
            suffix: unit.Suffix 
          });
        }
        
        return suffixMatch && widthMatch;
      });
      
      console.log('Total matches:', filtered.length);
      
      // Sort by Suffix (ascending), then by Prefix (ascending)
      const sorted = filtered.sort((a: any, b: any) => {
        if (a.Suffix !== b.Suffix) {
          return a.Suffix - b.Suffix;
        }
        return a.Prefix - b.Prefix;
      });
      
      // Map to recommendation format
      const allRecommendations = sorted.map((unit: any) => ({
        model: unit.model,
        Prefix: unit.Prefix,
        Suffix: unit.Suffix,
        surface_gauss: unit.surface_gauss,
        force_factor: unit.force_factor,
        watts: unit.watts,
        width: unit.width,
        frame: unit.frame
      }));
      
      setRecommendations(allRecommendations);
      
      if (allRecommendations.length > 0) {
        toast({
          title: "Calculation Complete",
          description: `Found ${allRecommendations.length} recommended OCW units.`,
        });
      } else {
        toast({
          title: "No Matches Found",
          description: `No units found with Suffix ≥ ${minSuffix} and width ${widthMin}-${widthMax}mm. Check console for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "An error occurred. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleViewOCW = (unit: OCWRecommendation) => {
    navigate(`/ocw?prefix=${unit.Prefix}&suffix=${unit.Suffix}&expand=true`);
  };

  const handleToggleComparison = (index: number) => {
    const newSelection = new Set(selectedForComparison);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      if (newSelection.size >= 5) {
        toast({
          title: "Maximum reached",
          description: "You can compare up to 5 units at a time",
          variant: "destructive",
        });
        return;
      }
      newSelection.add(index);
    }
    setSelectedForComparison(newSelection);
  };

  const handleCompareSelected = () => {
    const selectedUnits = recommendations.filter((_, index) => 
      selectedForComparison.has(index)
    );
    navigate('/ocw-comparison', { 
      state: { liveRecommendations: selectedUnits } 
    });
  };

  return (
    <div className="space-y-4">
      {/* Input Cards in 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Process Parameters */}
        <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Process Parameters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="beltSpeed" className="text-xs">Belt Speed (m/s)</Label>
            <Input
              id="beltSpeed"
              type="number"
              value={beltSpeed}
              onChange={(e) => setBeltSpeed(parseFloat(e.target.value))}
              step="0.1"
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="beltWidth" className="text-xs">Belt Width (mm)</Label>
            <Input
              id="beltWidth"
              type="number"
              value={beltWidth}
              onChange={(e) => setBeltWidth(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedDepth" className="text-xs">Feed Depth (mm)</Label>
            <Input
              id="feedDepth"
              type="number"
              value={feedDepth}
              onChange={(e) => setFeedDepth(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="throughput" className="text-xs">Throughput (TPH)</Label>
            <Input
              id="throughput"
              type="number"
              value={throughput}
              onChange={(e) => setThroughput(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Magnet & Shape */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Magnet & Shape</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="magnetGap" className="text-xs">Magnet Gap (mm)</Label>
            <Input
              id="magnetGap"
              type="number"
              value={magnetGap}
              onChange={(e) => setMagnetGap(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coreBeltRatio" className="text-xs">Core:Belt Ratio</Label>
            <Input
              id="coreBeltRatio"
              type="number"
              value={coreBeltRatio}
              onChange={(e) => setCoreBeltRatio(parseFloat(e.target.value))}
              step="0.1"
              min="0"
              max="1"
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="magnetPosition" className="text-xs">Magnet Position</Label>
            <Select value={magnetPosition} onValueChange={setMagnetPosition}>
              <SelectTrigger id="magnetPosition" className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overhead">Overhead</SelectItem>
                <SelectItem value="inline">Inline</SelectItem>
                <SelectItem value="drum">Drum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Material Stream */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Material Stream</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="bulkDensity" className="text-xs">Bulk Density (t/m³)</Label>
            <Input
              id="bulkDensity"
              type="number"
              value={bulkDensity}
              onChange={(e) => setBulkDensity(parseFloat(e.target.value))}
              step="0.1"
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waterContent" className="text-xs">Water Content (%)</Label>
            <Input
              id="waterContent"
              type="number"
              value={waterContent}
              onChange={(e) => setWaterContent(parseFloat(e.target.value))}
              step="1"
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ambientTemp" className="text-xs">Ambient Temp (°C)</Label>
            <Input
              id="ambientTemp"
              type="number"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tramp Metal */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tramp Metal (mm)</CardTitle>
          <Button
            onClick={handleAddStandard}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Standards
          </Button>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {trampMetals.map((metal) => (
            <div key={metal.id} className="grid grid-cols-[1fr_auto] gap-2 p-2 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{metal.name}</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Width (W)</Label>
                  <Input
                    type="number"
                    value={metal.width}
                    onChange={(e) => handleUpdateTrampMetal(metal.id, 'width', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Length (L)</Label>
                  <Input
                    type="number"
                    value={metal.length}
                    onChange={(e) => handleUpdateTrampMetal(metal.id, 'length', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height (H)</Label>
                  <Input
                    type="number"
                    value={metal.height}
                    onChange={(e) => handleUpdateTrampMetal(metal.id, 'height', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={() => handleDeleteTrampMetal(metal.id)}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 self-end"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      </div>

      {/* Calculate Button */}
      <Button 
        onClick={handleCalculate}
        disabled={isCalculating}
        className="w-full"
      >
        <Calculator className="w-4 h-4 mr-2" />
        {isCalculating ? "Calculating..." : "Calculate OCW Recommendations"}
      </Button>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recommended OCW Units</CardTitle>
              {selectedForComparison.size >= 2 && (
                <Button 
                  onClick={handleCompareSelected}
                  size="sm"
                  variant="default"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Selected ({selectedForComparison.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recommendations.map((unit, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors ${
                    selectedForComparison.has(index) ? 'bg-accent border-primary' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <Checkbox
                      id={`compare-${index}`}
                      checked={selectedForComparison.has(index)}
                      onCheckedChange={() => handleToggleComparison(index)}
                      aria-label={`Select ${unit.Prefix} OCW ${unit.Suffix} for comparison`}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="font-semibold text-sm">
                      {unit.Prefix} OCW {unit.Suffix}
                    </div>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-x-3">
                      <span>Gauss: {unit.surface_gauss}</span>
                      <span>Force: {unit.force_factor}</span>
                      <span>Watts: {unit.watts}</span>
                      <span>Width: {unit.width}mm</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewOCW(unit)}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </Button>
                    <Button 
                      onClick={() => navigate('/magnetic-decay', { 
                        state: { 
                          model: `${unit.Prefix} OCW ${unit.Suffix}`,
                          gauss: unit.surface_gauss,
                          force: unit.force_factor
                        }
                      })}
                      variant="outline"
                      size="sm"
                    >
                      Decay Chart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
