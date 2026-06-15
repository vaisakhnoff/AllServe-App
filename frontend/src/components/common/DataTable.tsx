import React from "react";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Column header label */
  header: string;
  /** Key of T to use for the cell value, OR a custom render function */
  accessor?: keyof T;
  /** Fully custom cell renderer. Receives the row object. */
  cell?: (row: T) => React.ReactNode;
  /** Optional inline style for the <th> and <td> */
  style?: React.CSSProperties;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Unique key extractor for rows */
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Optional row click handler */
  onRowClick?: (row: T) => void;
  /** Minimum height while loading / empty */
  minHeight?: number;
  /** Optional footer content (e.g., pagination, row count) */
  footer?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  emptyMessage = "No records found.",
  onRowClick,
  minHeight = 300,
  footer,
}: DataTableProps<T>) {
  const isClickable = !!onRowClick;
  const safeData = Array.isArray(data) ? data : [];

  return (
    <>
      <div style={{ overflowX: "auto", minHeight }}>
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: minHeight,
              color: "#64748b",
            }}
          >
            <Loader2 size={24} className="animate-spin" color="#4f46e5" />
          </div>
        ) : safeData.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: minHeight,
              color: "#64748b",
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={col.style}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safeData.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={isClickable ? () => onRowClick!(row) : undefined}
                  style={isClickable ? { cursor: "pointer" } : undefined}
                >
                  {columns.map((col, i) => (
                    <td key={i} style={col.style}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessor != null
                        ? String(row[col.accessor] ?? "")
                        : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {footer && (
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e2e8f0",
            color: "#64748b",
            fontSize: "0.875rem",
          }}
        >
          {footer}
        </div>
      )}
    </>
  );
}
