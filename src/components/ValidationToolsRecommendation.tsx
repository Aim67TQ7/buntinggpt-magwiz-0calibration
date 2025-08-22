import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, AlertTriangle } from 'lucide-react';
import { VALIDATION_TOOLS } from '@/utils/validation';
import { EnhancedCalculationResults } from '@/types/calculator';

interface ValidationToolsRecommendationProps {
  results: EnhancedCalculationResults;
}

export function ValidationToolsRecommendation({ results }: ValidationToolsRecommendationProps) {
  const recommendedTools = results.recommendedTools;
  
  const handleExportForTool = (toolKey: string) => {
    const tool = VALIDATION_TOOLS[toolKey as keyof typeof VALIDATION_TOOLS];
    const exportData = {
      magneticField: results.magneticFieldStrength,
      thermalData: results.thermalPerformance,
      geometricParams: 'Export geometric parameters for ' + tool.name,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magnetic_separator_data_${toolKey}${tool.exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle className="text-foreground">Professional Validation Tools</CardTitle>
        </div>
        <CardDescription>
          Recommended analysis tools for detailed validation and optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendedTools.map((toolKey) => {
          const tool = VALIDATION_TOOLS[toolKey as keyof typeof VALIDATION_TOOLS];
          return (
            <div key={toolKey} className="p-4 border border-border rounded-lg bg-card/50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-foreground">{tool.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {tool.exportFormat}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{tool.useCase}</p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportForTool(toolKey)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => window.open(`https://www.${toolKey === 'comsol' ? 'comsol.com' : toolKey === 'ansys' ? 'ansys.com' : 'mathworks.com'}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Learn More
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <h5 className="font-medium text-foreground mb-2">Validation Workflow Recommendation</h5>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Export calculation data to recommended tools</li>
            <li>2. Perform detailed FEA simulation for field verification</li>
            <li>3. Validate thermal performance under operating conditions</li>
            <li>4. Cross-reference results with manufacturer specifications</li>
            <li>5. Conduct field testing for final validation</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}