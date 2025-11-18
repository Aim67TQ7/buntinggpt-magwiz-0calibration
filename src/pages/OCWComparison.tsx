import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, GitCompare, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SavedConfiguration {
  id: string;
  created_at: string;
  name: string;
  notes: string | null;
  prefix: number;
  suffix: number;
  surface_gauss: number;
  force_factor: number;
  watts: number;
  width: number;
  frame: string;
  total_mass: number;
  voltage_a: number;
  resistance_a: number;
  watts_a: number;
  cold_current_a: number;
  hot_ampere_turns_a: number;
}

const OCWComparison = () => {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState<SavedConfiguration[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_ocw_configurations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations((data || []) as unknown as SavedConfiguration[]);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Failed to load saved configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      if (newSelection.size >= 5) {
        toast.error('You can compare up to 5 configurations at a time');
        return;
      }
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_ocw_configurations' as any)
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Configuration deleted');
      setConfigurations(configurations.filter((c) => c.id !== deleteId));
      selectedIds.delete(deleteId);
      setSelectedIds(new Set(selectedIds));
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const selectedConfigs = configurations.filter((c) => selectedIds.has(c.id));

  const comparisonRows = [
    { label: 'Model', key: (c: SavedConfiguration) => `${c.prefix} OCW ${c.suffix}` },
    { label: 'Surface Gauss', key: (c: SavedConfiguration) => c.surface_gauss?.toLocaleString() || '-' },
    { label: 'Force Factor', key: (c: SavedConfiguration) => c.force_factor?.toLocaleString() || '-' },
    { label: 'Watts', key: (c: SavedConfiguration) => c.watts?.toLocaleString() || '-' },
    { label: 'Width (mm)', key: (c: SavedConfiguration) => c.width?.toLocaleString() || '-' },
    { label: 'Frame', key: (c: SavedConfiguration) => c.frame || '-' },
    { label: 'Total Mass (kg)', key: (c: SavedConfiguration) => c.total_mass?.toFixed(2) || '-' },
    { label: 'Voltage (A20)', key: (c: SavedConfiguration) => c.voltage_a || '-' },
    { label: 'Resistance (A20)', key: (c: SavedConfiguration) => c.resistance_a?.toFixed(4) || '-' },
    { label: 'Cold Current (A20)', key: (c: SavedConfiguration) => c.cold_current_a?.toFixed(2) || '-' },
    { label: 'Hot AT (A20)', key: (c: SavedConfiguration) => c.hot_ampere_turns_a?.toLocaleString() || '-' },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">OCW Configuration Comparison</h1>
          <p className="text-muted-foreground">
            Select up to 5 configurations to compare side-by-side
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/ocw')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selector
        </Button>
      </div>

      {configurations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No saved configurations yet. Save configurations from the OCW Specifications page to compare them here.
            </p>
            <Button onClick={() => navigate('/ocw')}>Go to OCW Selector</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedIds.size >= 2 && !showComparison && (
            <Card className="border-primary">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedIds.size} configurations selected
                  </p>
                  <Button onClick={() => setShowComparison(true)}>
                    <GitCompare className="w-4 h-4 mr-2" />
                    Compare Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showComparison && selectedIds.size >= 2 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Comparison Table</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComparison(false)}
                  >
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Specification</TableHead>
                        {selectedConfigs.map((config) => (
                          <TableHead key={config.id} className="text-center">
                            <div className="font-bold">{config.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(config.created_at).toLocaleDateString()}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonRows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          {selectedConfigs.map((config) => (
                            <TableCell key={config.id} className="text-center">
                              {row.key(config)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Saved Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {configurations.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.has(config.id)}
                        onCheckedChange={() => handleToggleSelection(config.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{config.name}</h3>
                          <Badge variant="secondary">
                            {config.prefix} OCW {config.suffix}
                          </Badge>
                        </div>
                        {config.notes && (
                          <p className="text-sm text-muted-foreground truncate">
                            {config.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Saved: {new Date(config.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{config.surface_gauss} G</span>
                        <span>•</span>
                        <span>{config.watts} W</span>
                        <span>•</span>
                        <span>{config.width} mm</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(config.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saved configuration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OCWComparison;
