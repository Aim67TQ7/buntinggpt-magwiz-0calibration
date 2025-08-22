import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParameterSection, ParameterInput, ParameterSelect } from "./ParameterSection";
import { ResultsDisplay } from "./ResultsDisplay";
import { CalculatorInputs, EnhancedCalculationResults } from '@/types/calculator';
import { performEnhancedCalculation } from '@/utils/calculations';
import { generateValidationExportData } from '@/utils/validation';
import { Calculator, Settings, Thermometer, Globe, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Material database with bulk densities and magnetic properties
const MATERIAL_DATABASE: Record<string, { bulkDensity: number; magneticSusceptibility: number }> = {
  'Iron': { bulkDensity: 7.87, magneticSusceptibility: 2000 },
  'Steel (Mild)': { bulkDensity: 7.85, magneticSusceptibility: 1800 },
  'Copper': { bulkDensity: 8.96, magneticSusceptibility: -9.6 }, // Diamagnetic
  'Cobalt': { bulkDensity: 8.9, magneticSusceptibility: 1100 },
  'Nickel': { bulkDensity: 8.9, magneticSusceptibility: 600 },
  'Lead': { bulkDensity: 11.34, magneticSusceptibility: -27 }, // Diamagnetic
  'Aluminum': { bulkDensity: 2.70, magneticSusceptibility: 22 }, // Paramagnetic
  'Zinc': { bulkDensity: 7.13, magneticSusceptibility: -11 }, // Diamagnetic
  'Brass': { bulkDensity: 8.44, magneticSusceptibility: -9 }, // Diamagnetic
  'Shredded Steel Scrap': { bulkDensity: 0.9, magneticSusceptibility: 1500 },
  'High-Density Shredded Scrap': { bulkDensity: 2.0, magneticSusceptibility: 1600 },
  'Iron Powder': { bulkDensity: 2.38, magneticSusceptibility: 1200 },
  'Aluminum Powder': { bulkDensity: 1.0, magneticSusceptibility: 20 }, // Average of range
  'Aluminum Shavings': { bulkDensity: 0.175, magneticSusceptibility: 18 }, // Average of range
  'Custom': { bulkDensity: 2.5, magneticSusceptibility: 500 }
};

export function MagneticSeparatorCalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<CalculatorInputs>({
    geometric: {
      beltWidth: 1200,
      suspensionHeight: 300,
      elementLength: 1000,
      elementWidth: 800,
      elementHeight: 400,
      beltSpeed: 1.5,
      feedRate: 100,
      materialLayerThickness: 25
    },
    magnetic: {
      powerSourceType: 'electromagnetic-air',
      ampereTurns: 5000,
      numberOfTurns: 100,
      current: 50,
      magnetGap: 150,
      numberOfPoles: 4,
      poleConfiguration: 'alternating',
      magnetArrangement: 'cross-belt'
    },
    material: {
      materialType: 'Iron',
      bulkDensity: 7.87,
      waterContent: 8,
      trampMetalSize: { min: 5, max: 150 },
      magneticSusceptibility: 2000,
      particleDistribution: 'mixed',
      flowCharacteristics: 'free-flowing',
      contaminationLevel: 2
    },
    environmental: {
      operatingTemperature: 25,
      altitude: 500,
      dustExposure: 'medium',
      humidity: 65,
      vibrationLevel: 'low',
      airCurrents: 'none',
      materialPreConditioning: 'screening'
    }
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
            {/* Geometric Parameters */}
            <ParameterSection title="Geometric Parameters" icon={<Settings size={20} />}>
              <div className="grid grid-cols-3 gap-4">
                <ParameterInput
                  label="Belt Width"
                  value={inputs.geometric.beltWidth}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, beltWidth: Number(value) }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Belt Speed"
                  value={inputs.geometric.beltSpeed}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, beltSpeed: Number(value) }
                  }))}
                  unit="m/s"
                  step={0.1}
                />
                <ParameterInput
                  label="Feed Rate"
                  value={inputs.geometric.feedRate}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, feedRate: Number(value) }
                  }))}
                  unit="t/h"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <ParameterInput
                  label="Suspension Height"
                  value={inputs.geometric.suspensionHeight}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, suspensionHeight: Number(value) }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Material Layer Thickness"
                  value={inputs.geometric.materialLayerThickness}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, materialLayerThickness: Number(value) }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Element Length"
                  value={inputs.geometric.elementLength}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, elementLength: Number(value) }
                  }))}
                  unit="mm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ParameterInput
                  label="Element Width"
                  value={inputs.geometric.elementWidth}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    geometric: { ...prev.geometric, elementWidth: Number(value) }
                  }))}
                  unit="mm"
                />
                <ParameterInput
                  label="Element Height"
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
                  { value: 'electromagnetic-air', label: 'Electromagnetic (Air Cooled)' },
                  { value: 'electromagnetic-oil', label: 'Electromagnetic (Oil Cooled)' }
                ]}
              />
              <div className="grid grid-cols-3 gap-4">
                <ParameterSelect
                  label="Pole Configuration"
                  value={inputs.magnetic.poleConfiguration}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, poleConfiguration: value as any }
                  }))}
                  options={[
                    { value: 'alternating', label: 'Alternating Poles' },
                    { value: 'single', label: 'Single Polarity' },
                    { value: 'focused', label: 'Focused Field' }
                  ]}
                />
                <ParameterSelect
                  label="Magnet Arrangement"
                  value={inputs.magnetic.magnetArrangement}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, magnetArrangement: value as any }
                  }))}
                  options={[
                    { value: 'cross-belt', label: 'Cross-Belt' },
                    { value: 'drum', label: 'Drum Type' },
                    { value: 'linear', label: 'Linear' }
                  ]}
                />
                <ParameterInput
                  label="Number of Poles"
                  value={inputs.magnetic.numberOfPoles}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    magnetic: { ...prev.magnetic, numberOfPoles: Number(value) }
                  }))}
                  min={2}
                  max={20}
                />
              </div>
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
                <ParameterSelect
                  label="Material Type"
                  value={inputs.material.materialType}
                  onChange={(value) => {
                    const materialData = MATERIAL_DATABASE[value];
                    setInputs(prev => ({
                      ...prev,
                      material: { 
                        ...prev.material, 
                        materialType: value,
                        bulkDensity: materialData?.bulkDensity || prev.material.bulkDensity,
                        magneticSusceptibility: materialData?.magneticSusceptibility || prev.material.magneticSusceptibility
                      }
                    }));
                  }}
                  options={[
                    { value: 'Iron', label: 'Iron' },
                    { value: 'Steel (Mild)', label: 'Steel (Mild)' },
                    { value: 'Copper', label: 'Copper' },
                    { value: 'Cobalt', label: 'Cobalt' },
                    { value: 'Nickel', label: 'Nickel' },
                    { value: 'Lead', label: 'Lead' },
                    { value: 'Aluminum', label: 'Aluminum' },
                    { value: 'Zinc', label: 'Zinc' },
                    { value: 'Brass', label: 'Brass' },
                    { value: 'Shredded Steel Scrap', label: 'Shredded Steel Scrap' },
                    { value: 'High-Density Shredded Scrap', label: 'High-Density Shredded Scrap' },
                    { value: 'Iron Powder', label: 'Iron Powder' },
                    { value: 'Aluminum Powder', label: 'Aluminum Powder' },
                    { value: 'Aluminum Shavings', label: 'Aluminum Shavings' },
                    { value: 'Custom', label: 'Custom Material' }
                  ]}
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
                <ParameterSelect
                  label="Particle Distribution"
                  value={inputs.material.particleDistribution}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { ...prev.material, particleDistribution: value as any }
                  }))}
                  options={[
                    { value: 'fine', label: 'Fine Particles' },
                    { value: 'mixed', label: 'Mixed Distribution' },
                    { value: 'coarse', label: 'Coarse Particles' }
                  ]}
                />
                <ParameterSelect
                  label="Flow Characteristics"
                  value={inputs.material.flowCharacteristics}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { ...prev.material, flowCharacteristics: value as any }
                  }))}
                  options={[
                    { value: 'free-flowing', label: 'Free Flowing' },
                    { value: 'cohesive', label: 'Cohesive' },
                    { value: 'sticky', label: 'Sticky' }
                  ]}
                />
                <ParameterInput
                  label="Contamination Level"
                  value={inputs.material.contaminationLevel}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    material: { ...prev.material, contaminationLevel: Number(value) }
                  }))}
                  unit="%"
                  min={0}
                  max={50}
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
              <div className="grid grid-cols-3 gap-4">
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
                <ParameterSelect
                  label="Vibration Level"
                  value={inputs.environmental.vibrationLevel}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, vibrationLevel: value as any }
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
              <div className="grid grid-cols-2 gap-4">
                <ParameterSelect
                  label="Air Currents"
                  value={inputs.environmental.airCurrents}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, airCurrents: value as any }
                  }))}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'mild', label: 'Mild' },
                    { value: 'strong', label: 'Strong' }
                  ]}
                />
                <ParameterSelect
                  label="Material Pre-Conditioning"
                  value={inputs.environmental.materialPreConditioning}
                  onChange={(value) => setInputs(prev => ({
                    ...prev,
                    environmental: { ...prev.environmental, materialPreConditioning: value as any }
                  }))}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'screening', label: 'Screening' },
                    { value: 'drying', label: 'Drying' },
                    { value: 'both', label: 'Screening + Drying' }
                  ]}
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