"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Plus,
  Search,
  Edit2,
  X,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Staff {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  dateTime: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  patient: Patient;
  staff: Staff;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPES = ["CHECKUP", "FOLLOW_UP", "CONSULTATION", "EMERGENCY", "PROCEDURE"];
const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"];

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Lookup data
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Load reference data when modal opens
  const loadReferenceData = async () => {
    const [pRes, sRes] = await Promise.all([
      fetch("/api/patients?limit=200"),
      fetch("/api/staff"),
    ]);
    const pData = await pRes.json();
    const sData = await sRes.json();
    setPatientsList(pData.patients ?? []);
    setStaffList(sData.staff ?? []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      patientId: fd.get("patientId"),
      staffId: fd.get("staffId"),
      dateTime: new Date(fd.get("dateTime") as string).toISOString(),
      duration: Number(fd.get("duration")),
      type: fd.get("type"),
      status: fd.get("status") || "SCHEDULED",
      notes: fd.get("notes") || undefined,
    };

    const url = editAppt ? `/api/appointments/${editAppt.id}` : "/api/appointments";
    const method = editAppt ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(typeof err.error === "string" ? err.error : JSON.stringify(err.error));
      setFormLoading(false);
      return;
    }

    setShowModal(false);
    setEditAppt(null);
    setFormLoading(false);
    fetchAppointments();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  };

  const openCreate = async () => {
    setEditAppt(null);
    setFormError("");
    await loadReferenceData();
    setShowModal(true);
  };

  const openEdit = async (a: Appointment) => {
    setEditAppt(a);
    setFormError("");
    await loadReferenceData();
    setShowModal(true);
  };

  return (
    <>
      <div className="animate-fade-in max-w-7xl mx-auto">
        {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <CalendarDays size={24} className="text-brand-500" />
            Appointments
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            {pagination ? `${pagination.total} appointment${pagination.total !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={18} /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-nowrap overflow-x-auto pb-2 gap-2 mb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        {["", ...STATUSES].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center text-surface-500">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 shadow-sm flex items-center justify-center mx-auto mb-5 -rotate-3 hover:rotate-0 transition-transform duration-300">
              <CalendarDays size={32} className="text-brand-500" />
            </div>
            <p className="font-bold text-surface-900 text-lg">No appointments found</p>
            <p className="text-sm mt-1.5 max-w-sm mx-auto">Click "New Appointment" to schedule a consultation between a patient and practitioner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Staff</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-surface-900">
                      {a.patient.firstName} {a.patient.lastName}
                    </td>
                    <td>{a.staff.name}</td>
                    <td>{format(new Date(a.dateTime), "MMM d, yyyy 'at' h:mm a")}</td>
                    <td>{a.duration} min</td>
                    <td className="capitalize">{a.type.toLowerCase().replace("_", " ")}</td>
                    <td>
                      <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === "SCHEDULED" && (
                          <>
                            <button
                              onClick={() => updateStatus(a.id, "COMPLETED")}
                              className="btn btn-sm btn-secondary text-success-700"
                              title="Mark complete"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => updateStatus(a.id, "CANCELLED")}
                              className="btn btn-sm btn-secondary text-danger-500"
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button onClick={() => openEdit(a)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(a.id)} className="btn btn-ghost-danger btn-sm ml-1" title="Delete Appointment">
                            <X size={14} strokeWidth={2.5} />
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
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-sm text-surface-500 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditAppt(null); }}>
          <div className="modal-content flex flex-col p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-200 bg-surface-50/50">
              <div>
                <h2 className="text-xl font-bold text-surface-900 tracking-tight">
                  {editAppt ? "Edit Appointment" : "Schedule Appointment"}
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                  {editAppt ? "Modify the appointment requirements below." : "Book an appointment between a patient and practitioner."}
                </p>
              </div>
              <button 
                onClick={() => { setShowModal(false); setEditAppt(null); }} 
                className="p-2 -mr-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
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

              <form id="appt-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Entities */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-surface-200 pb-2">
                    Participants
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Patient Selection *</label>
                      <select name="patientId" defaultValue={editAppt?.patient.id} className="form-input shadow-sm" required>
                        <option value="" disabled>Select patient…</option>
                        {patientsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Staff Assignment *</label>
                      <select name="staffId" defaultValue={editAppt?.staff.id} className="form-input shadow-sm" required>
                        <option value="" disabled>Select staff member…</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Properties */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-surface-200 pb-2">
                    Scheduling
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Date & Time *</label>
                      <input
                        name="dateTime"
                        type="datetime-local"
                        defaultValue={editAppt ? format(new Date(editAppt.dateTime), "yyyy-MM-dd'T'HH:mm") : ""}
                        className="form-input shadow-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Duration (min) *</label>
                      <input
                        name="duration"
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        defaultValue={editAppt?.duration ?? 30}
                        className="form-input shadow-sm"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Appointment Type *</label>
                      <select name="type" defaultValue={editAppt?.type ?? "CHECKUP"} className="form-input shadow-sm" required>
                        {TYPES.map((t) => (
                          <option key={t} value={t}>{t.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                    {editAppt && (
                      <div>
                        <label className="form-label">Status Context</label>
                        <select name="status" defaultValue={editAppt.status} className="form-input shadow-sm bg-surface-50 focus:bg-white transition-colors">
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Notes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-widest border-b border-surface-200 pb-2">
                    Specific Requirements or Notes
                  </label>
                  <textarea 
                    name="notes" 
                    rows={3} 
                    placeholder="Enter any necessary administrative or diagnostic context..."
                    defaultValue={editAppt?.notes ?? ""} 
                    className="form-input shadow-sm resize-none" 
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => { setShowModal(false); setEditAppt(null); }} 
                className="btn btn-secondary hover:bg-surface-200 shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="appt-form"
                disabled={formLoading} 
                className="btn btn-primary shadow-md"
              >
                {formLoading ? <Loader2 size={18} className="animate-spin mr-1" /> : null}
                {editAppt ? "Update Details" : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
