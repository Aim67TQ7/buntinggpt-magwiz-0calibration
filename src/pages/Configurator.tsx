import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Info, Zap, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

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

interface OCWUnit {
  model: string;
  Prefix: number;
  Suffix: number;
  surface_gauss: number;
  force_factor: number;
  watts: number;
  width: number;
  frame: string;
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
  const navigate = useNavigate();
  const [beltWidth, setBeltWidth] = useState("");
  const [minGauss, setMinGauss] = useState("");
  const [minForce, setMinForce] = useState("");
  const [burdenDepth, setBurdenDepth] = useState("");
  const [coreBeltRatio, setCoreBeltRatio] = useState("0.3");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStream | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [customMaterial, setCustomMaterial] = useState<MaterialStream>({
    name: "",
    density: "",
    surcharge: "",
    moisture: "",
    lumps: "",
    notes: "",
    commonTramp: "",
    specificTramp: ""
  });
  const [ocwUnits, setOcwUnits] = useState<OCWUnit[]>([]);
  const [recommendations, setRecommendations] = useState<OCWUnit[]>([]);
  const [isLoadingOCW, setIsLoadingOCW] = useState(false);
  
  // BOM Pricing states
  const [selectedPrefix, setSelectedPrefix] = useState<number | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<number | null>(null);
  const [availablePrefixes, setAvailablePrefixes] = useState<number[]>([]);
  const [availableSuffixes, setAvailableSuffixes] = useState<number[]>([]);
  const [bomData, setBomData] = useState<any>(null);
  const [isLoadingBOM, setIsLoadingBOM] = useState(false);
  const [selectedBOMType, setSelectedBOMType] = useState<'OCW' | 'Suspension' | 'Overband'>('OCW');
  
  // Tramp Metal Profile states
  const [isTrampMetalOpen, setIsTrampMetalOpen] = useState(false);
  const [trampMaterialStream, setTrampMaterialStream] = useState("sand");
  const [trampMetalTypes, setTrampMetalTypes] = useState({
    loaderTeeth: false,
    rebar: false,
    boltsFasteners: false,
    drillRods: false,
    wireNails: false,
    crusherPlates: false
  });
  const [extractionPriority, setExtractionPriority] = useState<number>(50);

  const handleMaterialSelect = (stream: MaterialStream) => {
    setSelectedMaterial(stream);
    setIsCustomMaterial(false);
  };

  const handleMaterialDoubleClick = (stream: MaterialStream) => {
    setSelectedMaterial(stream);
    setIsCustomMaterial(false);
    setIsDialogOpen(false);
  };

  const handleCustomMaterialSave = () => {
    if (customMaterial.name && customMaterial.density) {
      setSelectedMaterial(customMaterial);
      setIsCustomMaterial(true);
      setIsDialogOpen(false);
    }
  };

  // Fetch OCW data on mount
  useEffect(() => {
    const fetchOCWData = async () => {
      setIsLoadingOCW(true);
      try {
        const { data, error } = await supabase
          .from('BMR_Top' as any)
          .select('model, Prefix, Suffix, surface_gauss, force_factor, watts, width, frame');
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('BMR_Top data fetched:', data);
        
        if (data) {
          setOcwUnits(data as unknown as OCWUnit[]);
          
          // Populate prefix and suffix dropdowns
          const prefixSet = new Set<number>();
          const suffixSet = new Set<number>();
          data.forEach((unit: any) => {
            prefixSet.add(unit.Prefix);
            suffixSet.add(unit.Suffix);
          });
          setAvailablePrefixes(Array.from(prefixSet).sort((a, b) => a - b));
          setAvailableSuffixes(Array.from(suffixSet).sort((a, b) => a - b));
        }
      } catch (error) {
        console.error('Error fetching OCW data:', error);
      } finally {
        setIsLoadingOCW(false);
      }
    };

    fetchOCWData();
  }, []);

