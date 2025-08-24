-- Add constraints to prevent extreme P&L values in PaperTrade table

-- Add check constraint to ensure P&L is within reasonable bounds (-$10,000 to +$10,000)
ALTER TABLE "PaperTrade" 
ADD CONSTRAINT chk_pnl_reasonable_bounds 
CHECK (pnl IS NULL OR (pnl >= -10000 AND pnl <= 10000));

-- Add check constraint to ensure P&L percentage is within reasonable bounds (-1000% to +1000%)
ALTER TABLE "PaperTrade" 
ADD CONSTRAINT chk_pnl_percent_reasonable_bounds 
CHECK ("pnlPercent" IS NULL OR ("pnlPercent" >= -1000 AND "pnlPercent" <= 1000));

-- Add check constraint to ensure quantity is positive and reasonable
ALTER TABLE "PaperTrade" 
ADD CONSTRAINT chk_quantity_positive 
CHECK (quantity > 0 AND quantity <= 1000000);

-- Add check constraint to ensure price is positive and reasonable
ALTER TABLE "PaperTrade" 
ADD CONSTRAINT chk_price_positive 
CHECK (price > 0 AND price <= 10000000);

-- Add check constraint to ensure value is reasonable
ALTER TABLE "PaperTrade" 
ADD CONSTRAINT chk_value_reasonable 
CHECK (value > 0 AND value <= 100000000);