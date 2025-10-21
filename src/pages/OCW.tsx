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
import { ArrowLeft, ChevronDown, Calculator, Waves, Settings, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useOCWList, OCWRecommendation } from "@/contexts/OCWListContext";
import { Badge } from "@/components/ui/badge";

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
  
  const [beltSpeed, setBeltSpeed] = useState<number>(2.5);
  const [beltWidth, setBeltWidth] = useState<number>(1200);
  const [feedDepth, setFeedDepth] = useState<number>(100);
  const [throughput, setThroughput] = useState<number>(500);
  const [magnetGap, setMagnetGap] = useState<number>(150);
  const [coreBeltRatio, setCoreBeltRatio] = useState<number>(0.25);
  const [magnetPosition, setMagnetPosition] = useState<string>("overhead");
  const [bulkDensity, setBulkDensity] = useState<number>(1.8);
  const [waterContent, setWaterContent] = useState<number>(8);
  const [ambientTemp, setAmbientTemp] = useState<number>(25);
  const [minGauss, setMinGauss] = useState<string>("");
  const [minForce, setMinForce] = useState<string>("");
  const [trampMetalProfile, setTrampMetalProfile] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [sortBy, setSortBy] = useState<'gauss' | 'width' | 'frame' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
        feedDepth,
        throughput,
        magnetGap,
        coreBeltRatio,
        magnetPosition,
        bulkDensity,
        waterContent,
        ambientTemp,
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
          <CardTitle>Calculate OCW Recommendations</CardTitle>
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
                    <Input id="minGauss" type="number" value={minGauss} onChange={(e) => setMinGauss(e.target.value)} className="h-8" placeholder="3000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minForce" className="text-xs">Min Force (optional)</Label>
                    <Input id="minForce" type="number" value={minForce} onChange={(e) => setMinForce(e.target.value)} className="h-8" placeholder="500000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trampProfile" className="text-xs">Tramp Metal Extraction Profile</Label>
                  <Select value={trampMetalProfile} onValueChange={setTrampMetalProfile}>
                    <SelectTrigger id="trampProfile" className="h-8">
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAMP_METAL_PROFILES.map((profile) => (
                        <SelectItem key={profile.value} value={profile.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{profile.label}</span>
                            <span className="text-xs text-muted-foreground">{profile.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="feedDepth" className="text-xs">Feed Depth (mm)</Label>
                  <Input id="feedDepth" type="number" value={feedDepth} onChange={(e) => setFeedDepth(parseFloat(e.target.value))} className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="throughput" className="text-xs">Throughput (TPH)</Label>
                  <Input id="throughput" type="number" value={throughput} onChange={(e) => setThroughput(parseFloat(e.target.value))} className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="magnetGap" className="text-xs">Magnet Gap (mm)</Label>
                  <Input id="magnetGap" type="number" value={magnetGap} onChange={(e) => setMagnetGap(parseFloat(e.target.value))} className="h-8" />
                </div>
              </CardContent>
            </Card>

            {/* Material Stream */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Material Stream</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 pt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="bulkDensity" className="text-xs">Bulk Density (t/m³)</Label>
                  <Input id="bulkDensity" type="number" value={bulkDensity} onChange={(e) => setBulkDensity(parseFloat(e.target.value))} step="0.1" className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="waterContent" className="text-xs">Water Content (%)</Label>
                  <Input id="waterContent" type="number" value={waterContent} onChange={(e) => setWaterContent(parseFloat(e.target.value))} step="1" className="h-8" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ambientTemp" className="text-xs">Ambient Temp (°C)</Label>
                  <Input id="ambientTemp" type="number" value={ambientTemp} onChange={(e) => setAmbientTemp(parseFloat(e.target.value))} className="h-8" />
                </div>
              </CardContent>
            </Card>

            {/* Magnet Position */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Magnet Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
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
                <div key={index} className={`flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors ${selectedOCW?.Prefix === unit.Prefix && selectedOCW?.Suffix === unit.Suffix ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm">
                      {unit.Prefix} OCW {unit.Suffix}
                    </div>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-5 gap-x-3">
                      <span>Gauss: {unit.surface_gauss}</span>
                      <span>Force: {unit.force_factor}</span>
                      <span>Watts: {unit.watts}</span>
                      <span>Width: {unit.width}mm</span>
                      <span>Frame: {unit.frame}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleViewOCW(unit)} variant="outline" size="sm">
                      View
                    </Button>
                    <Button onClick={() => navigate('/magnetic-decay', { state: { model: `${unit.Prefix} OCW ${unit.Suffix}`, gauss: unit.surface_gauss, force: unit.force_factor }})} variant="outline" size="sm">
                      Decay Chart
                    </Button>
                    <Button onClick={() => {
                      const modelMatch = `${unit.Prefix} OCW ${unit.Suffix}`;
                      navigate('/field-simulator', {
                        state: {
                          model: modelMatch,
                          beltWidth: unit.belt_width,
                          magnetDimension: `${unit.Prefix}x${unit.Suffix}x${unit.width}`,
                          density: unit.density,
                          waterContent: unit.waterContent
                        }
                      });
                    }} variant="default" size="sm">
                      <Waves className="w-3 h-3 mr-1" />
                      Simulator
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Or select manually:</span>
        <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
          <span className="text-sm font-medium">BMR</span>
          <Select value={selectedPrefix?.toString()} onValueChange={value => setSelectedPrefix(Number(value))}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="000" />
            </SelectTrigger>
            <SelectContent>
              {prefixes.map(prefix => <SelectItem key={prefix} value={prefix.toString()}>{prefix}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm">-</span>
          <Select value={selectedSuffix?.toString()} onValueChange={value => setSelectedSuffix(Number(value))} disabled={selectedPrefix === undefined}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="00" />
            </SelectTrigger>
            <SelectContent>
              {availableSuffixes.map(suffix => <SelectItem key={suffix} value={suffix.toString()}>{suffix}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

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
              navigate('/field-simulator', { state: { model: modelName, beltWidth: selectedRecord.belt_width, magnetDimension: selectedRecord.magnet_dimension }});
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
    </div>
  );
};

export default OCW;
