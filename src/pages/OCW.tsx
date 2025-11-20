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
import { ArrowLeft, ChevronDown, Calculator, Waves, Settings, X, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useOCWList, OCWRecommendation } from "@/contexts/OCWListContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface TrampMetalProfile {
  value: string;
  label: string;
  description: string;
}

const TRAMP_METAL_PROFILES: TrampMetalProfile[] = [
  { value: "mining-general", label: "Mining - General", description: "Standard mining tramp: loader teeth, rebar, fasteners" },
  { value: "mining-heavy", label: "Mining - Heavy", description: "Heavy duty: drill rods, crusher plates, large fasteners" },
  { value: "quarry", label: "Quarry & Aggregates", description: "Screen hooks, blast fragments, bucket teeth" },
  { value: "coal", label: "Coal Processing", description: "Roof bolts, cable wire, continuous miner picks" },
  { value: "recycling", label: "Recycling", description: "Wire bundles, engine components, mixed ferrous" },
  { value: "industrial", label: "Industrial", description: "Tools, fasteners, wear plates, cable pieces" },
];

const OCW = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { 
    recommendations, 
    setRecommendations, 
    selectedOCW, 
    setSelectedOCW,
    inputParameters,
    setInputParameters,
    clearList,
    hasActiveList 
  } = useOCWList();

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
  
  const [beltSpeed, setBeltSpeed] = useState<number>(1.5);
  const [beltWidth, setBeltWidth] = useState<number>(1200);
  const [burdenDepth, setBurdenDepth] = useState<number>(100);
  const [throughput, setThroughput] = useState<number>(500);
  const [airGap, setAirGap] = useState<number>(150);
  const [coreBeltRatio, setCoreBeltRatio] = useState<number>(0.25);
  const [magnetPosition, setMagnetPosition] = useState<string>("overhead");
  const [bulkDensity, setBulkDensity] = useState<number>(1.8);
  const [waterContent, setWaterContent] = useState<number>(8);
  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [minGauss, setMinGauss] = useState<string>("");
  const [minForce, setMinForce] = useState<string>("");
  const [beltTroughingAngle, setBeltTroughingAngle] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedConfigIds, setSavedConfigIds] = useState<Set<string>>(new Set());
  const [savingConfig, setSavingConfig] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'gauss' | 'width' | 'frame' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchOCWData();
      
      const prefixParam = searchParams.get('prefix');
      const suffixParam = searchParams.get('suffix');
      const expandParam = searchParams.get('expand');
      
      if (prefixParam) {
        setSelectedPrefix(Number(prefixParam));
      }
      if (suffixParam) {
        setSelectedSuffix(Number(suffixParam));
      }
      
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

  useEffect(() => {
    if (selectedPrefix !== undefined) {
      const validSuffixes = suffixes.filter(suffix => ocwData.some(record => record.prefix === selectedPrefix && record.suffix === suffix));
      setAvailableSuffixes(validSuffixes);
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

  // Fetch saved configurations status
  useEffect(() => {
    const fetchSavedConfigs = async () => {
      if (recommendations.length === 0) return;
      
      const { data } = await supabase
        .from('saved_ocw_configurations')
        .select('prefix, suffix')
        .in('prefix', recommendations.map(r => r.Prefix));
      
      if (data) {
        const saved = new Set(data.map(d => `${d.prefix}-${d.suffix}`));
        setSavedConfigIds(saved);
      }
    };
    
    fetchSavedConfigs();
  }, [recommendations]);

  const handleToggleSaveConfig = async (unit: OCWRecommendation, isChecked: boolean) => {
    const configId = `${unit.Prefix}-${unit.Suffix}`;
    
    if (isChecked) {
      setSavingConfig(configId);
      
      try {
      // Fetch full data from OCW_magwiz table
      const { data: magwizData, error: magwizError } = await supabase
        .from('OCW_magwiz')
        .select('*')
        .eq('prefix', unit.Prefix)
        .eq('suffix', unit.Suffix)
        .maybeSingle();
      
      if (magwizError) throw magwizError;
      if (!magwizData) {
        throw new Error('Configuration data not found');
      }
        
        // Save to saved_ocw_configurations
        const { error: saveError } = await supabase
          .from('saved_ocw_configurations')
          .insert({
            name: `${unit.Prefix} OCW ${unit.Suffix}`,
            prefix: unit.Prefix,
            suffix: unit.Suffix,
            surface_gauss: unit.surface_gauss,
            force_factor: unit.force_factor,
            watts: unit.watts,
            width: unit.width,
            frame: unit.frame,
            // Map OCW_magwiz fields to saved_ocw_configurations fields
            radial_depth: magwizData?.radial_depth,
            coil_height: magwizData?.coil_height,
            number_of_sections: magwizData?.number_of_sections,
            diameter: magwizData?.diameter,
            mean_length_of_turn: magwizData?.mean_length_of_turn,
            surface_area: magwizData?.surface_area,
            wires_in_parallel: magwizData?.wires_in_parallel,
            core_mass: magwizData?.core_mass,
            winding_mass: magwizData?.winding_mass,
            backbar_mass: magwizData?.backbar_mass,
            core_backbar_mass: magwizData?.core_backbar_mass,
            side_pole_mass: magwizData?.side_pole_mass,
            conservator_mass: magwizData?.conservator_mass,
            coolant_mass: magwizData?.coolant_mass,
            total_mass: magwizData?.total_mass,
            voltage_a: magwizData?.voltage_A,
            voltage_b: magwizData?.voltage_B,
            voltage_c: magwizData?.voltage_C,
            resistance_a: magwizData?.resistance_A,
            resistance_b: magwizData?.resistance_B,
            resistance_c: magwizData?.resistance_C,
            watts_a: magwizData?.watts_A,
            watts_b: magwizData?.watts_B,
            watts_c: magwizData?.watts_C,
            cold_current_a: magwizData?.cold_current_A,
            cold_current_b: magwizData?.cold_current_B,
            cold_current_c: magwizData?.cold_current_C,
            hot_current_a: magwizData?.hot_current_A,
            hot_current_b: magwizData?.hot_current_B,
            hot_current_c: magwizData?.hot_current_C,
            cold_ampere_turns_a: magwizData?.cold_ampere_turns_A?.toString(),
            cold_ampere_turns_b: magwizData?.cold_ampere_turns_B?.toString(),
            cold_ampere_turns_c: magwizData?.cold_ampere_turns_C?.toString(),
            hot_ampere_turns_a: magwizData?.hot_ampere_turns_A,
            hot_ampere_turns_b: magwizData?.hot_ampere_turns_B,
            hot_ampere_turns_c: magwizData?.hot_ampere_turns_C,
            temperature_rise_a: magwizData?.temperature_rise_A,
            temperature_rise_b: magwizData?.temperature_rise_B,
            temperature_rise_c: magwizData?.temperature_rise_C,
            maximum_rise_a: magwizData?.maximum_rise_A,
            maximum_rise_b: magwizData?.maximum_rise_B,
            maximum_rise_c: magwizData?.maximum_rise_C,
            expected_rise_a: magwizData?.expected_rise_A,
            expected_rise_b: magwizData?.expected_rise_B,
            expected_rise_c: magwizData?.expected_rise_C,
            ambient_temperature_a: magwizData?.ambient_temperature_A?.toString(),
            ambient_temperature_b: magwizData?.ambient_temperature_B?.toString(),
            ambient_temperature_c: magwizData?.ambient_temperature_C?.toString(),
            core_dimension: magwizData?.core_dimension,
            winding_dimension: magwizData?.winding_dimension,
            backbar_dimension: magwizData?.backbar_dimension,
            core_backbar_dimension: magwizData?.core_backbar_dimension,
            side_pole_dimension: magwizData?.side_pole_dimension,
            sealing_plate_dimension: magwizData?.sealing_plate_dimension,
            sealing_plate_mass: magwizData?.sealing_plate_mass?.toString(),
            core_insulator_dimension: magwizData?.core_insulator_dimension,
            core_insulator_mass: magwizData?.core_insulator_mass?.toString(),
            conservator_dimension: magwizData?.conservator_dimension,
            number_of_turns: magwizData?.number_of_turns,
          });
        
        if (saveError) throw saveError;
        
        setSavedConfigIds(prev => new Set(prev).add(configId));
        
        toast({
          title: "Configuration Saved",
          description: `${unit.Prefix} OCW ${unit.Suffix} added to Compare OCW page`,
        });
      } catch (error: any) {
        toast({
          title: "Save Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setSavingConfig(null);
      }
    } else {
      try {
        const { error } = await supabase
          .from('saved_ocw_configurations')
          .delete()
          .eq('prefix', unit.Prefix)
          .eq('suffix', unit.Suffix)
          .eq('name', `${unit.Prefix} OCW ${unit.Suffix}`);
        
        if (error) throw error;
        
        const newSet = new Set(savedConfigIds);
        newSet.delete(configId);
        setSavedConfigIds(newSet);
        
        toast({
          title: "Configuration Removed",
          description: `${unit.Prefix} OCW ${unit.Suffix} removed from Compare OCW page`,
        });
      } catch (error: any) {
        toast({
          title: "Remove Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const fetchOCWData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('BMR_magwiz').select('*');
      if (error) throw error;
      setOcwData(data || []);

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

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.from('BMR_Top').select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: "No Data Available",
          description: "No OCW units found in BMR_Top table.",
          variant: "destructive",
        });
        setIsCalculating(false);
        return;
      }
      
      const minSuffix = Math.round((beltWidth * coreBeltRatio) / 10);
      const widthMin = beltWidth * 0.9;
      const widthMax = beltWidth * 1.2;
      const minGaussNum = minGauss ? parseFloat(minGauss) : 0;
      const minForceNum = minForce ? parseFloat(minForce) : 0;
      
      const filtered = data.filter((unit: any) => {
        const suffixMatch = unit.Suffix >= minSuffix;
        const widthMatch = unit.width >= widthMin && unit.width <= widthMax;
        const gaussMatch = minGaussNum === 0 || unit.surface_gauss >= minGaussNum;
        const forceMatch = minForceNum === 0 || unit.force_factor >= minForceNum;
        return suffixMatch && widthMatch && gaussMatch && forceMatch;
      });
      
      const sorted = filtered.sort((a: any, b: any) => {
        if (a.Suffix !== b.Suffix) return a.Suffix - b.Suffix;
        return a.Prefix - b.Prefix;
      });
      
      const allRecommendations: OCWRecommendation[] = sorted.map((unit: any) => ({
        model: unit.model,
        Prefix: unit.Prefix,
        Suffix: unit.Suffix,
        surface_gauss: unit.surface_gauss,
        force_factor: unit.force_factor,
        watts: unit.watts,
        width: unit.width,
        frame: unit.frame,
        belt_width: beltWidth,
        density: bulkDensity,
        waterContent: waterContent,
        bulkDensity: bulkDensity,
        ambientTemp: ambientTemp,
      }));
      
      setRecommendations(allRecommendations);
      setInputParameters({
        beltSpeed,
        beltWidth,
        burdenDepth,
        throughput,
        airGap,
        coreBeltRatio,
        magnetPosition,
        bulkDensity,
        waterContent,
        ambientTemp,
        beltTroughingAngle,
      });
      
      if (allRecommendations.length > 0) {
        toast({
          title: "Calculation Complete",
          description: `Found ${allRecommendations.length} recommended OCW units.`,
        });
      } else {
        toast({
          title: "No Matches Found",
          description: `No units found with Suffix ≥ ${minSuffix} and width ${widthMin}-${widthMax}mm.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "An error occurred. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleViewOCW = (unit: OCWRecommendation) => {
    setSelectedOCW(unit);
    setSelectedPrefix(unit.Prefix);
    setSelectedSuffix(unit.Suffix);
  };

  const componentData = selectedRecord ? [
    { name: "Core", amount: 1, material: "Mild Steel", dimension: selectedRecord.core_dimension, mass: selectedRecord.core_mass },
    { name: "Winding", amount: 1, material: "Aluminium Nomex", dimension: selectedRecord.winding_dimension, mass: selectedRecord.winding_mass },
    { name: "Backbar", amount: 1, material: "Mild Steel", dimension: selectedRecord.backbar_dimension, mass: selectedRecord.backbar_mass },
    { name: "Core Backbar", amount: 1, material: "Mild Steel", dimension: selectedRecord.core_backbar_dimension, mass: selectedRecord.core_backbar_mass },
    { name: "Side Pole", amount: 4, material: "Mild Steel", dimension: selectedRecord.side_pole_dimension, mass: selectedRecord.side_pole_mass },
    { name: "Sealing Plate", amount: 1, material: "Manganese Steel", dimension: selectedRecord.sealing_plate_dimension, mass: selectedRecord.sealing_plate_mass ? parseFloat(selectedRecord.sealing_plate_mass) : undefined },
    { name: "Core Insulator", amount: 1, material: "Elephantide", dimension: selectedRecord.core_insulator_dimension, mass: selectedRecord.core_insulator_mass ? parseFloat(selectedRecord.core_insulator_mass) : undefined },
    { name: "Conservator", amount: 1, material: "Mild Steel", dimension: selectedRecord.conservator_dimension, mass: selectedRecord.conservator_mass },
    { name: "Coolant", amount: 7563, material: "Oil", dimension: "-", mass: selectedRecord.coolant_mass }
  ].filter(item => item.mass !== undefined && item.mass !== null) : [];

  if (loading) {
    return <div className="container mx-auto p-6">
      <div className="text-center">Loading OCW data...</div>
    </div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">OCW Selector</h1>
            {hasActiveList && (
              <Badge variant="secondary" className="mt-1">
                {recommendations.length} units in list
              </Badge>
            )}
          </div>
        </div>
        
        {hasActiveList && (
          <Button variant="outline" size="sm" onClick={clearList}>
            <X className="w-4 h-4 mr-2" />
            Clear List
          </Button>
        )}
      </div>

      {/* Calculator Inputs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Calculate OCW Recommendations</CardTitle>
            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" onClick={() => setShowHelpDialog(true)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Required Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="beltWidth" className="text-xs">Belt Width (mm)</Label>
                    <Input id="beltWidth" type="number" value={beltWidth} onChange={(e) => setBeltWidth(parseFloat(e.target.value))} className="h-8" placeholder="1200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coreBeltRatio" className="text-xs">Core/Belt Ratio</Label>
                    <Input id="coreBeltRatio" type="number" value={coreBeltRatio} onChange={(e) => setCoreBeltRatio(parseFloat(e.target.value))} step="0.01" min="0" max="1" className="h-8" placeholder="0.3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minGauss" className="text-xs">Min Gauss (optional)</Label>
                    <Input id="minGauss" type="number" value={minGauss} onChange={(e) => setMinGauss(e.target.value)} className="h-8" placeholder="" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minForce" className="text-xs">Min Force (optional)</Label>
                    <Input id="minForce" type="number" value={minForce} onChange={(e) => setMinForce(e.target.value)} className="h-8" placeholder="" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Process Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Process Parameters</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="beltSpeed" className="text-xs">Belt Speed (m/s)</Label>
                  <Input id="beltSpeed" type="number" value={beltSpeed} onChange={(e) => setBeltSpeed(parseFloat(e.target.value))} step="0.1" className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="beltTroughingAngle" className="text-xs">Belt Troughing Angle (degrees)</Label>
                  <Input id="beltTroughingAngle" type="number" value={beltTroughingAngle} onChange={(e) => setBeltTroughingAngle(parseFloat(e.target.value))} step="1" className="h-8" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="burdenDepth" className="text-xs">Burden Depth (mm)</Label>
                  <Input id="burdenDepth" type="number" value={burdenDepth} onChange={(e) => setBurdenDepth(parseFloat(e.target.value))} className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="throughput" className="text-xs">Throughput (TPH)</Label>
                  <Input id="throughput" type="number" value={throughput} onChange={(e) => setThroughput(parseFloat(e.target.value))} className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="airGap" className="text-xs">Air Gap (mm)</Label>
                  <Input id="airGap" type="number" value={airGap} onChange={(e) => setAirGap(parseFloat(e.target.value))} className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="magnetPosition" className="text-xs">Magnet Position</Label>
                  <Select value={magnetPosition} onValueChange={setMagnetPosition}>
                    <SelectTrigger id="magnetPosition" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overhead">Overhead</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                      <SelectItem value="drum">Drum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleCalculate} disabled={isCalculating} className="w-full">
            <Calculator className="w-4 h-4 mr-2" />
            {isCalculating ? "Calculating..." : "Calculate OCW Recommendations"}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {hasActiveList && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recommended OCW Units</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sort by:</span>
                <Button
                  variant={sortBy === 'gauss' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'gauss') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('gauss');
                      setSortDirection('desc');
                    }
                  }}
                >
                  Gauss {sortBy === 'gauss' && (sortDirection === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant={sortBy === 'width' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'width') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('width');
                      setSortDirection('desc');
                    }
                  }}
                >
                  Width {sortBy === 'width' && (sortDirection === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant={sortBy === 'frame' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'frame') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('frame');
                      setSortDirection('asc');
                    }
                  }}
                >
                  Frame {sortBy === 'frame' && (sortDirection === 'asc' ? '↑' : '↓')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {(() => {
                let sorted = [...recommendations];
                if (sortBy) {
                  sorted.sort((a, b) => {
                    let aVal: number | string = 0;
                    let bVal: number | string = 0;
                    
                    if (sortBy === 'gauss') {
                      aVal = a.surface_gauss || 0;
                      bVal = b.surface_gauss || 0;
                    } else if (sortBy === 'width') {
                      aVal = a.width || 0;
                      bVal = b.width || 0;
                    } else if (sortBy === 'frame') {
                      aVal = a.frame || '';
                      bVal = b.frame || '';
                    }
                    
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                      return sortDirection === 'asc' 
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                    }
                    
                    return sortDirection === 'asc' 
                      ? (aVal as number) - (bVal as number)
                      : (bVal as number) - (aVal as number);
                  });
                }
                return sorted;
              })().map((unit, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors ${
                  selectedOCW?.Prefix === unit.Prefix && selectedOCW?.Suffix === unit.Suffix ? 'border-primary bg-primary/5' : ''
                } ${savedConfigIds.has(`${unit.Prefix}-${unit.Suffix}`) ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' : ''}`}>
                  
                  {/* Existing content */}
                  <div className="flex-1 space-y-0.5">
                    <div className="font-semibold text-sm">
                      {unit.Prefix} OCW {unit.Suffix}
                      {savedConfigIds.has(`${unit.Prefix}-${unit.Suffix}`) && (
                        <Badge variant="secondary" className="ml-2 text-xs">Saved</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-5 gap-x-3">
                      <span>Gauss: {unit.surface_gauss}</span>
                      <span>Force: {unit.force_factor}</span>
                      <span>Watts: {unit.watts}</span>
                      <span>Width: {unit.width}mm</span>
                      <span>Frame: {unit.frame}</span>
                    </div>
                  </div>
                  
                  {/* Existing buttons */}
                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/ocw-specs', { state: { unit }})} variant="outline" size="sm">
                      View
                    </Button>
                    <Button onClick={() => navigate('/magnetic-decay', { state: { model: `${unit.Prefix} OCW ${unit.Suffix}`, gauss: unit.surface_gauss, force: unit.force_factor }})} variant="outline" size="sm">
                      Decay Chart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {selectedRecord && (
        <>
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="font-medium">Selected: {selectedRecord.filename}</p>
            <p className="text-base font-semibold text-primary mt-1">
              Magnet Dimension: {selectedRecord.magnet_dimension || 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => {
              const modelMatch = selectedRecord.filename?.match(/(\d+)\s*OCW\s*(\d+)/);
              const modelName = modelMatch ? `${modelMatch[1]} OCW ${modelMatch[2]}` : '55 OCW 25';
              navigate('/field-simulator', { 
                state: { 
                  model: modelName, 
                  beltWidth: selectedRecord.belt_width, 
                  magnetDimension: selectedRecord.magnet_dimension,
                  airGap,
                  burdenDepth,
                  beltTroughingAngle
                }
              });
            }}>
              <Waves className="w-4 h-4 mr-2" />
              Field Simulator
            </Button>
            {[20, 30, 40, 50].map((temp) => (
              <Button 
                key={temp} 
                variant={temp === 20 ? "default" : "outline"} 
                size="sm" 
                onClick={() => {
                  // Calculate gauss and force based on temperature
                  // A20 is baseline, others will be calculated later
                  const baseGauss = 2410;
                  const baseForce = 499496;
                  navigate('/magnetic-decay', { 
                    state: { 
                      model: selectedRecord.filename, 
                      gauss: baseGauss, 
                      force: baseForce, 
                      ambient: temp 
                    }
                  });
                }}
              >
                A{temp}
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          {componentData.map((component, index) => (
                            <TableRow key={index} className="h-10">
                              <TableCell className="font-medium py-2">{component.name}</TableCell>
                              <TableCell className="py-2">{component.amount}</TableCell>
                              <TableCell className="py-2">{component.material}</TableCell>
                              <TableCell className="py-2">{component.dimension || 'N/A'}</TableCell>
                              <TableCell className="py-2">{component.mass?.toFixed(2) || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
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
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>Radial Depth:</span><span>{selectedRecord.radial_depth || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Coil Height:</span><span>{selectedRecord.coil_height || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Number of Sections:</span><span>{selectedRecord.number_of_sections || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Diameter:</span><span>{selectedRecord.diameter || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Mean Length of Turn:</span><span>{selectedRecord.mean_length_of_turn || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Number of Turns:</span><span>{selectedRecord.number_of_turns || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Surface Area:</span><span>{selectedRecord.surface_area || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Wires in Parallel:</span><span>{selectedRecord.wires_in_parallel || 'N/A'}</span></div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

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
                    <div className="flex gap-2 mt-6">
                      <Button onClick={() => {
                        const params = new URLSearchParams({
                          prefix: selectedRecord.prefix?.toString() || '',
                          suffix: selectedRecord.suffix?.toString() || '',
                          data: encodeURIComponent(JSON.stringify(selectedRecord))
                        });
                        navigate(`/winding-sheet?${params.toString()}`);
                      }} className="flex-1">
                        View Winding Sheet
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </>
      )}

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Determining OCW Magnet Configuration Parameters</DialogTitle>
            <DialogDescription>Standardized method for OCW selection using the Recommendation Tool</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Purpose</h3>
              <p>To standardize the method of determining Overhead Conveyor Magnet (OCW) selection parameters using the OCW Recommendation Tool. Ensures consistent design criteria for throughput, belt speed, magnetic performance, and dimensional requirements.</p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">1. Required Parameters</h3>
              
              <div className="space-y-3 ml-4">
                <div>
                  <h4 className="font-medium">1.1 Belt Width (mm)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Conveyor belt width at the magnet location.</p>
                  <p className="mt-1"><strong>How to Determine:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Measure the usable conveyor width (material flow width, not frame width).</li>
                    <li>Select the next standard belt size (e.g., 600, 900, 1200 mm).</li>
                  </ul>
                  <p className="mt-1 italic">Note: Belt width directly affects core size and magnet span.</p>
                </div>

                <div>
                  <h4 className="font-medium">1.2 Core/Belt Ratio</h4>
                  <p className="mt-1"><strong>Definition:</strong> Ratio between magnet core width and conveyor belt width.</p>
                  <p className="mt-1"><strong>Typical Range:</strong> 0.20 – 0.30.</p>
                  <p className="mt-1"><strong>Selection Guidance:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Use 0.25 as standard (balanced coverage & magnetic performance).</li>
                    <li>Increase ratio for deep burdens or wide material distribution.</li>
                    <li>Decrease for fine, uniform burdens or tight installations.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">1.3 Minimum Gauss (optional)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Minimum field intensity at the burden surface required for capture.</p>
                  <p className="mt-1"><strong>Selection Guidance:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Ferrous fines: 1500–3000 Gauss</li>
                    <li>Tramp steel / larger objects: 3000–5000 Gauss</li>
                    <li>Leave blank to let the system optimize based on force and air gap.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">1.4 Minimum Force (optional)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Required attractive force at the material surface.</p>
                  <p className="mt-1"><strong>Use Case:</strong> When a specific pick-up force is known (from tests or spec sheets).</p>
                  <p className="mt-1"><strong>Typical Range:</strong> 250,000 – 800,000 dynes.</p>
                  <p className="mt-1 italic">Leave blank if you want the algorithm to infer force based on throughput and air gap.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Process Parameters</h3>
              
              <div className="space-y-3 ml-4">
                <div>
                  <h4 className="font-medium">2.1 Belt Speed (m/s)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Conveyor belt velocity under the magnet.</p>
                  <p className="mt-1"><strong>Selection:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Use process data or measure actual line speed.</li>
                    <li>High belt speeds reduce exposure time, requiring stronger or lower-mounted magnets.</li>
                  </ul>
                  <table className="w-full mt-2 border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Application</th>
                        <th className="border p-2 text-left">Typical Speed</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border p-2">Light-duty recycling</td><td className="border p-2">0.8 – 1.2 m/s</td></tr>
                      <tr><td className="border p-2">Aggregates</td><td className="border p-2">1.2 – 2.0 m/s</td></tr>
                      <tr><td className="border p-2">Mining / High throughput</td><td className="border p-2">2.0 – 3.0 m/s</td></tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-medium">2.2 Belt Troughing Angle (°)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Angle of side idlers.</p>
                  <p className="mt-1">Input "0" for flat conveyors.</p>
                  <p className="mt-1"><strong>Effect:</strong> Higher troughing angles increase material depth and can require more magnetic depth or adjusted air gap.</p>
                </div>

                <div>
                  <h4 className="font-medium">2.3 Burden Depth (mm)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Material thickness on the belt under normal loading conditions.</p>
                  <p className="mt-1"><strong>Measurement:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Measure average height of the material profile.</li>
                    <li>Avoid peak loads—use nominal running depth.</li>
                  </ul>
                  <p className="mt-1"><strong>Effect:</strong> Increased depth → greater air gap → requires higher magnetic power.</p>
                </div>

                <div>
                  <h4 className="font-medium">2.4 Throughput (TPH)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Tons per hour of conveyed material.</p>
                  <p className="mt-1"><strong>Used to:</strong> Estimate mass loading and particle density.</p>
                  <p className="mt-1"><strong>Input:</strong> From process line specs or weigh belt data.</p>
                </div>

                <div>
                  <h4 className="font-medium">2.5 Air Gap (mm)</h4>
                  <p className="mt-1"><strong>Definition:</strong> Vertical distance from magnet face to top of burden.</p>
                  <p className="mt-1"><strong>Determination Steps:</strong></p>
                  <ol className="list-decimal ml-5 mt-1 space-y-1">
                    <li>Measure from conveyor belt surface to magnet face.</li>
                    <li>Subtract burden depth (mm).</li>
                    <li>Verify clearance for belt splice and bounce (add 25–50 mm buffer).</li>
                  </ol>
                  <p className="mt-1"><strong>Typical Range:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>100–150 mm for standard OCW</li>
                    <li>200–300 mm for high-speed or deep burden applications</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">2.6 Magnet Position</h4>
                  <p className="mt-1"><strong>Options:</strong> Overhead, Inline, Crossbelt.</p>
                  <p className="mt-1"><strong>Effect on Design:</strong></p>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li><strong>Overhead:</strong> Captures ferrous contamination from the top, most common.</li>
                    <li><strong>Inline:</strong> Magnet installed parallel to belt, suited for tramp metal removal in material flow direction.</li>
                    <li><strong>Crossbelt:</strong> Magnet positioned across belt width; typically requires greater core width.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. Calculation Workflow</h3>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Input required parameters: Belt width and core/belt ratio (start with 0.25).</li>
                <li>Enter process data: Belt speed, burden depth, throughput, and air gap.</li>
                <li>Select magnet position.</li>
                <li>Click "Calculate OCW Recommendations."</li>
                <li>Review outputs:
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    <li>Magnet width recommendation (core width = belt width × ratio).</li>
                    <li>Suggested air gap or field strength adjustments.</li>
                    <li>Warnings if throughput or air gap exceed recommended magnetic performance limits.</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Adjustment Guidelines</h3>
              <table className="w-full border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Scenario</th>
                    <th className="border p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border p-2">Burden depth exceeds spec</td><td className="border p-2">Increase air gap or magnet size</td></tr>
                  <tr><td className="border p-2">Weak pickup</td><td className="border p-2">Increase field strength or lower magnet</td></tr>
                  <tr><td className="border p-2">Over-saturation</td><td className="border p-2">Reduce core width or increase air gap</td></tr>
                  <tr><td className="border p-2">Excessive belt speed</td><td className="border p-2">Use stronger magnet or longer exposure</td></tr>
                </tbody>
              </table>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OCW;
