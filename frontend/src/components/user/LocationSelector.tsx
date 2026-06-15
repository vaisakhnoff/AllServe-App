"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Country, State, City, IState, ICity } from "country-state-city";
import { ChevronDown, MapPin, Navigation, Search, Loader2 } from "lucide-react";

/**
 * Coordinate source priority — used to prevent low-precision data
 * (city-level dropdown coords) from overwriting high-precision data
 * (GPS, pincode-derived, or place-derived coords).
 *
 * Priority order: gps > pincode > place > city > none
 *
 * Why this matters:
 *   A provider in Changaramkulam (679574) selecting city="Kochi" from
 *   the dropdown should NOT get Kochi's coordinates — they're 80km off.
 *   Pincode geocoding gives the actual area; GPS gives the actual point.
 */
export type CoordSource = "gps" | "pincode" | "place" | "city" | "none";

const PRIORITY: Record<CoordSource, number> = {
  gps: 4,
  pincode: 3,
  place: 2,
  city: 1,
  none: 0,
};

export interface LocationValue {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  district?: string;
  city: string;
  /** Free-text locality / town / village name — geocoded for accurate coords */
  place?: string;
  pincode: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  /** Tracks the source that set the current coordinates */
  coordSource?: CoordSource;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  errors?: Partial<Record<keyof LocationValue, string>>;
  showFullAddress?: boolean;
}

/**
 * Searchable combobox for cascading dropdowns.
 */
