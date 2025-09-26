import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ParameterInput, ParameterSelect } from "./ParameterSection";
import { CalculatorInputs } from '@/types/calculator';
import { Calculator, Settings, Thermometer, Package, Magnet, Box, ChevronDown, ChevronRight } from "lucide-react";

interface CompactCalculatorInputsProps {
  inputs: CalculatorInputs;
  setInputs: (updater: (prev: CalculatorInputs) => CalculatorInputs) => void;
  selectedMaterialTypes: string[];
  setSelectedMaterialTypes: (types: string[]) => void;
  showMaterialTypes: boolean;
  setShowMaterialTypes: (show: boolean) => void;
  materialTypes: Array<{
    item: string;
    source: string;
    typicalSize: string;
    weightRange: string;
  }>;
  burdenMaterials: Array<{
    material: string;
    industry: string;
    tph: string;
    bulkDensity: string;
    moisture: string;
    roiDriver: string;
  }>;
  results?: any;
}

export const CompactCalculatorInputs = ({
  inputs,
  setInputs,
  selectedMaterialTypes,
  setSelectedMaterialTypes,
  showMaterialTypes,
  setShowMaterialTypes,
  materialTypes,
  burdenMaterials,
  results
}: CompactCalculatorInputsProps) => {
  return (
    <div className="space-y-4">
      {/* Primary Parameters - Compact Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Process Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ParameterInput
              label="Throughput"
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
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <ParameterInput
              label="Water Content"
              value={inputs.burden.waterContent}
              onChange={(value) => setInputs(prev => ({
                ...prev,
                burden: { ...prev.burden, waterContent: Number(value) }
              }))}
              type="number"
              min={0}
              max={50}
              unit="%"
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
              max={5}
              step={0.1}
              unit="t/m³"
            />
          </div>
        </CardContent>
      </Card>

      {/* Magnet & Shape Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Magnet className="w-5 h-5" />
            Magnet & Shape
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Magnet Parameters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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
          </div>

          {/* Shape Parameters */}
          <div className="border-t border-border/50 pt-3">
            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Box className="w-4 h-4" />
              Shape Dimensions
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <ParameterInput
                label="Width"
                value={inputs.shape.width}
                onChange={(value) => setInputs(prev => ({
                  ...prev,
                  shape: { ...prev.shape, width: Number(value) }
                }))}
                type="number"
                min={100}
                max={5000}
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
                min={100}
                max={10000}
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
                min={100}
                max={3000}
                unit="mm"
              />
            </div>
            
            {/* Quick Analysis Display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-muted/30 rounded text-sm">
                <div className="font-medium">Volume</div>
                <div className="text-lg font-semibold">
                  {((inputs.shape.width / 1000) * (inputs.shape.length / 1000) * (inputs.shape.height / 1000)).toFixed(3)} m³
                </div>
              </div>
              
              {selectedMaterialTypes.length > 0 && (
                <div className="p-2 bg-muted/30 rounded text-sm">
                  <div className="font-medium">Materials</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedMaterialTypes.length} type{selectedMaterialTypes.length !== 1 ? 's' : ''} selected
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Material Types - Compact Toggle */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <Collapsible open={showMaterialTypes} onOpenChange={setShowMaterialTypes}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between h-8">
                  <span className="text-sm">Material Types ({selectedMaterialTypes.length} selected)</span>
                  {showMaterialTypes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                  <div className="grid grid-cols-1 gap-1">
                    {materialTypes.slice(0, 15).map((material) => (
                      <label key={material.item} className="flex items-center space-x-2 text-xs p-1 hover:bg-muted/50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMaterialTypes.includes(material.item)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMaterialTypes([...selectedMaterialTypes, material.item]);
                            } else {
                              setSelectedMaterialTypes(selectedMaterialTypes.filter(item => item !== material.item));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{material.item}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {materialTypes.length > 15 && (
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      +{materialTypes.length - 15} more available
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Removal Efficiency Display */}
          {results && selectedMaterialTypes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="font-medium text-sm mb-2">Removal Efficiency</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-medium">Small</div>
                  <div className="text-lg font-semibold text-primary">
                    {results.trampMetalRemoval.fineParticles.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-medium">Medium</div>
                  <div className="text-lg font-semibold text-primary">
                    {results.trampMetalRemoval.mediumParticles.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-medium">Large</div>
                  <div className="text-lg font-semibold text-primary">
                    {results.trampMetalRemoval.largeParticles.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};