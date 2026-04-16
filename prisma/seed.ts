import { PrismaClient, AppointmentStatus, Role } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { addDays, addHours, setHours, setMinutes, subDays } from "date-fns";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@collabforce.com",
      name: "Admin User",
      hashedPassword,
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@collabforce.com",
      name: "Jane Smith",
      hashedPassword,
      role: Role.STAFF,
    },
  });

  console.log("✅ Users created");

  // ── Patients ─────────────────────────────────────────
  const patientData = [
    { firstName: "John", lastName: "Doe", dateOfBirth: new Date("1985-03-15"), email: "john.doe@example.com", phone: "+44 7700 900001", address: "123 High Street, London", notes: "Requires wheelchair access" },
    { firstName: "Sarah", lastName: "Williams", dateOfBirth: new Date("1990-07-22"), email: "sarah.w@example.com", phone: "+44 7700 900002", address: "45 Oak Avenue, Manchester" },
    { firstName: "Mohammed", lastName: "Ali", dateOfBirth: new Date("1978-11-30"), phone: "+44 7700 900003", address: "78 Park Road, Birmingham", notes: "Prefers afternoon appointments" },
    { firstName: "Emily", lastName: "Chen", dateOfBirth: new Date("1995-01-10"), email: "emily.c@example.com", phone: "+44 7700 900004" },
    { firstName: "James", lastName: "Brown", dateOfBirth: new Date("1960-05-18"), email: "j.brown@example.com", phone: "+44 7700 900005", address: "12 Victoria Lane, Leeds", notes: "Hearing impairment — speak clearly" },
    { firstName: "Amina", lastName: "Hassan", dateOfBirth: new Date("1988-09-03"), phone: "+44 7700 900006", address: "56 Crescent Way, Bristol" },
    { firstName: "David", lastName: "Taylor", dateOfBirth: new Date("1972-12-25"), email: "d.taylor@example.com", phone: "+44 7700 900007" },
    { firstName: "Lisa", lastName: "Patel", dateOfBirth: new Date("2000-04-14"), email: "lisa.p@example.com", phone: "+44 7700 900008", address: "89 Elm Street, Liverpool" },
    { firstName: "Robert", lastName: "Wilson", dateOfBirth: new Date("1965-08-20"), phone: "+44 7700 900009", notes: "Soft-deleted patient — moved away", isDeleted: true },
    { firstName: "Fatima", lastName: "Khan", dateOfBirth: new Date("1993-02-28"), email: "f.khan@example.com", phone: "+44 7700 900010", address: "34 Maple Drive, Edinburgh" },
  ];

  const patients = await Promise.all(
    patientData.map((p) => prisma.patient.create({ data: p }))
  );

  console.log("✅ Patients created");

  // ── Appointments ─────────────────────────────────────
  const today = new Date();
  const baseDate = setMinutes(setHours(today, 9), 0);

  const appointmentData = [
    // Today's appointments
    { patientId: patients[0].id, staffId: admin.id, dateTime: setHours(baseDate, 9), duration: 30, type: "Initial Assessment", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[1].id, staffId: staff.id, dateTime: setHours(baseDate, 10), duration: 45, type: "Follow-up", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[2].id, staffId: admin.id, dateTime: setHours(baseDate, 11), duration: 30, type: "Review", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[3].id, staffId: staff.id, dateTime: setHours(baseDate, 14), duration: 60, type: "General", status: AppointmentStatus.SCHEDULED },

    // Past appointments
    { patientId: patients[0].id, staffId: staff.id, dateTime: subDays(baseDate, 7), duration: 30, type: "Initial Assessment", status: AppointmentStatus.COMPLETED, notes: "Patient responded well to initial plan." },
    { patientId: patients[1].id, staffId: admin.id, dateTime: subDays(baseDate, 5), duration: 45, type: "Follow-up", status: AppointmentStatus.COMPLETED },
    { patientId: patients[4].id, staffId: staff.id, dateTime: subDays(baseDate, 3), duration: 30, type: "General", status: AppointmentStatus.CANCELLED, notes: "Patient cancelled due to illness." },
    { patientId: patients[5].id, staffId: admin.id, dateTime: subDays(baseDate, 2), duration: 30, type: "Review", status: AppointmentStatus.COMPLETED },
    { patientId: patients[6].id, staffId: staff.id, dateTime: subDays(baseDate, 1), duration: 60, type: "Initial Assessment", status: AppointmentStatus.COMPLETED, notes: "Comprehensive assessment completed." },

    // Future appointments
    { patientId: patients[7].id, staffId: admin.id, dateTime: addDays(setHours(baseDate, 10), 1), duration: 30, type: "Follow-up", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[9].id, staffId: staff.id, dateTime: addDays(setHours(baseDate, 11), 1), duration: 45, type: "General", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[0].id, staffId: admin.id, dateTime: addDays(setHours(baseDate, 9), 2), duration: 30, type: "Review", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[2].id, staffId: staff.id, dateTime: addDays(setHours(baseDate, 14), 2), duration: 30, type: "Follow-up", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[3].id, staffId: admin.id, dateTime: addDays(setHours(baseDate, 10), 3), duration: 60, type: "General", status: AppointmentStatus.SCHEDULED },
    { patientId: patients[5].id, staffId: staff.id, dateTime: addDays(setHours(baseDate, 11), 3), duration: 30, type: "Review", status: AppointmentStatus.SCHEDULED },

    // More past
    { patientId: patients[3].id, staffId: admin.id, dateTime: subDays(baseDate, 14), duration: 30, type: "General", status: AppointmentStatus.COMPLETED },
    { patientId: patients[4].id, staffId: admin.id, dateTime: subDays(baseDate, 10), duration: 45, type: "Initial Assessment", status: AppointmentStatus.COMPLETED, notes: "Hearing assessed. Recommend follow-up." },
    { patientId: patients[6].id, staffId: staff.id, dateTime: subDays(baseDate, 8), duration: 30, type: "Follow-up", status: AppointmentStatus.CANCELLED },
    { patientId: patients[7].id, staffId: admin.id, dateTime: subDays(baseDate, 6), duration: 30, type: "General", status: AppointmentStatus.COMPLETED },
    { patientId: patients[8].id, staffId: admin.id, dateTime: subDays(baseDate, 9), duration: 30, type: "General", status: AppointmentStatus.COMPLETED, notes: "Historical appointment for soft-deleted patient." },
    { patientId: patients[9].id, staffId: staff.id, dateTime: subDays(baseDate, 4), duration: 60, type: "Initial Assessment", status: AppointmentStatus.COMPLETED },
  ];

  await Promise.all(
    appointmentData.map((a) => prisma.appointment.create({ data: a }))
  );

  console.log("✅ Appointments created");

  // ── Audit Logs ───────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "LOGIN", entity: "User", entityId: admin.id },
      { userId: admin.id, action: "CREATE", entity: "Patient", entityId: patients[0].id, details: { firstName: "John", lastName: "Doe" } },
      { userId: staff.id, action: "LOGIN", entity: "User", entityId: staff.id },
      { userId: staff.id, action: "CREATE", entity: "Appointment", entityId: "seed-appt-1", details: { type: "Initial Assessment" } },
      { userId: admin.id, action: "DELETE", entity: "Patient", entityId: patients[8].id, details: { reason: "Patient moved away" } },
    ],
  });

  console.log("✅ Audit logs created");
  console.log("\n🎉 Seeding complete!\n");
  console.log("Demo credentials:");
  console.log("  Admin: admin@collabforce.com / password123");
  console.log("  Staff: staff@collabforce.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
