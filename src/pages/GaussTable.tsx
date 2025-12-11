import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, LineChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Scientific decay constants
const DECAY_CONSTANTS = {
  DECAY_GAUSS: 0.00575,
  DECAY_FF: 0.01150,
};

// Temperature scaling factors
const TEMP_CONFIGS = {
  20: { label: 'A20', gaussScale: 1.000, ffScale: 1.000 },
  30: { label: 'A30', gaussScale: 0.95484, ffScale: 0.9117 },
  40: { label: 'A40', gaussScale: 0.90451, ffScale: 0.8181 },
  45: { label: 'A45', gaussScale: 0.87739, ffScale: 0.7694 },
};

function calculateGaussAtGap(surfaceGauss: number, gap: number, tempKey: keyof typeof TEMP_CONFIGS): number {
  const decayFactor = Math.exp(-DECAY_CONSTANTS.DECAY_GAUSS * gap);
  return surfaceGauss * decayFactor * TEMP_CONFIGS[tempKey].gaussScale;
}

function calculateFFAtGap(surfaceFF: number, gap: number, tempKey: keyof typeof TEMP_CONFIGS): number {
  const decayFactor = Math.exp(-DECAY_CONSTANTS.DECAY_FF * gap);
  return surfaceFF * decayFactor * TEMP_CONFIGS[tempKey].ffScale;
}

interface OCWUnit {
  Prefix: number;
  Suffix: number;
  surface_gauss: number;
  force_factor: number;
  watts: number;
  width: number;
  frame: string;
}

interface GaussTableRow {
  gap: number;
  gauss20: number;
  gauss30: number;
  gauss40: number;
  gauss45: number;
  ff20: number;
  ff30: number;
  ff40: number;
  ff45: number;
}

export default function GaussTable() {
  const location = useLocation();
  const { unit } = location.state as { unit: OCWUnit } || {};
  const [ocwData, setOcwData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOCWData = async () => {
      if (!unit?.Prefix || !unit?.Suffix) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('BMR_magwiz')
          .select('*')
          .eq('prefix', unit.Prefix)
          .eq('suffix', unit.Suffix)
          .single();
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

  const tableData = useMemo(() => {
    if (!unit) return [];
    
    const data: GaussTableRow[] = [];
    for (let gap = 0; gap <= 800; gap += 25) {
      data.push({
        gap,
        gauss20: Math.round(calculateGaussAtGap(unit.surface_gauss, gap, 20)),
        gauss30: Math.round(calculateGaussAtGap(unit.surface_gauss, gap, 30)),
        gauss40: Math.round(calculateGaussAtGap(unit.surface_gauss, gap, 40)),
        gauss45: Math.round(calculateGaussAtGap(unit.surface_gauss, gap, 45)),
        ff20: Math.round(calculateFFAtGap(unit.force_factor, gap, 20)),
        ff30: Math.round(calculateFFAtGap(unit.force_factor, gap, 30)),
        ff40: Math.round(calculateFFAtGap(unit.force_factor, gap, 40)),
        ff45: Math.round(calculateFFAtGap(unit.force_factor, gap, 45)),
      });
    }
    return data;
  }, [unit]);

  const exportToCSV = () => {
    const headers = ['Gap (mm)', 'A20 Gauss', 'A20 FF', 'A30 Gauss', 'A30 FF', 'A40 Gauss', 'A40 FF', 'A45 Gauss', 'A45 FF'];
    const rows = tableData.map(row => [
      row.gap,
      row.gauss20,
      row.ff20,
      row.gauss30,
      row.ff30,
      row.gauss40,
      row.ff40,
      row.gauss45,
      row.ff45,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gauss-table-${unit?.Prefix}-OCW-${unit?.Suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!unit) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No OCW unit selected</div>
        <Link to="/ocw">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to OCW Selector
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gauss & Force Factor Table</h1>
          <p className="text-muted-foreground">
            Model: <span className="font-semibold">{unit.Prefix} OCW {unit.Suffix}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/ocw">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to OCW Selector
            </Button>
          </Link>
          <Link to="/magnetic-decay" state={{ 
            model: `${unit.Prefix} OCW ${unit.Suffix}`,
            gauss: unit.surface_gauss,
            force: unit.force_factor
          }}>
            <Button variant="outline">
              <LineChart className="w-4 h-4 mr-2" />
              Decay Chart
            </Button>
          </Link>
          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Surface Values Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Surface Values (Gap = 0mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Surface Gauss</div>
              <div className="text-2xl font-bold">{unit.surface_gauss?.toLocaleString()} G</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Surface Force Factor</div>
              <div className="text-2xl font-bold">{unit.force_factor?.toLocaleString()} N</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Watts</div>
              <div className="text-2xl font-bold">{unit.watts?.toLocaleString()} W</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Width</div>
              <div className="text-2xl font-bold">{unit.width?.toLocaleString()} mm</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Scaling Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature Scaling Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            {Object.entries(TEMP_CONFIGS).map(([temp, config]) => (
              <div key={temp} className="p-3 rounded-lg bg-muted/50">
                <Badge variant="outline" className="mb-2">{config.label}</Badge>
                <div className="text-sm">
                  <div>Gauss: <span className="font-semibold">{(config.gaussScale * 100).toFixed(1)}%</span></div>
                  <div>FF: <span className="font-semibold">{(config.ffScale * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Gauss/FF Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gauss & Force Factor at Distance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="text-center border-r">Gap (mm)</TableHead>
                  <TableHead colSpan={2} className="text-center border-r bg-muted/30">A20</TableHead>
                  <TableHead colSpan={2} className="text-center border-r bg-muted/30">A30</TableHead>
                  <TableHead colSpan={2} className="text-center border-r bg-muted/30">A40</TableHead>
                  <TableHead colSpan={2} className="text-center bg-muted/30">A45</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-right">Gauss</TableHead>
                  <TableHead className="text-right border-r">FF</TableHead>
                  <TableHead className="text-right">Gauss</TableHead>
                  <TableHead className="text-right border-r">FF</TableHead>
                  <TableHead className="text-right">Gauss</TableHead>
                  <TableHead className="text-right border-r">FF</TableHead>
                  <TableHead className="text-right">Gauss</TableHead>
                  <TableHead className="text-right">FF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.gap} className={row.gap === 0 ? 'bg-primary/10 font-semibold' : ''}>
                    <TableCell className="text-center border-r font-medium">{row.gap}</TableCell>
                    <TableCell className="text-right">{row.gauss20.toLocaleString()}</TableCell>
                    <TableCell className="text-right border-r">{row.ff20.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.gauss30.toLocaleString()}</TableCell>
                    <TableCell className="text-right border-r">{row.ff30.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.gauss40.toLocaleString()}</TableCell>
                    <TableCell className="text-right border-r">{row.ff40.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.gauss45.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.ff45.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
