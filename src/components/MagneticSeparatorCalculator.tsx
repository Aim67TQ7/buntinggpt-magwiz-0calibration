import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CompactCalculatorInputs } from "./CompactCalculatorInputs";
import { ResultsDisplay } from "./ResultsDisplay";
import { CalculatorInputs, EnhancedCalculationResults } from '@/types/calculator';
import { performEnhancedCalculation } from '@/utils/calculations';
import { generateValidationExportData } from '@/utils/validation';
import { Calculator, Settings, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const materialTypes = [
  { item: "Suspension Parts", source: "Automotive components", typicalSize: "100-600mm (4-24\") assemblies", weightRange: "2-30 kg (4-66 lbs)" },
  { item: "Steel Grinding Balls", source: "Ball mills", typicalSize: "25-125mm (1-5\") diameter", weightRange: "0.1-8 kg (0.2-18 lbs)" },
  { item: "Conveyor Splice Bolts", source: "Belt connections", typicalSize: "M16-M24 (5/8\"-1\") dia, 50-150mm (2-6\") long", weightRange: "100-600g (0.2-1.3 lbs)" },
  { item: "Bottle Caps", source: "Beverage containers", typicalSize: "26-38mm (1-1.5\") diameter", weightRange: "1-3g (0.04-0.1 oz)" },
  { item: "Drill Steel", source: "Blast hole drilling", typicalSize: "1-6m (3-20 ft) long, 32-89mm (1.25\"-3.5\") dia", weightRange: "8-50 kg (18-110 lbs)" },
  { item: "Drill Rod Sections", source: "Blast hole equipment", typicalSize: "1-3m (3-10 ft) long, 76-152mm (3-6\") dia", weightRange: "15-80 kg (33-175 lbs)" },
  { item: "Structural Steel", source: "Building demolition", typicalSize: "1-8m (3-26 ft) beams/angles", weightRange: "20-500 kg (44-1100 lbs)" },
  { item: "Rebar Sections", source: "Concrete demolition", typicalSize: "3-12m (10-40 ft) long, 10-32mm (#3-#10) dia", weightRange: "2-50 kg (4-110 lbs)" },
  { item: "Nails/Screws", source: "Construction lumber", typicalSize: "25-150mm (1-6\") long, 2-8mm (1/16\"-5/16\") dia", weightRange: "2-50g (0.07-1.8 oz)" },
  { item: "Aerosol Cans", source: "Consumer products", typicalSize: "45-75mm (1.75-3\") dia, 100-300mm (4-12\") tall", weightRange: "50-200g (1.8-7 oz)" },
  { item: "Food Cans", source: "Consumer waste", typicalSize: "65-108mm (2.5-4.25\") dia, 75-180mm (3-7\") tall", weightRange: "15-150g (0.5-5.3 oz)" },
  { item: "Pick Points", source: "Continuous miners", typicalSize: "75-150mm (3-6\") long, 25-40mm (1-1.5\") dia", weightRange: "200-800g (0.4-1.8 lbs)" },
  { item: "Mine Cables", source: "Conveyor/power systems", typicalSize: "10-50m (30-165 ft) long, 12-50mm (1/2\"-2\") dia", weightRange: "5-100 kg (10-220 lbs)" },
  { item: "Hinges/Hardware", source: "Doors/cabinets", typicalSize: "50-200mm (2-8\") pieces", weightRange: "100-2000g (3.5-70 oz)" },
  { item: "Wire/Cable", source: "Electrical systems", typicalSize: "1-100m (3-330 ft) long, 1-25mm (AWG 18-1/0)", weightRange: "0.1-20 kg (0.2-44 lbs)" },
  { item: "Hydraulic Cylinders", source: "Equipment components", typicalSize: "200-1000mm (8-40\") long, 75-200mm (3-8\") dia", weightRange: "10-150 kg (22-330 lbs)" },
  { item: "Bolt/Nut Hardware", source: "Equipment maintenance", typicalSize: "M12-M36 (1/2\"-1.5\") bolts, 20-100mm (3/4\"-4\") long", weightRange: "50-500g (0.1-1 lb)" },
  { item: "Crusher Wear Plates", source: "Equipment maintenance", typicalSize: "300-1200mm (12-48\") sections", weightRange: "15-200 kg (33-440 lbs)" },
  { item: "Chain Links", source: "Equipment/rigging", typicalSize: "50-200mm (2-8\") links, 8-25mm (5/16\"-1\") wire", weightRange: "0.5-5 kg (1-11 lbs)" },
  { item: "Blast Fragments", source: "Explosive steel casings", typicalSize: "50-300mm (2-12\") irregular pieces", weightRange: "0.5-15 kg (1-33 lbs)" },
];

const burdenMaterials = [
  { material: "E-Waste Shred", industry: "Recycling", tph: "50-200", bulkDensity: "50-80", moisture: "1-5%", roiDriver: "Precious metal recovery" },
  { material: "Battery Recycling", industry: "Energy Storage", tph: "50-200", bulkDensity: "60-90", moisture: "1-5%", roiDriver: "Critical material recovery" },
  { material: "Mill Scale", industry: "Steel", tph: "500-1500", bulkDensity: "200-250", moisture: "2-5%", roiDriver: "Iron recovery" },
  { material: "Lead Slag", industry: "Lead", tph: "200-600", bulkDensity: "180-220", moisture: "2-6%", roiDriver: "Lead recovery" },
  { material: "Scrap Metal Shred", industry: "Recycling", tph: "200-1000", bulkDensity: "40-60", moisture: "2-8%", roiDriver: "Product separation" },
  { material: "Solar Panel Recycling", industry: "Renewable", tph: "25-100", bulkDensity: "45-70", moisture: "2-8%", roiDriver: "Silicon/metal recovery" },
  { material: "Copper Slag", industry: "Copper", tph: "400-1000", bulkDensity: "140-170", moisture: "3-8%", roiDriver: "Copper recovery" },
  { material: "Foundry Sand", industry: "Foundry", tph: "400-1200", bulkDensity: "80-100", moisture: "3-8%", roiDriver: "Sand reclamation" },
  { material: "Zinc Calcine", industry: "Zinc", tph: "300-800", bulkDensity: "90-120", moisture: "3-8%", roiDriver: "Process protection" },
  { material: "Catalyst Recovery", industry: "Chemical", tph: "50-150", bulkDensity: "80-120", moisture: "3-10%", roiDriver: "Precious metal recovery" },
  { material: "Iron Ore Concentrate", industry: "Steel/Mining", tph: "2000-8000", bulkDensity: "140-160", moisture: "12-15%", roiDriver: "$500K+ mill protection" },
  { material: "Coal Run-of-Mine", industry: "Power/Steel", tph: "1500-5000", bulkDensity: "45-55", moisture: "12-15%", roiDriver: "$200K belt + downtime" },
  { material: "Bauxite Ore", industry: "Aluminum", tph: "1000-2500", bulkDensity: "75-95", moisture: "12-15%", roiDriver: "Refinery protection" },
  { material: "Magnetite Concentrate", industry: "Steel", tph: "1000-3000", bulkDensity: "150-180", moisture: "10-15%", roiDriver: "Pellet plant protection" },
  { material: "Coal ROM (Metallurgical)", industry: "Steel", tph: "1000-3000", bulkDensity: "50-60", moisture: "10-18%", roiDriver: "Coking plant protection" },
];

export function MagneticSeparatorCalculator() {
  const { toast } = useToast();
  
  const [inputs, setInputs] = useState<CalculatorInputs>({
    conveyor: {
      beltSpeed: 2.5,
      troughAngle: 20,
      beltWidth: 1200
    },
    burden: {
      feedDepth: 100,
      throughPut: 500,
      density: 1.8,
      waterContent: 8
    },
    shape: {
      width: 50,
      length: 100,
      height: 25
    },
    magnet: {
      gap: 150,
      coreBeltRatio: 0.7,
      position: 'overhead'
    },
    misc: {
      altitude: 0,
      ambientTemperature: 25
    }
  });

  const [results, setResults] = useState<EnhancedCalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetEfficiency, setTargetEfficiency] = useState(95);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [showMaterialTypes, setShowMaterialTypes] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const calculationResults = await performEnhancedCalculation(inputs, false);
      setResults(calculationResults);
      
      if (calculationResults.validation.severity === 'critical') {
        toast({
          title: "Critical Issues Detected",
          description: "Review validation errors before proceeding.",
          variant: "destructive",
        });
      } else if (calculationResults.validation.severity === 'warning') {
        toast({
          title: "Warnings Present",
          description: "Design is feasible but please review recommendations.",
        });
      } else {
        toast({
          title: "Design Validated",
          description: "Your magnetic separator design passes all checks.",
        });
      }
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "An error occurred. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleOptimize = async () => {
    setIsCalculating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const calculationResults = await performEnhancedCalculation(inputs, true, targetEfficiency / 100);
      setResults(calculationResults);
      
      if (calculationResults.optimization?.success) {
        const optimized = calculationResults.optimization.optimizedParameters;
        setInputs(prev => ({
          ...prev,
          magnet: {
            ...prev.magnet,
            gap: optimized.gap || prev.magnet.gap,
            coreBeltRatio: optimized.coreBeltRatio || prev.magnet.coreBeltRatio
          },
          conveyor: {
            ...prev.conveyor,
            beltSpeed: optimized.beltSpeed || prev.conveyor.beltSpeed
          },
          burden: {
            ...prev.burden,
            feedDepth: optimized.feedDepth || prev.burden.feedDepth
          }
        }));
        toast({
          title: `Optimization Successful!`,
          description: `Achieved ${(calculationResults.optimization.achievedEfficiency * 100).toFixed(1)}% efficiency`,
        });
      } else {
        toast({
          title: `Optimization Incomplete`,
          description: `Reached ${(calculationResults.optimization?.achievedEfficiency || 0 * 100).toFixed(1)}% efficiency.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Optimization Error",
        description: "Failed to perform optimization.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = () => {
    if (!results) return;

    const exportData = generateValidationExportData(results, results.validation);
    
    const csvData = [
      ['Parameter', 'Value', 'Unit', 'Status'],
      ['Validation Status', exportData.validation.status, '', ''],
      ['Severity Level', exportData.validation.severity, '', ''],
      ['Magnetic Field Strength (Tesla)', results.magneticFieldStrength.tesla.toString(), 'T', ''],
      ['Overall Removal Efficiency', results.trampMetalRemoval.overallEfficiency.toString(), '%', ''],
      ['Temperature Rise', results.thermalPerformance.temperatureRise.toString(), '°C', ''],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magnetic-separator-design-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Results exported to CSV.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-engineering-primary mb-2">
            Magnetic Separator Calculator
          </h1>
          <p className="text-lg text-muted-foreground">
            Optimize tramp metal removal efficiency and thermal performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compact Input Parameters */}
          <div className="space-y-4">
            <CompactCalculatorInputs
              inputs={inputs}
              setInputs={setInputs}
              selectedMaterialTypes={selectedMaterialTypes}
              setSelectedMaterialTypes={setSelectedMaterialTypes}
              showMaterialTypes={showMaterialTypes}
              setShowMaterialTypes={setShowMaterialTypes}
              materialTypes={materialTypes}
              burdenMaterials={burdenMaterials}
              results={results}
            />

            {/* Action Buttons - Compact */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button 
                    onClick={handleCalculate} 
                    disabled={isCalculating}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <Calculator className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={handleOptimize} 
                    disabled={isCalculating}
                    variant="secondary"
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Optimize
                  </Button>
                </div>

                {results && (
                  <Button 
                    onClick={handleExport} 
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Results
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Advanced Options Toggle */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Advanced Options</CardTitle>
                  <Switch 
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                </div>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs">Target Efficiency</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="80"
                          max="99"
                          value={targetEfficiency}
                          onChange={(e) => setTargetEfficiency(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="min-w-[3rem] text-xs">{targetEfficiency}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Altitude</Label>
                      <input
                        type="number"
                        value={inputs.misc.altitude}
                        onChange={(e) => setInputs(prev => ({
                          ...prev,
                          misc: { ...prev.misc, altitude: Number(e.target.value) }
                        }))}
                        className="w-full mt-1 p-1 text-xs border rounded"
                        placeholder="m"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Results Display */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            {results ? (
              <ResultsDisplay results={results} inputs={inputs} />
            ) : (
              <Card className="p-8 text-center">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Ready to Calculate</h3>
                <p className="text-muted-foreground">
                  Enter your parameters and click "Calculate" to see the results.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}