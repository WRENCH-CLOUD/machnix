-- Rename tables for better naming convention
ALTER TABLE tenant.parts RENAME TO inventory_items;
ALTER TABLE tenant.part_usages RENAME TO inventory_item_usages;
