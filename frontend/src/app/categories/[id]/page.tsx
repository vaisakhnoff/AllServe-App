"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { ChevronRight, ShieldCheck, ArrowRight, Wrench, Layers } from "lucide-react";
import { categoryService } from "@/services/category";
import { Category } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHandler";
import toast from "react-hot-toast";
import { RootState } from "@/store";
import { Role } from "@/enums/role.enum";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { UserShell } from "@/components/layout/UserShell";
import { ROUTES } from "@/shared";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
  const canView = isInitialized && isAuthenticated && role === Role.USER;

  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!id) return;
    let dead = false;
    categoryService.getAll()
      .then((res) => {
        if (dead) return;
        const data = res.data?.data;
        const list: Category[] =
          (data as { items?: Category[] } | null)?.items ??
          (Array.isArray(data) ? (data as Category[]) : []);
        setCategory(
          list.find((c) => c._id === id || c.name.toLowerCase() === id.toLowerCase()) ?? null
        );
      })
      .catch((err) => toast.error(getErrorMessage(err) || "Failed to load category"));
    return () => { dead = true; };
  }, [id]);

  const title = category?.name || "Services";
  const desc = category?.description || "Professional services for your home and business.";
  const subcategoriesList = category?.subcategories || [];

  /* ─── Inline style constants ─── */
  const heroCard: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #E9EFF6",
    borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    overflow: "hidden",
    width: "100%",
  };

  const iconBox: React.CSSProperties = {
    width: 68,
    height: 68,
    borderRadius: 14,
    background: "#F0FDF4",
    border: "1px solid #D1FAE5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
  return (
    <UserShell>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 40, width: "100%" }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Link href={isAuthenticated ? ROUTES.DASHBOARD : "/"} style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textDecoration: "none" }}>
          Home
        </Link>
        <ChevronRight size={10} color="#CBD5E1" />
        <Link href="/categories" style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textDecoration: "none" }}>
          Categories
        </Link>
        <ChevronRight size={10} color="#CBD5E1" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1E293B" }}>{title}</span>
      </nav>

      {/* Hero Banner Header */}
      <div style={heroCard}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0F172A",
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1,
            }}>
              {title} Services
            </h1>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              background: "#F0FDF4",
              border: "1px solid #D1FAE5",
              color: "#00B761",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
            }}>
              <ShieldCheck size={11} color="#00B761" /> Verified
            </span>
          </div>

          <p style={{
            fontSize: 13,
            color: "#64748B",
            fontWeight: 500,
            marginTop: 6,
            lineHeight: 1.45,
          }}>
            {desc}
          </p>
        </div>

        {/* Hero Category Icon */}
        <div style={iconBox}>
          {category?.icon && (category.icon.startsWith("http") || category.icon.startsWith("/")) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={category.icon} alt={title} style={{ width: 36, height: 36, objectFit: "contain" }} />
          ) : (
            <Wrench size={32} color="#00B761" />
          )}
        </div>
      </div>

      {/* Sub-categories Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#0F172A",
            letterSpacing: "-0.01em",
            margin: 0,
            textTransform: "uppercase",
          }}>
            Select Subcategory
          </h2>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
            {subcategoriesList.length} subcategories available
          </span>
        </div>

        {subcategoriesList.length === 0 ? (
          <div style={{
            background: "#ffffff",
            border: "1px dashed #CBD5E1",
            borderRadius: 16,
            padding: "36px 24px",
            textAlign: "center",
          }}>
            <Layers size={28} color="#CBD5E1" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: "#475569", margin: 0 }}>No subcategories found</p>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
              Subcategories added in the admin panel for &quot;{title}&quot; will appear here.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}>
            {subcategoriesList.map((sub) => (
              <Link
                key={sub.name}
                href={`/categories/${id}/sub/${encodeURIComponent(sub.name)}`}
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
                    const nameEl = e.currentTarget.querySelector(".sub-name") as HTMLElement;
                    if (nameEl) nameEl.style.color = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                    e.currentTarget.style.borderColor = "#EEF2F7";
                    const nameEl = e.currentTarget.querySelector(".sub-name") as HTMLElement;
                    if (nameEl) nameEl.style.color = "#0F172A";
                  }}
                >
                  <div>
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
                    }}>
                      <Wrench size={17} />
                    </div>

                    <h3
                      className="sub-name"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0F172A",
                        lineHeight: 1.3,
                        margin: 0,
                        transition: "color 0.15s ease",
                      }}
                    >
                      {sub.name}
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
                      {(sub as unknown as { description?: string }).description || "Professional service for your home"}
                    </p>
                  </div>

                  <div style={{
                    marginTop: 12,
                    paddingTop: 9,
                    borderTop: "1px solid #F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#00B761" }}>
                      View Services
                    </span>
                    <ArrowRight size={12} color="#00B761" />
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
