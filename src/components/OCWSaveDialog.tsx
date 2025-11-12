import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OCWSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocwData: any;
}

export const OCWSaveDialog: React.FC<OCWSaveDialogProps> = ({
  open,
  onOpenChange,
  ocwData,
}) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for this configuration');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_ocw_configurations')
        .insert({
          name: name.trim(),
          notes: notes.trim() || null,
          prefix: ocwData.Prefix,
          suffix: ocwData.Suffix,
          surface_gauss: ocwData.surface_gauss,
          force_factor: ocwData.force_factor,
          watts: ocwData.watts,
          width: ocwData.width,
          frame: ocwData.frame,
          core_dimension: ocwData.core_dimension,
          core_mass: ocwData.core_mass,
          winding_dimension: ocwData.winding_dimension,
          winding_mass: ocwData.winding_mass,
          backbar_dimension: ocwData.backbar_dimension,
          backbar_mass: ocwData.backbar_mass,
          core_backbar_dimension: ocwData.core_backbar_dimension,
          core_backbar_mass: ocwData.core_backbar_mass,
          side_pole_dimension: ocwData.side_pole_dimension,
          side_pole_mass: ocwData.side_pole_mass,
          sealing_plate_dimension: ocwData.sealing_plate_dimension,
          sealing_plate_mass: ocwData.sealing_plate_mass?.toString(),
          core_insulator_dimension: ocwData.core_insulator_dimension,
          core_insulator_mass: ocwData.core_insulator_mass?.toString(),
          conservator_dimension: ocwData.conservator_dimension,
          conservator_mass: ocwData.conservator_mass,
          coolant_mass: ocwData.coolant_mass,
          total_mass: ocwData.total_mass,
          number_of_sections: ocwData.number_of_sections,
          radial_depth: ocwData.radial_depth,
          coil_height: ocwData.coil_height,
          diameter: ocwData.diameter,
          mean_length_of_turn: ocwData.mean_length_of_turn,
          number_of_turns: ocwData.number_of_turns,
          surface_area: ocwData.surface_area,
          wires_in_parallel: ocwData.wires_in_parallel,
          voltage_A: ocwData.voltage_A,
          voltage_B: ocwData.voltage_B,
          voltage_C: ocwData.voltage_C,
          resistance_A: ocwData.resistance_A,
          resistance_B: ocwData.resistance_B,
          resistance_C: ocwData.resistance_C,
          watts_A: ocwData.watts_A,
          watts_B: ocwData.watts_B,
          watts_C: ocwData.watts_C,
          cold_current_A: ocwData.cold_current_A,
          cold_current_B: ocwData.cold_current_B,
          cold_current_C: ocwData.cold_current_C,
          hot_current_A: ocwData.hot_current_A,
          hot_current_B: ocwData.hot_current_B,
          hot_current_C: ocwData.hot_current_C,
          cold_ampere_turns_A: ocwData.cold_ampere_turns_A,
          cold_ampere_turns_B: ocwData.cold_ampere_turns_B,
          cold_ampere_turns_C: ocwData.cold_ampere_turns_C,
          hot_ampere_turns_A: ocwData.hot_ampere_turns_A,
          hot_ampere_turns_B: ocwData.hot_ampere_turns_B,
          hot_ampere_turns_C: ocwData.hot_ampere_turns_C,
          ambient_temperature_A: ocwData.ambient_temperature_A,
          ambient_temperature_B: ocwData.ambient_temperature_B,
          ambient_temperature_C: ocwData.ambient_temperature_C,
          temperature_rise_A: ocwData.temperature_rise_A,
          temperature_rise_B: ocwData.temperature_rise_B,
          temperature_rise_C: ocwData.temperature_rise_C,
          maximum_rise_A: ocwData.maximum_rise_A,
          maximum_rise_B: ocwData.maximum_rise_B,
          maximum_rise_C: ocwData.maximum_rise_C,
          expected_rise_A: ocwData.expected_rise_A,
          expected_rise_B: ocwData.expected_rise_B,
          expected_rise_C: ocwData.expected_rise_C,
        });

      if (error) throw error;

      toast.success('Configuration saved successfully!');
      setName('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save OCW Configuration</DialogTitle>
          <DialogDescription>
            Save this configuration to compare it with other OCW models later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Project Alpha - Primary Magnet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes about this configuration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
              rows={3}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Model: <span className="font-semibold">{ocwData.Prefix} OCW {ocwData.Suffix}</span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
