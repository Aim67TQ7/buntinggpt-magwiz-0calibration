import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DecayData {
  gap: number;
  gauss: number;
  forceFactor: number;
}

export default function MagneticDecay() {
  const location = useLocation();
  const { model, gauss: initialGauss, force: initialForce } = location.state || { 
    model: "Unknown", 
    gauss: 2410, 
    force: 0 
  };

  // Generate decay data with gap on X-axis and field strength on Y-axis
  const generateDecayData = (): DecayData[] => {
    const data: DecayData[] = [];
    const maxGap = 500;
    
    // Generate points for each gap value
    for (let gap = 0; gap <= maxGap; gap += 10) {
      // Calculate magnetic field at this gap using decay formula
      // G(x) = G₀ × (0.866)^(x/25)
      const gaussAtGap = initialGauss * Math.pow(0.866, gap / 25);
      
      // Calculate force factor (normalized to initial force)
      // Force decreases with field strength squared approximately
      const forceFactor = initialForce > 0 
        ? (gaussAtGap / initialGauss) * (gaussAtGap / initialGauss) 
        : 0;
      
      data.push({
        gap: gap,
        gauss: Math.round(gaussAtGap),
        forceFactor: Math.round(forceFactor * 100) / 100
      });
    }
    
    return data;
  };

  const decayData = generateDecayData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/ocw">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to OCW Selector
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Magnetic Field Decay Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Model: <span className="font-semibold">{model}</span> | Initial Gauss: {initialGauss} G | Initial Force: {initialForce} N
          </p>
        </div>
      </div>

      {/* Chart and Table Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Magnetic Field Decay – {model}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={decayData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                
                <XAxis 
                  dataKey="gap"
                  stroke="hsl(var(--foreground))"
                  label={{ 
                    value: 'Gap Distance (mm)', 
                    position: 'insideBottom', 
                    offset: -10, 
                    style: { fill: 'hsl(var(--foreground))' }
                  }}
                />
                
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--primary))"
                  label={{ 
                    value: 'Field Strength (Gauss)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--primary))' }
                  }}
                />
                
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--chart-2))"
                  label={{ 
                    value: 'Force Factor', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { fill: 'hsl(var(--chart-2))' }
                  }}
                />
                
                {/* Gauss decay line */}
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="gauss" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Gauss"
                  dot={false}
                />
                
                {/* Force factor line */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="forceFactor" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  name="Force Factor"
                  dot={false}
                  strokeDasharray="5 5"
                />
                
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelFormatter={(value) => `Gap: ${value} mm`}
                />
                <Legend 
                  verticalAlign="top"
                  height={36}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table - Takes 1 column */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Decay Data Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Gap (mm)</TableHead>
                    <TableHead className="text-right">Gauss</TableHead>
                    <TableHead className="text-right">Force</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decayData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.gap}</TableCell>
                      <TableCell className="text-right">{row.gauss}</TableCell>
                      <TableCell className="text-right">{row.forceFactor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
