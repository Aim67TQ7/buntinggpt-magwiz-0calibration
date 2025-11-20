import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { RotateCcw, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Constants for the severity index calculation
const CONSTANTS = {
  v0: 2.0,      // reference belt speed (m/s)
  g0: 200,      // reference air gap (mm)
  d0: 100,      // reference burden depth (mm)
  k: 0.5,       // burden to gap conversion factor
  G0: 3000,     // base gauss at tramp level
  W0: 10,       // base coil power (kW)
  a: 0.4,       // speed exponent
  b: 1.7,       // distance exponent
  c: 0.5        // burden exponent
};

const TRAMP_SIZE_MAP = {
  small: { value: 1.0, label: "Small", description: "Bolts, nails, small plate" },
  medium: { value: 1.5, label: "Medium", description: "Tooling fragments, small rebar" },
  large: { value: 2.0, label: "Large", description: "Full rebar, bucket teeth" },
  veryLarge: { value: 2.5, label: "Very Large", description: "Very large or frequent tramp" }
} as const;

type TrampSize = keyof typeof TRAMP_SIZE_MAP;

interface OCWRequirements {
  severity: number;
  requiredGauss: number;
  requiredWatts: number;
  forceFactor: number;
}

function computeOCWRequirements(v: number, g: number, d: number, T: number): OCWRequirements {
  const h = g + CONSTANTS.k * d;
  const h0 = CONSTANTS.g0 + CONSTANTS.k * CONSTANTS.d0;
  
  const S = Math.pow(v / CONSTANTS.v0, CONSTANTS.a) *
            Math.pow(h / h0, CONSTANTS.b) *
            Math.pow(d / CONSTANTS.d0, CONSTANTS.c) *
            T;
  
  return {
    severity: S,
    requiredGauss: CONSTANTS.G0 * S,
    requiredWatts: CONSTANTS.W0 * S * S,
    forceFactor: S
  };
}

function generateGraphData(v: number, d: number, T: number) {
  const data = [];
  for (let g = 100; g <= 800; g += 20) {
    const result = computeOCWRequirements(v, g, d, T);
    data.push({
      gap: g,
      gauss: Math.round(result.requiredGauss),
      watts: Math.round(result.requiredWatts * 10) / 10,
      forceFactor: Math.round(result.forceFactor * 100) / 100
    });
  }
  return data;
}

export default function OCWAnalyzer() {
  const [beltSpeed, setBeltSpeed] = useState(2.0);
  const [airGap, setAirGap] = useState(200);
  const [burdenDepth, setBurdenDepth] = useState(100);
  const [trampSize, setTrampSize] = useState<TrampSize>('small');
  const [graphMetric, setGraphMetric] = useState<'gauss' | 'watts' | 'forceFactor'>('gauss');

  const currentResults = useMemo(
    () => computeOCWRequirements(beltSpeed, airGap, burdenDepth, TRAMP_SIZE_MAP[trampSize].value),
    [beltSpeed, airGap, burdenDepth, trampSize]
  );

  const graphData = useMemo(
    () => generateGraphData(beltSpeed, burdenDepth, TRAMP_SIZE_MAP[trampSize].value),
    [beltSpeed, burdenDepth, trampSize]
  );

  const handleReset = () => {
    setBeltSpeed(2.0);
    setAirGap(200);
    setBurdenDepth(100);
    setTrampSize('small');
  };

  const getSeverityColor = (severity: number) => {
    if (severity < 1.2) return "bg-green-500/10 text-green-700 border-green-500/20";
    if (severity < 2.0) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  const getMetricLabel = () => {
    switch (graphMetric) {
      case 'gauss': return 'Required Gauss (G)';
      case 'watts': return 'Required Power (kW)';
      case 'forceFactor': return 'Force Factor';
    }
  };

  const getMetricValue = (dataPoint: any) => {
    switch (graphMetric) {
      case 'gauss': return dataPoint.gauss;
      case 'watts': return dataPoint.watts;
      case 'forceFactor': return dataPoint.forceFactor;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">OCW Performance Analyzer</h1>
        <p className="text-muted-foreground">
          Interactive tool to understand how operating conditions affect magnet requirements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Parameters</CardTitle>
            <CardDescription>Adjust sliders to see real-time impact on magnet requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Belt Speed Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Belt Speed</label>
                <Badge variant="secondary">{beltSpeed.toFixed(1)} m/s</Badge>
              </div>
              <Slider
                value={[beltSpeed]}
                onValueChange={(val) => setBeltSpeed(val[0])}
                min={0.5}
                max={5.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher speeds reduce contact time with magnetic field
              </p>
            </div>

            {/* Air Gap Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Air Gap</label>
                <Badge variant="secondary">{airGap} mm</Badge>
              </div>
              <Slider
                value={[airGap]}
                onValueChange={(val) => setAirGap(val[0])}
                min={100}
                max={800}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Distance from magnet face to tramp metal
              </p>
            </div>

            {/* Burden Depth Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Burden Depth</label>
                <Badge variant="secondary">{burdenDepth} mm</Badge>
              </div>
              <Slider
                value={[burdenDepth]}
                onValueChange={(val) => setBurdenDepth(val[0])}
                min={50}
                max={300}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Material depth on belt adds effective distance
              </p>
            </div>

            {/* Tramp Size */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Tramp Size / Severity</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TRAMP_SIZE_MAP).map(([key, data]) => (
                  <Button
                    key={key}
                    variant={trampSize === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrampSize(key as TrampSize)}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-semibold">{data.label}</span>
                    <span className="text-xs opacity-70">{data.value}x</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {TRAMP_SIZE_MAP[trampSize].description}
              </p>
            </div>

            {/* Current Results */}
            <div className="pt-4 space-y-4 border-t">
              <h3 className="font-semibold">Current Operating Point</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Severity Index</p>
                  <Badge className={getSeverityColor(currentResults.severity)}>
                    {currentResults.severity.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Force Factor</p>
                  <p className="text-lg font-semibold">{currentResults.forceFactor.toFixed(2)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Required Gauss</p>
                  <p className="text-lg font-semibold">{Math.round(currentResults.requiredGauss)} G</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Required Power</p>
                  <p className="text-lg font-semibold">{currentResults.requiredWatts.toFixed(1)} kW</p>
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Graph */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Curve</CardTitle>
            <CardDescription>How requirements change with air gap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metric Selection */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={graphMetric === 'gauss' ? 'default' : 'outline'}
                onClick={() => setGraphMetric('gauss')}
              >
                Gauss
              </Button>
              <Button
                size="sm"
                variant={graphMetric === 'watts' ? 'default' : 'outline'}
                onClick={() => setGraphMetric('watts')}
              >
                Power
              </Button>
              <Button
                size="sm"
                variant={graphMetric === 'forceFactor' ? 'default' : 'outline'}
                onClick={() => setGraphMetric('forceFactor')}
              >
                Force Factor
              </Button>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="gap" 
                    label={{ value: 'Air Gap (mm)', position: 'insideBottom', offset: -5 }}
                    className="text-xs"
                  />
                  <YAxis 
                    label={{ value: getMetricLabel(), angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <ReferenceLine 
                    x={airGap} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="3 3"
                    label={{ value: 'Current Gap', position: 'top' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={graphMetric} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name={getMetricLabel()}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How to use:</strong> Adjust the sliders to see how belt speed, air gap, 
          burden depth, and tramp size affect magnet requirements. Larger tramp sizes increase 
          the severity multiplier and require more powerful magnets. The vertical line on the 
          graph shows your current gap setting.
        </AlertDescription>
      </Alert>
    </div>
  );
}
