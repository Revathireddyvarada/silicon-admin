-- RETIRED. Do not apply. Dashboards use ride-service trip_slot_counts.
-- Drop with sql/drop-trip-counts.sql.
CREATE TABLE IF NOT EXISTS trip_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_trips integer NOT NULL DEFAULT 0,
  pending_trips integer NOT NULL DEFAULT 0,
  ongoing_trips integer NOT NULL DEFAULT 0,
  completed_trips integer NOT NULL DEFAULT 0,
  cancelled_trips integer NOT NULL DEFAULT 0,
  vendor_id uuid NOT NULL,
  state_id uuid NOT NULL,
  city_id uuid NOT NULL,
  zone_id uuid NOT NULL,
  total_trip_amount numeric(14, 2) NOT NULL DEFAULT 0,
  driver_amount numeric(14, 2) NOT NULL DEFAULT 0,
  vendor_amount numeric(14, 2) NOT NULL DEFAULT 0,
  admin_amount numeric(14, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_counts_vendor_date_zone_uk
    UNIQUE (vendor_id, date, state_id, city_id, zone_id)
);

CREATE INDEX IF NOT EXISTS trip_counts_date_idx ON trip_counts (date);
CREATE INDEX IF NOT EXISTS trip_counts_vendor_date_idx ON trip_counts (vendor_id, date);
CREATE INDEX IF NOT EXISTS trip_counts_zone_date_idx ON trip_counts (zone_id, date);
