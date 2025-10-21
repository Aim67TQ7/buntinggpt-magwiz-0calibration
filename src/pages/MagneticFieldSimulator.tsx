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

  const getTrampStatus = (tramp: TrampObject): { captured: boolean; fieldStrength: number; captureDepth: number } => {
    const depth = airGap + burdenDepth;
    const fieldStrength = calculateFieldStrength(depth);
    // Calculate maximum depth where this tramp can be captured: d = ln(G₀/G_req) / k
    const captureDepth = tramp.threshold < selectedModel.G0 
      ? Math.log(selectedModel.G0 / tramp.threshold) / selectedModel.k
      : 0;
    
    return {
      captured: fieldStrength >= tramp.threshold && depth <= captureDepth,
      fieldStrength: Math.round(fieldStrength),
      captureDepth: Math.round(captureDepth),
    };
  };

  // Generate capture zones for each tramp type
  const generateCaptureZones = (): Array<{
    tramp: TrampObject;
    startDepth: number;
    endDepth: number;
    color: string;
    gaussAtEnd: number;
  }> => {
    const zones = [];
    const zoneColors = [
      "#22c55e", // Green for strongest
      "#84cc16", // Lime
      "#eab308", // Yellow
      "#f97316", // Orange
      "#ef4444", // Red for weakest
    ];

    // Sort tramps by threshold (highest to lowest)
    const sortedTrampObjects = [...trampObjects].sort((a, b) => b.threshold - a.threshold);

    let previousDepth = 0;
    sortedTrampObjects.forEach((tramp, idx) => {
      if (tramp.threshold < selectedModel.G0) {
        // Calculate depth where field strength equals this tramp's threshold
        const captureDepth = Math.log(selectedModel.G0 / tramp.threshold) / selectedModel.k;
        
        zones.push({
          tramp,
          startDepth: previousDepth,
          endDepth: captureDepth,
          color: zoneColors[idx] || zoneColors[zoneColors.length - 1],
          gaussAtEnd: tramp.threshold,
        });
        
        previousDepth = captureDepth;
      }
    });

    // Add a "Dead Zone" beyond the last tramp
    if (zones.length > 0) {
      const lastZone = zones[zones.length - 1];
      zones.push({
        tramp: { name: "Dead Zone", threshold: 0, icon: "💀" },
        startDepth: lastZone.endDepth,
        endDepth: 200, // Extend to 200mm
        color: "#64748b",
        gaussAtEnd: 0,
      });
    }

    return zones;
  };

  // Gauss contour levels to overlay
  const contourLevels = [200, 300, 400, 700, 1000, 1500, 2000];
  
  const captureZones = generateCaptureZones();
  const totalDepthToShow = Math.min(200, Math.max(150, (airGap + burdenDepth) + 50));
  
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
                  max="500"
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
                  max="500"
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
              <h3 className="font-semibold text-sm">Tramp Capture Zones</h3>
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
                            Limit: {status.captureDepth} mm @ {tramp.threshold} G
                          </div>
                        </div>
                      </div>
                      <Badge variant={status.captured ? "default" : "destructive"}>
                        {status.captured ? "✅ In Zone" : "⚠️ Too Deep"}
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
            <CardTitle>Layered Capture Zones — Which Tramps Can We Recover?</CardTitle>
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
                    {[0, 25, 50, 75, 100, 150, 200].filter(d => d <= totalDepthToShow).map((depth) => (
                      <g key={depth}>
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

                  {/* TRAMP CAPTURE ZONES - Layered by capture depth */}
                  {captureZones.map((zone, idx) => {
                    const y1 = magnetHeight + zone.startDepth * scale;
                    const y2 = magnetHeight + Math.min(zone.endDepth, totalDepthToShow) * scale;
                    const zoneHeight = y2 - y1;
                    
                    if (zoneHeight <= 0) return null;
                    
                    const isDeadZone = zone.tramp.name === "Dead Zone";
                    const totalTrampDepth = airGap + burdenDepth;
                    const isCaptured = totalTrampDepth <= zone.endDepth;
                    
                    return (
                      <g key={idx}>
                        {/* Zone background with sequential reveal animation */}
                        <motion.rect
                          initial={{ opacity: 0, scaleY: 0 }}
                          animate={{ opacity: isDeadZone ? 0.15 : (isCaptured ? 0.5 : 0.2), scaleY: 1 }}
                          transition={{ duration: 0.6, delay: idx * 0.15 }}
                          x={beltX}
                          y={y1}
                          width={beltWidth}
                          height={zoneHeight}
                          fill={zone.color}
                          stroke={isDeadZone ? "#374151" : "#fff"}
                          strokeWidth={isDeadZone ? "1" : "3"}
                          strokeDasharray={isDeadZone ? "4,4" : "none"}
                          style={{ transformOrigin: `${beltX}px ${y1}px` }}
                        />
                        
                        {/* Zone label */}
                        {!isDeadZone && (
                          <>
                            <text 
                              x={beltX + 15} 
                              y={y1 + 20} 
                              fontSize="14" 
                              fontWeight="bold" 
                              fill="#1e293b"
                            >
                              {zone.tramp.icon} {zone.tramp.name}
                            </text>
                            <text 
                              x={beltX + 15} 
                              y={y1 + 36} 
                              fontSize="11" 
                              fill="#475569"
                              fontWeight="bold"
                            >
                              Requires ≥ {zone.tramp.threshold} G
                            </text>
                          </>
                        )}
                        
                        {isDeadZone && (
                          <text 
                            x={beltX + beltWidth / 2} 
                            y={y1 + zoneHeight / 2} 
                            textAnchor="middle"
                            fontSize="16" 
                            fontWeight="bold" 
                            fill="#475569"
                            opacity="0.6"
                          >
                            {zone.tramp.icon} DEAD ZONE — Field Too Weak
                          </text>
                        )}
                        
                        {/* Horizontal depth marker at zone limit */}
                        {!isDeadZone && (
                          <>
                            <line
                              x1={beltX - 15}
                              y1={y2}
                              x2={beltX + beltWidth + 15}
                              y2={y2}
                              stroke={isCaptured ? "#22c55e" : "#64748b"}
                              strokeWidth="4"
                              strokeDasharray="10,5"
                            />
                            <circle
                              cx={beltX - 15}
                              cy={y2}
                              r="5"
                              fill={isCaptured ? "#22c55e" : "#64748b"}
                            />
                            <circle
                              cx={beltX + beltWidth + 15}
                              cy={y2}
                              r="5"
                              fill={isCaptured ? "#22c55e" : "#64748b"}
                            />
                            {/* Depth limit label */}
                            <rect
                              x={beltX + beltWidth + 25}
                              y={y2 - 12}
                              width="140"
                              height="24"
                              fill={isCaptured ? "#22c55e" : "#ef4444"}
                              opacity="0.9"
                              rx="4"
                            />
                            <text 
                              x={beltX + beltWidth + 32} 
                              y={y2 + 5} 
                              fontSize="11" 
                              fontWeight="bold" 
                              fill="white"
                            >
                              {zone.tramp.icon} Limit: {Math.round(zone.endDepth)}mm
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Gauss contour overlay lines */}
                  {contourLevels.filter(g => g < selectedModel.G0).map((gauss, idx) => {
                    const depth = Math.log(selectedModel.G0 / gauss) / selectedModel.k;
                    if (depth > totalDepthToShow) return null;
                    
                    const y = magnetHeight + depth * scale;
                    
                    return (
                      <g key={idx}>
                        <line
                          x1={beltX}
                          y1={y}
                          x2={beltX + beltWidth}
                          y2={y}
                          stroke="#fff"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                          opacity="0.6"
                        />
                        <text
                          x={beltX + beltWidth + 10}
                          y={y + 4}
                          fontSize="10"
                          fill="#64748b"
                          fontWeight="bold"
                        >
                          {gauss}G @ {Math.round(depth)}mm
                        </text>
                      </g>
                    );
                  })}

                  {/* AIR GAP + BURDEN DEPTH INDICATOR */}
                  <g>
                    {/* Air gap zone */}
                    <rect 
                      x={beltX} 
                      y={magnetHeight} 
                      width={beltWidth} 
                      height={airGap * scale} 
                      fill="none" 
                      stroke="#0ea5e9" 
                      strokeWidth="3" 
                      strokeDasharray="8,4" 
                    />
                    <text 
                      x={beltX - 180} 
                      y={magnetHeight + (airGap * scale) / 2 + 5} 
                      fontSize="12" 
                      fontWeight="bold" 
                      fill="#0ea5e9"
                    >
                      Air Gap: {airGap}mm →
                    </text>

                    {/* Burden depth zone */}
                    <rect 
                      x={beltX} 
                      y={magnetHeight + airGap * scale} 
                      width={beltWidth} 
                      height={burdenDepth * scale} 
                      fill="#92400e" 
                      fillOpacity="0.25" 
                      stroke="#78350f" 
                      strokeWidth="3" 
                    />
                    {/* Material particles in burden */}
                    {Array.from({ length: 80 }).map((_, i) => (
                      <circle
                        key={i}
                        cx={beltX + 20 + (i % 40) * (beltWidth / 40)}
                        cy={magnetHeight + airGap * scale + 10 + Math.floor(i / 40) * (burdenDepth * scale * 0.45)}
                        r="2.5"
                        fill="#78350f"
                        opacity="0.6"
                      />
                    ))}
                    <text 
                      x={beltX - 180} 
                      y={magnetHeight + airGap * scale + (burdenDepth * scale) / 2 + 5} 
                      fontSize="12" 
                      fontWeight="bold" 
                      fill="#78350f"
                    >
                      Burden: {burdenDepth}mm →
                    </text>

                    {/* CRITICAL: Burden Bottom Line - This is where tramps are located */}
                    <line
                      x1={beltX - 30}
                      y1={magnetHeight + (airGap + burdenDepth) * scale}
                      x2={beltX + beltWidth + 30}
                      y2={magnetHeight + (airGap + burdenDepth) * scale}
                      stroke="#000"
                      strokeWidth="8"
                    />
                    <line
                      x1={beltX - 30}
                      y1={magnetHeight + (airGap + burdenDepth) * scale}
                      x2={beltX + beltWidth + 30}
                      y2={magnetHeight + (airGap + burdenDepth) * scale}
                      stroke="#fbbf24"
                      strokeWidth="5"
                    />
                    
                    {/* Burden line label box */}
                    <rect
                      x={beltX + beltWidth / 2 - 140}
                      y={magnetHeight + (airGap + burdenDepth) * scale - 35}
                      width="280"
                      height="26"
                      fill="#000"
                      opacity="0.85"
                      rx="4"
                    />
                    <text
                      x={beltX + beltWidth / 2}
                      y={magnetHeight + (airGap + burdenDepth) * scale - 16}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill="#fbbf24"
                    >
                      ▼ BURDEN BOTTOM: {airGap + burdenDepth}mm ▼
                    </text>
                    
                    {/* Field strength at tramp depth */}
                    <rect
                      x={beltX + beltWidth / 2 - 120}
                      y={magnetHeight + (airGap + burdenDepth) * scale + 10}
                      width="240"
                      height="22"
                      fill="#dc2626"
                      opacity="0.9"
                      rx="4"
                    />
                    <text
                      x={beltX + beltWidth / 2}
                      y={magnetHeight + (airGap + burdenDepth) * scale + 25}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="bold"
                      fill="white"
                    >
                      Field at Tramp: {Math.round(calculateFieldStrength(airGap + burdenDepth))} G
                    </text>
                  </g>

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

                  {/* TRAMP ICONS AT BOTTOM - Show if in capture zone */}
                  {trampObjects.map((tramp, idx) => {
                    const status = getTrampStatus(tramp);
                    const spacing = beltWidth / (trampObjects.length + 1);
                    const trampX = beltX + spacing * (idx + 1);
                    const trampY = magnetHeight + totalDepth + beltHeight + 35;

                    return (
                      <g key={idx}>
                        {/* Capture zone indicator for this specific tramp */}
                        {status.captured && (
                          <>
                            <circle
                              cx={trampX}
                              cy={trampY}
                              r="30"
                              fill="#22c55e"
                              opacity="0.15"
                            >
                              <animate
                                attributeName="r"
                                values="30;35;30"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                            {/* Line from tramp to its zone */}
                            <line
                              x1={trampX}
                              y1={trampY - 25}
                              x2={trampX}
                              y2={magnetHeight + (airGap + burdenDepth) * scale}
                              stroke="#22c55e"
                              strokeWidth="2"
                              strokeDasharray="4,2"
                              opacity="0.6"
                            />
                          </>
                        )}
                        
                        <rect
                          x={trampX - 24}
                          y={trampY - 24}
                          width="48"
                          height="48"
                          fill={status.captured ? "#22c55e" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth="3"
                          rx="8"
                          opacity={status.captured ? "0.95" : "0.5"}
                        />
                        <text
                          x={trampX}
                          y={trampY + 4}
                          textAnchor="middle"
                          fontSize="24"
                          dominantBaseline="middle"
                        >
                          {tramp.icon}
                        </text>
                        
                        <text
                          x={trampX}
                          y={trampY + 38}
                          textAnchor="middle"
                          fontSize="11"
                          fill={status.captured ? "#166534" : "#991b1b"}
                          fontWeight="bold"
                        >
                          {status.captured ? "✅ IN ZONE" : "⚠️ TOO DEEP"}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 52}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#64748b"
                        >
                          {tramp.name}
                        </text>
                        <text
                          x={trampX}
                          y={trampY + 65}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#475569"
                          fontWeight="bold"
                        >
                          Limit: {status.captureDepth}mm
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

            {/* Legend */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Capture Depth Formula</h3>
                  <div className="font-mono text-sm p-2 bg-background rounded border">
                    d<sub>limit</sub> = ln(G₀ / G<sub>req</sub>) / k
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Each horizontal zone shows the maximum depth where that tramp type can be captured.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Current Setup</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Air Gap:</span>
                      <span className="font-mono font-bold text-sky-600">{airGap} mm</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Burden Depth:</span>
                      <span className="font-mono font-bold text-amber-700">{burdenDepth} mm</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-600 text-white rounded font-bold">
                      <span>Total Depth to Tramps:</span>
                      <span className="font-mono">{airGap + burdenDepth} mm</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-500 text-black rounded font-bold">
                      <span>Field at Tramp Depth:</span>
                      <span className="font-mono">{Math.round(calculateFieldStrength(airGap + burdenDepth))} G</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-sm">Capture Zone Limits</h3>
                <div className="grid grid-cols-2 gap-2">
                  {captureZones.filter(z => z.tramp.name !== "Dead Zone").map((zone, idx) => {
                    const totalTrampDepth = airGap + burdenDepth;
                    const isCaptured = totalTrampDepth <= zone.endDepth;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2 p-2 border-2 rounded ${isCaptured ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}
                      >
                        <span className="text-lg">{zone.tramp.icon}</span>
                        <div className="text-xs flex-1">
                          <div className="font-semibold">{zone.tramp.name}</div>
                          <div className={isCaptured ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                            Limit: {Math.round(zone.endDepth)}mm
                          </div>
                        </div>
                        <span className="text-lg">
                          {isCaptured ? '✅' : '❌'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-background rounded border-l-4 border-l-blue-500">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How to read this:</strong> The bold black/yellow line shows your burden bottom ({airGap + burdenDepth}mm). 
                  Tramps with depth limits above this line (green markers) can be captured. 
                  Tramps with limits below this line (gray markers) are too deep and will be missed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
