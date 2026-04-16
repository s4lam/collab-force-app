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
    <>
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
          className="form-input !pl-10"
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
          <div className="p-16 text-center text-surface-500">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 shadow-sm flex items-center justify-center mx-auto mb-5 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Users size={32} className="text-brand-500" />
            </div>
            <p className="font-bold text-surface-900 text-lg">No patients found</p>
            <p className="text-sm mt-1.5 max-w-sm mx-auto">Add your first patient to the registry to begin scheduling their appointments securely.</p>
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

      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditPatient(null); }}>
          <div className="modal-content flex flex-col p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-200 bg-surface-50/50">
              <div>
                <h2 className="text-xl font-bold text-surface-900 tracking-tight">
                  {editPatient ? "Edit Patient" : "Add New Patient"}
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                  {editPatient ? "Update patient records below." : "Enter patient details to register them."}
                </p>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditPatient(null); }} 
                className="p-2 -mr-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto max-h-[65vh]">
              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-danger-50 border border-danger-500/20 text-danger-700 text-sm font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
                  {formError}
                </div>
              )}

              <form id="patient-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-surface-200 pb-2">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">First Name *</label>
                      <input name="firstName" defaultValue={editPatient?.firstName} className="form-input shadow-sm" placeholder="e.g. John" required />
                    </div>
                    <div>
                      <label className="form-label">Last Name *</label>
                      <input name="lastName" defaultValue={editPatient?.lastName} className="form-input shadow-sm" placeholder="e.g. Doe" required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Date of Birth *</label>
                    <input
                      name="dateOfBirth"
                      type="date"
                      defaultValue={editPatient ? format(new Date(editPatient.dateOfBirth), "yyyy-MM-dd") : ""}
                      className="form-input shadow-sm sm:max-w-xs"
                      required
                    />
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-surface-200 pb-2">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Email Address</label>
                      <input name="email" type="email" placeholder="john@example.com" defaultValue={editPatient?.email ?? ""} className="form-input shadow-sm" />
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input name="phone" placeholder="+44 7700 900000" defaultValue={editPatient?.phone ?? ""} className="form-input shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Residential Address</label>
                    <input name="address" placeholder="123 Main St, City" defaultValue={editPatient?.address ?? ""} className="form-input shadow-sm" />
                  </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-surface-200 pb-2">
                    Additional Notes
                  </label>
                  <textarea 
                    name="notes" 
                    rows={3} 
                    placeholder="Provide any relevant medical history or administrative notes..."
                    defaultValue={editPatient?.notes ?? ""} 
                    className="form-input shadow-sm resize-none" 
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => { setShowModal(false); setEditPatient(null); }} 
                className="btn btn-secondary hover:bg-surface-200 shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="patient-form"
                disabled={formLoading} 
                className="btn btn-primary shadow-md"
              >
                {formLoading ? <Loader2 size={18} className="animate-spin mr-1" /> : null}
                {editPatient ? "Save Changes" : "Register Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
