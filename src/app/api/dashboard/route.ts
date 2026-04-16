import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";

// GET /api/dashboard — Dashboard statistics
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const [
    totalPatients,
    totalAppointments,
    todayAppointments,
    upcomingAppointments,
    scheduledCount,
    completedCount,
    cancelledCount,
    recentAppointments,
  ] = await Promise.all([
    // Total active patients
    prisma.patient.count({ where: { isDeleted: false } }),
    // Total appointments
    prisma.appointment.count(),
    // Today's appointments
    prisma.appointment.count({
      where: {
        dateTime: { gte: todayStart, lte: todayEnd },
        status: "SCHEDULED",
      },
    }),
    // Upcoming (next 7 days)
    prisma.appointment.count({
      where: {
        dateTime: { gte: now, lte: weekEnd },
        status: "SCHEDULED",
      },
    }),
    // Status counts
    prisma.appointment.count({ where: { status: "SCHEDULED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    // Recent appointments (for table)
    prisma.appointment.findMany({
      where: {
        dateTime: { gte: todayStart },
        status: "SCHEDULED",
      },
      take: 10,
      orderBy: { dateTime: "asc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        staff: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalPatients,
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      scheduledCount,
      completedCount,
      cancelledCount,
    },
    recentAppointments,
  });
}
