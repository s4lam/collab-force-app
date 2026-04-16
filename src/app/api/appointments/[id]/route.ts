import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appointmentUpdateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { addMinutes } from "date-fns";

interface Context {
  params: Promise<{ id: string }>;
}

// Overlap check (shared logic)
async function checkOverlap(
  dateTime: Date,
  duration: number,
  staffId: string,
  patientId: string,
  excludeId: string
): Promise<string | null> {
  const endTime = addMinutes(dateTime, duration);

  const overlapping = await prisma.appointment.findFirst({
    where: {
      id: { not: excludeId },
      status: "SCHEDULED",
      OR: [{ staffId }, { patientId }],
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

// GET /api/appointments/:id
export async function GET(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      staff: { select: { id: true, name: true, email: true } },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json(appointment);
}

// PUT /api/appointments/:id — Update
export async function PUT(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = appointmentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (existing.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot update a cancelled appointment" }, { status: 400 });
  }

  // If date/time/duration/staff/patient changed, re-check overlap
  const dateTime = parsed.data.dateTime ? new Date(parsed.data.dateTime) : existing.dateTime;
  const duration = parsed.data.duration ?? existing.duration;
  const staffId = parsed.data.staffId ?? existing.staffId;
  const patientId = parsed.data.patientId ?? existing.patientId;

  const overlapMsg = await checkOverlap(dateTime, duration, staffId, patientId, id);
  if (overlapMsg) {
    return NextResponse.json({ error: overlapMsg }, { status: 409 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.dateTime) updateData.dateTime = dateTime;
  if (parsed.data.duration !== undefined) updateData.duration = duration;
  if (parsed.data.staffId) updateData.staffId = staffId;
  if (parsed.data.patientId) updateData.patientId = patientId;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { firstName: true, lastName: true } },
      staff: { select: { name: true } },
    },
  });

  await logAudit(session.user.id, "UPDATE", "Appointment", id, {
    changes: Object.keys(updateData),
  });

  return NextResponse.json(appointment);
}

// PATCH /api/appointments/:id — Cancel
export async function PATCH(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (existing.status === "CANCELLED") {
    return NextResponse.json({ error: "Appointment is already cancelled" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      staff: { select: { name: true } },
    },
  });

  await logAudit(session.user.id, "CANCEL", "Appointment", id, {
    patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    staff: appointment.staff.name,
    previousStatus: existing.status,
  });

  return NextResponse.json(appointment);
}
