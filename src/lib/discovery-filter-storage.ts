import {
  EMPTY_DISCOVERY_FILTERS,
  type DiscoveryFilters,
} from './discovery-filters';

const KEY = 'rhinofit.discoveryFilters';

export function readDiscoveryFilters(): DiscoveryFilters {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_DISCOVERY_FILTERS;
    return { ...EMPTY_DISCOVERY_FILTERS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_DISCOVERY_FILTERS;
  }
}

export function writeDiscoveryFilters(filters: DiscoveryFilters) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(filters));
  } catch {
    /* ignore */
  }
}