  // Calculate BOM Pricing
  const calculateBOMPricing = async (prefix: number, suffix: number, bomType: 'OCW' | 'Suspension' | 'Overband' = 'OCW') => {
    setIsLoadingBOM(true);
    try {
      // 1. Get magnet data from BMR_magwiz
      const { data: magwizData, error: magwizError } = await supabase
        .from('BMR_magwiz' as any)
        .select('*')
        .eq('prefix', prefix)
        .eq('suffix', suffix)
        .maybeSingle();
      
      if (magwizError) throw magwizError;
      if (!magwizData) {
        console.error('No magwiz data found for', prefix, suffix);
        setBomData(null);
        return;
      }
      
      // 2. Get BOM ID (3=OCW, 6=Suspension, 7=Overband)
      const bomId = bomType === 'OCW' ? 3 : bomType === 'Suspension' ? 6 : 7;
      
      // 3. Get parts list for this BOM type
      const { data: partsData, error: partsError } = await supabase
        .from('BMR_parts' as any)
        .select('id, name, amount, material')
        .eq('bom', bomId);
      
      if (partsError) throw partsError;
      
      // 4. Get materials data
      const { data: materialsData, error: materialsError } = await supabase
        .from('BMR_materials' as any)
        .select('id, name, cost_per_unit, density');
      
      if (materialsError) throw materialsError;
      
      // Create a map of materials by id
      const materialsMap = new Map();
      materialsData?.forEach((mat: any) => {
        materialsMap.set(mat.id, mat);
      });
      
      // 5. Calculate costs for each part
      const partsCostBreakdown = partsData.map((part: any) => {
        const partNameLower = part.name.toLowerCase();
        let mass = 0;
        
        // Map part names to BMR_magwiz mass columns
        if (partNameLower.includes('core') && !partNameLower.includes('backbar')) {
          mass = (magwizData as any).core_mass || 0;
        } else if (partNameLower.includes('winding')) {
          mass = (magwizData as any).winding_mass || 0;
        } else if (partNameLower.includes('backbar') && !partNameLower.includes('core')) {
          mass = (magwizData as any).backbar_mass || 0;
        } else if (partNameLower.includes('core') && partNameLower.includes('backbar')) {
          mass = (magwizData as any).core_backbar_mass || 0;
        } else if (partNameLower.includes('side pole')) {
          mass = (magwizData as any).side_pole_mass || 0;
        } else if (partNameLower.includes('sealing')) {
          mass = parseFloat((magwizData as any).sealing_plate_mass) || 0;
        } else if (partNameLower.includes('insulator')) {
          mass = parseFloat((magwizData as any).core_insulator_mass) || 0;
        } else if (partNameLower.includes('conservator')) {
          mass = (magwizData as any).conservator_mass || 0;
        } else if (partNameLower.includes('coolant')) {
          mass = (magwizData as any).coolant_mass || 0;
        }
        
        // Get material info from the map
        const material = materialsMap.get(part.material);
        const materialCost = material?.cost_per_unit || 0;
        const quantity = part.amount || 1;
        const totalCost = mass * materialCost * quantity;
        
        return {
          partName: part.name,
          material: material?.name || 'Unknown',
          mass,
          quantity,
          materialCost,
          totalCost
        };
      });
      
      const totalMass = partsCostBreakdown.reduce((sum, part) => sum + part.mass, 0);
      const totalCost = partsCostBreakdown.reduce((sum, part) => sum + part.totalCost, 0);
      
      setBomData({
        prefix,
        suffix,
        bomType,
        parts: partsCostBreakdown,
        totalMass,
        totalCost,
        magwizData
      });
      
    } catch (error) {
      console.error('Error calculating BOM pricing:', error);
    } finally {
      setIsLoadingBOM(false);
    }
  };

  // Calculate OCW recommendations
  const calculateRecommendations = () => {
    if (!beltWidth || !coreBeltRatio) return;

    console.log('Total OCW units available:', ocwUnits.length);

    const beltWidthNum = parseFloat(beltWidth);
    const coreBeltRatioNum = parseFloat(coreBeltRatio);
    const minGaussNum = minGauss ? parseFloat(minGauss) : 0;
    const minForceNum = minForce ? parseFloat(minForce) : 0;
    
    // Calculate minimum suffix: (beltWidth * coreBeltRatio) / 10
    const minSuffix = Math.round((beltWidthNum * coreBeltRatioNum) / 10);

    console.log('Calculation:', { 
      beltWidth: beltWidthNum, 
      coreBeltRatio: coreBeltRatioNum, 
      minSuffix,
      minGauss: minGaussNum,
      minForce: minForceNum
    });

    // Belt width tolerance (-10% to +20%)
    const widthMin = beltWidthNum * 0.9;  // -10%
    const widthMax = beltWidthNum * 1.2;  // +20%

    console.log('Width range:', { widthMin, widthMax });

    // Filter units where:
    // - Suffix >= minSuffix
    // - Width is within tolerance
    // - Gauss >= minGauss (if specified)
    // - Force >= minForce (if specified)
    const filtered = ocwUnits
      .filter(unit => {
        const meetsGaussReq = minGaussNum === 0 || (unit.surface_gauss >= minGaussNum);
        const meetsForceReq = minForceNum === 0 || (unit.force_factor >= minForceNum);
        
        return (
          unit.Suffix >= minSuffix &&
          unit.width >= widthMin &&
          unit.width <= widthMax &&
          meetsGaussReq &&
          meetsForceReq
        );
      })
      .sort((a, b) => {
        // Sort by Suffix (ascending), then by Prefix (ascending)
        if (a.Suffix !== b.Suffix) {
          return a.Suffix - b.Suffix;
        }
        return a.Prefix - b.Prefix;
      });

    console.log('Filtered recommendations:', filtered.length);
    setRecommendations(filtered);
  };

