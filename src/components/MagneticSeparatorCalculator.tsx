import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParameterSection, ParameterInput, ParameterSelect } from "./ParameterSection";
import { ResultsDisplay } from "./ResultsDisplay";
import { CalculatorInputs, CalculationResults } from "@/types/calculator";
import { performCompleteCalculation } from "@/utils/calculations";
import { Calculator, Settings, Thermometer, Globe, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MagneticSeparatorCalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<CalculatorInputs>({
    geometric: {
      beltWidth: 1200,
      suspensionHeight: 300,
      elementLength: 1000,
      elementWidth: 800,
      elementHeight: 400
    },
    magnetic: {
      powerSourceType: 'electromagnetic-air',
      ampereTurns: 5000,
      numberOfTurns: 100,
      current: 50,
      magnetGap: 150
    },
    material: {
      materialType: 'Iron Ore',
      bulkDensity: 2.5,
      waterContent: 8,
      trampMetalSize: { min: 5, max: 150 },
      magneticSusceptibility: 500,
      particleDistribution: 'Normal'
    },
    environmental: {
      operatingTemperature: 25,
      altitude: 500,
      dustExposure: 'medium',
      humidity: 60,
      atexRating: 'Zone 2'
    }
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Simulate calculation time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      const calculationResults = performCompleteCalculation(inputs);
      setResults(calculationResults);
      toast({
        title: "Calculation Complete",
        description: "Magnetic separator analysis has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "An error occurred during calculation. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = () => {
    if (!results) return;
    
    // Generate CSV content
    const csvContent = `
Magnetic Separator Design Calculator Results
Generated: ${new Date().toLocaleString()}

Magnetic Field Analysis:
Tesla Strength,${results.magneticFieldStrength.tesla}
Gauss Strength,${results.magneticFieldStrength.gauss}
Penetration Depth (mm),${results.magneticFieldStrength.penetrationDepth}

Removal Efficiency:
Overall Efficiency (%),${results.trampMetalRemoval.overallEfficiency}
Fine Particles (%),${results.trampMetalRemoval.fineParticles}
Medium Particles (%),${results.trampMetalRemoval.mediumParticles}
Large Particles (%),${results.trampMetalRemoval.largeParticles}

Thermal Performance:
Total Power Loss (W),${results.thermalPerformance.totalPowerLoss}
Temperature Rise (°C),${results.thermalPerformance.temperatureRise}
Cooling Efficiency,${results.thermalPerformance.coolingEfficiency}

Recommended Model:
Model,${results.recommendedModel.model}
Score,${results.recommendedModel.score}
    `.trim();

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `separator-calculation-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Calculation results have been exported to CSV.",
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
            {/* Geometric Parameters */}
            <ParameterSection title="Geometric Parameters" icon={<Settings size={20} />}>
              <div className="grid grid-cols-2 gap-4">
                <ParameterInput
                  label="Belt Width"
                  value={inputs.geometric.beltWidth}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, beltWidth: Number(value) }
                  }))}
                  min={450}
                  max={2400}
                  unit="mm"
                />
                <ParameterInput
                  label="Suspension Height"
                  value={inputs.geometric.suspensionHeight}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, suspensionHeight: Number(value) }
                  }))}
                  min={0}
                  max={800}
                  unit="mm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <ParameterInput
                  label="Length"
                  value={inputs.geometric.elementLength}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, elementLength: Number(value) }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Width"
                  value={inputs.geometric.elementWidth}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, elementWidth: Number(value) }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Height"
                  value={inputs.geometric.elementHeight}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, elementHeight: Number(value) }
                  }))}
                  unit="mm"
                />
              </div>
            </ParameterSection>

            {/* Magnetic System Inputs */}
            <ParameterSection title="Magnetic System" icon={<Calculator size={20} />}>
              <ParameterSelect
                label="Power Source Type"
                value={inputs.magnetic.powerSourceType}
                onChange={(value) => setInputs(prev => ({
                  ...prev,
                  magnetic: { ...prev.magnetic, powerSourceType: value as any }
                }))}
                options={[
                  { value: 'permanent', label: 'Permanent Magnet' },
                  { value: 'electromagnetic-air', label: 'Electromagnetic (Air Cooled)' },
                  { value: 'electromagnetic-oil', label: 'Electromagnetic (Oil Cooled)' }
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <ParameterInput
                  label="Ampere-turns (NI)"
                  value={inputs.magnetic.ampereTurns}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, ampereTurns: Number(value) }
                  }))}
                />
                <ParameterInput
                  label="Number of Turns"
                  value={inputs.magnetic.numberOfTurns}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, numberOfTurns: Number(value) }
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ParameterInput
                  label="Current"
                  value={inputs.magnetic.current}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, current: Number(value) }
                  }))}
                  unit="A"
                />
                <ParameterInput
                  label="Magnet Gap"
                  value={inputs.magnetic.magnetGap}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, magnetGap: Number(value) }
                  }))}
                  unit="mm"
                />
              </div>
            </ParameterSection>

            {/* Material Parameters */}
            <ParameterSection title="Material Properties" icon={<Globe size={20} />}>
              <div className="grid grid-cols-2 gap-4">
                <ParameterInput
                  label="Material Type"
                  value={inputs.material.materialType}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { ...prev.material, materialType: value }
                  }))}
                  type="text"
                />
                <ParameterInput
                  label="Bulk Density"
                  value={inputs.material.bulkDensity}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { ...prev.material, bulkDensity: Number(value) }
                  }))}
                  unit="t/m³"
                  step={0.1}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <ParameterInput
                  label="Water Content"
                  value={inputs.material.waterContent}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { ...prev.material, waterContent: Number(value) }
                  }))}
                  unit="%"
                  min={0}
                  max={100}
                />
                <ParameterInput
                  label="Min Tramp Size"
                  value={inputs.material.trampMetalSize.min}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { 
                      ...prev.material, 
                      trampMetalSize: { ...prev.material.trampMetalSize, min: Number(value) }
                    }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Max Tramp Size"
                  value={inputs.material.trampMetalSize.max}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { 
                      ...prev.material, 
                      trampMetalSize: { ...prev.material.trampMetalSize, max: Number(value) }
                    }
                  }))}
                  unit="mm"
                />
              </div>
            </ParameterSection>

            {/* Environmental Constraints */}
            <ParameterSection title="Environmental Conditions" icon={<Thermometer size={20} />}>
              <div className="grid grid-cols-2 gap-4">
                <ParameterInput
                  label="Operating Temperature"
                  value={inputs.environmental.operatingTemperature}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, operatingTemperature: Number(value) }
                  }))}
                  unit="°C"
                />
                <ParameterInput
                  label="Altitude"
                  value={inputs.environmental.altitude}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, altitude: Number(value) }
                  }))}
                  unit="m"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ParameterSelect
                  label="Dust Exposure"
                  value={inputs.environmental.dustExposure}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, dustExposure: value as any }
                  }))}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]}
                />
                <ParameterInput
                  label="Humidity"
                  value={inputs.environmental.humidity}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, humidity: Number(value) }
                  }))}
                  unit="%"
                  min={0}
                  max={100}
                />
              </div>
            </ParameterSection>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex-1 bg-gradient-to-r from-engineering-primary to-engineering-primary-light hover:from-engineering-primary-light hover:to-engineering-primary text-white"
              >
                {isCalculating ? "Calculating..." : "Calculate Design"}
              </Button>
              {results && (
                <Button 
                  onClick={handleExport}
                  variant="outline"
                  className="border-engineering-primary text-engineering-primary hover:bg-engineering-primary hover:text-white"
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div>
            {results ? (
              <ResultsDisplay results={results} />
            ) : (
              <Card className="shadow-card h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Calculator size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Enter parameters and click "Calculate Design" to see results</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}