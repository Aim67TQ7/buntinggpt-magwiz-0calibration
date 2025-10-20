-- Enable Row Level Security on BMR_materials (case-sensitive table name)
ALTER TABLE "BMR_materials" ENABLE ROW LEVEL SECURITY;

-- Create public access policy for BMR_materials
CREATE POLICY "Allow public access to BMR_materials"
ON "BMR_materials"
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable Row Level Security on BMR_labour (case-sensitive table name)
ALTER TABLE "BMR_labour" ENABLE ROW LEVEL SECURITY;

-- Create public access policy for BMR_labour
CREATE POLICY "Allow public access to BMR_labour"
ON "BMR_labour"
FOR ALL
USING (true)
WITH CHECK (true);