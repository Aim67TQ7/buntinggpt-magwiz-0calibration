-- Add cost_per_unit column to materials table
ALTER TABLE "BMR_materials" 
ADD COLUMN IF NOT EXISTS cost_per_unit numeric;

-- Add cost_per_unit column to parts table
ALTER TABLE "BMR_parts" 
ADD COLUMN IF NOT EXISTS cost_per_unit numeric;

-- Add cost_per_unit column to labour table
ALTER TABLE "BMR_labour" 
ADD COLUMN IF NOT EXISTS cost_per_unit numeric;