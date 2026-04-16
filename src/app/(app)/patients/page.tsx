"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Users, Plus, Search, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("q", search);
    const res = await fetch(`/api/patients?${params}`);
    const data = await res.json();
    setPatients(data.patients);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchPatients(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      dateOfBirth: fd.get("dateOfBirth"),
      email: fd.get("email") || undefined,
      phone: fd.get("phone") || undefined,
      address: fd.get("address") || undefined,
      notes: fd.get("notes") || undefined,
    };

    const url = editPatient ? `/api/patients/${editPatient.id}` : "/api/patients";
    const method = editPatient ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(typeof err.error === "string" ? err.error : "Validation failed");
      setFormLoading(false);
      return;
    }

    setShowModal(false);
    setEditPatient(null);
    setFormLoading(false);
    fetchPatients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    fetchPatients();
  };

  const openEdit = (p: Patient) => {
    setEditPatient(p);
    setShowModal(true);
    setFormError("");
  };

  const openCreate = () => {
    setEditPatient(null);
    setShowModal(true);
    setFormError("");
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Users size={24} className="text-brand-500" />
            Patients
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            {pagination ? `${pagination.total} patient${pagination.total !== 1 ? "s" : ""} total` : "Loading…"}
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={18} /> Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Search patients by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No patients found</p>
            <p className="text-sm mt-1">Add your first patient or try a different search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Added</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-surface-900">{p.firstName} {p.lastName}</td>
                    <td>{format(new Date(p.dateOfBirth), "MMM d, yyyy")}</td>
                    <td>{p.email || "—"}</td>
                    <td>{p.phone || "—"}</td>
                    <td className="text-surface-400 text-sm">{format(new Date(p.createdAt), "MMM d, yyyy")}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-surface-500 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditPatient(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-surface-900">
                  {editPatient ? "Edit Patient" : "Add Patient"}
                </h2>
                <button onClick={() => { setShowModal(false); setEditPatient(null); }} className="text-surface-400 hover:text-surface-600">
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-500/20 text-danger-700 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input name="firstName" defaultValue={editPatient?.firstName} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Last Name *</label>
                    <input name="lastName" defaultValue={editPatient?.lastName} className="form-input" required />
                  </div>
                </div>
                <div>
                  <label className="form-label">Date of Birth *</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    defaultValue={editPatient ? format(new Date(editPatient.dateOfBirth), "yyyy-MM-dd") : ""}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input name="email" type="email" defaultValue={editPatient?.email ?? ""} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input name="phone" defaultValue={editPatient?.phone ?? ""} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input name="address" defaultValue={editPatient?.address ?? ""} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea name="notes" rows={3} defaultValue={editPatient?.notes ?? ""} className="form-input" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setEditPatient(null); }} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="btn btn-primary">
                    {formLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {editPatient ? "Save Changes" : "Add Patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
