import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParameterSection, ParameterInput, ParameterSelect } from "./ParameterSection";
import { ResultsDisplay } from "./ResultsDisplay";
import { CalculatorInputs, EnhancedCalculationResults } from '@/types/calculator';
import { performEnhancedCalculation } from '@/utils/calculations';
import { generateValidationExportData } from '@/utils/validation';
import { Calculator, Settings, Thermometer, Package, Magnet, Box, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      position: 300,
    },
    misc: {
      altitude: 1000,
      ambientTemperature: 25,
    },
  });

  const [results, setResults] = useState<EnhancedCalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Simulate calculation time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      const calculationResults = performEnhancedCalculation(inputs);
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
                <ParameterInput
                  label="Position"
                  value={inputs.magnet.position}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnet: { ...prev.magnet, position: Number(value) }
                  }))}
                  type="number"
                  min={0}
                  max={1000}
                  unit="mm"
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
            <div className="flex gap-4">
              <Button 
                onClick={handleCalculate} 
                disabled={isCalculating}
                className="flex-1 h-12 text-lg font-semibold"
              >
                <Calculator className="w-5 h-5 mr-2" />
                {isCalculating ? "Calculating..." : "Calculate Design"}
              </Button>
              
              {results && (
                <Button 
                  onClick={handleExport}
                  variant="outline"
                  className="h-12 px-6"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            {results ? (
              <ResultsDisplay results={results} />
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