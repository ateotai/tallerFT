ALTER TABLE "inventory"
  ADD COLUMN "part_condition" text NOT NULL DEFAULT 'Nuevo';

ALTER TABLE "inventory"
  ADD COLUMN "notes" text;

