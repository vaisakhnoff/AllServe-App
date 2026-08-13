"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Layers, ArrowRight } from "lucide-react";
import { categoryService } from "@/services/category";
import { Category } from "@/types/category.types";
import { UserShell } from "@/components/layout/UserShell";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
const LIMIT = 20;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
   const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);

  const totalPages = Math.ceil(total / LIMIT);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await categoryService.getWithPagination(debouncedSearch || undefined, page, LIMIT);
      const data = res.data.data;
      setCategories(data.items);
      setTotal(data.total);
    } catch {
      setCategories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setDebouncedSearch(searchQuery.trim()); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return (
    <UserShell>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 40, width: "100%" }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Link href={isAuthenticated ? "/dashboard" : "/"} style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textDecoration: "none" }}>
          Home
        </Link>
        <ChevronRight size={10} color="#CBD5E1" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1E293B" }}>All Categories</span>
      </nav>

      {/* Header Banner */}
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
            Explore All Categories
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 6, lineHeight: 1.45 }}>
            Discover verified professionals across all home, repair, and lifestyle service categories.
          </p>

          {/* Search */}
          <div style={{ position: "relative", marginTop: 14, maxWidth: 320 }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
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
        </div>

        {/* Right icon */}
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
          <Layers size={32} />
        </div>
      </section>

      {/* Grid */}
      <section>
        {loading ? (
          /* Skeleton */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
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
                <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
                <div className="skeleton" style={{ width: "60%", height: 13, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: "85%", height: 11, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div style={{
            background: "#ffffff",
            border: "1px dashed #CBD5E1",
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
          }}>
            <Search size={28} color="#CBD5E1" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: "#475569", margin: 0 }}>No categories found</p>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
              Try searching for &quot;Plumbing&quot;, &quot;Electrician&quot; or &quot;Cleaning&quot;
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/categories/${cat._id}`}
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
                      const name = e.currentTarget.querySelector(".cat-name") as HTMLElement;
                      if (name) name.style.color = "#059669";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                      e.currentTarget.style.borderColor = "#EEF2F7";
                      const name = e.currentTarget.querySelector(".cat-name") as HTMLElement;
                      if (name) name.style.color = "#0F172A";
                    }}
                  >
                    <div>
                      {/* Icon box */}
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "#F0FDF4",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                        overflow: "hidden",
                        padding: cat.icon && (cat.icon.startsWith("http") || cat.icon.startsWith("/")) ? 4 : 0,
                      }}>
                        {cat.icon && (cat.icon.startsWith("http") || cat.icon.startsWith("/")) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.icon} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <Layers size={18} />
                        )}
                      </div>

                      <h3
                        className="cat-name"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0F172A",
                          lineHeight: 1.3,
                          margin: 0,
                          transition: "color 0.15s ease",
                        }}
                      >
                        {cat.name}
                      </h3>
                      <p style={{
                        fontSize: 11.5,
                        color: "#94A3B8",
                        fontWeight: 500,
                        marginTop: 4,
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>
                        {cat.description || "Professional service providers available"}
                      </p>
                    </div>

                    {/* Footer */}
                    <div style={{
                      marginTop: 10,
                      paddingTop: 9,
                      borderTop: "1px solid #F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
                        {cat.subcategories?.length || 0} subcategories
                      </span>
                      <ArrowRight size={12} color="#10B981" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    background: "#fff",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    opacity: page === 1 ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronLeft size={15} color="#475569" />
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    background: "#fff",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    opacity: page === totalPages ? 0.4 : 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronRight size={15} color="#475569" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  </UserShell>
  );
}
