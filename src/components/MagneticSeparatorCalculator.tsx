import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ParameterSection, ParameterInput, ParameterSelect } from "./ParameterSection";
import { ResultsDisplay } from "./ResultsDisplay";
import { CalculatorInputs, EnhancedCalculationResults } from '@/types/calculator';
import { performEnhancedCalculation } from '@/utils/calculations';
import { generateValidationExportData } from '@/utils/validation';
import { Calculator, Settings, Thermometer, Package, Magnet, Box, Download, Atom, Cloud, Zap, ChevronDown, ChevronRight } from "lucide-react";
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
  { item: "Conveyor Components", source: "Idler parts, frames", typicalSize: "100-500mm (4-20\") sections", weightRange: "2-50 kg (4-110 lbs)" },
  { item: "Crusher Hammers", source: "Impact crushers", typicalSize: "200-500mm (8-20\") long", weightRange: "8-40 kg (18-88 lbs)" },
  { item: "Manholes Covers", source: "Infrastructure", typicalSize: "600-900mm (24-36\") diameter", weightRange: "50-150 kg (110-330 lbs)" },
  { item: "Bucket Teeth", source: "Loader/excavator", typicalSize: "100-300mm (4-12\") long", weightRange: "2-15 kg (4-33 lbs)" },
  { item: "Shovel Teeth", source: "Loading equipment", typicalSize: "150-400mm (6-16\") long", weightRange: "5-25 kg (11-55 lbs)" },
  { item: "Liner Bolts", source: "Mill/crusher liners", typicalSize: "M20-M48 (3/4\"-2\") dia, 100-400mm (4-16\") long", weightRange: "0.5-5 kg (1-11 lbs)" },
  { item: "Track Shoes", source: "Mobile equipment", typicalSize: "300-600mm (12-24\") sections", weightRange: "20-100 kg (44-220 lbs)" },
  { item: "Furnace Tools", source: "Operations equipment", typicalSize: "500-2000mm (20-80\") long", weightRange: "5-100 kg (11-220 lbs)" },
  { item: "Staples/Clips", source: "Packaging materials", typicalSize: "6-50mm (1/4\"-2\") long", weightRange: "1-10g (0.04-0.35 oz)" },
  { item: "Post-Tension Cables", source: "Prestressed concrete", typicalSize: "10-50m (30-165 ft) long, 12-25mm (1/2\"-1\") dia", weightRange: "5-80 kg (11-175 lbs)" },
  { item: "Crusher Wear Parts", source: "Primary/secondary crushers", typicalSize: "200-800mm (8-32\") pieces", weightRange: "10-200 kg (22-440 lbs)" },
  { item: "Wire Mesh", source: "Reinforcing material", typicalSize: "2-6m (6-20 ft) sheets, 4-8mm (5/32\"-5/16\") wire", weightRange: "5-40 kg (11-88 lbs)" },
  { item: "Mill Rolls", source: "Rolling operations", typicalSize: "1-3m (3-10 ft) long, 200-800mm (8-32\") dia", weightRange: "100-2000 kg (220-4400 lbs)" },
  { item: "Band Saw Blades", source: "Sawmill operations", typicalSize: "3-10m (10-33 ft) long, 1-3mm (0.04-0.12\") thick", weightRange: "0.5-5 kg (1-11 lbs)" },
  { item: "Roof Bolts", source: "Underground support", typicalSize: "1.2-2.4m (4-8 ft) long, 19-25mm (3/4\"-1\") dia", weightRange: "2-8 kg (4-18 lbs)" },
  { item: "Pipe Sections", source: "Utilities", typicalSize: "1-6m (3-20 ft) long, 100-600mm (4-24\") dia", weightRange: "20-300 kg (44-660 lbs)" },
  { item: "Engine Components", source: "Vehicle dismantling", typicalSize: "200-800mm (8-32\") blocks", weightRange: "20-200 kg (44-440 lbs)" },
  { item: "Body Panels", source: "Vehicle shredding", typicalSize: "300-2000mm (12-80\") sections", weightRange: "5-50 kg (11-110 lbs)" },
  { item: "Appliance Parts", source: "White goods", typicalSize: "100-1000mm (4-40\") components", weightRange: "1-50 kg (2-110 lbs)" }
];

