import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, Calculator, Waves } from "lucide-react";
import { Link } from "react-router-dom";
interface OCWData {
  filename: string;
  prefix?: number;
  suffix?: number;
  belt_width?: number;
  core_dimension?: string;
  winding_dimension?: string;
  backbar_dimension?: string;
  core_backbar_dimension?: string;
  side_pole_dimension?: string;
  sealing_plate_dimension?: string;
  core_insulator_dimension?: string;
  conservator_dimension?: string;
  magnet_dimension?: string;
  core_mass?: number;
  winding_mass?: number;
  backbar_mass?: number;
  core_backbar_mass?: number;
  side_pole_mass?: number;
  sealing_plate_mass?: string;
  core_insulator_mass?: string;
  conservator_mass?: number;
  coolant_mass?: number;
  total_mass?: number;
  radial_depth?: number;
  coil_height?: number;
  number_of_sections?: number;
  diameter?: number;
  mean_length_of_turn?: number;
  number_of_turns?: string;
  surface_area?: number;
  wires_in_parallel?: number;
  voltage_A?: number;
  voltage_B?: number;
  voltage_C?: number;
  resistance_A?: number;
  resistance_B?: number;
  resistance_C?: number;
  watts_A?: number;
  watts_B?: number;
  watts_C?: number;
  cold_current_A?: number;
  cold_current_B?: number;
  cold_current_C?: number;
  hot_current_A?: number;
  hot_current_B?: number;
  hot_current_C?: number;
  cold_ampere_turns_A?: string;
  cold_ampere_turns_B?: string;
  cold_ampere_turns_C?: string;
  hot_ampere_turns_A?: number;
  hot_ampere_turns_B?: number;
  hot_ampere_turns_C?: number;
  ambient_temperature_A?: string;
  ambient_temperature_B?: string;
  ambient_temperature_C?: string;
  temperature_rise_A?: number;
  temperature_rise_B?: number;
  temperature_rise_C?: number;
  maximum_rise_A?: number;
  maximum_rise_B?: number;
  maximum_rise_C?: number;
  expected_rise_A?: number;
  expected_rise_B?: number;
  expected_rise_C?: number;
}
const OCW = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ocwData, setOcwData] = useState<OCWData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OCWData | null>(null);
  const [prefixes, setPrefixes] = useState<number[]>([]);
  const [suffixes, setSuffixes] = useState<number[]>([]);
  const [availableSuffixes, setAvailableSuffixes] = useState<number[]>([]);
  const [selectedPrefix, setSelectedPrefix] = useState<number | undefined>(undefined);
  const [selectedSuffix, setSelectedSuffix] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isComponentsOpen, setIsComponentsOpen] = useState(false);
  const [isWindingOpen, setIsWindingOpen] = useState(false);
  const [isTempElectricalOpen, setIsTempElectricalOpen] = useState(false);
  
  // Calculation inputs
  const [beltWidth, setBeltWidth] = useState<number>(1200);
  const [coreBeltRatio, setCoreBeltRatio] = useState<number>(0.5);
  const [recommendations, setRecommendations] = useState<Array<{prefix: number, suffix: number, distance: number, belt_width: number}>>([]);
  
  // Tramp metal profile states
  const [isTrampMetalOpen, setIsTrampMetalOpen] = useState(false);
  const [materialStream, setMaterialStream] = useState<string>("sand");
  const [trampMetalTypes, setTrampMetalTypes] = useState({
    loaderTeeth: false,
    rebar: false,
    boltsFasteners: false,
    drillRods: false,
    wireNails: false,
    crusherPlates: false
  });
  const [extractionPriority, setExtractionPriority] = useState<number>(50);
  useEffect(() => {
    const loadData = async () => {
      await fetchOCWData();
      
      // Check for URL parameters to restore selection AFTER data is loaded
      const prefixParam = searchParams.get('prefix');
      const suffixParam = searchParams.get('suffix');
      const expandParam = searchParams.get('expand');
      
      if (prefixParam) {
        setSelectedPrefix(Number(prefixParam));
      }
      if (suffixParam) {
        setSelectedSuffix(Number(suffixParam));
      }
      
      // Auto-expand sections if expand=true
      if (expandParam === 'true') {
        setIsComponentsOpen(true);
        setIsWindingOpen(true);
        setIsTempElectricalOpen(true);
      }
    };
    
    loadData();
  }, [searchParams]);
  useEffect(() => {
    if (selectedPrefix !== undefined && selectedSuffix !== undefined) {
      const matchingRecord = ocwData.find(record => record.prefix === selectedPrefix && record.suffix === selectedSuffix);
      setSelectedRecord(matchingRecord || null);
    } else {
      setSelectedRecord(null);
    }
  }, [selectedPrefix, selectedSuffix, ocwData]);

  // Update available suffixes when prefix changes
  useEffect(() => {
    if (selectedPrefix !== undefined) {
      const validSuffixes = suffixes.filter(suffix => ocwData.some(record => record.prefix === selectedPrefix && record.suffix === suffix));
      setAvailableSuffixes(validSuffixes);
      // Only reset suffix if it was manually changed and is invalid (not from URL)
      const suffixParam = searchParams.get('suffix');
      if (selectedSuffix !== undefined && !validSuffixes.includes(selectedSuffix) && !suffixParam) {
        setSelectedSuffix(undefined);
      }
    } else {
      setAvailableSuffixes(suffixes);
      if (!searchParams.get('suffix')) {
        setSelectedSuffix(undefined);
      }
    }
  }, [selectedPrefix, suffixes, ocwData]);
  const fetchOCWData = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('BMR_magwiz').select('*');
      if (error) throw error;
      setOcwData(data || []);

      // Extract unique prefixes and suffixes from database columns
      const prefixSet = new Set<number>();
      const suffixSet = new Set<number>();
      (data || []).forEach(record => {
        if (record.prefix !== null && record.prefix !== undefined) prefixSet.add(record.prefix);
        if (record.suffix !== null && record.suffix !== undefined) suffixSet.add(record.suffix);
      });
      setPrefixes(Array.from(prefixSet).sort((a, b) => a - b));
      setSuffixes(Array.from(suffixSet).sort((a, b) => a - b));
      setAvailableSuffixes(Array.from(suffixSet).sort((a, b) => a - b));
    } catch (error) {
      console.error('Error fetching BMR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRecommendations = () => {
    const targetValue = beltWidth * coreBeltRatio;
    
    // Find 3-4 closest prefixes
    const prefixDistances = prefixes.map(prefix => ({
      prefix,
      distance: Math.abs(prefix - targetValue)
    })).sort((a, b) => a.distance - b.distance).slice(0, 4);
    
    // For each selected prefix, find the 2 nearest suffixes based on belt_width
    const allRecommendations: Array<{prefix: number, suffix: number, distance: number, belt_width: number}> = [];
    
    prefixDistances.forEach(({prefix}) => {
      const prefixRecords = ocwData.filter(record => record.prefix === prefix && record.belt_width);
      const suffixDistances = prefixRecords.map(record => ({
        prefix: record.prefix!,
        suffix: record.suffix!,
        belt_width: record.belt_width!,
        distance: Math.abs(record.belt_width! - beltWidth)
      })).sort((a, b) => a.distance - b.distance).slice(0, 2);
      
      allRecommendations.push(...suffixDistances);
    });
    
    setRecommendations(allRecommendations.sort((a, b) => a.distance - b.distance));
  };

  const componentData = selectedRecord ? [{
    name: "Core",
    amount: 1,
    material: "Mild Steel",
    dimension: selectedRecord.core_dimension,
    mass: selectedRecord.core_mass
  }, {
    name: "Winding",
    amount: 1,
    material: "Aluminium Nomex",
    dimension: selectedRecord.winding_dimension,
    mass: selectedRecord.winding_mass
  }, {
    name: "Backbar",
    amount: 1,
    material: "Mild Steel",
    dimension: selectedRecord.backbar_dimension,
    mass: selectedRecord.backbar_mass
  }, {
    name: "Core Backbar",
    amount: 1,
    material: "Mild Steel",
    dimension: selectedRecord.core_backbar_dimension,
    mass: selectedRecord.core_backbar_mass
  }, {
    name: "Side Pole",
    amount: 4,
    material: "Mild Steel",
    dimension: selectedRecord.side_pole_dimension,
    mass: selectedRecord.side_pole_mass
  }, {
    name: "Sealing Plate",
    amount: 1,
    material: "Manganese Steel",
    dimension: selectedRecord.sealing_plate_dimension,
    mass: selectedRecord.sealing_plate_mass ? parseFloat(selectedRecord.sealing_plate_mass) : undefined
  }, {
    name: "Core Insulator",
    amount: 1,
    material: "Elephantide",
    dimension: selectedRecord.core_insulator_dimension,
    mass: selectedRecord.core_insulator_mass ? parseFloat(selectedRecord.core_insulator_mass) : undefined
  }, {
    name: "Conservator",
    amount: 1,
    material: "Mild Steel",
    dimension: selectedRecord.conservator_dimension,
    mass: selectedRecord.conservator_mass
  }, {
    name: "Coolant",
    amount: 7563,
    material: "Oil",
    dimension: "-",
    mass: selectedRecord.coolant_mass
  }].filter(item => item.mass !== undefined && item.mass !== null) : [];
  if (loading) {
    return <div className="container mx-auto p-6">
        <div className="text-center">Loading BMR data...</div>
      </div>;
  }
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calculator
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">BMR Magnet Specifications</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Decay Chart and Field Simulator Buttons */}
          {selectedRecord && (
            <div className="flex items-center gap-2">
              {/* Field Simulator Button */}
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  // Extract magnet model from filename (e.g., "55 OCW 25" from filename)
                  const modelMatch = selectedRecord.filename?.match(/(\d+)\s*OCW\s*(\d+)/);
                  const modelName = modelMatch ? `${modelMatch[1]} OCW ${modelMatch[2]}` : '55 OCW 25';
                  
                  navigate('/field-simulator', {
                    state: {
                      model: modelName,
                      beltWidth: selectedRecord.belt_width,
                      magnetDimension: selectedRecord.magnet_dimension
                    }
                  });
                }}
              >
                <Waves className="w-4 h-4 mr-2" />
                Field Simulator
              </Button>
              
              {[20, 30, 40, 45].map((temp) => (
                <Button
                  key={temp}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // For now, only A20 is implemented, others will be added later
                    if (temp === 20) {
                      navigate('/magnetic-decay', {
                        state: {
                          model: selectedRecord.filename,
                          gauss: 2410, // This should come from BMR_Top table
                          force: 499496, // This should come from BMR_Top table
                          ambient: temp
                        }
                      });
                    }
                  }}
                  disabled={temp !== 20}
                >
                  A{temp} Gauss
                </Button>
              ))}
            </div>
          )}
          
          {/* Compact selector in upper right */}
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
            <span className="text-sm font-medium">BMR</span>
            <Select value={selectedPrefix?.toString()} onValueChange={value => setSelectedPrefix(Number(value))}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue placeholder="000" />
              </SelectTrigger>
              <SelectContent>
                {prefixes.map(prefix => <SelectItem key={prefix} value={prefix.toString()}>
                    {prefix}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm">-</span>
            <Select value={selectedSuffix?.toString()} onValueChange={value => setSelectedSuffix(Number(value))} disabled={selectedPrefix === undefined}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue placeholder="00" />
              </SelectTrigger>
              <SelectContent>
                {availableSuffixes.map(suffix => <SelectItem key={suffix} value={suffix.toString()}>
                    {suffix}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedRecord && <div className="bg-muted rounded-lg p-3 text-sm">
          <p className="font-medium">Selected: {selectedRecord.filename}</p>
          <p className="text-base font-semibold text-primary mt-1">
            Magnet Dimension: {selectedRecord.magnet_dimension || 'N/A'}
          </p>
        </div>}

      {selectedRecord && <div className="space-y-6">
          {/* Component Specifications and Winding Information - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Component Table - Collapsible - 60% width */}
            <Collapsible open={isComponentsOpen} onOpenChange={setIsComponentsOpen}>
              <Card className="lg:col-span-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Component Specifications</CardTitle>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isComponentsOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>Dimension</TableHead>
                          <TableHead>Mass</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {componentData.map((component, index) => <TableRow key={index} className="h-10">
                            <TableCell className="font-medium py-2">{component.name}</TableCell>
                            <TableCell className="py-2">{component.amount}</TableCell>
                            <TableCell className="py-2">{component.material}</TableCell>
                            <TableCell className="py-2">{component.dimension || 'N/A'}</TableCell>
                            <TableCell className="py-2">{component.mass?.toFixed(2) || 'N/A'}</TableCell>
                          </TableRow>)}
                        <TableRow className="font-bold h-10">
                          <TableCell colSpan={4} className="py-2">Total</TableCell>
                          <TableCell className="py-2">{selectedRecord.total_mass?.toFixed(2) || 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Winding Information - 40% width */}
            <Collapsible open={isWindingOpen} onOpenChange={setIsWindingOpen}>
              <Card className="lg:col-span-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Winding Information</CardTitle>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isWindingOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Radial Depth:</span>
                          <span>{selectedRecord.radial_depth || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Coil Height:</span>
                          <span>{selectedRecord.coil_height || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Sections:</span>
                          <span>{selectedRecord.number_of_sections || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Diameter:</span>
                          <span>{selectedRecord.diameter || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mean Length of Turn:</span>
                          <span>{selectedRecord.mean_length_of_turn || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Turns:</span>
                          <span>{selectedRecord.number_of_turns || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Surface Area:</span>
                          <span>{selectedRecord.surface_area || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wires in Parallel:</span>
                          <span>{selectedRecord.wires_in_parallel || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>


          {/* Temperature and Electrical Properties - Full width below */}
          <Collapsible open={isTempElectricalOpen} onOpenChange={setIsTempElectricalOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Temperature and Electrical Properties</CardTitle>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isTempElectricalOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Ambient Temperature:</span>
                          <span>{selectedRecord.ambient_temperature_A || 'N/A'}</span>
                          <span>{selectedRecord.ambient_temperature_B || 'N/A'}</span>
                          <span>{selectedRecord.ambient_temperature_C || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Temperature Rise:</span>
                          <span>{selectedRecord.temperature_rise_A || 'N/A'}</span>
                          <span>{selectedRecord.temperature_rise_B || 'N/A'}</span>
                          <span>{selectedRecord.temperature_rise_C || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Maximum Rise:</span>
                          <span>{selectedRecord.maximum_rise_A || 'N/A'}</span>
                          <span>{selectedRecord.maximum_rise_B || 'N/A'}</span>
                          <span>{selectedRecord.maximum_rise_C || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Expected Rise:</span>
                          <span>{selectedRecord.expected_rise_A?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.expected_rise_B?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.expected_rise_C?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Voltage:</span>
                          <span>{selectedRecord.voltage_A || 'N/A'}</span>
                          <span>{selectedRecord.voltage_B || 'N/A'}</span>
                          <span>{selectedRecord.voltage_C || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Resistance:</span>
                          <span>{selectedRecord.resistance_A?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.resistance_B?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.resistance_C?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Watts:</span>
                          <span>{selectedRecord.watts_A || 'N/A'}</span>
                          <span>{selectedRecord.watts_B || 'N/A'}</span>
                          <span>{selectedRecord.watts_C || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Cold Current:</span>
                          <span>{selectedRecord.cold_current_A?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.cold_current_B?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.cold_current_C?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Hot Current:</span>
                          <span>{selectedRecord.hot_current_A?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.hot_current_B?.toFixed(2) || 'N/A'}</span>
                          <span>{selectedRecord.hot_current_C?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Cold Ampere Turns:</span>
                          <span>{selectedRecord.cold_ampere_turns_A || 'N/A'}</span>
                          <span>{selectedRecord.cold_ampere_turns_B || 'N/A'}</span>
                          <span>{selectedRecord.cold_ampere_turns_C || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <span>Hot Ampere Turns:</span>
                          <span>{selectedRecord.hot_ampere_turns_A || 'N/A'}</span>
                          <span>{selectedRecord.hot_ampere_turns_B || 'N/A'}</span>
                          <span>{selectedRecord.hot_ampere_turns_C || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6">
                      <Button 
                        onClick={() => {
                          const params = new URLSearchParams({
                            prefix: selectedRecord.prefix?.toString() || '',
                            suffix: selectedRecord.suffix?.toString() || '',
                            data: encodeURIComponent(JSON.stringify(selectedRecord))
                          });
                          navigate(`/winding-sheet?${params.toString()}`);
                        }}
                        className="flex-1"
                      >
                        View Winding Sheet
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
        </div>}
    </div>;
};
export default OCW;