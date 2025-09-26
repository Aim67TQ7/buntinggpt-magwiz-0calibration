import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Info } from "lucide-react";

interface MaterialStream {
  name: string;
  density: string;
  surcharge: string;
  moisture: string;
  lumps: string;
  notes: string;
  commonTramp: string;
  specificTramp: string;
}

const materialStreams: MaterialStream[] = [
  {
    name: "Coal (bituminous / thermal)",
    density: "0.80–1.00 t/m³",
    surcharge: "20–25°",
    moisture: "5–12%",
    lumps: "≤150 mm",
    notes: "flow: free → slightly cohesive when wet",
    commonTramp: "fasteners, hardware, wear plates, wire rope pieces",
    specificTramp: "roof bolts/plates, cable & splice wire, continuous miner pick points, cutting chain fragments, drill steel, belt clips"
  },
  {
    name: "Iron Ore (crushed / screened)",
    density: "2.0–2.5 t/m³",
    surcharge: "20–25°",
    moisture: "2–8%",
    lumps: "≤250 mm",
    notes: "abrasive",
    commonTramp: "fasteners, wear parts",
    specificTramp: "crusher teeth, grizzly bars, drill rods, shovel bucket lips/teeth, blast/rebar fragments, wire rope/cable eyes"
  },
  {
    name: "Copper Ore (sulfide porphyry, crushed)",
    density: "1.6–2.2 t/m³",
    surcharge: "20–25°",
    moisture: "2–6%",
    lumps: "≤200 mm",
    notes: "",
    commonTramp: "fasteners, wear plates",
    specificTramp: "blast fragments, mill ball chips, liner pieces, screen media hooks, cable whips"
  },
  {
    name: "Precious Metal Ores (gold/silver)",
    density: "1.6–2.0 t/m³",
    surcharge: "20–25°",
    moisture: "2–8%",
    lumps: "≤200 mm",
    notes: "",
    commonTramp: "fasteners, hardware",
    specificTramp: "drill steel, ANFO cap wires, crusher tooth segments, chute liner shards, cable"
  },
  {
    name: "Limestone / Aggregates",
    density: "1.5–1.7 t/m³",
    surcharge: "20–25°",
    moisture: "1–5%",
    lumps: "≤200 mm",
    notes: "",
    commonTramp: "fasteners, wear plates",
    specificTramp: "drill steel, screen deck hooks, blast fragments, rebar (from recycled base), bucket teeth"
  },
  {
    name: "Sand (construction / silica)",
    density: "1.4–1.6 t/m³",
    surcharge: "15–20°",
    moisture: "2–8%",
    lumps: "fine",
    notes: "can be fluidized when dry",
    commonTramp: "fasteners, tools",
    specificTramp: "screen wire pieces, cable ties/wire, liner chips (small)"
  },
  {
    name: "Cement Clinker",
    density: "1.2–1.5 t/m³",
    surcharge: "20–25°",
    moisture: "≤1%",
    lumps: "≤75 mm",
    notes: "hot/abrasive",
    commonTramp: "fasteners, wear parts",
    specificTramp: "grate bar fragments, refractory anchors, chain links from conveyors, cooler liner shards"
  },
  {
    name: "Potash (granular / standard)",
    density: "1.0–1.2 t/m³",
    surcharge: "25–30°",
    moisture: "0.5–2%",
    lumps: "friable",
    notes: "",
    commonTramp: "stainless/galv hardware, belt clips",
    specificTramp: "screen wires, mild steel fragments from handling gear (aim to keep ferrous out to protect product quality)"
  },
  {
    name: "Phosphate Rock",
    density: "1.5–1.7 t/m³",
    surcharge: "20–25°",
    moisture: "3–8%",
    lumps: "≤150 mm",
    notes: "",
    commonTramp: "fasteners, wear plates",
    specificTramp: "drag chain pieces, crusher teeth, chute liner sections, wire rope"
  },
  {
    name: "Bauxite / Alumina (calcined or hydrate)",
    density: "1.2–1.5 t/m³",
    surcharge: "20–25°",
    moisture: "1–6%",
    lumps: "",
    notes: "hydrate lower density",
    commonTramp: "fasteners, wear parts",
    specificTramp: "ship-unloader wear bits, screen hooks, cable ends"
  },
  {
    name: "Wood Chips / Biomass",
    density: "0.25–0.35 t/m³",
    surcharge: "35–45°",
    moisture: "20–50%",
    lumps: "fibrous",
    notes: "",
    commonTramp: "fasteners",
    specificTramp: "nails, lag screws, wire mesh pieces, cables, staple strips, tooling"
  },
  {
    name: "MSW / RDF (pre-processed)",
    density: "0.15–0.30 t/m³",
    surcharge: "30–40°",
    moisture: "variable",
    lumps: "highly heterogeneous",
    notes: "",
    commonTramp: "fasteners, wear parts",
    specificTramp: "conveyor components (lost rollers/brackets), wire bundles, engine components (ferrous), rebar, plate, tools"
  },
  {
    name: "Auto Shredder Residue (ASR)",
    density: "0.30–0.50 t/m³",
    surcharge: "25–35°",
    moisture: "5–15%",
    lumps: "fines + light frags",
    notes: "",
    commonTramp: "fasteners, hardware",
    specificTramp: "engine parts/alternators, wire harness, conveyor fragments, plate shards, crusher teeth carryover"
  },
  {
    name: "Blast Furnace / Sinter / Pellet Fines",
    density: "1.0–1.6 (dust/fines) to 1.9–2.2 (pellet fines) t/m³",
    surcharge: "18–25°",
    moisture: "3–12%",
    lumps: "",
    notes: "",
    commonTramp: "fasteners, wear plates",
    specificTramp: "blast fragments, tuyere hardware, refractory clips, chain links"
  },
  {
    name: "Glass Cullet",
    density: "1.1–1.4 t/m³",
    surcharge: "25–30°",
    moisture: "1–5%",
    lumps: "",
    notes: "",
    commonTramp: "fasteners, hardware",
    specificTramp: "wire mesh from screens, can ends (tinplate), processing tool bits, small cable pieces"
  },
  {
    name: "Wind-Turbine Recycling (composites + metals)",
    density: "0.4–1.2 t/m³",
    surcharge: "20–35°",
    moisture: "variable",
    lumps: "mix of composite, steel, copper",
    notes: "",
    commonTramp: "fasteners, wear parts",
    specificTramp: "copper cables, gearbox/engine components, plate sections, rebar from foundations, wire rope"
  }
];

