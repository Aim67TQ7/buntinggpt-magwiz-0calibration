import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
interface OCWData {
  filename: string;
  prefix?: string;
  suffix?: string;
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
  sealing_plate_mass?: number;
  core_insulator_mass?: number;
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
  cold_ampere_turns_A?: number;
  cold_ampere_turns_B?: number;
  cold_ampere_turns_C?: number;
  hot_ampere_turns_A?: number;
  hot_ampere_turns_B?: number;
  hot_ampere_turns_C?: number;
  ambient_temperature_A?: number;
  ambient_temperature_B?: number;
  ambient_temperature_C?: number;
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
  const [ocwData, setOcwData] = useState<OCWData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OCWData | null>(null);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [suffixes, setSuffixes] = useState<string[]>([]);
  const [availableSuffixes, setAvailableSuffixes] = useState<string[]>([]);
  const [selectedPrefix, setSelectedPrefix] = useState<string>("");
  const [selectedSuffix, setSelectedSuffix] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isComponentsOpen, setIsComponentsOpen] = useState(true);
  useEffect(() => {
    fetchOCWData();
  }, []);
  useEffect(() => {
    if (selectedPrefix && selectedSuffix) {
      const matchingRecord = ocwData.find(record => (record as any).prefix === selectedPrefix && (record as any).suffix === selectedSuffix);
      setSelectedRecord(matchingRecord || null);
    } else {
      setSelectedRecord(null);
    }
  }, [selectedPrefix, selectedSuffix, ocwData]);

  // Update available suffixes when prefix changes
  useEffect(() => {
    if (selectedPrefix) {
      const validSuffixes = suffixes.filter(suffix => ocwData.some(record => (record as any).prefix === selectedPrefix && (record as any).suffix === suffix));
      setAvailableSuffixes(validSuffixes);
      // Reset suffix if current selection is not valid for the new prefix
      if (selectedSuffix && !validSuffixes.includes(selectedSuffix)) {
        setSelectedSuffix("");
      }
    } else {
      setAvailableSuffixes(suffixes);
      setSelectedSuffix("");
    }
  }, [selectedPrefix, suffixes, ocwData, selectedSuffix]);
  const fetchOCWData = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('OCW_magwiz').select('*');
      if (error) throw error;
      setOcwData(data || []);

      // Extract unique prefixes and suffixes from database columns
      const prefixSet = new Set<string>();
      const suffixSet = new Set<string>();
      (data || []).forEach(record => {
        if ((record as any).prefix) prefixSet.add((record as any).prefix);
        if ((record as any).suffix) suffixSet.add((record as any).suffix);
      });

      // Sort numerically instead of alphabetically
      const sortedPrefixes = Array.from(prefixSet).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
      });
      const sortedSuffixes = Array.from(suffixSet).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
      });
      setPrefixes(sortedPrefixes);
      setSuffixes(sortedSuffixes);
      setAvailableSuffixes(sortedSuffixes);
    } catch (error) {
      console.error('Error fetching OCW data:', error);
    } finally {
      setLoading(false);
    }
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
    mass: selectedRecord.sealing_plate_mass
  }, {
    name: "Core Insulator",
    amount: 1,
    material: "Elephantide",
    dimension: selectedRecord.core_insulator_dimension,
    mass: selectedRecord.core_insulator_mass
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
        <div className="text-center">Loading OCW data...</div>
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
          <h1 className="text-3xl font-bold">OCW Magnet Specifications</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prefix</label>
              <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  {prefixes.map(prefix => <SelectItem key={prefix} value={prefix}>
                      {prefix}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Suffix</label>
              <Select value={selectedSuffix} onValueChange={setSelectedSuffix} disabled={!selectedPrefix}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedPrefix ? "Select suffix" : "Select prefix first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSuffixes.map(suffix => <SelectItem key={suffix} value={suffix}>
                      {suffix}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedRecord && <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">Selected: {selectedRecord.filename}</p>
                <p className="text-lg font-semibold text-primary mt-2">
                  Magnet Dimension: {selectedRecord.magnet_dimension || 'N/A'}
                </p>
              </div>}
          </CardContent>
        </Card>
      </div>

      {selectedRecord && <div className="space-y-6">
          {/* Component Table - Collapsible */}
          <Collapsible open={isComponentsOpen} onOpenChange={setIsComponentsOpen}>
            <Card>
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

          {/* Winding Information and Temperature/Electrical Properties - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Winding Information - 33% width */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Winding Information</CardTitle>
              </CardHeader>
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
            </Card>

            {/* Temperature and Electrical Properties - 66% width */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Temperature and Electrical Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium">
                      <span></span>
                      <span>A/20°C</span>
                      <span>B/30°C</span>
                      <span>C/40°C</span>
                    </div>
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
              </CardContent>
            </Card>
          </div>
        </div>}
    </div>;
};
export default OCW;