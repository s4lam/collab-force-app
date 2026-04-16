import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appointmentCreateSchema, appointmentFilterSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { addMinutes } from "date-fns";

// ── Overlap check ──────────────────────────────────────
// Business rule: no overlapping SCHEDULED appointments for same staff OR same patient
async function checkOverlap(
  dateTime: Date,
  duration: number,
  staffId: string,
  patientId: string,
  excludeId?: string
): Promise<string | null> {
  const endTime = addMinutes(dateTime, duration);

  const overlapping = await prisma.appointment.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: "SCHEDULED",
      OR: [
        { staffId },
        { patientId },
      ],
      // Overlaps if: existing.start < new.end AND new.start < existing.end
      dateTime: { lt: endTime },
      AND: {
        dateTime: {
          gte: new Date(dateTime.getTime() - duration * 60 * 1000),
        },
      },
    },
    include: {
      staff: { select: { name: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  });

  if (!overlapping) return null;

  // Refine check: actual overlap math
  const existingEnd = addMinutes(overlapping.dateTime, overlapping.duration);
  if (dateTime < existingEnd && overlapping.dateTime < endTime) {
    if (overlapping.staffId === staffId) {
      return `Staff member "${overlapping.staff.name}" already has an appointment at this time.`;
    }
    if (overlapping.patientId === patientId) {
      return `Patient "${overlapping.patient.firstName} ${overlapping.patient.lastName}" already has an appointment at this time.`;
    }
  }

  return null;
}

// GET /api/appointments — List with filters
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = appointmentFilterSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
    status: searchParams.get("status") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    staffId: searchParams.get("staffId") ?? undefined,
    patientId: searchParams.get("patientId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, limit, status, date, staffId, patientId } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;
  if (patientId) where.patientId = patientId;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.dateTime = { gte: start, lt: end };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateTime: "desc" },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        staff: { select: { id: true, name: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({
    appointments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/appointments — Create
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = appointmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientId, staffId, dateTime: dtStr, duration, type, notes } = parsed.data;

  // Verify patient exists and is not deleted
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || patient.isDeleted) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // Verify staff exists
  const staffUser = await prisma.user.findUnique({ where: { id: staffId } });
  if (!staffUser) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Check for overlapping appointments
  const dateTime = new Date(dtStr);
  const overlapMsg = await checkOverlap(dateTime, duration, staffId, patientId);
  if (overlapMsg) {
    return NextResponse.json({ error: overlapMsg }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      staffId,
      dateTime,
      duration,
      type,
      notes: notes || null,
    },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      staff: { select: { name: true } },
    },
  });

  await logAudit(session.user.id, "CREATE", "Appointment", appointment.id, {
    patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    staff: appointment.staff.name,
    type,
    dateTime: dtStr,
  });

  return NextResponse.json(appointment, { status: 201 });
}
