import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/staff — List staff members (for dropdowns)
// Context: This route must remain active even without a /staff frontend page.
// It is explicitly relied upon by src/app/(app)/appointments/page.tsx to populate 
// the staff selector dropdown when scheduling new appointments.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(staff);
}