function SearchableSelect({
  value, onChange, options, placeholder, disabled, error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options.slice(0, 100);
    const q = query.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 100);
  }, [query, options]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-lg border bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>{value || placeholder}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-slate-500">No matches found</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => {
                    onChange(opt.name);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === opt.name ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  data-code={opt.code}
                >
                  {opt.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

export function LocationSelector({ value, onChange, errors = {}, showFullAddress = true }: Props) {
  const [detecting, setDetecting] = useState(false);
  const [pincodeLooking, setPincodeLooking] = useState(false);
  const [placeLooking, setPlaceLooking] = useState(false);

  // Default to India (IN) on first mount
  useEffect(() => {
    if (!value.countryCode && !value.country) {
      onChange({ ...value, country: "India", countryCode: "IN" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(
    () => (value.countryCode ? State.getStatesOfCountry(value.countryCode) : []),
    [value.countryCode]
  );
  const cities = useMemo<ICity[]>(() => {
    if (!value.countryCode || !value.stateCode) return [];
    return City.getCitiesOfState(value.countryCode, value.stateCode);
  }, [value.countryCode, value.stateCode]);

  /**
   * Update coords only if the new source is equal-or-higher priority.
   * Returns the merged value to pass to onChange.
   */
  const updateCoords = (
    base: LocationValue,
    newLat: number | undefined,
    newLng: number | undefined,
    newSource: CoordSource
  ): LocationValue => {
    const currentSource = base.coordSource || "none";
    if (newLat == null || newLng == null) return base;
    if (PRIORITY[newSource] >= PRIORITY[currentSource]) {
      return { ...base, latitude: newLat, longitude: newLng, coordSource: newSource };
    }
    return base;
  };

  const handleCountryChange = (name: string) => {
    const c = countries.find((x) => x.name === name);
    if (!c) return;
    onChange({ ...value, country: c.name, countryCode: c.isoCode, state: "", stateCode: "", city: "", district: "" });
  };

  const handleStateChange = (name: string) => {
    const s: IState | undefined = states.find((x) => x.name === name);
    if (!s) return;
    onChange({ ...value, state: s.name, stateCode: s.isoCode, city: "", district: "" });
  };

  const handleCityChange = (name: string) => {
    const c = cities.find((x) => x.name === name);
    if (!c) return;
    const lat = c.latitude ? parseFloat(c.latitude) : undefined;
    const lng = c.longitude ? parseFloat(c.longitude) : undefined;
    // City coords are only used if no higher-priority source has set them
    const next = updateCoords({ ...value, city: c.name }, lat, lng, "city");
    onChange(next);
  };

  // Pincode → coords (high priority — overrides city coords)
  // 1. Use api.postalpincode.in for state/district/city metadata (India only)
  // 2. Use Nominatim for accurate pincode-area coordinates
  const lookupPincode = async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode) || value.countryCode !== "IN") return;
    setPincodeLooking(true);
    try {
      // Run both lookups in parallel
      const [postalRes, nominatimRes] = await Promise.all([
        fetch(`https://api.postalpincode.in/pincode/${pincode}`).then((r) => r.json()).catch(() => null),
        fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=in&format=json&limit=1`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      let next: LocationValue = { ...value, pincode };

      // Apply postal pincode metadata (state/district/city)
      const office = postalRes?.[0]?.PostOffice?.[0];
      if (office) {
        const matchedState = states.find((s) => s.name.toLowerCase() === office.State?.toLowerCase());
        next = {
          ...next,
          state: matchedState?.name || office.State || next.state,
          stateCode: matchedState?.isoCode || next.stateCode,
          district: office.District || next.district,
          // Only auto-fill city if dropdown city is empty (don't override user choice)
          city: next.city || office.District || office.Block || "",
        };
      }

      // Apply Nominatim coordinates (override city-level coords)
      if (Array.isArray(nominatimRes) && nominatimRes.length > 0) {
        const lat = parseFloat(nominatimRes[0].lat);
        const lng = parseFloat(nominatimRes[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          next = updateCoords(next, lat, lng, "pincode");
        }
      }

      onChange(next);
    } catch { /* ignore — backend will geocode on save */ } finally {
      setPincodeLooking(false);
    }
  };

  // Place/Locality → coords (medium priority — beats city, loses to pincode/GPS)
  const lookupPlace = async (place: string) => {
    if (!place || place.trim().length < 3) return;
    const query = [place, value.state, value.country || "India"].filter(Boolean).join(", ");
    setPlaceLooking(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in&addressdetails=1`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          onChange(updateCoords({ ...value, place }, lat, lng, "place"));
          return;
        }
      }
    } catch { /* ignore */ } finally {
      setPlaceLooking(false);
    }
  };

  // GPS — highest priority, never overwritten
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const addr = data?.address || {};
          const detectedCountry = countries.find(
            (c) => c.name === addr.country || c.isoCode === (addr.country_code || "").toUpperCase()
          );
          const countryCode = detectedCountry?.isoCode || "IN";
          const stateList = State.getStatesOfCountry(countryCode);
          const detectedState = stateList.find((s) => s.name.toLowerCase() === (addr.state || "").toLowerCase());
          const stateCode = detectedState?.isoCode || "";
          const cityList = stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
          const cityName = addr.city || addr.town || addr.village || addr.county || "";
          const detectedCity = cityList.find((c) => c.name.toLowerCase() === cityName.toLowerCase());

          // GPS sets coords with highest priority
          onChange({
            ...value,
            country: detectedCountry?.name || addr.country || "India",
            countryCode,
            state: detectedState?.name || addr.state || value.state,
            stateCode,
            district: addr.state_district || addr.county || value.district,
            city: detectedCity?.name || cityName || value.city,
            place: addr.suburb || addr.neighbourhood || addr.hamlet || value.place || "",
            pincode: addr.postcode || value.pincode,
            fullAddress: data?.display_name || value.fullAddress,
            latitude,
            longitude,
            coordSource: "gps",
          });
        } catch {
          onChange({ ...value, latitude, longitude, coordSource: "gps" });
        } finally { setDetecting(false); }
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sourceLabel: Record<CoordSource, string> = {
    gps: "GPS",
    pincode: "Pincode",
    place: "Place name",
    city: "City",
    none: "—",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin size={14} className="text-indigo-600" />
          Location Details
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={detecting}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
        >
          {detecting ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
          {detecting ? "Detecting..." : "Use Current Location"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Country <span className="text-red-500">*</span></label>
          <SearchableSelect
            value={value.country}
            onChange={handleCountryChange}
            options={countries.map((c) => ({ code: c.isoCode, name: c.name }))}
            placeholder="Select country"
            error={errors.country}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">State <span className="text-red-500">*</span></label>
          <SearchableSelect
            value={value.state}
            onChange={handleStateChange}
            options={states.map((s) => ({ code: s.isoCode, name: s.name }))}
            placeholder={value.countryCode ? "Select state" : "Select country first"}
            disabled={!value.countryCode}
            error={errors.state}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">City / Nearest Town <span className="text-red-500">*</span></label>
          <SearchableSelect
            value={value.city}
            onChange={handleCityChange}
            options={cities.map((c) => ({ code: c.name, name: c.name }))}
            placeholder={value.stateCode ? "Select city" : "Select state first"}
            disabled={!value.stateCode}
            error={errors.city}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Pincode <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={value.pincode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                onChange({ ...value, pincode: v });
                if (v.length === 6 && value.countryCode === "IN") lookupPincode(v);
              }}
              placeholder="e.g., 679574"
              className={`w-full rounded-lg border bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none transition ${
                errors.pincode ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-[#4F46E5]"
              }`}
            />
            {pincodeLooking && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
          </div>
          {errors.pincode && <p className="mt-1 text-[10px] text-red-500">{errors.pincode}</p>}
          {!errors.pincode && value.countryCode === "IN" && (
            <p className="mt-1 text-[10px] text-slate-400">
              Pincode determines accurate coordinates. Auto-fills city/state.
            </p>
          )}
        </div>
      </div>

      {/* Place / Locality — for villages & towns not in city dropdown */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-700">
          Locality / Town / Village <span className="text-slate-400">(optional but recommended)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={value.place || ""}
            onChange={(e) => onChange({ ...value, place: e.target.value })}
            onBlur={(e) => lookupPlace(e.target.value.trim())}
            placeholder="e.g., Changaramkulam, Aluva, Kakkanad"
            className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5] transition"
          />
          {placeLooking && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          If your area isn&apos;t in the city dropdown, type its name here. Coordinates are derived from this.
        </p>
      </div>

      {showFullAddress && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Street Address / Landmark</label>
          <input
            type="text"
            value={value.fullAddress || ""}
            onChange={(e) => onChange({ ...value, fullAddress: e.target.value })}
            placeholder="House/Flat No., Street, Landmark"
            className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#4F46E5] transition"
          />
        </div>
      )}

      {value.latitude && value.longitude && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-emerald-600" />
            <span className="text-emerald-700 font-semibold">
              {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Source: {sourceLabel[value.coordSource || "none"]}
          </span>
        </div>
      )}
    </div>
  );
}
