import type { Class, ClassType, Trainer } from '../../types';
import {
  distanceBetweenLocationsKm,
  type DistanceUnit,
  unitToKm,
} from './geo';
import { isOnline } from '../utils/onlineStatus';

export type DiscoveryFilters = {
  specialty: string[];
  verified: boolean;
  topRated: boolean;
  premiumOnly: boolean;
  district: string;
  maxDistance: number | null;
  time: 'any' | 'morning' | 'afternoon' | 'evening';
  classType: ClassType[];
  languages: string[];
  level: string;
  /** VND inclusive range; null = open side */
  priceMin: number | null;
  priceMax: number | null;
  /** Minimum rating threshold; 0 = any */
  ratingMin: number;
  freeToday: boolean;
  gender: 'any' | 'female' | 'male' | 'other';
  onlineNow: boolean;
};

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  specialty: [],
  verified: false,
  topRated: false,
  premiumOnly: false,
  district: 'All',
  maxDistance: null,
  time: 'any',
  classType: [],
  languages: [],
  level: '',
  priceMin: null,
  priceMax: null,
  ratingMin: 0,
  freeToday: false,
  gender: 'any',
  onlineNow: false,
};

export function countDiscoveryFilters(filters: DiscoveryFilters): number {
  return (
    filters.specialty.length +
    filters.classType.length +
    filters.languages.length +
    (filters.district !== 'All' ? 1 : 0) +
    (filters.maxDistance != null ? 1 : 0) +
    (filters.time !== 'any' ? 1 : 0) +
    (filters.level ? 1 : 0) +
    (filters.verified ? 1 : 0) +
    (filters.topRated || filters.ratingMin >= 4.8 ? 1 : 0) +
    (filters.ratingMin > 0 && filters.ratingMin < 4.8 ? 1 : 0) +
    (filters.premiumOnly ? 1 : 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.freeToday ? 1 : 0) +
    (filters.gender !== 'any' ? 1 : 0) +
    (filters.onlineNow ? 1 : 0)
  );
}

function checkTime(classTime: string, filterTime: DiscoveryFilters['time']): boolean {
  if (filterTime === 'any') return true;
  const hour = parseInt(classTime.split(':')[0] ?? '', 10);
  if (Number.isNaN(hour)) return false;
  if (filterTime === 'morning') return hour >= 6 && hour < 12;
  if (filterTime === 'afternoon') return hour >= 12 && hour < 17;
  if (filterTime === 'evening') return hour >= 17 && hour < 22;
  return false;
}

function weekdayShort(d = new Date()) {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function classHasCapacityToday(cls: Class): boolean {
  const day = weekdayShort();
  const days = cls.schedule?.days ?? [];
  if (!days.some((d) => d.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)))) {
    return false;
  }
  const enrolled = cls.bookings?.length ?? 0;
  return cls.capacity <= 0 || enrolled < cls.capacity;
}

function classMatchesFilters(cls: Class, filters: DiscoveryFilters): boolean {
  if (filters.classType.length > 0 && !filters.classType.includes(cls.classType)) {
    return false;
  }
  if (filters.level && cls.level !== filters.level) {
    return false;
  }
  if (filters.languages.length > 0) {
    const langs = cls.language ?? [];
    if (!filters.languages.some((l) => langs.includes(l))) return false;
  }
  if (filters.time !== 'any') {
    if (!cls.schedule?.time || !checkTime(cls.schedule.time, filters.time)) return false;
  }
  if (filters.priceMin != null && cls.price < filters.priceMin) return false;
  if (filters.priceMax != null && cls.price > filters.priceMax) return false;
  if (filters.freeToday && !classHasCapacityToday(cls)) return false;
  return true;
}

function trainerNeedsClassMatch(filters: DiscoveryFilters): boolean {
  return (
    filters.classType.length > 0 ||
    filters.languages.length > 0 ||
    !!filters.level ||
    filters.time !== 'any' ||
    filters.freeToday ||
    filters.priceMin != null ||
    filters.priceMax != null
  );
}

export function trainerDistanceKm(
  trainer: Trainer,
  userLocation?: string | null
): number | null {
  return distanceBetweenLocationsKm(userLocation, trainer.location);
}

