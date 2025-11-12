-- Create table for saved OCW configurations
CREATE TABLE public.saved_ocw_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  notes TEXT,
  
  -- Performance specifications
  prefix BIGINT NOT NULL,
  suffix BIGINT NOT NULL,
  surface_gauss BIGINT,
  force_factor BIGINT,
  watts BIGINT,
  width BIGINT,
  frame TEXT,
  
  -- Component data
  core_dimension TEXT,
  core_mass DOUBLE PRECISION,
  winding_dimension TEXT,
  winding_mass DOUBLE PRECISION,
  backbar_dimension TEXT,
  backbar_mass DOUBLE PRECISION,
  core_backbar_dimension TEXT,
  core_backbar_mass DOUBLE PRECISION,
  side_pole_dimension TEXT,
  side_pole_mass DOUBLE PRECISION,
  sealing_plate_dimension TEXT,
  sealing_plate_mass TEXT,
  core_insulator_dimension TEXT,
  core_insulator_mass TEXT,
  conservator_dimension TEXT,
  conservator_mass DOUBLE PRECISION,
  coolant_mass DOUBLE PRECISION,
  total_mass DOUBLE PRECISION,
  
  -- Winding information
  number_of_sections BIGINT,
  radial_depth BIGINT,
  coil_height DOUBLE PRECISION,
  diameter DOUBLE PRECISION,
  mean_length_of_turn DOUBLE PRECISION,
  number_of_turns TEXT,
  surface_area DOUBLE PRECISION,
  wires_in_parallel BIGINT,
  
  -- Electrical properties
  voltage_A BIGINT,
  voltage_B DOUBLE PRECISION,
  voltage_C DOUBLE PRECISION,
  resistance_A DOUBLE PRECISION,
  resistance_B DOUBLE PRECISION,
  resistance_C DOUBLE PRECISION,
  watts_A BIGINT,
  watts_B BIGINT,
  watts_C BIGINT,
  cold_current_A DOUBLE PRECISION,
  cold_current_B DOUBLE PRECISION,
  cold_current_C DOUBLE PRECISION,
  hot_current_A DOUBLE PRECISION,
  hot_current_B DOUBLE PRECISION,
  hot_current_C DOUBLE PRECISION,
  cold_ampere_turns_A TEXT,
  cold_ampere_turns_B TEXT,
  cold_ampere_turns_C TEXT,
  hot_ampere_turns_A BIGINT,
  hot_ampere_turns_B BIGINT,
  hot_ampere_turns_C BIGINT,
  ambient_temperature_A TEXT,
  ambient_temperature_B TEXT,
  ambient_temperature_C TEXT,
  temperature_rise_A BIGINT,
  temperature_rise_B BIGINT,
  temperature_rise_C BIGINT,
  maximum_rise_A BIGINT,
  maximum_rise_B BIGINT,
  maximum_rise_C BIGINT,
  expected_rise_A DOUBLE PRECISION,
  expected_rise_B DOUBLE PRECISION,
  expected_rise_C DOUBLE PRECISION
);

-- Enable Row Level Security
ALTER TABLE public.saved_ocw_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since no auth in this app)
CREATE POLICY "Allow all operations on saved_ocw_configurations" 
ON public.saved_ocw_configurations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_ocw_configurations_updated_at
BEFORE UPDATE ON public.saved_ocw_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on created_at for faster sorting
CREATE INDEX idx_saved_ocw_configurations_created_at 
ON public.saved_ocw_configurations(created_at DESC);