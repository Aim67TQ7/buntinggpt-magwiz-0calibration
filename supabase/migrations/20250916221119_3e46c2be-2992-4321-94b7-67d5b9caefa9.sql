-- Enable public access to BMR_magwiz table
CREATE POLICY "Allow public access to BMR_magwiz" 
ON public."BMR_magwiz"
FOR ALL 
USING (true)
WITH CHECK (true);