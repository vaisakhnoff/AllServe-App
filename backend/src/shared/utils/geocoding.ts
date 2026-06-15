import { logger } from "../logger/logger";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  fullAddress?: string;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

interface NominatimAddress {
  state?: string;
  state_district?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
}

interface NominatimReverseResult {
  error?: string;
  display_name?: string;
  address?: NominatimAddress;
}

async function nominatimFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AllServeApp/1.0" },
  });
  if (!res.ok) return null;
  return res.json();
}

// Geocode an address string (city, pincode, or full address) into coordinates.
//  Returns null if geocoding fails — caller should handle gracefully.



export async function geocodeAddress(query: string): Promise<GeocodingResult | null> {
  try {
    const data = await nominatimFetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=in`
    );
    if (!Array.isArray(data) || data.length === 0) return null;
    const result = data[0] as NominatimSearchResult;
    if (!result.lat || !result.lon) return null;
    const addr = result.address || {};
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      state: addr.state,
      district: addr.state_district || addr.county,
      city: addr.city || addr.town || addr.village,
      pincode: addr.postcode,
      fullAddress: result.display_name,
    };
  } catch (err) {
    logger.error("Geocoding failed", { query, error: err });
    return null;
  }
}

  // Reverse geocode coordinates into address details.

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const data = await nominatimFetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    if (!data || typeof data !== "object") return null;
    const result = data as NominatimReverseResult;
    if (result.error) return null;
    const addr = result.address || {};
    return {
      latitude: lat,
      longitude: lng,
      state: addr.state,
      district: addr.state_district || addr.county,
      city: addr.city || addr.town || addr.village,
      pincode: addr.postcode,
      fullAddress: result.display_name,
    };
  } catch (err) {
    logger.error("Reverse geocoding failed", { lat, lng, error: err });
    return null;
  }
}
