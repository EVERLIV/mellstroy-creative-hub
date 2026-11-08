import { HCMC_DISTRICTS } from '../../constants';

export type DistanceUnit = 'km' | 'mi';
export type LatLng = { lat: number; lng: number };

/** Approximate district centers for Saigon distance estimates. */
export const HCMC_DISTRICT_COORDS: Record<string, LatLng> = {
  'Quận 1': { lat: 10.7769, lng: 106.7009 },
  'Quận 2': { lat: 10.7872, lng: 106.7498 },
  'Quận 3': { lat: 10.784, lng: 106.6845 },
  'Quận 4': { lat: 10.759, lng: 106.7019 },
  'Quận 5': { lat: 10.754, lng: 106.667 },
  'Quận 6': { lat: 10.7463, lng: 106.635 },
  'Quận 7': { lat: 10.734, lng: 106.721 },
  'Quận 8': { lat: 10.7402, lng: 106.665 },
  'Quận 9': { lat: 10.842, lng: 106.81 },
  'Quận 10': { lat: 10.773, lng: 106.6675 },
  'Quận 11': { lat: 10.7635, lng: 106.65 },
  'Quận 12': { lat: 10.863, lng: 106.657 },
  'Quận Bình Thạnh': { lat: 10.8106, lng: 106.709 },
  'Quận Gò Vấp': { lat: 10.838, lng: 106.665 },
  'Quận Phú Nhuận': { lat: 10.799, lng: 106.68 },
  'Quận Tân Bình': { lat: 10.801, lng: 106.652 },
  'Quận Tân Phú': { lat: 10.79, lng: 106.628 },
  'Quận Bình Tân': { lat: 10.765, lng: 106.603 },
  'Thành phố Thủ Đức': { lat: 10.85, lng: 106.772 },
  'Huyện Bình Chánh': { lat: 10.72, lng: 106.575 },
  'Huyện Cần Giờ': { lat: 10.411, lng: 106.955 },
  'Huyện Củ Chi': { lat: 11.02, lng: 106.53 },
  'Huyện Hóc Môn': { lat: 10.886, lng: 106.595 },
  'Huyện Nhà Bè': { lat: 10.678, lng: 106.738 },
};

const KM_TO_MI = 0.621371;
const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function kmToUnit(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? km * KM_TO_MI : km;
}

export function unitToKm(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value / KM_TO_MI : value;
}

export function formatDistance(km: number | null | undefined, unit: DistanceUnit): string {
  if (km == null || Number.isNaN(km)) return '—';
  const value = kmToUnit(km, unit);
  const rounded = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  return `${rounded} ${unit}`;
}

/** Match free-text location strings to a known HCMC district. */
export function resolveDistrict(location?: string | null): string | null {
  if (!location) return null;
  const raw = location.trim();
  if (!raw) return null;

  const exact = HCMC_DISTRICTS.find((d) => d.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  const includes = HCMC_DISTRICTS.find(
    (d) => raw.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(raw.toLowerCase())
  );
  if (includes) return includes;

  // English "District N" → Quận N
  const districtMatch = raw.match(/district\s*(\d+)/i);
  if (districtMatch) {
    const candidate = `Quận ${districtMatch[1]}`;
    if (HCMC_DISTRICTS.includes(candidate)) return candidate;
  }

  return null;
}

export function coordsForLocation(location?: string | null): LatLng | null {
  const district = resolveDistrict(location);
  if (!district) return null;
  return HCMC_DISTRICT_COORDS[district] ?? null;
}

export function distanceBetweenLocationsKm(
  fromLocation?: string | null,
  toLocation?: string | null
): number | null {
  const from = coordsForLocation(fromLocation);
  const to = coordsForLocation(toLocation);
  if (!from || !to) return null;
  return haversineKm(from, to);
}

export const DISTANCE_PRESETS_KM = [2, 5, 10, 15, 25, 40] as const;
export const DISTANCE_PRESETS_MI = [1, 3, 5, 10, 15, 25] as const;

export function distancePresets(unit: DistanceUnit): readonly number[] {
  return unit === 'mi' ? DISTANCE_PRESETS_MI : DISTANCE_PRESETS_KM;
}

export function maxDistanceSlider(unit: DistanceUnit): number {
  return unit === 'mi' ? 30 : 50;
}
