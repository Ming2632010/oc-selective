-- Allow the seventh K–Y1 Maths unit. Additive: only widens the unit_id check.
ALTER TABLE early_math_items DROP CONSTRAINT IF EXISTS early_math_items_unit_id_check;
ALTER TABLE early_math_items ADD CONSTRAINT early_math_items_unit_id_check CHECK (unit_id BETWEEN 1 AND 7);
