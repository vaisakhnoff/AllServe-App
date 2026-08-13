"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { Search, Star, ChevronRight, UserCheck, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { providerService } from "@/services/provider";
import { categoryService } from "@/services/category";
import { PublicProvider } from "@/types/provider.types";
import { Category } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { RootState } from "@/store";
import { UserShell } from "@/components/layout/UserShell";

export default function ProvidersListPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("categoryId") ?? searchParams?.get("category") ?? "";
  const initialSearch = searchParams?.get("search") ?? "";
  const location = useSelector((state: RootState) => state.location);

  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    categoryService.getAll()
      .then((res) => {
        const data = res.data.data || res.data;
        const cats = (data as { items?: Category[] }).items || (Array.isArray(data) ? data as Category[] : []);
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string | number> = {};
    if (search.trim()) params.search = search.trim();
    if (categoryId) params.categoryId = categoryId;
    if (location.isSet && location.latitude && location.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      params.radius = 25;
    }
    const t = setTimeout(() => {
      providerService.getPublicProviders(params)
        .then((res) => { if (!cancelled) setProviders(res.data.data); })
        .catch((err) => { if (!cancelled) toast.error(getErrorMessage(err) || "Failed to load providers"); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, categoryId, location.latitude, location.longitude, location.isSet]);

  return (
    <UserShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 40, width: "100%" }}>
        {/* Breadcrumb Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Link href={isAuthenticated ? "/dashboard" : "/"} style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textDecoration: "none" }}>
            Home
          </Link>
          <ChevronRight size={10} color="#CBD5E1" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1E293B" }}>All Providers</span>
        </nav>

        {/* Top Banner Header */}
        <section style={{
          background: "#ffffff",
          border: "1px solid #E9EFF6",
          borderRadius: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>
              Find a Service Professional
            </h1>
            <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 6, lineHeight: 1.45 }}>
              {location.isSet && location.label
                ? `Discover verified service professionals near ${location.label}`
                : "Explore top-rated verified professionals ready to help with your home & business needs."}
            </p>

            {/* Filters Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {/* Search Input Box */}
              <div style={{ position: "relative", minWidth: 240, maxWidth: 300, flex: 1 }}>
                <Search
                  size={14}
                  color="#94A3B8"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by pro name..."
                  style={{
                    width: "100%",
                    paddingLeft: 34,
                    paddingRight: 14,
                    paddingTop: 8,
                    paddingBottom: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#334155",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 999,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Category Select Dropdown */}
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  paddingLeft: 14,
                  paddingRight: 28,
                  paddingTop: 8,
                  paddingBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 999,
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Icon Box */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 14,
            background: "#F0FDF4",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <UserCheck size={32} />
          </div>
        </section>

        {/* Main Grid Section */}
        <section>
          {loading ? (
            /* Skeleton matching Categories grid */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #EEF2F7",
                    borderRadius: 12,
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 999 }} />
                  <div className="skeleton" style={{ width: "60%", height: 13, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: "85%", height: 11, borderRadius: 6 }} />
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div style={{
              background: "#ffffff",
              border: "1px dashed #CBD5E1",
              borderRadius: 16,
              padding: "48px 24px",
              textAlign: "center",
            }}>
              <Search size={28} color="#CBD5E1" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#475569", margin: 0 }}>No providers found</p>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Try adjusting your search name or select a different category.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {providers.map((prov) => (
                <Link
                  key={prov.id}
                  href={`/providers/${prov.id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "flex" }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #EEF2F7",
                      borderRadius: 12,
                      padding: "14px 14px 12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      width: "100%",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      cursor: "pointer",
                      transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)";
                      e.currentTarget.style.borderColor = "#D1FAE5";
                      const name = e.currentTarget.querySelector(".prov-name") as HTMLElement;
                      if (name) name.style.color = "#059669";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                      e.currentTarget.style.borderColor = "#EEF2F7";
                      const name = e.currentTarget.querySelector(".prov-name") as HTMLElement;
                      if (name) name.style.color = "#0F172A";
                    }}
                  >
                    <div>
                      {/* Top Row: Avatar & Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          background: "#E6F7F0",
                          color: "#00B761",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 16,
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1px solid #D1FAE5",
                        }}>
                          {prov.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={prov.profileImage} alt={prov.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span>{prov.name[0]?.toUpperCase() || "P"}</span>
                          )}
                        </div>

                        <div style={{ overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <h3
                              className="prov-name"
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#0F172A",
                                lineHeight: 1.3,
                                margin: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                transition: "color 0.15s ease",
                              }}
                            >
                              {prov.name}
                            </h3>
                          </div>

                          {/* Rating & Verified badges */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#D97706", display: "flex", alignItems: "center", gap: 2 }}>
                              <Star size={11} color="#D97706" fill="#D97706" />
                              {prov.rating ? prov.rating.toFixed(1) : "New"}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#00B761", display: "flex", alignItems: "center", gap: 2 }}>
                              <CheckCircle2 size={10} color="#00B761" fill="#00B761" />
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      <p style={{
                        fontSize: 11.5,
                        color: "#94A3B8",
                        fontWeight: 500,
                        margin: 0,
                        lineHeight: 1.4,
                      }}>
                        Professional service provider
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div style={{
                      marginTop: 10,
                      paddingTop: 9,
                      borderTop: "1px solid #F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>
                        {prov.price !== null ? `From ₹${prov.price}` : "Get quote"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#00B761" }}>
                        <span>Profile</span>
                        <ArrowRight size={12} color="#00B761" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </UserShell>
  );
}
