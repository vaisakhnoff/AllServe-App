"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from "lucide-react";
import { categoryService } from "@/services/category";
import { Category, Subcategory } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { DataTable, ColumnDef } from "@/components/common/DataTable";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  // Form states
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      setCategories(res.data?.data?.items ?? []);
    } catch (err) {
      setErrorMsg(getErrorMessage(err) || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAddModal = () => {
    setForm({ name: "", description: "", icon: "" });
    setSubcategories([]);
    setShowAddForm(true);
  };

  const openEditModal = (cat: Category) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "" });
    setSubcategories(cat.subcategories || []);
  };

  const addSubcategory = () => {
    setSubcategories([...subcategories, { name: "", image: "" }]);
  };

  const updateSubcategory = (index: number, field: keyof Subcategory, value: string) => {
    const updated = [...subcategories];
    updated[index] = { ...updated[index], [field]: value };
    setSubcategories(updated);
  };

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubcategoryImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { updateSubcategory(index, "image", reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!form.name) return setErrorMsg("Name is required");
    setFormLoading(true);
    setErrorMsg("");
    try {
      const dataToSave = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        subcategories: subcategories.filter((s) => s.name.trim()),
      };
      if (editCategory) {
        await categoryService.update(editCategory._id, dataToSave);
      } else {
        await categoryService.create(dataToSave);
      }
      setShowAddForm(false);
      setEditCategory(null);
      await fetchCategories();
    } catch (err) {
      setErrorMsg(getErrorMessage(err) || "Failed to save category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    setFormLoading(true);
    try {
      await categoryService.delete(deleteCategory._id);
      setDeleteCategory(null);
      await fetchCategories();
    } catch (err) {
      setErrorMsg(getErrorMessage(err) || "Failed to delete category");
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<Category>[] = [
    {
      header: "Icon",
      cell: (cat) => (
        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
          {cat.icon ? (
            cat.icon.startsWith("http") || cat.icon.startsWith("/") || cat.icon.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.icon} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "1.25rem" }}>{cat.icon}</span>
            )
          ) : (
            <ImageIcon size={20} />
          )}
        </div>
      ),
    },
    {
      header: "Category Name",
      cell: (cat) => <span style={{ fontWeight: 600, color: "#0f172a" }}>{cat.name}</span>,
    },
    {
      header: "Description",
      cell: (cat) => <span style={{ color: "#64748b", fontSize: "0.875rem" }}>{cat.description || "No description"}</span>,
    },
    {
      header: "Subcategories",
      cell: (cat) => (
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", maxWidth: "200px" }}>
          {cat.subcategories && cat.subcategories.length > 0 ? (
            cat.subcategories.map((sub, i) => (
              <span key={i} style={{ padding: "0.125rem 0.375rem", backgroundColor: "#e0e7ff", color: "#4338ca", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                {sub.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sub.image} alt="" style={{ width: 14, height: 14, borderRadius: 2, objectFit: "cover" }} />
                )}
                {sub.name}
              </span>
            ))
          ) : (
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>None</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: () => <span className="admin-badge active">ACTIVE</span>,
    },
    {
      header: "Actions",
      style: { textAlign: "right" },
      cell: (cat) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button className="admin-btn-secondary" style={{ padding: "0.4rem" }} title="Edit Category" onClick={(e) => { e.stopPropagation(); openEditModal(cat); }}>
            <Edit2 size={16} />
          </button>
          <button className="admin-btn-danger" style={{ padding: "0.4rem" }} title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteCategory(cat); }}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0f172a" }}>Category Management</h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Manage service categories displayed on the platform</p>
        </div>
        <button className="admin-btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {errorMsg && !showAddForm && !editCategory && !deleteCategory && (
        <div style={{ padding: "1rem", color: "#dc2626", backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", borderRadius: "8px" }}>
          {errorMsg}
        </div>
      )}

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <DataTable
          columns={columns}
          data={categories}
          rowKey={(cat) => cat._id}
          isLoading={loading}
          emptyMessage="No categories found. Create one to get started."
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={showAddForm || !!editCategory} onClose={() => { setShowAddForm(false); setEditCategory(null); setErrorMsg(""); }} title={editCategory ? "Edit Category" : "Create New Category"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
          <div>
            <label className="text-sm text-gray-800 font-medium mb-1 block">Category Name</label>
            <input type="text" className="input bg-white text-gray-800" placeholder="e.g. Carpentry" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-800 font-medium mb-1 block">Description</label>
            <textarea className="input bg-white text-gray-800" rows={2} placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-800 font-medium mb-1 block">Icon</label>
            <input type="text" className="input bg-white text-gray-800" placeholder="Emoji or image URL, e.g. 🔧 or /icons/plumbing.png" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <p className="mt-1 text-xs text-gray-500">Shown on the user dashboard category card.</p>
          </div>
          <div>
            <label className="text-sm text-gray-800 font-medium mb-1 block">Subcategories</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {subcategories.map((sub, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
                  <label style={{ cursor: "pointer", flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 6, border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#fff" }}>
                      {sub.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sub.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <ImageIcon size={16} color="#94a3b8" />
                      )}
                    </div>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleSubcategoryImage(i, e)} />
                  </label>
                  <input type="text" className="input bg-white text-gray-800" placeholder="Subcategory name" value={sub.name} onChange={(e) => updateSubcategory(i, "name", e.target.value)} style={{ flex: 1 }} />
                  <button type="button" onClick={() => removeSubcategory(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.25rem" }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSubcategory} style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "1px dashed #cbd5e1", borderRadius: 8, padding: "0.5rem 0.75rem", color: "#64748b", fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}>
                <Plus size={14} /> Add subcategory
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowAddForm(false); setEditCategory(null); setErrorMsg(""); }}>Cancel</Button>
            <Button onClick={handleSave} loading={formLoading}>{editCategory ? "Update" : "Save"}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteCategory} onClose={() => setDeleteCategory(null)} title="Confirm Delete">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
          <p className="text-gray-300">Are you sure you want to delete the category <strong>{deleteCategory?.name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteCategory(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={formLoading}>Delete Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
