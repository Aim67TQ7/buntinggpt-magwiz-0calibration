-- Enable RLS and create policies for BMR tables to allow public access
-- Using correct case-sensitive table names

-- BMR_quotes table
ALTER TABLE public."BMR_quotes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to BMR_quotes" ON public."BMR_quotes" FOR ALL USING (true) WITH CHECK (true);

-- BMR_quote_items table  
ALTER TABLE public."BMR_quote_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to BMR_quote_items" ON public."BMR_quote_items" FOR ALL USING (true) WITH CHECK (true);

-- BMR_products table
ALTER TABLE public."BMR_products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to BMR_products" ON public."BMR_products" FOR ALL USING (true) WITH CHECK (true);

-- BMR_parts table
ALTER TABLE public."BMR_parts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to BMR_parts" ON public."BMR_parts" FOR ALL USING (true) WITH CHECK (true);