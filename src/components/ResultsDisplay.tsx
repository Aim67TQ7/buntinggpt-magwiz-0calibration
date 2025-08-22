import { EnhancedCalculationResults } from '@/types/calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, XCircle, Info, Zap, Thermometer, Target, Award, TrendingUp, ArrowRight } from 'lucide-react';
import { ValidationToolsRecommendation } from './ValidationToolsRecommendation';

interface ResultsDisplayProps {
  results: EnhancedCalculationResults;
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
                {(results.trampMetalRemoval.overallEfficiency * 100).toFixed(1)}%
              </Badge>
            </div>
            <Progress 
              value={results.trampMetalRemoval.overallEfficiency * 100} 
              className="h-3"
            />
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-engineering-primary">
                  {(results.trampMetalRemoval.fineParticles * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Fine Particles</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-engineering-secondary">
                  {(results.trampMetalRemoval.mediumParticles * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Medium Particles</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-engineering-accent">
                  {(results.trampMetalRemoval.largeParticles * 100).toFixed(1)}%
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

      {/* Professional Validation Tools */}
      <ValidationToolsRecommendation results={results} />
      
      {/* Optimization Results */}
      {results.optimization && (
        <Card className="shadow-card">
          <CardHeader className="bg-gradient-to-r from-engineering-primary to-engineering-secondary text-white">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Optimization Results
            </CardTitle>
            <CardDescription className="text-white/90">
              {results.optimization.success 
                ? `Successfully achieved ${(results.optimization.achievedEfficiency * 100).toFixed(1)}% efficiency`
                : `Reached ${(results.optimization.achievedEfficiency * 100).toFixed(1)}% efficiency in ${results.optimization.iterations} iterations`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Target</div>
                <div className="text-3xl font-bold text-engineering-accent">
                  {(results.optimization.targetEfficiency * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <ArrowRight className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground mb-1">Achieved</div>
                <div className="text-3xl font-bold text-engineering-primary">
                  {(results.optimization.achievedEfficiency * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Iterations</div>
                <div className="text-3xl font-bold text-engineering-secondary">
                  {results.optimization.iterations}
                </div>
              </div>
            </div>
            
            {results.optimization.parameterChanges.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Parameter Changes</h4>
                <div className="space-y-3">
                  {results.optimization.parameterChanges.map((change, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">{change.parameter}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {change.originalValue.toFixed(2)} → {change.optimizedValue.toFixed(2)}
                        </span>
                        <Badge 
                          variant={change.change > 0 ? "default" : "secondary"}
                          className={change.change > 0 ? "bg-engineering-success text-white" : ""}
                        >
                          {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}