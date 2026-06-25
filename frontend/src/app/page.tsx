"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES, API_ENDPOINTS } from "@/shared/routes";
import { Search, Star, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Category } from "@/types/category.types";
import { PublicProvider } from "@/types/provider.types";
import { categoryService } from "@/services/category";
import { providerService } from "@/services/provider";

const categoryCardColors = [
  { background: "#dbeafe", color: "#3b82f6" },
  { background: "#fef3c7", color: "#f59e0b" },
  { background: "#ede9fe", color: "#7c3aed" },
  { background: "#e0f2fe", color: "#0284c7" },
  { background: "#fce7f3", color: "#db2777" },
  { background: "#dcfce7", color: "#16a34a" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          categoryService.getAll(),
          providerService.getPublicProviders(),
        ]);
        const catData = catRes.data.data || catRes.data;
        const provData = provRes.data.data || provRes.data;
        setCategories((catData as { items?: Category[] }).items || (Array.isArray(catData) ? catData as Category[] : []));
        setProviders(Array.isArray(provData) ? provData : []);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="home-shell">
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "#0f172a" }}>Allserve</span>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "2px 7px", borderRadius: 99 }}>MARKETPLACE</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href={ROUTES.LOGIN} style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569", textDecoration: "none" }}>Login</Link>
            <Link href={ROUTES.SIGNUP}>
              <button style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "0.5rem 1.25rem", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}>
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero" style={{ padding: "5rem 1.5rem 4rem", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.04em", marginBottom: "1rem" }}>
            Find the right professional.<br />
            <span className="gradient-text">Instantly.</span>
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "#64748b", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 520, margin: "0 auto 2.5rem" }}>
            Describe what you need done, and our AI will match you with top-rated experts available in your area.
          </p>

          {/* Search Bar */}
          <div style={{ display: "flex", gap: "0", background: "#fff", border: "2px solid #e2e8f0", borderRadius: 14, padding: "0.375rem 0.375rem 0.375rem 1.125rem", maxWidth: 560, margin: "0 auto 1.25rem", boxShadow: "0 4px 24px rgba(79,70,229,0.1)" }}>
            <Search size={18} color="#94a3b8" style={{ flexShrink: 0, alignSelf: "center" }} />
            <input
              type="text"
              placeholder="Ask anything... like 'I need an electrician for a new socket'"
              style={{ flex: 1, border: "none", outline: "none", fontSize: "0.9375rem", color: "#0f172a", padding: "0.5rem 0.75rem", background: "transparent", fontFamily: "inherit" }}
            />
            <Link href={ROUTES.LOGIN}>
              <button style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", border: "none", borderRadius: 10, padding: "0.625rem 1.25rem", fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem", fontFamily: "inherit", flexShrink: 0 }}>
                Search <ArrowRight size={16} />
              </button>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontWeight: 500 }}>POPULAR:</span>
            {categories.slice(0, 3).map(cat => (
              <span key={cat._id} style={{ background: "#f1f5f9", borderRadius: 999, padding: "0.3125rem 0.875rem", fontSize: "0.8125rem", fontWeight: 500, color: "#475569" }}>
                {cat.name}
              </span>
            ))}
            {!loading && categories.length === 0 && (
              <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>No categories yet</span>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#0f172a" }}>Browse Categories</h2>
          <Link href={ROUTES.LOGIN} style={{ color: "#4f46e5", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ color: "#64748b", fontWeight: 600, padding: "2rem 0" }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, background: "#fff", padding: "2rem", color: "#64748b", textAlign: "center", fontWeight: 600 }}>
            No categories available.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {categories.map((cat, i) => {
              const color = categoryCardColors[i % categoryCardColors.length];
              return (
                <Link key={cat._id} href={ROUTES.LOGIN} style={{ textDecoration: "none" }}>
                  <div
                    style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseOver={e => { const el = e.currentTarget; el.style.boxShadow = "0 4px 20px rgba(79,70,229,0.12)"; el.style.borderColor = "#c7d2fe"; el.style.transform = "translateY(-2px)"; }}
                    onMouseOut={e => { const el = e.currentTarget; el.style.boxShadow = "none"; el.style.borderColor = "#e2e8f0"; el.style.transform = "none"; }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: color.background, display: "flex", alignItems: "center", justifyContent: "center", color: color.color, fontSize: "1.5rem", fontWeight: 800 }}>
                      {cat.icon && (cat.icon.startsWith("http") || cat.icon.startsWith("/"))
                        ? <img src={cat.icon} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
                        : cat.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a" }}>{cat.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Top Providers */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#0f172a" }}>Top-Rated Professionals</h2>
          <Link href={ROUTES.LOGIN} style={{ color: "#4f46e5", fontWeight: 600, fontSize: "0.9375rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ color: "#64748b", fontWeight: 600, padding: "2rem 0" }}>Loading providers...</div>
        ) : providers.length === 0 ? (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, background: "#fff", padding: "2rem", color: "#64748b", textAlign: "center", fontWeight: 600 }}>
            No providers available yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {providers.map(pro => (
              <div key={pro.id} className="soft-hover" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.25rem", color: "#4f46e5", flexShrink: 0, overflow: "hidden" }}>
                    {pro.profileImage
                      ? <img src={pro.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : pro.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.0625rem" }}>{pro.name}</p>
                        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Verified Professional</p>
                      </div>
                      <p style={{ fontWeight: 700, color: "#4f46e5", fontSize: "1.0625rem" }}>
                        {pro.price !== null ? `₹${pro.price}` : "Quote"}<span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}> starting</span>
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.375rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: 600, fontSize: "0.875rem" }}>
                        <Star size={14} fill="#f59e0b" /> {pro.rating || "New"}
                      </span>
                      <span style={{ background: "#eef2ff", color: "#4f46e5", fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>Approved</span>
                    </div>
                  </div>
                </div>
                <Link href={ROUTES.LOGIN}>
                  <button
                    style={{ width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "0.625rem", fontWeight: 600, fontSize: "0.875rem", color: "#334155", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "#4f46e5"; (e.currentTarget as HTMLElement).style.color = "#4f46e5"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#334155"; }}>
                    View Profile
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust badges */}
      <section style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem", textAlign: "center" }}>
          {[
            { icon: <Shield size={28} color="#4f46e5" />, title: "Verified Professionals", desc: "Background-checked & certified providers" },
            { icon: <Zap size={28} color="#f59e0b" />, title: "Instant Matching", desc: "Get matched in seconds, book in minutes" },
            { icon: <Clock size={28} color="#10b981" />, title: "24/7 Support", desc: "We're here whenever you need help" },
          ].map(item => (
            <div key={item.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <p style={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{item.title}</p>
              <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
        © 2026 AllServe. All rights reserved.
      </footer>
    </div>
  );
}
