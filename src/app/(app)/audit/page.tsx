"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { FileText, ChevronDown, ChevronUp, Search } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (entityFilter) params.set("entity", entityFilter);
    const res = await fetch(`/api/audit?${params}`);
    const data = await res.json();
    setEntries(data.entries);
    setTotalPages(data.pagination.totalPages);
    setLoading(false);
  }, [page, entityFilter]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const actionColor = (action: string) => {
    if (action === "CREATE") return "text-success-700 bg-success-50";
    if (action === "UPDATE") return "text-brand-700 bg-brand-50";
    if (action === "DELETE") return "text-danger-700 bg-danger-50";
    return "text-surface-700 bg-surface-100";
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <FileText size={24} className="text-brand-500" />
          Audit Log
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          System activity trail — all changes are recorded
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["", "PATIENT", "APPOINTMENT"].map((e) => (
          <button
            key={e}
            className={`btn btn-sm ${entityFilter === e ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setEntityFilter(e); setPage(1); }}
          >
            {e || "All"}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No audit entries</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {entries.map((entry) => (
              <div key={entry.id} className="px-6 py-4 hover:bg-surface-50 transition-smooth">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <span className={`badge ${actionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                  <span className="text-sm font-medium text-surface-900 capitalize">
                    {entry.entity.toLowerCase()}
                  </span>
                  <span className="text-xs text-surface-400 font-mono">{entry.entityId.slice(0, 8)}…</span>
                  <span className="flex-1" />
                  <span className="text-xs text-surface-400">
                    by {entry.user?.name ?? "System"}
                  </span>
                  <span className="text-xs text-surface-400">
                    {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                  </span>
                  {entry.details ? (
                    expanded === entry.id ? <ChevronUp size={16} className="text-surface-400" /> : <ChevronDown size={16} className="text-surface-400" />
                  ) : null}
                </div>
                {expanded === entry.id && entry.details && (
                  <pre className="mt-3 p-4 rounded-xl bg-surface-100 text-xs text-surface-600 overflow-x-auto animate-fade-in">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-sm text-surface-500 px-3">
            Page {page} of {totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
