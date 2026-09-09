-- Zone management: polygons stored as jsonb (GeoJSON + Google Maps paths)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name VARCHAR(255) NOT NULL,
  state_id UUID NOT NULL REFERENCES states(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  polygon JSONB NOT NULL,
  polygon_paths JSONB NOT NULL,
  status BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_zones_name_city_active
  ON zones (LOWER(TRIM(zone_name)), city_id)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_zones_state_id ON zones (state_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_zones_city_id ON zones (city_id) WHERE is_deleted = false;

-- Active zones are cached in Redis key `zones:active` (admin-service on CRUD/boot).
-- ride-service reads that key on trip create using ADMIN_MASTER_REDIS_DB (same value as admin-service).
