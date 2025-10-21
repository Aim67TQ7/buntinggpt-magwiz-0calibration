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
  const [burdenDepth] = useState(50);
  const [airGap] = useState(50);

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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Air Gap:</span>
                  <span className="font-mono">{airGap} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Burden Depth:</span>
                  <span className="font-mono">{burdenDepth} mm</span>
                </div>
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
                  viewBox="0 0 500 300"
                  className="w-full border rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <defs>
                    <radialGradient id="fieldGradient" cx="50%" cy="0%" r="100%">
                      {gradientStops.map((stop, idx) => (
                        <stop
                          key={idx}
                          offset={`${stop.offset}%`}
                          stopColor={stop.color}
                          stopOpacity={0.6}
                        />
                      ))}
                    </radialGradient>
                  </defs>

                  {/* Magnet (Top Block) */}
                  <rect x="150" y="10" width="200" height="30" fill="#3b82f6" stroke="#1e40af" strokeWidth="2" />
                  <text x="250" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    {selectedModel.name}
                  </text>

                  {/* Air Gap */}
                  <rect x="150" y="40" width="200" height={airGap} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="355" y="65" fontSize="10" fill="#64748b">
                    Air Gap ({airGap}mm)
                  </text>

                  {/* Burden Layer */}
                  <rect
                    x="150"
                    y={40 + airGap}
                    width="200"
                    height={burdenDepth}
                    fill="#a8a29e"
                    stroke="#78716c"
                    strokeWidth="1"
                  />
                  <text x="355" y={65 + airGap} fontSize="10" fill="#44403c">
                    Burden ({burdenDepth}mm)
                  </text>

                  {/* Conveyor Belt */}
                  <rect
                    x="100"
                    y={40 + airGap + burdenDepth}
                    width="300"
                    height="20"
                    fill="#374151"
                    stroke="#1f2937"
                    strokeWidth="2"
                  />

                  {/* Magnetic Field Visualization */}
                  <ellipse
                    cx="250"
                    cy="40"
                    rx="150"
                    ry="120"
                    fill="url(#fieldGradient)"
                    opacity="0.7"
                  >
                    <animate
                      attributeName="ry"
                      values="120;125;120"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </ellipse>

                  {/* Tramp Objects */}
                  <TooltipProvider>
                    {TRAMPS.map((tramp, idx) => {
                      const status = getTrampStatus(tramp);
                      return (
                        <g key={idx}>
                          <circle
                            cx={tramp.x + 50}
                            cy={40 + airGap + burdenDepth - 10}
                            r="8"
                            fill={status.captured ? "#22c55e" : "#ef4444"}
                            stroke="white"
                            strokeWidth="2"
                          />
                          <text
                            x={tramp.x + 50}
                            y={40 + airGap + burdenDepth - 7}
                            textAnchor="middle"
                            fontSize="10"
                          >
                            {tramp.icon}
                          </text>
                        </g>
                      );
                    })}
                  </TooltipProvider>

                  {/* Field Strength Indicator Lines */}
                  {[0, 30, 60, 90, 120, 150].map((depth, idx) => {
                    const gauss = Math.round(calculateFieldStrength(depth));
                    return (
                      <g key={idx}>
                        <line
                          x1="10"
                          y1={40 + depth}
                          x2="140"
                          y2={40 + depth}
                          stroke="#94a3b8"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text x="15" y={42 + depth} fontSize="9" fill="#64748b">
                          {depth}mm: {gauss}G
                        </text>
                      </g>
                    );
                  })}
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