export function trainerMatchesDiscoveryFilters(
  trainer: Trainer,
  filters: DiscoveryFilters,
  opts: {
    searchQuery?: string;
    categoryId?: string | null;
    userLocation?: string | null;
    distanceUnit: DistanceUnit;
  }
): boolean {
  const specialty = trainer.specialty ?? [];
  const classes = trainer.classes ?? [];

  if (opts.categoryId && opts.categoryId !== 'all') {
    const cat = opts.categoryId.toLowerCase();
    const hit =
      specialty.some((s) => s.toLowerCase().includes(cat)) ||
      classes.some((c) => c.name.toLowerCase().includes(cat));
    if (!hit) return false;
  }

  if (filters.specialty.length > 0) {
    if (!filters.specialty.some((s) => specialty.includes(s))) return false;
  }

  if (filters.district !== 'All') {
    if (!trainer.location?.includes(filters.district)) return false;
  }

  if (filters.maxDistance != null) {
    const km = trainerDistanceKm(trainer, opts.userLocation);
    if (km == null) return false;
    if (km > unitToKm(filters.maxDistance, opts.distanceUnit)) return false;
  }

  if (filters.verified && trainer.verificationStatus !== 'verified') return false;

  const ratingFloor = filters.topRated ? Math.max(filters.ratingMin, 4.8) : filters.ratingMin;
  if (ratingFloor > 0 && (trainer.rating || 0) < ratingFloor) return false;

  if (filters.premiumOnly && !trainer.isPremium) return false;

  if (filters.gender !== 'any' && trainer.gender && trainer.gender !== filters.gender) {
    return false;
  }
  if (filters.gender !== 'any' && !trainer.gender) return false;

  if (filters.onlineNow && !(trainer.lastSeen && isOnline(trainer.lastSeen))) {
    return false;
  }

  if (filters.priceMin != null || filters.priceMax != null) {
    const price = trainer.price || 0;
    if (filters.priceMin != null && price < filters.priceMin) return false;
    if (filters.priceMax != null && price > filters.priceMax) return false;
  }

  if (trainerNeedsClassMatch(filters)) {
    if (!classes.some((cls) => classMatchesFilters(cls, filters))) return false;
  }

  const query = opts.searchQuery?.toLowerCase().trim();
  if (query) {
    const nameMatch = (trainer.name || '').toLowerCase().includes(query);
    const locMatch = (trainer.location || '').toLowerCase().includes(query);
    const specialtyMatch = specialty.some((s) => s.toLowerCase().includes(query));
    const classMatch = classes.some(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.level || '').toLowerCase().includes(query)
    );
    if (!nameMatch && !locMatch && !specialtyMatch && !classMatch) return false;
  }

  return true;
}

export function classEntryMatchesDiscoveryFilters(
  entry: { cls: Class; trainer: Trainer },
  filters: DiscoveryFilters,
  opts: {
    searchQuery?: string;
    categoryId?: string | null;
    userLocation?: string | null;
    distanceUnit: DistanceUnit;
  }
): boolean {
  const { cls, trainer } = entry;
  const specialty = trainer.specialty ?? [];

  if (filters.district !== 'All' && !trainer.location?.includes(filters.district)) {
    return false;
  }
  if (filters.maxDistance != null) {
    const km = trainerDistanceKm(trainer, opts.userLocation);
    if (km == null) return false;
    if (km > unitToKm(filters.maxDistance, opts.distanceUnit)) return false;
  }
  if (filters.verified && trainer.verificationStatus !== 'verified') return false;
  const ratingFloor = filters.topRated ? Math.max(filters.ratingMin, 4.8) : filters.ratingMin;
  if (ratingFloor > 0 && (trainer.rating || 0) < ratingFloor) return false;
  if (filters.premiumOnly && !trainer.isPremium) return false;
  if (filters.gender !== 'any') {
    if (!trainer.gender || trainer.gender !== filters.gender) return false;
  }
  if (filters.onlineNow && !(trainer.lastSeen && isOnline(trainer.lastSeen))) return false;
  if (filters.specialty.length > 0 && !filters.specialty.some((s) => specialty.includes(s))) {
    return false;
  }
  if (!classMatchesFilters(cls, filters)) return false;

  if (opts.categoryId && opts.categoryId !== 'all') {
    const cat = opts.categoryId.toLowerCase();
    const hit =
      specialty.some((s) => s.toLowerCase().includes(cat)) ||
      cls.name.toLowerCase().includes(cat);
    if (!hit) return false;
  }

  const query = opts.searchQuery?.toLowerCase().trim();
  if (query) {
    const hit =
      cls.name.toLowerCase().includes(query) ||
      trainer.name.toLowerCase().includes(query) ||
      (trainer.location || '').toLowerCase().includes(query) ||
      (cls.level || '').toLowerCase().includes(query) ||
      (cls.language || []).some((l) => l.toLowerCase().includes(query));
    if (!hit) return false;
  }

  return true;
}
