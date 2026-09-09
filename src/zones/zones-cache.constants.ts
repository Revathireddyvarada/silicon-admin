/** Shared Redis key — admin writes; ride-service reads for trip create PIP. */
export const ZONES_ACTIVE_CACHE_KEY = "zones:active";

export type CachedZoneLatLng = { lat: number; lng: number };

export type CachedZone = {
  id: string;
  zone_name: string;
  state_id: string;
  city_id: string;
  polygon_paths: CachedZoneLatLng[];
  /** Axis-aligned bbox for fast reject before PIP. */
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number };
};
