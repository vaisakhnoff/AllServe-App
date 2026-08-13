"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MapPin, Navigation, Search, X, ChevronDown, Check, Compass, Building2 } from "lucide-react";
import { City, ICity } from "country-state-city";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/store";
import { setLocation, clearLocation } from "@/features/location";

interface Suggestion {
  label: string;
  source: "provider" | "csc" | "osm";
  latitude?: number;
  longitude?: number;
  context?: string;
}

const POPULAR_CITIES = [
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Kozhikode", lat: 11.2588, lng: 75.7804 },
  { name: "Trivandrum", lat: 8.5241, lng: 76.9366 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
];

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

  const containerRef = useRef<HTMLDivElement>(null);
  const indianCities = getIndianCities();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    const q = search.trim();
    if (!q || q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const [providerSuggestions, osmResults] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/providers/locations/suggestions?q=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((d) => (d?.success && Array.isArray(d.data) ? (d.data as string[]) : []))
          .catch(() => [] as string[]),

        (() => {
          const url = /^\d{6}$/.test(q)
            ? `https://nominatim.openstreetmap.org/search?postalcode=${q}&country=in&format=json&limit=5&addressdetails=1`
            : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=1`;
          return fetch(url, { headers: { "User-Agent": "AllServe/1.0" } })
            .then((r) => r.json())
            .catch(() => []);
        })(),
      ]);

      const ql = q.toLowerCase();
      const cscMatches = indianCities
        .filter((c) => c.name.toLowerCase().includes(ql))
        .sort((a, b) => {
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

      const osmSuggestions: Suggestion[] = (Array.isArray(osmResults) ? osmResults : [])
        .map((r: any) => {
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

      setSuggestions(merged.slice(0, 8));
    }, 350);
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

  const selectCity = useCallback((name: string, lat: number, lng: number) => {
    dispatch(setLocation({ latitude: lat, longitude: lng, city: name, label: name }));
    setOpen(false);
    setSearch("");
    setSuggestions([]);
    setGpsConfirm(null);
  }, [dispatch]);

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
        setOpen(false); setSearch("");
      }
    } catch { /* ignore */ } finally { setSearching(false); }
  }, [search, dispatch]);

  const selectSuggestion = useCallback(async (suggestion: Suggestion) => {
    setSearch(suggestion.label); setSuggestions([]);

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
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Location Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-200 shadow-xs ${
          open || location.isSet
            ? "border-[#00B761]/30 bg-[#E6F7F0] text-[#00B761]"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <MapPin size={14} className={location.isSet ? "text-[#00B761] shrink-0" : "text-slate-400 shrink-0"} />
        <div className="flex items-center gap-1 max-w-[130px] sm:max-w-[170px]">
          <span className="truncate text-xs font-extrabold">
            {location.label || "Select Location"}
          </span>
        </div>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-[#00B761]" : ""}`} />
      </button>

      {/* Popover Dropdown Panel (Anchored cleanly under button) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 z-50 w-[300px] sm:w-[350px] rounded-2xl bg-white p-4 shadow-xl border border-slate-100 text-slate-800"
          >
            {/* Header Title */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <span className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <Building2 size={14} className="text-[#00B761]" /> Choose Service Location
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X size={14} />
              </button>
            </div>

            {/* GPS Detection Confirmation */}
            {gpsConfirm ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#E6F7F0] border border-[#00B761]/20 p-3 text-center">
                  <Compass size={20} className="text-[#00B761] mx-auto mb-1 animate-spin" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detected Location</p>
                  <p className="text-sm font-black text-[#00B761] mt-0.5">{gpsConfirm.city}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      dispatch(setLocation({ latitude: gpsConfirm.lat, longitude: gpsConfirm.lng, city: gpsConfirm.city, label: gpsConfirm.city }));
                      setGpsConfirm(null);
                      setOpen(false);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-[#00B761] hover:bg-[#009E52] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setGpsConfirm(null)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search Bar Input */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchPlace()}
                    placeholder="Search city, area or pincode..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-12 py-2 text-xs font-medium outline-none focus:border-[#00B761] focus:bg-white focus:ring-1 focus:ring-[#00B761] transition-all"
                  />
                  {search ? (
                    <button
                      onClick={() => { setSearch(""); setSuggestions([]); }}
                      className="absolute right-2 top-2 p-1 rounded-md text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={searchPlace}
                      disabled={searching || !search.trim()}
                      className="absolute right-1.5 top-1.5 px-2 py-0.5 rounded-lg bg-[#00B761] text-white text-[10px] font-bold disabled:opacity-40"
                    >
                      {searching ? "..." : "Go"}
                    </button>
                  )}
                </div>

                {/* GPS Auto-Detect Button */}
                {!search && (
                  <button
                    onClick={detectGPS}
                    disabled={detecting}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-emerald-100 bg-[#E6F7F0]/40 hover:bg-[#E6F7F0] transition-all mb-3 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#00B761] text-white flex items-center justify-center">
                        <Navigation size={12} className={detecting ? "animate-pulse" : ""} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#00B761] transition-colors">
                          {detecting ? "Detecting location..." : "Use Current Location"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#00B761]">GPS</span>
                  </button>
                )}

                {/* Search Suggestions Dropdown list */}
                {suggestions.length > 0 ? (
                  <div className="rounded-xl border border-slate-100 bg-white overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {suggestions.map((s, i) => {
                      const iconColor = s.source === "provider" ? "text-[#00B761]" : s.source === "osm" ? "text-blue-500" : "text-slate-400";
                      return (
                        <button
                          key={`${s.source}-${s.label}-${i}`}
                          onClick={() => selectSuggestion(s)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#E6F7F0]/50 transition-colors"
                        >
                          <MapPin size={13} className={`shrink-0 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{s.label}</p>
                            {s.context && <p className="text-[10px] text-slate-400 truncate">{s.context}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Popular Cities Grid (When not typing search) */
                  !search && (
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Popular Cities</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {POPULAR_CITIES.map((city) => {
                          const isSelected = location.city?.toLowerCase() === city.name.toLowerCase();
                          return (
                            <button
                              key={city.name}
                              onClick={() => selectCity(city.name, city.lat, city.lng)}
                              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? "border-[#00B761] bg-[#E6F7F0] text-[#00B761] font-bold"
                                  : "border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
                              }`}
                            >
                              <span className="text-[11px] truncate w-full">{city.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            {/* Currently selected location footer pill */}
            {location.isSet && !gpsConfirm && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium truncate max-w-[200px]">
                  Active: <strong className="text-slate-900 font-extrabold">{location.label}</strong>
                </span>
                <button
                  onClick={() => {
                    dispatch(clearLocation());
                    setOpen(false);
                  }}
                  className="text-[11px] font-bold text-red-500 hover:underline shrink-0"
                >
                  Clear
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
