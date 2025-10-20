import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DecayData {
  gap: number;
  gauss: number;
  force: number;
}

export default function MagneticDecay() {
  const location = useLocation();
  const { model, gauss, force } = location.state || { model: "Unknown", gauss: 0, force: 0 };

  // Generate decay data: Gauss retains 86.6% (0.866), Force retains 75.1% (0.751) per 25mm step
  const generateDecayData = (): DecayData[] => {
    const data: DecayData[] = [];
    const gaussDecayFactor = 0.866;
    const forceDecayFactor = 0.751;
    
    for (let gap = 0; gap <= 800; gap += 25) {
      const steps = gap / 25;
      const currentGauss = Math.round(gauss * Math.pow(gaussDecayFactor, steps));
      const currentForce = Math.round(force * Math.pow(forceDecayFactor, steps));
      
      data.push({
        gap,
        gauss: currentGauss,
        force: currentForce
      });
    }
    
    return data;
  };

  const decayData = generateDecayData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Magnetic Field Decay Analysis</h1>
        <p className="text-muted-foreground">
          Model: <span className="font-semibold">{model}</span> | Initial Gauss: {gauss} | Initial Force: {force} | Ambient: 20°C
        </p>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Decay Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={decayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gap" 
                label={{ value: 'Gap (mm)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Gauss', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Force', angle: 90, position: 'insideRight' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="gauss" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Gauss"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="force" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Force"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Decay Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gap (mm)</TableHead>
                <TableHead className="text-right">Gauss</TableHead>
                <TableHead className="text-right">Force</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decayData.map((row) => (
                <TableRow key={row.gap}>
                  <TableCell className="font-medium">{row.gap}</TableCell>
                  <TableCell className="text-right">{row.gauss.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.force.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