  // Navigate to OCW page with selected unit and auto-expand sections
  const handleOCWClick = (unit: OCWUnit) => {
    navigate(`/ocw?prefix=${unit.Prefix}&suffix=${unit.Suffix}&expand=true`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">OCW Design</h1>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Manual Selection Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Or select manually:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label>BMR Prefix</Label>
                  <Select 
                    value={selectedPrefix?.toString() || ""} 
                    onValueChange={(value) => setSelectedPrefix(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="000" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrefixes.map((prefix) => (
                        <SelectItem key={prefix} value={prefix.toString()}>
                          {prefix}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <span className="mt-8">-</span>
                
                <div className="space-y-2 flex-1">
                  <Label>Suffix</Label>
                  <Select 
                    value={selectedSuffix?.toString() || ""} 
                    onValueChange={(value) => setSelectedSuffix(parseInt(value))}
                    disabled={!selectedPrefix}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSuffixes
                        .filter(suffix => {
                          if (!selectedPrefix) return true;
                          return ocwUnits.some(unit => 
                            unit.Prefix === selectedPrefix && unit.Suffix === suffix
                          );
                        })
                        .map((suffix) => (
                          <SelectItem key={suffix} value={suffix.toString()}>
                            {suffix}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  if (selectedPrefix && selectedSuffix) {
                    const selectedUnit = ocwUnits.find(
                      u => u.Prefix === selectedPrefix && u.Suffix === selectedSuffix
                    );
                    if (selectedUnit) {
                      navigate('/ocw-specs', { state: { unit: selectedUnit } });
                    }
                  }
                }}
                disabled={!selectedPrefix || !selectedSuffix}
                className="w-full"
              >
                View OCW Specifications
              </Button>
            </CardContent>
          </Card>
        </div>


        {/* OCW Recommendations Card */}
        {beltWidth && coreBeltRatio && recommendations.length === 0 && ocwUnits.length === 0 && !isLoadingOCW && (
          <Card className="mt-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No OCW data available in the BMR_Top table. Please add data to the table first.</p>
            </CardContent>
          </Card>
        )}
        
        {beltWidth && coreBeltRatio && recommendations.length === 0 && ocwUnits.length > 0 && !isLoadingOCW && (
          <Card className="mt-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No OCW units match the criteria. Try adjusting the belt width or core/belt ratio.</p>
            </CardContent>
          </Card>
        )}
        
        {recommendations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Recommended OCW Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((unit, index) => {
                  const beltWidthNum = parseFloat(beltWidth);
                  const matchPercentage = ((unit.width / beltWidthNum) * 100).toFixed(0);
                  
                  return (
                    <button
                      key={index}
                      className="w-full text-left p-3 rounded-md border hover:bg-primary/5 hover:border-primary transition-colors"
                      onClick={() => handleOCWClick(unit)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-bold text-sm">
                          {unit.Prefix} OCW {unit.Suffix}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Gauss: <span className="font-medium">{unit.surface_gauss}</span></span>
                          <span>Force: <span className="font-medium">{unit.force_factor}</span></span>
                          <span>Watts: <span className="font-medium">{unit.watts}</span></span>
                          <span>Width: <span className="font-medium">{unit.width}mm ({matchPercentage}%)</span></span>
                          <span>Frame: <span className="font-medium">{unit.frame}</span></span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Configurator;