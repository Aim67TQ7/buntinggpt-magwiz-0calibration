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
      
      // Calculate required force based on tramp metal dimensions and material stream
      const trampVolume = (trampWidth * trampLength * trampHeight) / 1000000; // mm³ to m³
      const trampMass = trampVolume * 7850; // Steel density kg/m³
      const requiredForce = trampMass * 9.81; // Force in Newtons
      
      // Filter and score OCW units
      const scored = data.map((unit: any) => {
        let score = 0;
        
        // Belt width matching (critical)
        if (unit.width && Math.abs(unit.width - beltWidth) < 100) {
          score += 50;
        } else if (unit.width && unit.width >= beltWidth) {
          score += 30;
        }
        
        // Force factor matching
        if (unit.force_factor && unit.force_factor >= requiredForce / 100) {
          score += 30;
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
    <div className="space-y-6">
      {/* Process Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Process Parameters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="beltSpeed">Belt Speed (m/s)</Label>
            <Input
              id="beltSpeed"
              type="number"
              value={beltSpeed}
              onChange={(e) => setBeltSpeed(parseFloat(e.target.value))}
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beltWidth">Belt Width (mm)</Label>
            <Input
              id="beltWidth"
              type="number"
              value={beltWidth}
              onChange={(e) => setBeltWidth(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedDepth">Feed Depth (mm)</Label>
            <Input
              id="feedDepth"
              type="number"
              value={feedDepth}
              onChange={(e) => setFeedDepth(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="throughput">Throughput (TPH)</Label>
            <Input
              id="throughput"
              type="number"
              value={throughput}
              onChange={(e) => setThroughput(parseFloat(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Magnet & Shape */}
      <Card>
        <CardHeader>
          <CardTitle>Magnet & Shape</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="magnetGap">Magnet Gap (mm)</Label>
            <Input
              id="magnetGap"
              type="number"
              value={magnetGap}
              onChange={(e) => setMagnetGap(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coreBeltRatio">Core:Belt Ratio</Label>
            <Input
              id="coreBeltRatio"
              type="number"
              value={coreBeltRatio}
              onChange={(e) => setCoreBeltRatio(parseFloat(e.target.value))}
              step="0.1"
              min="0"
              max="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="magnetPosition">Magnet Position</Label>
            <Select value={magnetPosition} onValueChange={setMagnetPosition}>
              <SelectTrigger id="magnetPosition">
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
        <CardHeader>
          <CardTitle>Material Stream</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bulkDensity">Bulk Density (t/m³)</Label>
            <Input
              id="bulkDensity"
              type="number"
              value={bulkDensity}
              onChange={(e) => setBulkDensity(parseFloat(e.target.value))}
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterContent">Water Content (%)</Label>
            <Input
              id="waterContent"
              type="number"
              value={waterContent}
              onChange={(e) => setWaterContent(parseFloat(e.target.value))}
              step="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ambientTemp">Ambient Temp (°C)</Label>
            <Input
              id="ambientTemp"
              type="number"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tramp Metal */}
      <Card>
        <CardHeader>
          <CardTitle>Tramp Metal (mm)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trampWidth">Width (W)</Label>
            <Input
              id="trampWidth"
              type="number"
              value={trampWidth}
              onChange={(e) => setTrampWidth(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trampLength">Length (L)</Label>
            <Input
              id="trampLength"
              type="number"
              value={trampLength}
              onChange={(e) => setTrampLength(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trampHeight">Height (H)</Label>
            <Input
              id="trampHeight"
              type="number"
              value={trampHeight}
              onChange={(e) => setTrampHeight(parseFloat(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full"
            size="lg"
          >
            <Calculator className="w-5 h-5 mr-2" />
            {isCalculating ? "Calculating..." : "Calculate OCW Recommendations"}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended OCW Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((unit, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-lg">
                      {unit.Prefix} OCW {unit.Suffix}
                    </div>
                    <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-x-4">
                      <span>Gauss: {unit.surface_gauss}</span>
                      <span>Force: {unit.force_factor}</span>
                      <span>Watts: {unit.watts}</span>
                      <span>Width: {unit.width}mm</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleViewOCW(unit)}
                    variant="outline"
                  >
                    View Details
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
