import { useLocation, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LineChart, Download } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { downloadOCWSpecifications } from "@/components/OCWSpecificationsPDF";
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
export default function OCWSpecs() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    unit
  } = location.state || {};
  const [ocwData, setOcwData] = useState<OCWData | null>(null);
  const [isComponentsOpen, setIsComponentsOpen] = useState(true);
  const [isWindingOpen, setIsWindingOpen] = useState(true);
  const [isTempElectricalOpen, setIsTempElectricalOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchOCWData = async () => {
      if (!unit?.Prefix || !unit?.Suffix) return;
      try {
        setLoading(true);
        const {
          data,
          error
        } = await supabase.from('BMR_magwiz').select('*').eq('prefix', unit.Prefix).eq('suffix', unit.Suffix).single();
        if (error) throw error;
        setOcwData(data);
      } catch (error) {
        console.error('Error fetching OCW data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOCWData();
  }, [unit]);
  if (!unit) {
    return <div className="container mx-auto p-6">
        <div className="text-center">No OCW unit selected</div>
        <Link to="/ocw">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to OCW Selector
          </Button>
        </Link>
      </div>;
  }
  const componentData = ocwData ? [{
    name: "Core",
    amount: 1,
    material: "Mild Steel",
    dimension: ocwData.core_dimension,
    mass: ocwData.core_mass
  }, {
    name: "Winding",
    amount: 1,
    material: "Aluminium Nomex",
    dimension: ocwData.winding_dimension,
    mass: ocwData.winding_mass
  }, {
    name: "Backbar",
    amount: 1,
    material: "Mild Steel",
    dimension: ocwData.backbar_dimension,
    mass: ocwData.backbar_mass
  }, {
    name: "Core Backbar",
    amount: 1,
    material: "Mild Steel",
    dimension: ocwData.core_backbar_dimension,
    mass: ocwData.core_backbar_mass
  }, {
    name: "Side Pole",
    amount: 4,
    material: "Mild Steel",
    dimension: ocwData.side_pole_dimension,
    mass: ocwData.side_pole_mass
  }, {
    name: "Sealing Plate",
    amount: 1,
    material: "Manganese Steel",
    dimension: ocwData.sealing_plate_dimension,
    mass: ocwData.sealing_plate_mass ? parseFloat(ocwData.sealing_plate_mass) : undefined
  }, {
    name: "Core Insulator",
    amount: 1,
    material: "Elephantide",
    dimension: ocwData.core_insulator_dimension,
    mass: ocwData.core_insulator_mass ? parseFloat(ocwData.core_insulator_mass) : undefined
  }, {
    name: "Conservator",
    amount: 1,
    material: "Mild Steel",
    dimension: ocwData.conservator_dimension,
    mass: ocwData.conservator_mass
  }, {
    name: "Coolant",
    amount: 7563,
    material: "Oil",
    dimension: "-",
    mass: ocwData.coolant_mass
  }].filter(item => item.mass !== undefined && item.mass !== null) : [];
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/ocw">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to OCW Selector
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">OCW Specifications</h1>
          </div>
          <p className="text-muted-foreground">
            Model: <span className="font-semibold">{unit.Prefix} OCW {unit.Suffix}</span>
          </p>
        </div>
      </div>

      {/* Performance Specifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Specifications</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (ocwData) {
                    downloadOCWSpecifications({
                      prefix: unit.Prefix,
                      suffix: unit.Suffix,
                      surface_gauss: unit.surface_gauss,
                      force_factor: unit.force_factor,
                      watts: unit.watts,
                      width: unit.width,
                      frame: unit.frame,
                      ...ocwData,
                      sealing_plate_mass: ocwData.sealing_plate_mass ? parseFloat(ocwData.sealing_plate_mass) : undefined,
                      core_insulator_mass: ocwData.core_insulator_mass ? parseFloat(ocwData.core_insulator_mass) : undefined,
                    });
                  }
                }}
                disabled={!ocwData}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/magnetic-decay', { 
                  state: { 
                    modelParams: {
                      gauss: unit.surface_gauss,
                      force: unit.force_factor,
                      model: `${unit.Prefix} OCW ${unit.Suffix}`
                    }
                  } 
                })}
              >
                <LineChart className="w-4 h-4 mr-2" />
                View Magnetic Decay
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Surface Gauss</div>
              <div className="text-2xl font-bold">{unit.surface_gauss}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Force Factor</div>
              <div className="text-2xl font-bold">{unit.force_factor?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Watts</div>
              <div className="text-2xl font-bold">{unit.watts}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Width (mm)</div>
              <div className="text-2xl font-bold">{unit.width}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Frame</div>
              <div className="text-2xl font-bold">{unit.frame}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center py-8 text-muted-foreground">Loading detailed specifications...</div>}

      {!loading && ocwData && <>
          {/* Component Breakdown */}
          <Collapsible open={isComponentsOpen} onOpenChange={setIsComponentsOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle>Component Breakdown</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isComponentsOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Dimension</TableHead>
                        <TableHead className="text-right">Mass (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {componentData.map((item, index) => <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.amount}</TableCell>
                          <TableCell>{item.material}</TableCell>
                          <TableCell className="font-mono text-xs">{item.dimension || '-'}</TableCell>
                          <TableCell className="text-right">{item.mass?.toFixed(2)}</TableCell>
                        </TableRow>)}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={4}>Total Mass</TableCell>
                        <TableCell className="text-right">{ocwData.total_mass?.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Winding Information and Temperature Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Winding Information */}
            <Collapsible open={isWindingOpen} onOpenChange={setIsWindingOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardTitle>Winding Information</CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isWindingOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Number of Sections</div>
                        <div className="font-semibold">{ocwData.number_of_sections}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Radial Depth (mm)</div>
                        <div className="font-semibold">{ocwData.radial_depth}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Coil Height (mm)</div>
                        <div className="font-semibold">{ocwData.coil_height?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Diameter (mm)</div>
                        <div className="font-semibold">{ocwData.diameter?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Mean Length of Turn (mm)</div>
                        <div className="font-semibold">{ocwData.mean_length_of_turn?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Number of Turns</div>
                        <div className="font-semibold">{ocwData.number_of_turns}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Surface Area (m²)</div>
                        <div className="font-semibold">{ocwData.surface_area?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Wires in Parallel</div>
                        <div className="font-semibold">{ocwData.wires_in_parallel}</div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Temperature & Electrical Properties */}
            <Collapsible open={isTempElectricalOpen} onOpenChange={setIsTempElectricalOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardTitle>Temperature & Electrical Properties</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isTempElectricalOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className="text-right">A20</TableHead>
                        <TableHead className="text-right">A30</TableHead>
                        <TableHead className="text-right">A40</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Voltage (V)</TableCell>
                        <TableCell className="text-right">{ocwData.voltage_A}</TableCell>
                        <TableCell className="text-right">{ocwData.voltage_B?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.voltage_C?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Resistance (Ω)</TableCell>
                        <TableCell className="text-right">{ocwData.resistance_A?.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{ocwData.resistance_B?.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{ocwData.resistance_C?.toFixed(4)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Watts (W)</TableCell>
                        <TableCell className="text-right">{ocwData.watts_A}</TableCell>
                        <TableCell className="text-right">{ocwData.watts_B}</TableCell>
                        <TableCell className="text-right">{ocwData.watts_C}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Cold Current (A)</TableCell>
                        <TableCell className="text-right">{ocwData.cold_current_A?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.cold_current_B?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.cold_current_C?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Hot Current (A)</TableCell>
                        <TableCell className="text-right">{ocwData.hot_current_A?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.hot_current_B?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.hot_current_C?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Cold AT</TableCell>
                        <TableCell className="text-right">{ocwData.cold_ampere_turns_A}</TableCell>
                        <TableCell className="text-right">{ocwData.cold_ampere_turns_B}</TableCell>
                        <TableCell className="text-right">{ocwData.cold_ampere_turns_C}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Hot AT</TableCell>
                        <TableCell className="text-right">{ocwData.hot_ampere_turns_A}</TableCell>
                        <TableCell className="text-right">{ocwData.hot_ampere_turns_B}</TableCell>
                        <TableCell className="text-right">{ocwData.hot_ampere_turns_C}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Ambient (°C)</TableCell>
                        <TableCell className="text-right">{ocwData.ambient_temperature_A}</TableCell>
                        <TableCell className="text-right">{ocwData.ambient_temperature_B}</TableCell>
                        <TableCell className="text-right">{ocwData.ambient_temperature_C}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Rise (°C)</TableCell>
                        <TableCell className="text-right">{ocwData.temperature_rise_A?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.temperature_rise_B?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.temperature_rise_C?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Maximum (°C)</TableCell>
                        <TableCell className="text-right">{ocwData.maximum_rise_A?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.maximum_rise_B?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.maximum_rise_C?.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Expected (°C)</TableCell>
                        <TableCell className="text-right">{ocwData.expected_rise_A?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.expected_rise_B?.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{ocwData.expected_rise_C?.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </div>
        </>}

      {!loading && !ocwData && <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Detailed specifications not available for this unit
          </CardContent>
        </Card>}
    </div>;
}