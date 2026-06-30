"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MapPin, Navigation, Search, X } from "lucide-react";
import { City, ICity } from "country-state-city";
import { RootState } from "@/store";
import { setLocation, clearLocation } from "@/features/location";

interface Suggestion {
  label: string;
  source: "provider" | "csc" | "osm";
  // Cached coordinates (csc + osm have these; provider doesn't)
  latitude?: number;
  longitude?: number;
  // Optional context (e.g., "Malappuram, Kerala")
  context?: string;
}

let cachedIndianCities: ICity[] | null = null;
function getIndianCities() {
  if (cachedIndianCities) return cachedIndianCities;
  try { cachedIndianCities = City.getCitiesOfCountry("IN") || []; } catch { cachedIndianCities = []; }
  return cachedIndianCities;
}

export function LocationPicker() {
  const dispatch = useDispatch();
  const location = useSelector((state: RootState) => state.location);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [gpsConfirm, setGpsConfirm] = useState<{ lat: number; lng: number; city: string } | null>(null);

  // Pre-load Indian cities once for instant prefix-search fallback
  const indianCities = getIndianCities();

  useEffect(() => {
    const q = search.trim();
    if (!q || q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      // Run all three sources in parallel
      const [providerSuggestions, osmResults] = await Promise.all([
        // 1. Registered provider locations (city/district/state/pincode/fullAddress)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/providers/locations/suggestions?q=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((d) => (d?.success && Array.isArray(d.data) ? (d.data as string[]) : []))
          .catch(() => [] as string[]),

        // 3. OpenStreetMap Nominatim — handles arbitrary places (villages, towns)
        // Pincode? Use postalcode endpoint. Otherwise general search with India filter.
        (() => {
          const url = /^\d{6}$/.test(q)
            ? `https://nominatim.openstreetmap.org/search?postalcode=${q}&country=in&format=json&limit=5&addressdetails=1`
            : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=1`;
          return fetch(url, { headers: { "User-Agent": "AllServe/1.0" } })
            .then((r) => r.json())
            .catch(() => []);
        })(),
      ]);

      // 2. country-state-city — prefix and substring on Indian cities
      const ql = q.toLowerCase();
      const cscMatches = indianCities
        .filter((c) => c.name.toLowerCase().includes(ql))
        .sort((a, b) => {
          // Prefix matches first
          const aP = a.name.toLowerCase().startsWith(ql) ? 0 : 1;
          const bP = b.name.toLowerCase().startsWith(ql) ? 0 : 1;
          return aP - bP;
        })
        .slice(0, 6)
        .map<Suggestion>((c) => ({
          label: c.name,
          source: "csc",
          latitude: c.latitude ? parseFloat(c.latitude) : undefined,
          longitude: c.longitude ? parseFloat(c.longitude) : undefined,
        }));

      // OSM results → Suggestion[]
      const osmSuggestions: Suggestion[] = (Array.isArray(osmResults) ? osmResults : [])
        .map((r: unknown) => {
          const addr = r.address || {};
          const primary = addr.village || addr.town || addr.city || addr.county || addr.suburb || addr.neighbourhood || r.display_name?.split(",")[0]?.trim() || "";
          const ctxParts = [addr.state_district || addr.county, addr.state].filter(Boolean);
          return {
            label: primary,
            source: "osm" as const,
            latitude: parseFloat(r.lat),
            longitude: parseFloat(r.lon),
            context: ctxParts.join(", "),
          };
        })
        .filter((s) => s.label && !Number.isNaN(s.latitude) && !Number.isNaN(s.longitude));

      // Deduplicate by label (case-insensitive). Provider > CSC > OSM.
      const seen = new Set<string>();
      const merged: Suggestion[] = [];
      for (const s of [
        ...providerSuggestions.map<Suggestion>((label) => ({ label, source: "provider" })),
        ...cscMatches,
        ...osmSuggestions,
      ]) {
        const key = s.label.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(s);
      }

      setSuggestions(merged.slice(0, 12));
    }, 400);
    return () => clearTimeout(t);
  }, [search, indianCities]);

  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Current Location";
          setGpsConfirm({ lat: pos.coords.latitude, lng: pos.coords.longitude, city });
        } catch {
          setGpsConfirm({ lat: pos.coords.latitude, lng: pos.coords.longitude, city: "Current Location" });
        } finally { setDetecting(false); }
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const searchPlace = useCallback(async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search.trim())}&format=json&addressdetails=1&limit=1&countrycodes=in`);
      const data = await res.json();
      if (data.length > 0) {
        const r = data[0];
        const city = r.address?.city || r.address?.town || r.address?.village || search.trim();
        dispatch(setLocation({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon), city, label: city }));
        setOpen(false); setSearch(""); setSuggestions([]);
      }
    } catch { /* ignore */ } finally { setSearching(false); }
  }, [search, dispatch]);

  const selectSuggestion = useCallback(async (suggestion: Suggestion) => {
    setSearch(suggestion.label); setSuggestions([]);

    // If we already have coordinates (from country-state-city), use them directly
    if (suggestion.latitude && suggestion.longitude) {
      dispatch(setLocation({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        city: suggestion.label,
        label: suggestion.label,
      }));
      setOpen(false); setSearch("");
      return;
    }

    // Otherwise geocode the label via Nominatim
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(suggestion.label)}&format=json&addressdetails=1&limit=1&countrycodes=in`);
      const data = await res.json();
      if (data.length > 0) {
        const r = data[0];
        dispatch(setLocation({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon), city: suggestion.label, label: suggestion.label }));
        setOpen(false); setSearch("");
      }
    } catch { /* ignore */ } finally { setSearching(false); }
  }, [dispatch]);

  return (
    <>
      {/* Trigger button in navbar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-all max-w-[160px]"
      >
        <MapPin size={13} className={location.isSet ? "text-emerald-500 shrink-0" : "text-[var(--primary)] shrink-0"} />
        <span className="truncate">{location.label || "Set location"}</span>
        {location.isSet && (
          <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); dispatch(clearLocation()); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); dispatch(clearLocation()); } }} className="text-slate-400 hover:text-red-500 shrink-0 cursor-pointer">
            <X size={11} />
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5 animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Set Location</h2>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>

            {gpsConfirm ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-center">
                  <MapPin size={20} className="text-[var(--primary)] mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Detected Location</p>
                  <p className="text-base font-extrabold text-[var(--primary)]">{gpsConfirm.city}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { dispatch(setLocation({ latitude: gpsConfirm.lat, longitude: gpsConfirm.lng, city: gpsConfirm.city, label: gpsConfirm.city })); setGpsConfirm(null); setOpen(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] text-white text-xs font-bold"
                  >Use This</button>
                  <button onClick={() => setGpsConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">Choose Another</button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={detectGPS} disabled={detecting} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50/40 transition-all mb-3">
                  <Navigation size={16} className={`text-[var(--primary)] ${detecting ? "animate-pulse" : ""}`} />
                  <span className="text-sm font-semibold text-slate-800">{detecting ? "Detecting..." : "Use GPS"}</span>
                </button>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchPlace()} placeholder="City, town, or pincode..." className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-16 py-2.5 text-sm outline-none focus:border-purple-400 transition-all" />
                  <button onClick={searchPlace} disabled={searching || !search.trim()} className="absolute right-2 top-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-[10px] font-bold disabled:opacity-40">
                    {searching ? "..." : "Go"}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-1.5 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden max-h-72 overflow-y-auto">
                    {suggestions.map((s, i) => {
                      const iconColor = s.source === "provider" ? "text-emerald-500" : s.source === "osm" ? "text-purple-500" : "text-slate-400";
                      return (
                        <button
                          key={`${s.source}-${s.label}-${i}`}
                          onClick={() => selectSuggestion(s)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-purple-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <MapPin size={12} className={`shrink-0 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{s.label}</p>
                            {s.context && <p className="text-[10px] text-slate-400 truncate">{s.context}</p>}
                          </div>
                          {s.source === "provider" && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                          )}
                          {s.source === "osm" && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full shrink-0">Map</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {location.isSet && !gpsConfirm && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                <MapPin size={12} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 flex-1 truncate">{location.label}</span>
                <button onClick={() => dispatch(clearLocation())} className="text-[10px] text-red-500 font-bold">Clear</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
