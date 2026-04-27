"use client";

import { useCallback, useMemo, useState } from "react";
import { useClient } from "sanity";

export type CsvExportPaneOptions = {
  /** GROQ query selecting the documents to export. */
  query: string;
  /** Ordered list of document field paths to include as CSV columns. */
  columns: string[];
  /** Optional friendly column headers (defaults to `columns`). */
  headers?: string[];
  /** File name (without extension) for the downloaded CSV. */
  fileName?: string;
  /** Pane title shown in the Studio. */
  title?: string;
  /** Optional helper text shown above the button. */
  description?: string;
};

// Sanity passes `S.component(...).options({...})` values via the
// `options` field of the standard user-component pane props.
type CsvExportPaneProps = {
  options?: Partial<CsvExportPaneOptions> | Record<string, unknown>;
};

const API_VERSION = "2024-01-01";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === "object") {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function pick(doc: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, doc);
}

/**
 * Generic CSV export pane for use inside the Sanity Studio structure builder.
 * Fetches documents matching the given GROQ query and offers a one-click
 * download. Used by the Leads and Newsletter sections (Phase 4).
 */
export default function CsvExportPane(props: CsvExportPaneProps) {
  const opts = (props.options ?? {}) as Partial<CsvExportPaneOptions>;
  const query = opts.query ?? "";
  const columns = useMemo(
    () => (Array.isArray(opts.columns) ? opts.columns : []),
    [opts.columns],
  );
  const headers = useMemo(
    () => (Array.isArray(opts.headers) ? opts.headers : undefined),
    [opts.headers],
  );
  const fileName = opts.fileName ?? "export";
  const title = opts.title ?? "Export CSV";
  const description = opts.description;
  const client = useClient({ apiVersion: API_VERSION });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCount, setLastCount] = useState<number | null>(null);

  const headerRow = useMemo(
    () => (headers && headers.length === columns.length ? headers : columns),
    [headers, columns],
  );

  const onExport = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const docs = await client.fetch<Record<string, unknown>[]>(query);
      const rows = [headerRow.map(escapeCsv).join(",")];
      for (const doc of docs ?? []) {
        rows.push(columns.map((c) => escapeCsv(pick(doc, c))).join(","));
      }
      const csv = rows.join("\r\n");
      // Prepend BOM so Excel opens UTF-8 cleanly.
      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${fileName}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastCount(docs?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }, [client, query, columns, headerRow, fileName]);

  return (
    <div
      style={{
        padding: "1.5rem",
        height: "100%",
        boxSizing: "border-box",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem" }}>{title}</h2>
      {description && (
        <p
          style={{
            margin: "0 0 1rem",
            color: "#6b7280",
            fontSize: "0.875rem",
          }}
        >
          {description}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={onExport}
          disabled={busy}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            background: busy ? "#9ca3af" : "#2563eb",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Exporting…" : "⬇ Download CSV"}
        </button>
        {lastCount !== null && !busy && !error && (
          <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Exported {lastCount} {lastCount === 1 ? "row" : "rows"}.
          </span>
        )}
      </div>
      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.375rem",
            color: "#991b1b",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}
      <p style={{ marginTop: "1.5rem", color: "#9ca3af", fontSize: "0.75rem" }}>
        Columns: {headerRow.join(", ")}
      </p>
    </div>
  );
}