export function MagneticSeparatorCalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<CalculatorInputs>({
    conveyor: {
      beltSpeed: 2.5,
      troughAngle: 20,
      beltWidth: 1200,
    },
    burden: {
      feedDepth: 100,
      throughPut: 100,
      density: 2.5,
      waterContent: 8,
    },
    shape: {
      width: 15,
      length: 25,
      height: 8,
    },
    magnet: {
      gap: 150,
      coreBeltRatio: 0.6,
      position: 'overhead',
    },
    misc: {
      altitude: 1000,
      ambientTemperature: 25,
    },
    advanced: {
      materialProperties: {
        magneticSusceptibility: 0.003,
        particleDistribution: 'uniform',
        bulkDensity: 1.6
      },
      environmental: {
        humidity: 50,
        dustExposure: 'medium',
        vibrationLevel: 0.5
      },
      magneticSystem: {
        ampereTurns: 5000,
        poleConfiguration: 'double',
        magneticArrangement: 'overhead'
      }
    }
  });

  const [results, setResults] = useState<EnhancedCalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [targetEfficiency, setTargetEfficiency] = useState(95);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMaterialTypes, setShowMaterialTypes] = useState(false);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);

  const handleCalculate = async () => {
    console.log('handleCalculate started with inputs:', inputs);
    setIsCalculating(true);
    try {
      // Simulate calculation time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('About to call performEnhancedCalculation');
      const calculationResults = await performEnhancedCalculation(inputs, false);
      console.log('Calculation results received:', calculationResults);
      setResults(calculationResults);
      
      // Show appropriate toast based on validation results
      if (calculationResults.validation.severity === 'critical') {
        toast({
          title: "Calculation Complete - Critical Issues Detected",
          description: "Review validation errors before proceeding with this design.",
          variant: "destructive",
        });
      } else if (calculationResults.validation.severity === 'warning') {
        toast({
          title: "Calculation Complete - Warnings Present",
          description: "Design is feasible but please review recommendations.",
        });
      } else {
        toast({
          title: "Calculation Complete - Design Validated",
          description: "Your magnetic separator design passes all safety checks.",
        });
      }
    } catch (error) {
      console.error('Error in handleCalculate:', error);
      toast({
        title: "Calculation Error",
        description: "An error occurred during calculation. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleOptimize = async () => {
    console.log('handleOptimize started with inputs:', inputs, 'target:', targetEfficiency);
    setIsCalculating(true);
    
    try {
      // Simulate calculation time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('About to call performEnhancedCalculation with optimization');
      const calculationResults = await performEnhancedCalculation(inputs, true, targetEfficiency / 100);
      console.log('Optimization results received:', calculationResults);
      setResults(calculationResults);
      
      if (calculationResults.optimization?.success) {
        // Apply optimized parameters to inputs
        const optimized = calculationResults.optimization.optimizedParameters;
        console.log('Applying optimized parameters:', optimized);
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
          description: `Reached ${(calculationResults.optimization?.achievedEfficiency || 0 * 100).toFixed(1)}% efficiency. Target ${targetEfficiency}% may not be achievable.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleOptimize:', error);
      toast({
        title: "Optimization Error",
        description: "Failed to perform optimization. Please check your inputs.",
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
      ['Equipment Compliance', exportData.validation.equipmentCompliance, '', ''],
      ['Error Count', exportData.validation.errorCount.toString(), '', ''],
      ['Warning Count', exportData.validation.warningCount.toString(), '', ''],
      [''],
      ['CALCULATION RESULTS'],
      ['Magnetic Field Strength (Tesla)', results.magneticFieldStrength.tesla.toString(), 'T', exportData.safetyChecks.magneticFieldCheck ? 'SAFE' : 'UNSAFE'],
      ['Magnetic Field Strength (Gauss)', results.magneticFieldStrength.gauss.toString(), 'G', ''],
      ['Penetration Depth', results.magneticFieldStrength.penetrationDepth.toString(), 'mm', ''],
      ['Overall Removal Efficiency', results.trampMetalRemoval.overallEfficiency.toString(), '%', exportData.safetyChecks.efficiencyCheck ? 'SAFE' : 'UNSAFE'],
      ['Fine Particles Removal', results.trampMetalRemoval.fineParticles.toString(), '%', ''],
      ['Medium Particles Removal', results.trampMetalRemoval.mediumParticles.toString(), '%', ''],
      ['Large Particles Removal', results.trampMetalRemoval.largeParticles.toString(), '%', ''],
      ['Total Power Loss', results.thermalPerformance.totalPowerLoss.toString(), 'W', ''],
      ['Temperature Rise', results.thermalPerformance.temperatureRise.toString(), '°C', exportData.safetyChecks.temperatureCheck ? 'SAFE' : 'UNSAFE'],
      ['Cooling Efficiency', results.thermalPerformance.coolingEfficiency.toString(), '', ''],
      ['Recommended Model', results.recommendedModel.model, '', ''],
      ['Model Score', results.recommendedModel.score.toString(), '', ''],
      [''],
      ['VALIDATION RECOMMENDATIONS'],
      ...exportData.recommendations.map((rec, index) => [`Recommendation ${index + 1}`, rec, '', '']),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magnetic-separator-design-validated-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your validated calculation results have been exported to CSV.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-engineering-primary mb-4">
            Magnetic Separator Design Calculator
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive overband magnetic separator analysis tool for optimizing 
            tramp metal removal efficiency and thermal performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Parameters */}
          <div className="space-y-6">
            {/* Conveyor Parameters */}
            <ParameterSection 
              title="Conveyor" 
              icon={<Settings className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ParameterInput
                  label="Belt Speed"
                  value={inputs.conveyor.beltSpeed}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    conveyor: { ...prev.conveyor, beltSpeed: Number(value) }
                  }))}
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.1}
                  unit="m/s"
                />
                <ParameterInput
                  label="Trough Angle"
                  value={inputs.conveyor.troughAngle}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    conveyor: { ...prev.conveyor, troughAngle: Number(value) }
                  }))}
                  type="number"
                  min={0}
                  max={45}
                  unit="°"
                />
                <ParameterInput
                  label="Belt Width"
                  value={inputs.conveyor.beltWidth}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    conveyor: { ...prev.conveyor, beltWidth: Number(value) }
                  }))}
                  type="number"
                  min={450}
                  max={2400}
                  unit="mm"
                />
              </div>
            </ParameterSection>

            {/* Burden Parameters */}
            <ParameterSection 
              title="Burden" 
              icon={<Package className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ParameterInput
                  label="Feed Depth"
                  value={inputs.burden.feedDepth}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    burden: { ...prev.burden, feedDepth: Number(value) }
                  }))}
                  type="number"
                  min={10}
                  max={500}
                  unit="mm"
                />
                <ParameterInput
                  label="Through Put"
                  value={inputs.burden.throughPut}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    burden: { ...prev.burden, throughPut: Number(value) }
                  }))}
                  type="number"
                  min={10}
                  max={1000}
                  unit="t/h"
                />
                <ParameterInput
                  label="Density"
                  value={inputs.burden.density}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    burden: { ...prev.burden, density: Number(value) }
                  }))}
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.1}
                  unit="t/m³"
                />
                <ParameterInput
                  label="Water Content"
                  value={inputs.burden.waterContent}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    burden: { ...prev.burden, waterContent: Number(value) }
                  }))}
                  type="number"
                  min={0}
                  max={25}
                  step={0.1}
                  unit="%"
                />
              </div>
            </ParameterSection>

            {/* Shape Parameters */}
            <ParameterSection 
              title="Shape" 
              icon={<Box className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ParameterInput
                  label="Width"
                  value={inputs.shape.width}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    shape: { ...prev.shape, width: Number(value) }
                  }))}
                  type="number"
                  min={1}
                  max={100}
                  unit="mm"
                />
                <ParameterInput
                  label="Length"
                  value={inputs.shape.length}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    shape: { ...prev.shape, length: Number(value) }
                  }))}
                  type="number"
                  min={1}
                  max={100}
                  unit="mm"
                />
                <ParameterInput
                  label="Height"
                  value={inputs.shape.height}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    shape: { ...prev.shape, height: Number(value) }
                  }))}
                  type="number"
                  min={1}
                  max={50}
                  unit="mm"
                />
              </div>
              
              {/* Material Types Collapsible */}
              <div className="mt-4">
                <Collapsible open={showMaterialTypes} onOpenChange={setShowMaterialTypes}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Material Types (affects magnetic strength calculation)</span>
                      {showMaterialTypes ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Select material types present in feed</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                          {materialTypes.map((material) => (
                            <label key={material.item} className="flex items-center space-x-2 text-xs p-2 hover:bg-muted/50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedMaterialTypes.includes(material.item)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMaterialTypes(prev => [...prev, material.item]);
                                  } else {
                                    setSelectedMaterialTypes(prev => prev.filter(item => item !== material.item));
                                  }
                                }}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{material.item}</div>
                                <div className="text-muted-foreground">{material.source} • {material.typicalSize} • {material.weightRange}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          Selected: {selectedMaterialTypes.length} material type{selectedMaterialTypes.length !== 1 ? 's' : ''}
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ParameterSection>

            {/* Magnet Parameters */}
            <ParameterSection 
              title="Magnet" 
              icon={<Magnet className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ParameterInput
                  label="Gap"
                  value={inputs.magnet.gap}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnet: { ...prev.magnet, gap: Number(value) }
                  }))}
                  type="number"
                  min={50}
                  max={500}
                  unit="mm"
                />
                <ParameterInput
                  label="Core:Belt Ratio"
                  value={inputs.magnet.coreBeltRatio}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnet: { ...prev.magnet, coreBeltRatio: Number(value) }
                  }))}
                  type="number"
                  min={0.1}
                  max={0.9}
                  step={0.1}
                />
                <ParameterSelect
                  label="Position"
                  value={inputs.magnet.position}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnet: { ...prev.magnet, position: value as 'overhead' | 'crossbelt' | 'inline' | 'drum' }
                  }))}
                  options={[
                    { value: 'overhead', label: 'Overhead' },
                    { value: 'crossbelt', label: 'Crossbelt' },
                    { value: 'inline', label: 'Inline' },
                    { value: 'drum', label: 'Drum' }
                  ]}
                />
              </div>
            </ParameterSection>

            {/* Misc Parameters */}
            <ParameterSection 
              title="Misc" 
              icon={<Thermometer className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ParameterInput
                  label="Altitude"
                  value={inputs.misc.altitude}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    misc: { ...prev.misc, altitude: Number(value) }
                  }))}
                  type="number"
                  min={0}
                  max={4000}
                  unit="m"
                />
                <ParameterInput
                  label="Ambient Temperature"
                  value={inputs.misc.ambientTemperature}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    misc: { ...prev.misc, ambientTemperature: Number(value) }
                  }))}
                  type="number"
                  min={-20}
                  max={60}
                  unit="°C"
                />
              </div>
            </ParameterSection>

            {/* Action Buttons */}
            <div className="space-y-4">
              <ParameterInput
                label="Target Efficiency"
                value={targetEfficiency}
                onChange={(value) => setTargetEfficiency(Number(value))}
                type="number"
                min={50}
                max={99}
                step={0.1}
                unit="%"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full h-12 text-lg font-semibold"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  {isCalculating ? "Calculating..." : "Calculate Design"}
                </Button>
                
                <Button 
                  onClick={handleOptimize}
                  disabled={isCalculating}
                  variant="outline"
                  className="w-full h-12 text-lg font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isCalculating ? "Optimizing..." : `Optimize for ${targetEfficiency}% Efficiency`}
                </Button>
              </div>
              
              {results && (
                <Button 
                  onClick={handleExport}
                  variant="secondary"
                  className="w-full h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export CSV
                </Button>
              )}

              {/* Debug Testing Buttons */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">Debug: Test Dramatic Changes</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button 
                    onClick={() => {
                      setInputs(prev => ({
                        ...prev,
                        magnet: { ...prev.magnet, gap: 300 } // Double the gap
                      }));
                      toast({ title: "Gap doubled to 300mm", description: "Run calculation to see the difference" });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Test: Double Gap
                  </Button>
                  <Button 
                    onClick={() => {
                      setInputs(prev => ({
                        ...prev,
                        magnet: { ...prev.magnet, coreBeltRatio: 1.2 } // Double the ratio
                      }));
                      toast({ title: "Core:Belt ratio set to 1.2", description: "Run calculation to see the difference" });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Test: High Ratio
                  </Button>
                  <Button 
                    onClick={() => {
                      setInputs(prev => ({
                        ...prev,
                        conveyor: { ...prev.conveyor, beltWidth: 600 } // Half the width
                      }));
                      toast({ title: "Belt width halved to 600mm", description: "Run calculation to see the difference" });
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Test: Half Width
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-advanced"
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
                <Label htmlFor="show-advanced">Show Advanced Parameters</Label>
              </div>
            </div>
            
            {/* Advanced Parameters */}
            {showAdvanced && inputs.advanced && (
              <>
                <ParameterSection title="Material Properties" icon={<Atom className="h-5 w-5" />}>
                  <ParameterInput
                    label="Magnetic Susceptibility"
                    value={inputs.advanced.materialProperties.magneticSusceptibility}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        materialProperties: {
                          ...prev.advanced!.materialProperties,
                          magneticSusceptibility: Number(value)
                        }
                      }
                    }))}
                    type="number"
                    step={0.001}
                  />
                  
                  <ParameterSelect
                    label="Particle Distribution"
                    value={inputs.advanced.materialProperties.particleDistribution}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        materialProperties: {
                          ...prev.advanced!.materialProperties,
                          particleDistribution: value as 'uniform' | 'gaussian' | 'bimodal'
                        }
                      }
                    }))}
                    options={[
                      { value: 'uniform', label: 'Uniform' },
                      { value: 'gaussian', label: 'Gaussian' },
                      { value: 'bimodal', label: 'Bimodal' }
                    ]}
                  />
                  
                  <ParameterInput
                    label="Bulk Density"
                    value={inputs.advanced.materialProperties.bulkDensity}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        materialProperties: {
                          ...prev.advanced!.materialProperties,
                          bulkDensity: Number(value)
                        }
                      }
                    }))}
                    type="number"
                    step={0.1}
                    unit="t/m³"
                  />
                </ParameterSection>
                
                <ParameterSection title="Environmental" icon={<Cloud className="h-5 w-5" />}>
                  <ParameterInput
                    label="Humidity"
                    value={inputs.advanced.environmental.humidity}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        environmental: {
                          ...prev.advanced!.environmental,
                          humidity: Number(value)
                        }
                      }
                    }))}
                    type="number"
                    min={0}
                    max={100}
                    unit="%"
                  />
                  
                  <ParameterSelect
                    label="Dust Exposure"
                    value={inputs.advanced.environmental.dustExposure}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        environmental: {
                          ...prev.advanced!.environmental,
                          dustExposure: value as 'low' | 'medium' | 'high'
                        }
                      }
                    }))}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                  />
                  
                  <ParameterInput
                    label="Vibration Level"
                    value={inputs.advanced.environmental.vibrationLevel}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        environmental: {
                          ...prev.advanced!.environmental,
                          vibrationLevel: Number(value)
                        }
                      }
                    }))}
                    type="number"
                    step={0.1}
                    unit="g"
                  />
                </ParameterSection>
                
                <ParameterSection title="Magnetic System" icon={<Zap className="h-5 w-5" />}>
                  <ParameterInput
                    label="Ampere Turns"
                    value={inputs.advanced.magneticSystem.ampereTurns}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        magneticSystem: {
                          ...prev.advanced!.magneticSystem,
                          ampereTurns: Number(value)
                        }
                      }
                    }))}
                    type="number"
                    unit="AT"
                  />
                  
                  <ParameterSelect
                    label="Pole Configuration"
                    value={inputs.advanced.magneticSystem.poleConfiguration}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        magneticSystem: {
                          ...prev.advanced!.magneticSystem,
                          poleConfiguration: value as 'single' | 'double' | 'multi'
                        }
                      }
                    }))}
                    options={[
                      { value: 'single', label: 'Single Pole' },
                      { value: 'double', label: 'Double Pole' },
                      { value: 'multi', label: 'Multi Pole' }
                    ]}
                  />
                  
                  <ParameterSelect
                    label="Magnetic Arrangement"
                    value={inputs.advanced.magneticSystem.magneticArrangement}
                    onChange={(value) => setInputs(prev => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced!,
                        magneticSystem: {
                          ...prev.advanced!.magneticSystem,
                          magneticArrangement: value as 'inline' | 'crossbelt' | 'overhead'
                        }
                      }
                    }))}
                    options={[
                      { value: 'inline', label: 'In-line' },
                      { value: 'crossbelt', label: 'Cross-belt' },
                      { value: 'overhead', label: 'Overhead' }
                    ]}
                  />
                </ParameterSection>
              </>
            )}
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
                  Enter your parameters and click "Calculate Design" to see the results.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}