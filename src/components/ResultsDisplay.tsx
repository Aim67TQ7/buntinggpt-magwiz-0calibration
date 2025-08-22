import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalculationResults } from "@/types/calculator";
import { Zap, Thermometer, Target, Award } from "lucide-react";

interface ResultsDisplayProps {
  results: CalculationResults;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Magnetic Field Strength */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-engineering-secondary to-engineering-accent text-white">
          <CardTitle className="flex items-center gap-2">
            <Zap size={20} />
            Magnetic Field Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-engineering-primary">
                {results.magneticFieldStrength.tesla}
              </div>
              <div className="text-sm text-muted-foreground">Tesla</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-engineering-secondary">
                {results.magneticFieldStrength.gauss}
              </div>
              <div className="text-sm text-muted-foreground">Gauss</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-engineering-accent">
                {results.magneticFieldStrength.penetrationDepth}
              </div>
              <div className="text-sm text-muted-foreground">Penetration (mm)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tramp Metal Removal Efficiency */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-engineering-success to-engineering-accent text-white">
          <CardTitle className="flex items-center gap-2">
            <Target size={20} />
            Removal Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Efficiency</span>
              <Badge variant="secondary" className="bg-engineering-success text-white">
                {results.trampMetalRemoval.overallEfficiency}%
              </Badge>
            </div>
            <Progress 
              value={results.trampMetalRemoval.overallEfficiency} 
              className="h-3"
            />
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-engineering-primary">
                  {results.trampMetalRemoval.fineParticles}%
                </div>
                <div className="text-sm text-muted-foreground">Fine Particles</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-engineering-secondary">
                  {results.trampMetalRemoval.mediumParticles}%
                </div>
                <div className="text-sm text-muted-foreground">Medium Particles</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-engineering-accent">
                  {results.trampMetalRemoval.largeParticles}%
                </div>
                <div className="text-sm text-muted-foreground">Large Particles</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thermal Performance */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-engineering-warning to-engineering-error text-white">
          <CardTitle className="flex items-center gap-2">
            <Thermometer size={20} />
            Thermal Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-engineering-warning">
                {results.thermalPerformance.totalPowerLoss} W
              </div>
              <div className="text-sm text-muted-foreground">Total Power Loss</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-engineering-error">
                {results.thermalPerformance.temperatureRise}°C
              </div>
              <div className="text-sm text-muted-foreground">Temperature Rise</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-engineering-success">
                {(results.thermalPerformance.coolingEfficiency * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Cooling Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Recommendation */}
      <Card className="shadow-elevation border-engineering-primary">
        <CardHeader className="bg-gradient-to-r from-engineering-primary to-engineering-primary-light text-white">
          <CardTitle className="flex items-center gap-2">
            <Award size={20} />
            Recommended Separator Model
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-engineering-primary mb-2">
              {results.recommendedModel.model}
            </div>
            <Badge variant="secondary" className="bg-engineering-success text-white text-lg px-4 py-2">
              Score: {results.recommendedModel.score}/100
            </Badge>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Alternative Models:</h4>
            {results.recommendedModel.alternatives.map((alt, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">{alt.model}</span>
                <Badge variant="outline">Score: {alt.score}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}