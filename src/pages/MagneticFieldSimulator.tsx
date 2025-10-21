import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MagnetModel {
  name: string;
  G0: number;
  k: number;
}

interface TrampObject {
  name: string;
  threshold: number;
  icon: string;
}

const MODELS: MagnetModel[] = [
  { name: "55 OCW 25", G0: 2410, k: 0.0058 },
  { name: "80 OCW 25", G0: 3707, k: 0.0045 },
  { name: "100 OCW 25", G0: 4200, k: 0.0040 },
];

const TRAMPS: TrampObject[] = [
  { name: "25mm Cube", threshold: 200, icon: "⬛" },
  { name: "M12 Nut", threshold: 300, icon: "⬢" },
  { name: "M16×75 Bolt", threshold: 350, icon: "🔩" },
  { name: "6mm Plate", threshold: 700, icon: "▬" },
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

  // Generate field contour bands based on actual decay formula
  const generateContourBands = (): Array<{ depth: number; gauss: number; color: string }> => {
    const maxDepth = 150;
    const numBands = 7;
    const bands = [];
    const colors = ["#fef08a", "#fbbf24", "#fb923c", "#f97316", "#ef4444", "#c026d3", "#7c3aed"];

    for (let i = 0; i < numBands; i++) {
      const depth = (maxDepth / (numBands - 1)) * i;
      const gauss = Math.round(calculateFieldStrength(depth));
      bands.push({ depth, gauss, color: colors[i] });
    }

    return bands;
  };

  const contourBands = generateContourBands();
  
  // Scaling: 1mm = 2px for better visibility
  const scale = 2;
  const magnetHeight = 30;
  const beltHeight = 20;
  const svgHeight = magnetHeight + (airGap + burdenDepth) * scale + beltHeight + 100;
  const svgWidth = 600;

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
                <Label htmlFor="airGap">Air Gap: {airGap} mm</Label>
                <Input
                  id="airGap"
                  type="range"
                  min="10"
                  max="100"
                  value={airGap}
                  onChange={(e) => setAirGap(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="burdenDepth">Burden Depth: {burdenDepth} mm</Label>
                <Input
                  id="burdenDepth"
                  type="range"
                  min="10"
                  max="100"
                  value={burdenDepth}
                  onChange={(e) => setBurdenDepth(parseInt(e.target.value))}
                  className="w-full"
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cross-Sectional View — Depth Below Magnet</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedModel.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-x-auto"
              >
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full border rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
                  style={{ minHeight: "600px" }}
                >
                  {/* Depth Scale on Left */}
                  <g>
                    <line x1="50" y1={magnetHeight} x2="50" y2={magnetHeight + (airGap + burdenDepth) * scale} stroke="#64748b" strokeWidth="2" />
                    <text x="40" y={magnetHeight} textAnchor="end" fontSize="11" fill="#475569" fontWeight="bold">0mm</text>
                    <text x="40" y={magnetHeight + airGap * scale} textAnchor="end" fontSize="11" fill="#475569" fontWeight="bold">{airGap}mm</text>
                    <text x="40" y={magnetHeight + (airGap + burdenDepth) * scale} textAnchor="end" fontSize="11" fill="#475569" fontWeight="bold">{airGap + burdenDepth}mm</text>
                  </g>

                  {/* MAGNET BLOCK */}
                  <rect 
                    x="100" 
                    y="10" 
                    width="400" 
                    height={magnetHeight} 
                    fill="#3b82f6" 
                    stroke="#1e3a8a" 
                    strokeWidth="3" 
                    rx="4" 
                  />
                  <text x="300" y="28" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                    🧲 {selectedModel.name} — {selectedModel.G0} Gauss
                  </text>

                  {/* FIELD CONTOUR BANDS - Horizontal bands representing field decay */}
                  {contourBands.map((band, idx) => {
                    if (idx === contourBands.length - 1) return null;
                    const nextBand = contourBands[idx + 1];
                    const y1 = magnetHeight + band.depth * scale;
                    const y2 = magnetHeight + nextBand.depth * scale;
                    const bandHeight = y2 - y1;
                    
                    return (
                      <g key={idx}>
                        <motion.rect
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 0.4, height: bandHeight }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          x="100"
                          y={y1}
                          width="400"
                          height={bandHeight}
                          fill={band.color}
                          stroke="none"
                        />
                        {/* Field strength label on right */}
                        <text 
                          x="510" 
                          y={y1 + bandHeight / 2 + 4} 
                          fontSize="12" 
                          fontWeight="bold" 
                          fill={band.color}
                        >
                          {band.gauss} G
                        </text>
                      </g>
                    );
                  })}

                  {/* AIR GAP ZONE */}
                  <rect 
                    x="100" 
                    y={magnetHeight} 
                    width="400" 
                    height={airGap * scale} 
                    fill="none" 
                    stroke="#94a3b8" 
                    strokeWidth="2" 
                    strokeDasharray="6,4" 
                  />
                  <text x="105" y={magnetHeight + 15} fontSize="13" fontWeight="bold" fill="#475569">
                    AIR GAP — {airGap}mm
                  </text>
                  <text x="105" y={magnetHeight + 30} fontSize="10" fill="#64748b">
                    (No material resistance)
                  </text>

                  {/* BURDEN LAYER */}
                  <rect 
                    x="100" 
                    y={magnetHeight + airGap * scale} 
                    width="400" 
                    height={burdenDepth * scale} 
                    fill="#92400e" 
                    fillOpacity="0.3" 
                    stroke="#78350f" 
                    strokeWidth="2" 
                  />
                  {/* Particle pattern */}
                  {Array.from({ length: 50 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={110 + (i % 25) * 16}
                      cy={magnetHeight + airGap * scale + 10 + Math.floor(i / 25) * (burdenDepth * scale * 0.4)}
                      r="2"
                      fill="#78350f"
                      opacity="0.5"
                    />
                  ))}
                  <text x="105" y={magnetHeight + airGap * scale + 15} fontSize="13" fontWeight="bold" fill="#78350f">
                    MATERIAL BURDEN — {burdenDepth}mm
                  </text>

                  {/* CONVEYOR BELT */}
                  <rect 
                    x="80" 
                    y={magnetHeight + (airGap + burdenDepth) * scale} 
                    width="440" 
                    height={beltHeight} 
                    fill="#1f2937" 
                    stroke="#111827" 
                    strokeWidth="3" 
                  />
                  <text 
                    x="300" 
                    y={magnetHeight + (airGap + burdenDepth) * scale + 14} 
                    textAnchor="middle" 
                    fill="#9ca3af" 
                    fontSize="12" 
                    fontWeight="bold"
                  >
                    CONVEYOR BELT
                  </text>

                  {/* TRAMP OBJECTS with threshold lines */}
                  {TRAMPS.map((tramp, idx) => {
                    const status = getTrampStatus(tramp);
                    const trampY = magnetHeight + (airGap + burdenDepth) * scale + beltHeight + 30;
                    const trampX = 150 + idx * 100;
                    const trampDepth = airGap + burdenDepth;
                    const thresholdDepthLine = magnetHeight + trampDepth * scale;

                    return (
                      <g key={idx}>
                        {/* Threshold line - dashed horizontal line showing required field */}
                        <line
                          x1="100"
                          y1={thresholdDepthLine}
                          x2="500"
                          y2={thresholdDepthLine}
                          stroke={status.captured ? "#22c55e" : "#ef4444"}
                          strokeWidth="1.5"
                          strokeDasharray="4,3"
                          opacity="0.6"
                        />
                        <text
                          x="505"
                          y={thresholdDepthLine + 4}
                          fontSize="9"
                          fill={status.captured ? "#22c55e" : "#ef4444"}
                          fontWeight="bold"
                        >
                          {tramp.threshold}G req
                        </text>

                        {/* Tramp icon */}
                        <rect
                          x={trampX - 20}
                          y={trampY - 20}
                          width="40"
                          height="40"
                          fill={status.captured ? "#22c55e" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth="3"
                          rx="6"
                          opacity={status.captured ? "0.9" : "0.7"}
                        />
                        <text
                          x={trampX}
                          y={trampY + 2}
                          textAnchor="middle"
                          fontSize="20"
                          dominantBaseline="middle"
                        >
                          {tramp.icon}
                        </text>
                        
                        {/* Status label */}
                        <text
                          x={trampX}
                          y={trampY + 30}
                          textAnchor="middle"
                          fontSize="11"
                          fill={status.captured ? "#166534" : "#991b1b"}
                          fontWeight="bold"
                        >
                          {status.captured ? "✅ CAPTURED" : "⚠️ TOO DEEP"}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 44}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                        >
                          {tramp.name}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 56}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#475569"
                          fontWeight="bold"
                        >
                          Field: {status.fieldStrength}G
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-3 text-sm">Field Intensity Decay (G = G₀e⁻ᵏᵈ)</h3>
              <div className="grid grid-cols-7 gap-2">
                {contourBands.map((band, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className="h-8 rounded mb-1 border"
                      style={{ backgroundColor: band.color }}
                    />
                    <div className="text-xs font-mono font-bold">{band.gauss}G</div>
                    <div className="text-xs text-muted-foreground">{Math.round(band.depth)}mm</div>
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
