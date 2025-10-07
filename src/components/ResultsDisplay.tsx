import { EnhancedCalculationResults } from '@/types/calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, XCircle, Info, Zap, Target, TrendingUp, ArrowRight, Settings } from 'lucide-react';


interface ResultsDisplayProps {
  results: EnhancedCalculationResults;
  inputs?: any; // Add inputs prop for debugging
}

export function ResultsDisplay({ results, inputs }: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Debug: Input Values Display */}
      {inputs && (
        <Card className="shadow-card border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Info size={20} />
              Current Input Values (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold text-yellow-800">Gap:</div>
                <div>{inputs.magnet?.gap || 'N/A'} mm</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Core:Belt Ratio:</div>
                <div>{inputs.magnet?.coreBeltRatio || 'N/A'}</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Belt Width:</div>
                <div>{inputs.conveyor?.beltWidth || 'N/A'} mm</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Position:</div>
                <div>{inputs.magnet?.position || 'N/A'}</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Ampere-Turns:</div>
                <div>{inputs.advanced?.magneticSystem?.ampereTurns || 'N/A'}</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Belt Speed:</div>
                <div>{inputs.conveyor?.beltSpeed || 'N/A'} m/s</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Feed Depth:</div>
                <div>{inputs.burden?.feedDepth || 'N/A'} mm</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-800">Calculation Time:</div>
                <div>{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Magnetic Field Strength with more precision */}
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
              <div className="text-xs text-gray-500 mt-1">
                (High precision for debugging)
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-engineering-secondary">
                {results.magneticFieldStrength.gauss}
              </div>
              <div className="text-sm text-muted-foreground">Gauss</div>
              <div className="text-xs text-gray-500 mt-1">
                ({results.magneticFieldStrength.tesla} × 10,000)
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-engineering-accent">
                {results.magneticFieldStrength.penetrationDepth}
              </div>
              <div className="text-sm text-muted-foreground">Penetration (mm)</div>
              <div className="text-xs text-gray-500 mt-1">
                (Check console for intermediate values)
              </div>
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

      {/* Recommendation Engine Analysis */}
      {results.recommendationEngine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Enhanced Recommendation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">System Configuration</h3>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="font-medium text-sm mb-2">Recommended Model</div>
                    <div className="text-lg font-bold text-engineering-primary">
                      {results.recommendationEngine.recommendation_engine.base_recommendation.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span className="font-medium">{results.recommendationEngine.ui_autofill.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Face Width:</span>
                      <span className="font-medium">{results.recommendationEngine.ui_autofill.face_width_mm}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Length:</span>
                      <span className="font-medium">{results.recommendationEngine.ui_autofill.magnet_length_min_mm}mm</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Performance Matrix</h3>
                <div className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pickup Range:</span>
                      <Badge variant="outline">{results.recommendationEngine.recommendation_engine.matrix_bucket.r_range_mm}mm</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tramp Size:</span>
                      <Badge variant="outline">{results.recommendationEngine.recommendation_engine.matrix_bucket.tramp_bucket_mm}mm</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Distance:</span>
                      <span className="font-medium">{results.recommendationEngine.derived.effective_pickup_distance_r_mm.toFixed(0)}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Burden Depth:</span>
                      <span className="font-medium">{results.recommendationEngine.derived.burden_depth_h_mm.toFixed(1)}mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {results.recommendationEngine.recommendation_engine.notes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Engineering Notes</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <ul className="space-y-2">
                    {results.recommendationEngine.recommendation_engine.notes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-engineering-warning mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}