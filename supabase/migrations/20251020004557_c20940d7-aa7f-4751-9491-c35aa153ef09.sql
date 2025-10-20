-- Enable RLS on BMR_Top if not already enabled
ALTER TABLE public."BMR_Top" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to BMR_Top
CREATE POLICY "Allow public access to BMR_Top"
ON public."BMR_Top"
FOR SELECT
TO public
USING (true);