"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Users,
  CalendarDays,
  CalendarCheck,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  stats: {
    totalPatients: number;
    totalAppointments: number;
    todayAppointments: number;
    upcomingAppointments: number;
    scheduledCount: number;
    completedCount: number;
    cancelledCount: number;
  };
  recentAppointments: Array<{
    id: string;
    dateTime: string;
    duration: number;
    type: string;
    status: string;
    patient: { id: string; firstName: string; lastName: string };
    staff: { id: string; name: string };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton w-48 h-8 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6"><div className="skeleton w-full h-16" /></div>
          ))}
        </div>
        <div className="glass-card p-6"><div className="skeleton w-full h-48" /></div>
      </div>
    );
  }

  const { stats, recentAppointments } = data;

  const statCards = [
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-brand-600",
      bg: "bg-brand-50",
      cardClass: "stat-card-blue",
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarCheck,
      color: "text-success-700",
      bg: "bg-success-50",
      cardClass: "stat-card-green",
    },
    {
      label: "Upcoming (7 Days)",
      value: stats.upcomingAppointments,
      icon: Clock,
      color: "text-warning-700",
      bg: "bg-warning-50",
      cardClass: "stat-card-amber",
    },
    {
      label: "Total Appointments",
      value: stats.totalAppointments,
      icon: CalendarDays,
      color: "text-brand-600",
      bg: "bg-brand-50",
      cardClass: "stat-card-blue",
    },
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Activity size={24} className="text-brand-500" />
            Dashboard
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Overview of your practice — {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`glass-card stat-card ${card.cardClass} p-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`${card.bg} p-2.5 rounded-xl`}>
                  <Icon size={20} className={card.color} />
                </div>
                <TrendingUp size={14} className="text-surface-300" />
              </div>
              <p className="text-3xl font-bold text-surface-900">{card.value}</p>
              <p className="text-sm text-surface-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Scheduled", value: stats.scheduledCount, cls: "badge-scheduled" },
          { label: "Completed", value: stats.completedCount, cls: "badge-completed" },
          { label: "Cancelled", value: stats.cancelledCount, cls: "badge-cancelled" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-500">{s.label}</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{s.value}</p>
            </div>
            <span className={`badge ${s.cls}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Recent appointments */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">Upcoming Appointments</h2>
          <Link href="/appointments" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
        {recentAppointments.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No upcoming appointments</p>
            <p className="text-sm mt-1">Schedule an appointment to see it here</p>
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
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td className="font-medium text-surface-900">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </td>
                    <td>{appt.staff.name}</td>
                    <td>{format(new Date(appt.dateTime), "MMM d, yyyy 'at' h:mm a")}</td>
                    <td>{appt.duration} min</td>
                    <td className="capitalize">{appt.type.toLowerCase().replace("_", " ")}</td>
                    <td>
                      <span className={`badge badge-${appt.status.toLowerCase()}`}>
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