const Configurator = () => {
  const [beltWidth, setBeltWidth] = useState("");
  const [beltSpeed, setBeltSpeed] = useState("");
  const [burdenDepth, setBurdenDepth] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStream | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Magnet Configurator</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Required Inputs Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Required Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beltWidth">Belt Width (mm)</Label>
                  <Input
                    id="beltWidth"
                    type="number"
                    placeholder="1200"
                    value={beltWidth}
                    onChange={(e) => setBeltWidth(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="beltSpeed">Belt Speed (m/s)</Label>
                  <Input
                    id="beltSpeed"
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={beltSpeed}
                    onChange={(e) => setBeltSpeed(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="burdenDepth">Burden Depth (mm)</Label>
                  <Input
                    id="burdenDepth"
                    type="number"
                    placeholder="50"
                    value={burdenDepth}
                    onChange={(e) => setBurdenDepth(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Info className="w-4 h-4 mr-2" />
                      {selectedMaterial ? selectedMaterial.name : "Select Material Stream"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Material Streams & Tramp Metal Guide</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-4">
                        {materialStreams.map((stream, index) => (
                          <Card 
                            key={index} 
                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedMaterial?.name === stream.name ? 'border-primary' : ''
                            }`}
                            onClick={() => setSelectedMaterial(stream)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{stream.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Density:</span> {stream.density}
                                </div>
                                <div>
                                  <span className="font-medium">Surcharge:</span> {stream.surcharge}
                                </div>
                                <div>
                                  <span className="font-medium">Moisture:</span> {stream.moisture}
                                </div>
                                <div>
                                  <span className="font-medium">Lumps:</span> {stream.lumps}
                                </div>
                              </div>
                              
                              {stream.notes && (
                                <div className="text-sm">
                                  <span className="font-medium">Notes:</span> {stream.notes}
                                </div>
                              )}
                              
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Common Tramp:</span> {stream.commonTramp}
                                </div>
                                <div>
                                  <span className="font-medium">Stream-Specific Tramp:</span> {stream.specificTramp}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          
          {/* Selected Material Summary */}
          {selectedMaterial && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Selected Material</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-3">{selectedMaterial.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-medium">Density:</span> {selectedMaterial.density}</div>
                    <div><span className="font-medium">Surcharge:</span> {selectedMaterial.surcharge}</div>
                    <div><span className="font-medium">Moisture:</span> {selectedMaterial.moisture}</div>
                    <div><span className="font-medium">Lumps:</span> {selectedMaterial.lumps}</div>
                  </div>
                  {selectedMaterial.notes && (
                    <div><span className="font-medium">Notes:</span> {selectedMaterial.notes}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configurator;