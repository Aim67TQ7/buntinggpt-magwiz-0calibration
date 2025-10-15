-- Update BMR_quotes table to replace 'NULL' string values with MW0 format
-- This will convert records like id=63 to quote_number='MW00063'
-- Records starting with 'Q' will remain untouched
UPDATE "BMR_quotes"
SET quote_number = 'MW0' || LPAD(id::text, 5, '0')
WHERE quote_number = 'NULL';