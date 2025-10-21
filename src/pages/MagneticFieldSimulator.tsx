import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MagnetModel {
  name: string;
  G0: number;
  k: number;
}

interface TrampObject {
  name: string;
  threshold: number;
  x: number;
  y: number;
  icon: string;
}

const MODELS: MagnetModel[] = [
  { name: "55 OCW 25", G0: 2410, k: 0.0058 },
  { name: "80 OCW 25", G0: 3707, k: 0.0045 },
  { name: "100 OCW 25", G0: 4200, k: 0.0040 },
];

const TRAMPS: TrampObject[] = [
  { name: "25mm Cube", threshold: 200, x: 100, y: 140, icon: "⬛" },
  { name: "M12 Nut", threshold: 300, x: 200, y: 140, icon: "⬢" },
  { name: "M16×75 Bolt", threshold: 350, x: 300, y: 140, icon: "🔩" },
  { name: "6mm Plate", threshold: 700, x: 400, y: 140, icon: "▬" },
];

export default function MagneticFieldSimulator() {
  const [selectedModel, setSelectedModel] = useState<MagnetModel>(MODELS[0]);
  const [burdenDepth, setBurdenDepth] = useState(50);
  const [airGap, setAirGap] = useState(50);

  const calculateFieldStrength = (depth: number): number => {
    return selectedModel.G0 * Math.exp(-selectedModel.k * depth);
  };

  const getTrampStatus = (tramp: TrampObject): { captured: boolean; fieldStrength: number } => {
    const depth = airGap + burdenDepth;
    const fieldStrength = calculateFieldStrength(depth);
    return {
      captured: fieldStrength >= tramp.threshold,
      fieldStrength: Math.round(fieldStrength),
    };
  };

  const generateGradientStops = (): Array<{ offset: number; color: string; gauss: number }> => {
    const stops = [];
    const depths = [0, 30, 60, 90, 120, 150];
    const colors = ["#fef08a", "#fb923c", "#ef4444", "#c026d3", "#7c3aed", "#1e40af"];

    for (let i = 0; i < depths.length; i++) {
      const gauss = calculateFieldStrength(depths[i]);
      stops.push({
        offset: (depths[i] / 150) * 100,
        color: colors[i],
        gauss: Math.round(gauss),
      });
    }

    return stops;
  };

  const gradientStops = generateGradientStops();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Magnetic Field Penetration Simulator</h1>
        <p className="text-muted-foreground">
          Interactive visualization of magnetic field strength through burden layers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Select Magnet Model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select
              value={selectedModel.name}
              onValueChange={(value) => {
                const model = MODELS.find((m) => m.name === value);
                if (model) setSelectedModel(model);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <h3 className="font-semibold">Model Parameters</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surface Gauss (G₀):</span>
                  <span className="font-mono font-bold">{selectedModel.G0} G</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decay Constant (k):</span>
                  <span className="font-mono">{selectedModel.k}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Layer Configuration</h3>
              <div>
                <label htmlFor="airGap" className="text-sm text-muted-foreground">
                  Air Gap (mm)
                </label>
                <input
                  id="airGap"
                  type="number"
                  min="10"
                  max="150"
                  value={airGap}
                  onChange={(e) => setAirGap(Math.max(10, Math.min(150, parseInt(e.target.value) || 10)))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label htmlFor="burdenDepth" className="text-sm text-muted-foreground">
                  Burden Depth (mm)
                </label>
                <input
                  id="burdenDepth"
                  type="number"
                  min="10"
                  max="150"
                  value={burdenDepth}
                  onChange={(e) => setBurdenDepth(Math.max(10, Math.min(150, parseInt(e.target.value) || 10)))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Tramp Capture Status</h3>
              <div className="space-y-2">
                {TRAMPS.map((tramp) => {
                  const status = getTrampStatus(tramp);
                  return (
                    <div
                      key={tramp.name}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tramp.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{tramp.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Req: {tramp.threshold} G
                          </div>
                        </div>
                      </div>
                      <Badge variant={status.captured ? "default" : "destructive"}>
                        {status.captured ? "✅ Captured" : "⚠️ Too Deep"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cross-Sectional View</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedModel.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <svg
                  viewBox="0 0 600 400"
                  className="w-full border rounded-lg bg-gradient-to-b from-sky-100 to-amber-50 dark:from-slate-800 dark:to-slate-900"
                >
                  <defs>
                    <radialGradient id="fieldGradient" cx="50%" cy="10%" r="80%">
                      {gradientStops.map((stop, idx) => (
                        <stop
                          key={idx}
                          offset={`${stop.offset}%`}
                          stopColor={stop.color}
                          stopOpacity={0.5}
                        />
                      ))}
                    </radialGradient>
                  </defs>

                  {/* Title */}
                  <text x="300" y="25" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1e293b">
                    Cross-Section: Magnet → Air Gap → Material Burden → Belt → Tramp
                  </text>

                  {/* Magnet Block at Top */}
                  <rect x="200" y="50" width="200" height="40" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="3" rx="4" />
                  <text x="300" y="73" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                    🧲 {selectedModel.name}
                  </text>
                  <text x="300" y="88" textAnchor="middle" fill="white" fontSize="11">
                    {selectedModel.G0} Gauss at surface
                  </text>

                  {/* Magnetic Field Lines - radiating from magnet */}
                  <ellipse
                    cx="300"
                    cy="90"
                    rx="220"
                    ry={Math.max(150, airGap + burdenDepth + 60)}
                    fill="url(#fieldGradient)"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="ry"
                      values={`${Math.max(150, airGap + burdenDepth + 60)};${Math.max(155, airGap + burdenDepth + 65)};${Math.max(150, airGap + burdenDepth + 60)}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </ellipse>

                  {/* Air Gap Zone */}
                  <rect x="200" y="90" width="200" height={airGap * 1.5} fill="#bae6fd" fillOpacity="0.6" stroke="#0369a1" strokeWidth="2" strokeDasharray="4,4" />
                  <text x="410" y={90 + (airGap * 1.5) / 2} fontSize="13" fontWeight="bold" fill="#0369a1">
                    ← AIR GAP: {airGap}mm
                  </text>
                  <text x="205" y={90 + (airGap * 1.5) / 2} fontSize="10" fill="#0c4a6e">
                    (No material resistance)
                  </text>

                  {/* Burden Layer Zone */}
                  <rect 
                    x="200" 
                    y={90 + airGap * 1.5} 
                    width="200" 
                    height={burdenDepth * 1.5} 
                    fill="#92400e" 
                    fillOpacity="0.7" 
                    stroke="#78350f" 
                    strokeWidth="2"
                  />
                  {/* Particle pattern in burden */}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={210 + (i % 10) * 20}
                      cy={95 + airGap * 1.5 + Math.floor(i / 10) * (burdenDepth * 0.4)}
                      r="2"
                      fill="#451a03"
                      opacity="0.4"
                    />
                  ))}
                  <text x="410" y={90 + airGap * 1.5 + (burdenDepth * 1.5) / 2} fontSize="13" fontWeight="bold" fill="#78350f">
                    ← BURDEN: {burdenDepth}mm
                  </text>
                  <text x="205" y={90 + airGap * 1.5 + (burdenDepth * 1.5) / 2} fontSize="10" fill="#fef3c7">
                    (Material load)
                  </text>

                  {/* Conveyor Belt */}
                  <rect
                    x="150"
                    y={90 + airGap * 1.5 + burdenDepth * 1.5}
                    width="300"
                    height="25"
                    fill="#1f2937"
                    stroke="#111827"
                    strokeWidth="3"
                  />
                  <text 
                    x="300" 
                    y={90 + airGap * 1.5 + burdenDepth * 1.5 + 17} 
                    textAnchor="middle" 
                    fill="#9ca3af" 
                    fontSize="12"
                    fontWeight="bold"
                  >
                    CONVEYOR BELT
                  </text>

                  {/* Tramp Objects below belt */}
                  {TRAMPS.map((tramp, idx) => {
                    const status = getTrampStatus(tramp);
                    const trampY = 90 + airGap * 1.5 + burdenDepth * 1.5 + 40;
                    const trampX = 180 + idx * 70;
                    return (
                      <g key={idx}>
                        <rect
                          x={trampX - 15}
                          y={trampY - 15}
                          width="30"
                          height="30"
                          fill={status.captured ? "#22c55e" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth="2"
                          rx="4"
                        />
                        <text
                          x={trampX}
                          y={trampY}
                          textAnchor="middle"
                          fontSize="16"
                          dominantBaseline="middle"
                        >
                          {tramp.icon}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 25}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#1e293b"
                          fontWeight="bold"
                        >
                          {status.captured ? "✓ HELD" : "✗ MISSED"}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 35}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#64748b"
                        >
                          {status.fieldStrength}G
                        </text>
                      </g>
                    );
                  })}

                  {/* Depth indicator on left side */}
                  <line x1="170" y1="90" x2="170" y2={90 + airGap * 1.5 + burdenDepth * 1.5} stroke="#475569" strokeWidth="2" />
                  <text x="160" y="85" textAnchor="end" fontSize="10" fill="#475569" fontWeight="bold">
                    0mm
                  </text>
                  <text x="160" y={95 + airGap * 1.5} textAnchor="end" fontSize="10" fill="#475569" fontWeight="bold">
                    {airGap}mm
                  </text>
                  <text x="160" y={95 + airGap * 1.5 + burdenDepth * 1.5} textAnchor="end" fontSize="10" fill="#475569" fontWeight="bold">
                    {airGap + burdenDepth}mm
                  </text>
                </svg>
              </motion.div>
            </AnimatePresence>

            {/* Color Legend */}
            <div className="mt-4 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 text-sm">Magnetic Field Intensity Legend</h3>
              <div className="grid grid-cols-6 gap-2">
                {gradientStops.map((stop, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className="h-6 rounded mb-1"
                      style={{ backgroundColor: stop.color }}
                    />
                    <div className="text-xs font-mono">{stop.gauss}G</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
