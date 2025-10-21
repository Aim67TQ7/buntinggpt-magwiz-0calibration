import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MagnetModel {
  name: string;
  G0: number;
  k: number;
  width: number;
  thickness: number;
  beltWidth: number;
}

interface TrampObject {
  name: string;
  threshold: number;
  icon: string;
}

export default function MagneticFieldSimulator() {
  const [models, setModels] = useState<MagnetModel[]>([]);
  const [trampObjects, setTrampObjects] = useState<TrampObject[]>([]);
  const [selectedModel, setSelectedModel] = useState<MagnetModel | null>(null);
  const [burdenDepth, setBurdenDepth] = useState(50);
  const [airGap, setAirGap] = useState(50);
  const [loading, setLoading] = useState(true);

  // Fetch magnet models from Supabase Edge function
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('magnet-models');
        
        if (error) throw error;
        
        setModels(data.models);
        setTrampObjects(data.tramps);
        setSelectedModel(data.models[0]);
      } catch (error) {
        console.error('Error fetching magnet models:', error);
        toast.error('Failed to load magnet models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading || !selectedModel) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading magnet models...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    const gaussLevels = [
      { minGauss: 3000, color: "#fef08a" },
      { minGauss: 2000, color: "#fbbf24" },
      { minGauss: 1500, color: "#fb923c" },
      { minGauss: 1000, color: "#f97316" },
      { minGauss: 500, color: "#ef4444" },
      { minGauss: 200, color: "#c026d3" },
      { minGauss: 0, color: "#7c3aed" }
    ];

    const bands = [];
    for (const level of gaussLevels) {
      // Find depth where field = minGauss using inverse formula: d = -ln(G/G₀)/k
      if (level.minGauss > selectedModel.G0) continue;
      const depth = level.minGauss > 0 
        ? -Math.log(level.minGauss / selectedModel.G0) / selectedModel.k
        : maxDepth;
      
      if (depth <= maxDepth) {
        bands.push({
          depth: Math.min(depth, maxDepth),
          gauss: level.minGauss,
          color: level.color
        });
      }
    }

    return bands.sort((a, b) => a.depth - b.depth);
  };

  const contourBands = generateContourBands();
  
  // Physical scaling: 1mm = 2px for optimal visibility
  const scale = 2;
  const beltHeight = 20;
  
  // Calculate SVG dimensions based on real proportions
  const magnetWidth = selectedModel.width * scale;
  const magnetHeight = selectedModel.thickness * scale;
  const beltWidth = selectedModel.beltWidth * scale;
  const totalDepth = (airGap + burdenDepth) * scale;
  
  const svgWidth = beltWidth + 200; // Extra space for labels
  const svgHeight = magnetHeight + totalDepth + beltHeight + 150;
  
  // Center magnet over belt
  const magnetX = (svgWidth - magnetWidth) / 2 - 50; // -50 to account for left margin
  const beltX = (svgWidth - beltWidth) / 2 - 50;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Magnetic Field Penetration Simulator</h1>
        <p className="text-muted-foreground">
          Proportionally accurate visualization of magnetic field decay through burden layers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Magnet Model</Label>
              <Select
                value={selectedModel.name}
                onValueChange={(value) => {
                  const model = models.find((m) => m.name === value);
                  if (model) setSelectedModel(model);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Physical Dimensions</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magnet Width:</span>
                  <span className="font-mono">{selectedModel.width} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magnet Thickness:</span>
                  <span className="font-mono">{selectedModel.thickness} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Belt Width:</span>
                  <span className="font-mono">{selectedModel.beltWidth} mm</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Magnetic Properties</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surface Gauss (G₀):</span>
                  <span className="font-mono font-bold">{selectedModel.G0} G</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decay Constant (k):</span>
                  <span className="font-mono">{selectedModel.k.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Installation Parameters</h3>
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
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-semibold">Total Depth to Tramps:</div>
                <div className="text-2xl font-bold">{airGap + burdenDepth} mm</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Field at depth: {Math.round(calculateFieldStrength(airGap + burdenDepth))} G
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Tramp Capture Status</h3>
              <div className="space-y-2">
                {trampObjects.map((tramp) => {
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
                            Requires: {tramp.threshold} G
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
            <CardTitle>Proportionally Accurate Cross-Section (1mm = 2px)</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedModel.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-x-auto"
              >
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full border rounded-lg bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
                  style={{ minHeight: "700px" }}
                >
                  {/* Depth Scale on Left */}
                  <g>
                    <line 
                      x1="50" 
                      y1={magnetHeight} 
                      x2="50" 
                      y2={magnetHeight + totalDepth} 
                      stroke="#64748b" 
                      strokeWidth="2" 
                    />
                    {[0, airGap, airGap + burdenDepth].map((depth, idx) => (
                      <g key={idx}>
                        <line
                          x1="45"
                          y1={magnetHeight + depth * scale}
                          x2="55"
                          y2={magnetHeight + depth * scale}
                          stroke="#64748b"
                          strokeWidth="2"
                        />
                        <text 
                          x="40" 
                          y={magnetHeight + depth * scale + 4} 
                          textAnchor="end" 
                          fontSize="11" 
                          fill="#475569" 
                          fontWeight="bold"
                        >
                          {depth}mm
                        </text>
                      </g>
                    ))}
                    <text 
                      x="50" 
                      y={magnetHeight + totalDepth / 2} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="#64748b"
                      transform={`rotate(-90, 50, ${magnetHeight + totalDepth / 2})`}
                    >
                      DEPTH BELOW MAGNET
                    </text>
                  </g>

                  {/* MAGNET BLOCK - Centered over belt */}
                  <motion.rect 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 10, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    x={magnetX} 
                    y="10" 
                    width={magnetWidth} 
                    height={magnetHeight} 
                    fill="#3b82f6" 
                    stroke="#1e3a8a" 
                    strokeWidth="3" 
                    rx="4" 
                  />
                  <text 
                    x={magnetX + magnetWidth / 2} 
                    y={10 + magnetHeight / 2 - 8} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="14" 
                    fontWeight="bold"
                  >
                    🧲 {selectedModel.name}
                  </text>
                  <text 
                    x={magnetX + magnetWidth / 2} 
                    y={10 + magnetHeight / 2 + 8} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="11"
                  >
                    {selectedModel.G0} G · {selectedModel.width}×{selectedModel.thickness} mm
                  </text>

                  {/* FIELD CONTOUR BANDS - Based on true G(d) = G₀e^(-kd) */}
                  {contourBands.map((band, idx) => {
                    if (idx === contourBands.length - 1) return null;
                    const nextBand = contourBands[idx + 1];
                    const y1 = magnetHeight + band.depth * scale;
                    const y2 = magnetHeight + nextBand.depth * scale;
                    const bandHeight = y2 - y1;
                    
                    return (
                      <g key={idx}>
                        <motion.rect
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: 0.35, scaleY: 1 }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          x={beltX}
                          y={y1}
                          width={beltWidth}
                          height={bandHeight}
                          fill={band.color}
                          stroke="none"
                          style={{ transformOrigin: `${beltX}px ${y1}px` }}
                        />
                        {/* Field strength label */}
                        <text 
                          x={beltX + beltWidth + 10} 
                          y={y1 + bandHeight / 2 + 4} 
                          fontSize="12" 
                          fontWeight="bold" 
                          fill={band.color}
                        >
                          {band.gauss} G
                        </text>
                        <text 
                          x={beltX + beltWidth + 10} 
                          y={y1 + bandHeight / 2 + 18} 
                          fontSize="9" 
                          fill="#64748b"
                        >
                          @ {Math.round(band.depth)}mm
                        </text>
                      </g>
                    );
                  })}

                  {/* AIR GAP ZONE */}
                  <rect 
                    x={beltX} 
                    y={magnetHeight} 
                    width={beltWidth} 
                    height={airGap * scale} 
                    fill="none" 
                    stroke="#94a3b8" 
                    strokeWidth="2" 
                    strokeDasharray="8,4" 
                  />
                  <text 
                    x={beltX + 10} 
                    y={magnetHeight + 18} 
                    fontSize="13" 
                    fontWeight="bold" 
                    fill="#475569"
                  >
                    AIR GAP — {airGap}mm
                  </text>
                  <text 
                    x={beltX + 10} 
                    y={magnetHeight + 33} 
                    fontSize="10" 
                    fill="#64748b"
                  >
                    (No material resistance)
                  </text>

                  {/* BURDEN LAYER */}
                  <rect 
                    x={beltX} 
                    y={magnetHeight + airGap * scale} 
                    width={beltWidth} 
                    height={burdenDepth * scale} 
                    fill="#92400e" 
                    fillOpacity="0.25" 
                    stroke="#78350f" 
                    strokeWidth="2" 
                  />
                  {/* Material particles */}
                  {Array.from({ length: 80 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={beltX + 20 + (i % 40) * (beltWidth / 40)}
                      cy={magnetHeight + airGap * scale + 15 + Math.floor(i / 40) * (burdenDepth * scale * 0.3)}
                      r="2.5"
                      fill="#78350f"
                      opacity="0.5"
                    />
                  ))}
                  <text 
                    x={beltX + 10} 
                    y={magnetHeight + airGap * scale + 18} 
                    fontSize="13" 
                    fontWeight="bold" 
                    fill="#78350f"
                  >
                    MATERIAL BURDEN — {burdenDepth}mm
                  </text>

                  {/* CONVEYOR BELT */}
                  <rect 
                    x={beltX - 20} 
                    y={magnetHeight + totalDepth} 
                    width={beltWidth + 40} 
                    height={beltHeight} 
                    fill="#1f2937" 
                    stroke="#111827" 
                    strokeWidth="3" 
                  />
                  <text 
                    x={beltX + beltWidth / 2} 
                    y={magnetHeight + totalDepth + 14} 
                    textAnchor="middle" 
                    fill="#9ca3af" 
                    fontSize="12" 
                    fontWeight="bold"
                  >
                    CONVEYOR BELT ({selectedModel.beltWidth}mm)
                  </text>

                  {/* TRAMP OBJECTS - Evenly spaced */}
                  {trampObjects.map((tramp, idx) => {
                    const status = getTrampStatus(tramp);
                    const spacing = beltWidth / (trampObjects.length + 1);
                    const trampX = beltX + spacing * (idx + 1);
                    const trampY = magnetHeight + totalDepth + beltHeight + 35;
                    const trampDepthLine = magnetHeight + (airGap + burdenDepth) * scale;

                    return (
                      <g key={idx}>
                        {/* Dashed threshold line */}
                        <line
                          x1={beltX}
                          y1={trampDepthLine}
                          x2={beltX + beltWidth}
                          y2={trampDepthLine}
                          stroke={status.captured ? "#22c55e" : "#ef4444"}
                          strokeWidth="1.5"
                          strokeDasharray="5,3"
                          opacity="0.5"
                        />

                        {/* Tramp icon with glow effect */}
                        {status.captured && (
                          <circle
                            cx={trampX}
                            cy={trampY}
                            r="28"
                            fill={status.captured ? "#22c55e" : "#ef4444"}
                            opacity="0.2"
                          >
                            <animate
                              attributeName="r"
                              values="28;32;28"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                        
                        <rect
                          x={trampX - 22}
                          y={trampY - 22}
                          width="44"
                          height="44"
                          fill={status.captured ? "#22c55e" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth="3"
                          rx="6"
                          opacity={status.captured ? "0.9" : "0.6"}
                        />
                        <text
                          x={trampX}
                          y={trampY + 4}
                          textAnchor="middle"
                          fontSize="22"
                          dominantBaseline="middle"
                        >
                          {tramp.icon}
                        </text>
                        
                        <text
                          x={trampX}
                          y={trampY + 35}
                          textAnchor="middle"
                          fontSize="11"
                          fill={status.captured ? "#166534" : "#991b1b"}
                          fontWeight="bold"
                        >
                          {status.captured ? "✅ CAPTURED" : "⚠️ TOO DEEP"}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 49}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                        >
                          {tramp.name}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 62}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#475569"
                          fontWeight="bold"
                        >
                          {status.fieldStrength}G / {tramp.threshold}G req
                        </text>
                      </g>
                    );
                  })}

                  {/* Width dimension markers */}
                  <g>
                    {/* Magnet width indicator */}
                    <line
                      x1={magnetX}
                      y1="5"
                      x2={magnetX + magnetWidth}
                      y2="5"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    <line x1={magnetX} y1="0" x2={magnetX} y2="10" stroke="#3b82f6" strokeWidth="2" />
                    <line x1={magnetX + magnetWidth} y1="0" x2={magnetX + magnetWidth} y2="10" stroke="#3b82f6" strokeWidth="2" />
                  </g>
                </svg>
              </motion.div>
            </AnimatePresence>

            {/* Formula and Legend */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Field Decay Formula</h3>
                <div className="font-mono text-sm p-2 bg-background rounded border">
                  G(d) = G₀ × e<sup>(-k×d)</sup> = {selectedModel.G0} × e<sup>(-{selectedModel.k.toFixed(4)}×d)</sup>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-sm">Field Intensity Contours</h3>
                <div className="grid grid-cols-7 gap-2">
                  {contourBands.map((band, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className="h-8 rounded mb-1 border"
                        style={{ backgroundColor: band.color }}
                      />
                      <div className="text-xs font-mono font-bold">{band.gauss}G</div>
                      <div className="text-xs text-muted-foreground">@{Math.round(band.depth)}mm</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground italic">
                All dimensions proportionally accurate (1mm = 2px). Magnet centered over {selectedModel.beltWidth}mm belt.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
