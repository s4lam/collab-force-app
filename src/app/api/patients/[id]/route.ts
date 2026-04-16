import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { patientUpdateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/patients/:id — Get patient detail
export async function GET(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { staff: { select: { id: true, name: true, email: true } } },
        orderBy: { dateTime: "desc" },
      },
    },
  });

  if (!patient || patient.isDeleted) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

// PUT /api/patients/:id — Update patient
export async function PUT(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.firstName !== undefined) updateData.firstName = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) updateData.lastName = parsed.data.lastName;
  if (parsed.data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(parsed.data.dateOfBirth);
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;

  const patient = await prisma.patient.update({
    where: { id },
    data: updateData,
  });

  await logAudit(session.user.id, "UPDATE", "Patient", id, {
    changes: Object.keys(updateData),
  });

  return NextResponse.json(patient);
}

// DELETE /api/patients/:id — Soft-delete patient (admin only)
export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  await prisma.patient.update({
    where: { id },
    data: { isDeleted: true },
  });

  await logAudit(session.user.id, "DELETE", "Patient", id, {
    firstName: existing.firstName,
    lastName: existing.lastName,
  });

  return NextResponse.json({ message: "Patient deleted" });
}
