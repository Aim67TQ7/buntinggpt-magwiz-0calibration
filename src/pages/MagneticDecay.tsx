import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

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
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Magnetic Reach & Capture Zones – {model}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={decayData}>
              <defs>
                {/* Gradient for heatmap background - amber to red */}
                <linearGradient id="heatmapGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#f97316" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              
              <XAxis 
                dataKey="gap" 
                stroke="#fff"
                label={{ value: 'Gap (mm)', position: 'insideBottom', offset: -5, fill: '#fff' }}
              />
              
              <YAxis 
                scale="log"
                domain={['auto', 'auto']}
                stroke="#fff"
                label={{ value: 'Gauss (Log Scale)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              
              {/* Heatmap background using Area */}
              <Area 
                type="monotone" 
                dataKey="gauss" 
                fill="url(#heatmapGradient)"
                stroke="none"
                fillOpacity={1}
              />
              
              {/* Tramp pickup threshold lines */}
              <ReferenceLine 
                y={700} 
                stroke="#fbbf24" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: '6mm Plate (700G)', position: 'right', fill: '#fbbf24', fontSize: 12 }}
              />
              <ReferenceLine 
                y={400} 
                stroke="#fb923c" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'M18 Nut (400G)', position: 'right', fill: '#fb923c', fontSize: 12 }}
              />
              <ReferenceLine 
                y={350} 
                stroke="#f97316" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'M16×75mm Bolt (350G)', position: 'right', fill: '#f97316', fontSize: 12 }}
              />
              <ReferenceLine 
                y={300} 
                stroke="#ea580c" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'M12 Nut (300G)', position: 'right', fill: '#ea580c', fontSize: 12 }}
              />
              <ReferenceLine 
                y={200} 
                stroke="#dc2626" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: '25mm Cube (200G)', position: 'right', fill: '#dc2626', fontSize: 12 }}
              />
              
              {/* Main Gauss curve - navy blue with data points */}
              <Line 
                type="monotone" 
                dataKey="gauss" 
                stroke="#1e3a8a" 
                strokeWidth={3}
                name="Magnetic Field Strength"
                dot={{ fill: '#1e3a8a', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
              
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff'
                }}
                labelStyle={{ color: '#fbbf24' }}
                formatter={(value: number, name: string) => {
                  if (name === "Magnetic Field Strength") {
                    return [`${value.toLocaleString()} G`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#fff' }}
                iconType="line"
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
