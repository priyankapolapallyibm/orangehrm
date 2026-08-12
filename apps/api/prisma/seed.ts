import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { randomBytes, scryptSync } from 'node:crypto';
import { resolve } from 'node:path';

const prisma = new PrismaClient();
config({ path: resolve(process.cwd(), '../../.env') });
const PRIMARY_ADMIN_SEED_KEY = 'PRIMARY_ADMIN';

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('base64');
  return { passwordHash, passwordSalt: salt };
}

async function seed() {
  const production = process.env.NODE_ENV === 'production';
  const configuredUsername = process.env.DEMO_ADMIN_USERNAME;
  const configuredPassword = process.env.DEMO_ADMIN_PASSWORD;

  if (
    production &&
    (!configuredUsername ||
      !configuredPassword ||
      configuredPassword.length < 12 ||
      configuredPassword === 'admin123')
  ) {
    throw new Error(
      'Production seeding requires explicit non-default administrator credentials',
    );
  }

  const username = configuredUsername ?? 'Admin';
  const password = configuredPassword ?? 'admin123';
  const credentials = hashPassword(password);

  const seededAdmin =
    (await prisma.user.findUnique({
      where: { seedKey: PRIMARY_ADMIN_SEED_KEY },
    })) ??
    (await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        displayName: 'System Administrator',
        seedKey: null,
      },
    }));

  const administrator = {
    username,
    ...credentials,
    displayName: 'System Administrator',
    role: 'ADMIN',
    active: true,
    seedKey: PRIMARY_ADMIN_SEED_KEY,
  };

  if (seededAdmin) {
    await prisma.user.update({
      where: { id: seededAdmin.id },
      data: administrator,
    });
  } else {
    await prisma.user.create({
      data: administrator,
    });
  }

  const employees = [
    {
      employeeNumber: 'EMP-1001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@example.test',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      dateOfJoining: new Date('2024-02-12T00:00:00.000Z'),
    },
    {
      employeeNumber: 'EMP-1002',
      firstName: 'Meera',
      lastName: 'Patel',
      email: 'meera.patel@example.test',
      jobTitle: 'QA Engineer',
      department: 'Quality Assurance',
      dateOfJoining: new Date('2024-05-20T00:00:00.000Z'),
    },
    {
      employeeNumber: 'EMP-1003',
      firstName: 'Rohan',
      lastName: 'Verma',
      email: 'rohan.verma@example.test',
      jobTitle: 'HR Specialist',
      department: 'Human Resources',
      dateOfJoining: new Date('2023-11-06T00:00:00.000Z'),
    },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { employeeNumber: employee.employeeNumber },
      update: employee,
      create: employee,
    });
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
