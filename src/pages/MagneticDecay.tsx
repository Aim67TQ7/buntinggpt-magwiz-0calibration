import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Label, ReferenceArea } from "recharts";

interface DecayData {
  gauss: number;
  distance: number;
  cube200Req: number;
  nut300Req: number;
  bolt350Req: number;
  nut400Req: number;
  plate700Req: number;
}

interface TrampConfig {
  name: string;
  baseThreshold: number;
  gainFactor: number;
  color: string;
  fillColor: string;
  dataKey: string;
}

interface IntersectionPoint {
  gauss: number;
  distance: number;
  name: string;
  color: string;
}

export default function MagneticDecay() {
  const location = useLocation();
  const { model, gauss, force, feedDepth = 50 } = location.state || { model: "Unknown", gauss: 2410, force: 0, feedDepth: 50 };

  // Tramp configurations with base thresholds and gain factors
  const trampConfigs: TrampConfig[] = [
    { name: "25mm Cube", baseThreshold: 200, gainFactor: 0.0045, color: "#22c55e", fillColor: "rgba(34, 197, 94, 0.3)", dataKey: "cube200Req" },
    { name: "M12 Nut", baseThreshold: 300, gainFactor: 0.0050, color: "#eab308", fillColor: "rgba(234, 179, 8, 0.3)", dataKey: "nut300Req" },
    { name: "M16×75 Bolt", baseThreshold: 350, gainFactor: 0.0053, color: "#f97316", fillColor: "rgba(249, 115, 22, 0.3)", dataKey: "bolt350Req" },
    { name: "M18 Nut", baseThreshold: 400, gainFactor: 0.0055, color: "#f59e0b", fillColor: "rgba(245, 158, 11, 0.3)", dataKey: "nut400Req" },
    { name: "6mm Plate", baseThreshold: 700, gainFactor: 0.0060, color: "#dc2626", fillColor: "rgba(220, 38, 38, 0.3)", dataKey: "plate700Req" }
  ];

  // Generate data with X = Distance, Y = Gauss
  const generateDecayData = (): DecayData[] => {
    const data: DecayData[] = [];
    const maxDistance = 800;
    
    // Generate points for each distance value
    for (let distance = 0; distance <= maxDistance; distance += 10) {
      // Calculate magnet field at this distance using decay formula
      // G(x) = 2410 × (0.866)^(x/25)
      const gaussAtDistance = gauss * Math.pow(0.866, distance / 25);
      
      // Calculate tramp pickup requirements at this distance
      // Requirement increases with distance: Req(x) = baseThreshold × e^(gainFactor × x)
      const cube200Req = trampConfigs[0].baseThreshold * Math.exp(trampConfigs[0].gainFactor * distance);
      const nut300Req = trampConfigs[1].baseThreshold * Math.exp(trampConfigs[1].gainFactor * distance);
      const bolt350Req = trampConfigs[2].baseThreshold * Math.exp(trampConfigs[2].gainFactor * distance);
      const nut400Req = trampConfigs[3].baseThreshold * Math.exp(trampConfigs[3].gainFactor * distance);
      const plate700Req = trampConfigs[4].baseThreshold * Math.exp(trampConfigs[4].gainFactor * distance);
      
      data.push({
        distance: distance,
        gauss: Math.round(gaussAtDistance),
        cube200Req: Math.round(cube200Req),
        nut300Req: Math.round(nut300Req),
        bolt350Req: Math.round(bolt350Req),
        nut400Req: Math.round(nut400Req),
        plate700Req: Math.round(plate700Req)
      });
    }
    
    return data;
  };

  // Find intersection points between magnet field and tramp requirements
  const findIntersections = (data: DecayData[]): IntersectionPoint[] => {
    const intersections: IntersectionPoint[] = [];
    
    trampConfigs.forEach((tramp) => {
      for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1];
        const curr = data[i];
        const prevReq = prev[tramp.dataKey as keyof DecayData] as number;
        const currReq = curr[tramp.dataKey as keyof DecayData] as number;
        
        // Check if magnet field crosses below the requirement curve
        if (prev.gauss >= prevReq && curr.gauss < currReq) {
          // Linear interpolation to find exact intersection
          const ratio = (prev.gauss - prevReq) / ((prev.gauss - prevReq) - (curr.gauss - currReq));
          const intersectDistance = prev.distance + ratio * (curr.distance - prev.distance);
          const intersectGauss = prev.gauss + ratio * (curr.gauss - prev.gauss);
          
          intersections.push({
            distance: Math.round(intersectDistance),
            gauss: Math.round(intersectGauss),
            name: tramp.name,
            color: tramp.color
          });
          break;
        }
      }
    });
    
    return intersections;
  };

  const decayData = generateDecayData();
  const intersections = findIntersections(decayData);

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
            <CardTitle className="text-white">Magnet Field Decay vs. Tramp Pickup Requirement – {model}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={700}>
              <LineChart data={decayData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
                <defs>
                  {/* Capture zone fills for each tramp type */}
                  {trampConfigs.map((tramp, idx) => (
                    <linearGradient key={`gradient-${idx}`} id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={tramp.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={tramp.color} stopOpacity={0.2} />
                    </linearGradient>
                  ))}
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                
                <XAxis 
                  dataKey="distance" 
                  stroke="#fff"
                  domain={[0, 800]}
                  type="number"
                  label={{ value: 'Gap Distance (mm)', position: 'insideBottom', offset: -15, fill: '#fff', fontSize: 14 }}
                />
                
                <YAxis 
                  dataKey="gauss"
                  domain={[0, 2500]}
                  stroke="#fff"
                  label={{ value: 'Magnetic Field Strength (Gauss)', angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 14 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                
                {/* Feed depth shaded zone */}
                <ReferenceArea
                  x1={0}
                  x2={feedDepth}
                  fill="#94a3b8"
                  fillOpacity={0.2}
                  label={{ 
                    value: `Feed Depth: ${feedDepth}mm`, 
                    position: 'top',
                    fill: '#fff',
                    fontSize: 12
                  }}
                />
                
                {/* Capture zone shaded areas - where magnet field > tramp requirement */}
                {trampConfigs.map((tramp, idx) => (
                  <Area 
                    key={`area-${idx}`}
                    type="monotone" 
                    dataKey={tramp.dataKey}
                    fill={`url(#fill-${idx})`}
                    stroke="none"
                    fillOpacity={1}
                  />
                ))}
                
                {/* Tramp-specific requirement curves - dashed, rising with distance */}
                {trampConfigs.map((tramp, idx) => (
                  <Line 
                    key={`line-${idx}`}
                    type="monotone" 
                    dataKey={tramp.dataKey}
                    stroke={tramp.color} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={`${tramp.name} Pickup Req`}
                    dot={false}
                  />
                ))}
                
                {/* Main magnet field decay curve - solid blue, decreasing with distance */}
                <Line 
                  type="monotone" 
                  dataKey="gauss" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  name="Magnet Field Decay"
                  dot={false}
                />
                
                {/* Intersection points with labels */}
                {intersections.map((point, idx) => (
                  <ReferenceDot
                    key={`intersection-${idx}`}
                    x={point.distance}
                    y={point.gauss}
                    r={6}
                    fill={point.color}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    <Label
                      value={`${point.name}\n≈${point.distance} mm`}
                      position="right"
                      fill={point.color}
                      fontSize={11}
                      fontWeight="bold"
                    />
                  </ReferenceDot>
                ))}
                
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  formatter={(value: number, name: string) => {
                    if (name === "Magnet Field Decay") return [`${value} G`, name];
                    if (name.includes("Pickup Req")) return [`${value} G req`, name];
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff', paddingTop: '20px' }}
                  iconType="line"
                  verticalAlign="bottom"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table - Takes 1 column */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Capture Zone Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Intersection Summary */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Pickup Distances:</h3>
                {intersections.map((point, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 rounded" style={{ backgroundColor: point.color + '20' }}>
                    <span className="font-medium" style={{ color: point.color }}>{point.name}</span>
                    <span className="font-mono">{point.distance} mm @ {point.gauss} G</span>
                  </div>
                ))}
              </div>
              
              {/* Sample Data Table */}
              <div className="max-h-[500px] overflow-y-auto">
                <h3 className="font-semibold text-sm mb-2">Sample Data Points:</h3>
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Distance (mm)</TableHead>
                      <TableHead className="text-right">Gauss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decayData.filter((_, idx) => idx % 5 === 0).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.distance}</TableCell>
                        <TableCell className="text-right">{row.gauss}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
