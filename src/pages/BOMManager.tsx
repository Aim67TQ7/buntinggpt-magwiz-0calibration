import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, Trash2, RotateCcw, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface Material {
  id: number;
  name: string | null;
  density: number | null;
  cost_per_unit: number | null;
}

interface Part {
  id: number;
  name: string | null;
  bom: number | null;
  material: number | null;
  amount: number | null;
  cost_per_unit: number | null;
}

interface Labor {
  id: number;
  name: string | null;
  bom: number | null;
  rate: number | null;
  cost_per_unit: number | null;
}

const BOMManager = () => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [labor, setLabor] = useState<Labor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [materialsRes, partsRes, laborRes] = await Promise.all([
        supabase.from('BMR_materials').select('*').order('id'),
        supabase.from('BMR_parts').select('*').order('id'),
        supabase.from('BMR_labour').select('*').order('id')
      ]);

      if (materialsRes.error) throw materialsRes.error;
      if (partsRes.error) throw partsRes.error;
      if (laborRes.error) throw laborRes.error;

      setMaterials(materialsRes.data || []);
      setParts(partsRes.data || []);
      setLabor(laborRes.data || []);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching BOM data:', error);
      toast({
        title: "Error",
        description: "Failed to load BOM data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      
      // Update materials
      for (const material of materials) {
        const { error } = await supabase
          .from('BMR_materials')
          .update({ name: material.name, density: material.density, cost_per_unit: material.cost_per_unit })
          .eq('id', material.id);
        if (error) throw error;
      }

      // Update parts
      for (const part of parts) {
        const { error } = await supabase
          .from('BMR_parts')
          .update({ name: part.name, bom: part.bom, material: part.material, amount: part.amount, cost_per_unit: part.cost_per_unit })
          .eq('id', part.id);
        if (error) throw error;
      }

      // Update labor
      for (const lab of labor) {
        const { error } = await supabase
          .from('BMR_labour')
          .update({ name: lab.name, bom: lab.bom, rate: lab.rate, cost_per_unit: lab.cost_per_unit })
          .eq('id', lab.id);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "All changes saved successfully"
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = () => {
    fetchAllData();
    toast({
      title: "Reverted",
      description: "All changes discarded"
    });
  };

  // Define the desired order of BOM items
  const bomItemOrder = [
    'Core', 'Winding', 'Backbar', 'Core Backbar', 'Side Pole', 
    'Sealing Plate', 'Core Insulator', 'Conservator', 'Coolant',
    'Machining of Core', 'Dowels and Spacers', 'Lifting Lugs', 
    'Sling Chains', 'Steel Sections', 'Pulleys', 'Self Lube Bearings',
    'Geared Motor', 'Mesh Guards', 'Belt', 'Terminal Box and Posts',
    'Odds Factor', 'OCW Labour', 'Suspension Labour'
  ];

  const getSortOrder = (name: string | null) => {
    if (!name) return 999;
    const index = bomItemOrder.findIndex(item => 
      name.toLowerCase().includes(item.toLowerCase())
    );
    return index === -1 ? 999 : index;
  };

  const filteredMaterials = materials.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParts = parts
    .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => getSortOrder(a.name) - getSortOrder(b.name));

  const filteredLabor = labor
    .filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => getSortOrder(a.name) - getSortOrder(b.name));

  if (loading && materials.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading BOM data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Cost Inputs</h1>
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRevert} disabled={!hasChanges}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Revert
          </Button>
          <Button onClick={handleSaveAll} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bill of Materials Configuration</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
              <TabsTrigger value="parts">Parts ({parts.length})</TabsTrigger>
              <TabsTrigger value="labor">Labor ({labor.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-4">
              <div className="rounded-md border max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Material Name</TableHead>
                      <TableHead className="w-[200px]">Density (t/m³)</TableHead>
                      <TableHead className="w-[200px]">Cost per Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.id}</TableCell>
                        <TableCell>
                          <Input
                            value={material.name || ''}
                            onChange={(e) => {
                              setMaterials(materials.map(m => 
                                m.id === material.id ? { ...m, name: e.target.value } : m
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={material.density || ''}
                            onChange={(e) => {
                              setMaterials(materials.map(m => 
                                m.id === material.id ? { ...m, density: parseFloat(e.target.value) || null } : m
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={material.cost_per_unit || ''}
                            onChange={(e) => {
                              setMaterials(materials.map(m => 
                                m.id === material.id ? { ...m, cost_per_unit: parseFloat(e.target.value) || null } : m
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="parts" className="space-y-4">
              <div className="rounded-md border max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="w-[120px]">BOM</TableHead>
                      <TableHead className="w-[120px]">Material</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[150px]">Cost per Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>{part.id}</TableCell>
                        <TableCell>
                          <Input
                            value={part.name || ''}
                            onChange={(e) => {
                              setParts(parts.map(p => 
                                p.id === part.id ? { ...p, name: e.target.value } : p
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={part.bom || ''}
                            onChange={(e) => {
                              setParts(parts.map(p => 
                                p.id === part.id ? { ...p, bom: parseInt(e.target.value) || null } : p
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={part.material || ''}
                            onChange={(e) => {
                              setParts(parts.map(p => 
                                p.id === part.id ? { ...p, material: parseInt(e.target.value) || null } : p
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={part.amount || ''}
                            onChange={(e) => {
                              setParts(parts.map(p => 
                                p.id === part.id ? { ...p, amount: parseInt(e.target.value) || null } : p
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={part.cost_per_unit || ''}
                            onChange={(e) => {
                              setParts(parts.map(p => 
                                p.id === part.id ? { ...p, cost_per_unit: parseFloat(e.target.value) || null } : p
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="labor" className="space-y-4">
              <div className="rounded-md border max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Labor Name</TableHead>
                      <TableHead className="w-[150px]">BOM</TableHead>
                      <TableHead className="w-[150px]">Rate</TableHead>
                      <TableHead className="w-[150px]">Cost per Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabor.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell>{lab.id}</TableCell>
                        <TableCell>
                          <Input
                            value={lab.name || ''}
                            onChange={(e) => {
                              setLabor(labor.map(l => 
                                l.id === lab.id ? { ...l, name: e.target.value } : l
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={lab.bom || ''}
                            onChange={(e) => {
                              setLabor(labor.map(l => 
                                l.id === lab.id ? { ...l, bom: parseInt(e.target.value) || null } : l
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={lab.rate || ''}
                            onChange={(e) => {
                              setLabor(labor.map(l => 
                                l.id === lab.id ? { ...l, rate: parseInt(e.target.value) || null } : l
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={lab.cost_per_unit || ''}
                            onChange={(e) => {
                              setLabor(labor.map(l => 
                                l.id === lab.id ? { ...l, cost_per_unit: parseFloat(e.target.value) || null } : l
                              ));
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BOMManager;
