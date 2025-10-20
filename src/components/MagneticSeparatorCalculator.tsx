import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";
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
  const [trampWidth, setTrampWidth] = useState<number>(50);
  const [trampLength, setTrampLength] = useState<number>(100);
  const [trampHeight, setTrampHeight] = useState<number>(25);
  
  const [recommendations, setRecommendations] = useState<OCWRecommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

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
      
      // Calculate target suffix based on belt width and core:belt ratio
      const targetSuffix = (beltWidth * coreBeltRatio) / 10;
      
      // Filter and score OCW units
      const scored = data.map((unit: any) => {
        let score = 0;
        
        // Belt width matching (critical) - within ±20%
        const widthTolerance = beltWidth * 0.2;
        if (unit.width && Math.abs(unit.width - beltWidth) <= widthTolerance) {
          score += 50;
        }
        
        // Suffix matching - exact match gets highest score
        if (unit.Suffix === Math.round(targetSuffix)) {
          score += 30;
        } else if (unit.Suffix && Math.abs(unit.Suffix - targetSuffix) <= 2) {
          // Close suffix match
          score += 20;
        }
        
        // Magnetic field strength (gauss)
        if (unit.surface_gauss && unit.surface_gauss >= 800) {
          score += 20;
        }
        
        return {
          ...unit,
          score
        };
      });
      
      // Sort by score and take top 5
      const topRecommendations = scored
        .filter((unit: any) => unit.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5)
        .map((unit: any) => ({
          model: unit.model,
          Prefix: unit.Prefix,
          Suffix: unit.Suffix,
          surface_gauss: unit.surface_gauss,
          force_factor: unit.force_factor,
          watts: unit.watts,
          width: unit.width,
          frame: unit.frame
        }));
      
      setRecommendations(topRecommendations);
      
      if (topRecommendations.length > 0) {
        toast({
          title: "Calculation Complete",
          description: `Found ${topRecommendations.length} recommended OCW units.`,
        });
      } else {
        toast({
          title: "No Matches Found",
          description: "No OCW units match your criteria. Try adjusting parameters.",
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tramp Metal (mm)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="trampWidth" className="text-xs">Width (W)</Label>
            <Input
              id="trampWidth"
              type="number"
              value={trampWidth}
              onChange={(e) => setTrampWidth(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trampLength" className="text-xs">Length (L)</Label>
            <Input
              id="trampLength"
              type="number"
              value={trampLength}
              onChange={(e) => setTrampLength(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trampHeight" className="text-xs">Height (H)</Label>
            <Input
              id="trampHeight"
              type="number"
              value={trampHeight}
              onChange={(e) => setTrampHeight(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>
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
            <CardTitle className="text-base">Recommended OCW Units</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recommendations.map((unit, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-0.5">
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
                  <Button 
                    onClick={() => handleViewOCW(unit)}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
