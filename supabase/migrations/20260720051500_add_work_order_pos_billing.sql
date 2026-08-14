-- Add resolution_note to work_orders
ALTER TABLE work_orders 
ADD COLUMN resolution_note TEXT;

-- Add work_order_id to pos_sales to link sales to work orders
ALTER TABLE pos_sales
ADD COLUMN work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL;

-- Create an index to quickly lookup sales by work order
CREATE INDEX idx_pos_sales_work_order_id ON pos_sales(work_order_id);
