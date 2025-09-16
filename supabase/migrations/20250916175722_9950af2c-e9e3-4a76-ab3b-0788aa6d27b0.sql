-- Enable RLS on OCW_magwiz table if not already enabled
ALTER TABLE public."OCW_magwiz" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow public read access to OCW_magwiz table
CREATE POLICY "Allow public read access to OCW_magwiz" 
ON public."OCW_magwiz" 
FOR SELECT 
USING (true);