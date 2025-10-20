import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DecayData {
  gap: number;
  gauss: number;
  force: number;
  cube200?: number;
  nut300?: number;
  bolt350?: number;
  nut400?: number;
  plate700?: number;
}

interface TrampConfig {
  name: string;
  threshold: number;
  decayFactor: number;
  color: string;
  fillColor: string;
}

export default function MagneticDecay() {
  const location = useLocation();
  const { model, gauss, force } = location.state || { model: "Unknown", gauss: 2410, force: 0 };

  // Tramp configurations with thresholds and decay factors
  const trampConfigs: TrampConfig[] = [
    { name: "25mm Cube", threshold: 200, decayFactor: 0.95, color: "#dc2626", fillColor: "rgba(220, 38, 38, 0.15)" },
    { name: "M12 Nut", threshold: 300, decayFactor: 0.90, color: "#ea580c", fillColor: "rgba(234, 88, 12, 0.15)" },
    { name: "M16×75 Bolt", threshold: 350, decayFactor: 0.88, color: "#f97316", fillColor: "rgba(249, 115, 22, 0.15)" },
    { name: "M18 Nut", threshold: 400, decayFactor: 0.87, color: "#fb923c", fillColor: "rgba(251, 146, 60, 0.15)" },
    { name: "6mm Plate", threshold: 700, decayFactor: 0.83, color: "#fbbf24", fillColor: "rgba(251, 191, 36, 0.15)" }
  ];

  // Generate decay data with tramp-specific curves
  const generateDecayData = (): DecayData[] => {
    const data: DecayData[] = [];
    const gaussDecayFactor = 0.866;
    const forceDecayFactor = 0.751;
    
    for (let gap = 0; gap <= 800; gap += 25) {
      const steps = gap / 25;
      const currentGauss = Math.round(gauss * Math.pow(gaussDecayFactor, steps));
      const currentForce = Math.round(force * Math.pow(forceDecayFactor, steps));
      
      // Calculate tramp-specific effective field thresholds at this distance
      const cube200 = Math.round(200 * Math.pow(0.95, steps));
      const nut300 = Math.round(300 * Math.pow(0.90, steps));
      const bolt350 = Math.round(350 * Math.pow(0.88, steps));
      const nut400 = Math.round(400 * Math.pow(0.87, steps));
      const plate700 = Math.round(700 * Math.pow(0.83, steps));
      
      data.push({
        gap,
        gauss: currentGauss,
        force: currentForce,
        cube200,
        nut300,
        bolt350,
        nut400,
        plate700
      });
    }
    
    return data;
  };

  const decayData = generateDecayData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Magnetic Field Decay & Capture Zones</h1>
        <p className="text-muted-foreground">
          Model: <span className="font-semibold">{model}</span> | Initial Gauss: {gauss} | Initial Force: {force} | Ambient: 20°C
        </p>
      </div>

      {/* Chart and Table Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Magnet Field Decay & Capture Zones – {model}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={700} aspect={1}>
              <LineChart data={decayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  {/* Capture zone fills for each tramp type */}
                  {trampConfigs.map((tramp, idx) => (
                    <linearGradient key={`gradient-${idx}`} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={tramp.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={tramp.color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                
                <XAxis 
                  dataKey="gap" 
                  stroke="#fff"
                  label={{ value: 'Gap (mm)', position: 'insideBottom', offset: -10, fill: '#fff', fontSize: 14 }}
                />
                
                <YAxis 
                  scale="log"
                  domain={[100, 10000]}
                  stroke="#fff"
                  label={{ value: 'Magnetic Field Strength (Gauss - Log Scale)', angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 14 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                
                {/* Capture zone shaded areas - where magnet field > tramp threshold */}
                <Area 
                  type="monotone" 
                  dataKey="cube200" 
                  fill="url(#fill-0)"
                  stroke="none"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="nut300" 
                  fill="url(#fill-1)"
                  stroke="none"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="bolt350" 
                  fill="url(#fill-2)"
                  stroke="none"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="nut400" 
                  fill="url(#fill-3)"
                  stroke="none"
                  fillOpacity={1}
                />
                <Area 
                  type="monotone" 
                  dataKey="plate700" 
                  fill="url(#fill-4)"
                  stroke="none"
                  fillOpacity={1}
                />
                
                {/* Tramp-specific decay curves - dashed */}
                <Line 
                  type="monotone" 
                  dataKey="cube200" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="25mm Cube (200G)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="nut300" 
                  stroke="#ea580c" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="M12 Nut (300G)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="bolt350" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="M16×75 Bolt (350G)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="nut400" 
                  stroke="#fb923c" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="M18 Nut (400G)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="plate700" 
                  stroke="#fbbf24" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="6mm Plate (700G)"
                  dot={false}
                />
                
                {/* Main magnet field decay curve - solid blue */}
                <Line 
                  type="monotone" 
                  dataKey="gauss" 
                  stroke="#1e3a8a" 
                  strokeWidth={4}
                  name="Magnet Field"
                  dot={{ fill: '#1e3a8a', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
                
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  formatter={(value: number) => `${value.toLocaleString()} G`}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                  iconType="line"
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
            <div className="max-h-[700px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
