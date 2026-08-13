import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

jest.setTimeout(30_000);

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prisma: PrismaService;

  async function loginAsAdmin(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'Admin', password: 'admin123' })
      .expect(200);
    const body = response.body as { accessToken: string };
    return body.accessToken;
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get(JwtService);
    prisma = moduleFixture.get(PrismaService);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'peopleflow-api' });
  });

  it('/api/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'Admin', password: 'admin123' })
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          accessToken: unknown;
          user: { role: unknown };
        };
        expect(body.accessToken).toEqual(expect.any(String));
        expect(body.user.role).toBe('ADMIN');
      });
  });

  it('/api/auth/login rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'Admin', password: 'wrong' })
      .expect(401);
  });

  it('/api/auth/login rate limits repeated attempts', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'Admin', password: 'wrong' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'Admin', password: 'wrong' })
      .expect(429);
  });

  it('/api/employees supports authenticated CRUD and search', async () => {
    const token = await loginAsAdmin();
    const employeeNumber = `EMP-TEST-${Date.now()}`;
    const input = {
      employeeNumber,
      firstName: 'Test',
      lastName: 'Employee',
      email: `${employeeNumber.toLowerCase()}@example.test`,
      jobTitle: 'Automation Engineer',
      department: 'Quality Assurance',
      employmentStatus: 'ACTIVE',
      dateOfJoining: '2026-08-12',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(input)
      .expect(201);
    const created = createResponse.body as { id: number };

    await request(app.getHttpServer())
      .get(`/api/employees?search=${employeeNumber}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as Array<{ employeeNumber: string }>;
        expect(body).toHaveLength(1);
        expect(body[0]?.employeeNumber).toBe(employeeNumber);
      });

    await request(app.getHttpServer())
      .patch(`/api/employees/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ jobTitle: 'Senior Automation Engineer' })
      .expect(200)
      .expect((response) => {
        const body = response.body as { jobTitle: string };
        expect(body.jobTitle).toBe('Senior Automation Engineer');
      });

    await request(app.getHttpServer())
      .delete(`/api/employees/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('/api/employees rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/api/employees').expect(401);
  });

  it('rejects signed tokens for accounts that do not exist', () => {
    const token = jwtService.sign({
      sub: 2_147_483_647,
      username: 'missing.user',
      role: 'ADMIN',
    });
    return request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('/api/employees rejects mutations from employee accounts', async () => {
    const username = `employee.test.${Date.now()}`;
    const employeeAccount = await prisma.user.create({
      data: {
        username,
        passwordHash: 'not-used',
        passwordSalt: 'not-used',
        displayName: 'Employee Test',
        role: 'EMPLOYEE',
      },
    });
    const token = jwtService.sign({
      sub: employeeAccount.id,
      username,
      role: 'EMPLOYEE',
    });

    try {
      await request(app.getHttpServer())
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeNumber: 'EMP-FORBIDDEN',
          firstName: 'Forbidden',
          lastName: 'Mutation',
          email: 'forbidden@example.test',
          jobTitle: 'Employee',
          department: 'Testing',
          employmentStatus: 'ACTIVE',
          dateOfJoining: '2026-08-12',
        })
        .expect(403);
    } finally {
      await prisma.user.delete({ where: { id: employeeAccount.id } });
    }
  });

  it('supports leave, recruitment, and account administration workflows', async () => {
    const token = await loginAsAdmin();
    const suffix = Date.now();
    let employeeId: number | undefined;
    let leaveId: number | undefined;
    let vacancyId: number | undefined;
    let candidateId: number | undefined;
    let userId: number | undefined;

    try {
      const employeeResponse = await request(app.getHttpServer())
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeNumber: `EMP-HR-${suffix}`,
          firstName: 'Workflow',
          lastName: 'Tester',
          email: `workflow-${suffix}@example.test`,
          jobTitle: 'HR Test Specialist',
          department: 'Human Resources',
          employmentStatus: 'ACTIVE',
          dateOfJoining: '2026-08-13',
        })
        .expect(201);
      employeeId = (employeeResponse.body as { id: number }).id;

      const leaveResponse = await request(app.getHttpServer())
        .post('/api/leave-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employeeId,
          leaveType: 'ANNUAL',
          startDate: '2035-01-10',
          endDate: '2035-01-12',
          reason: 'Planned annual leave',
        })
        .expect(201);
      leaveId = (leaveResponse.body as { id: number }).id;

      await request(app.getHttpServer())
        .patch(`/api/leave-requests/${leaveId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'APPROVED' })
        .expect(200)
        .expect((response) => {
          expect((response.body as { status: string }).status).toBe('APPROVED');
        });

      const vacancyResponse = await request(app.getHttpServer())
        .post('/api/recruitment/vacancies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `QA Engineer ${suffix}`,
          department: 'Quality Assurance',
          description: 'Test automation and quality engineering',
          positions: 2,
        })
        .expect(201);
      vacancyId = (vacancyResponse.body as { id: number }).id;

      const candidateResponse = await request(app.getHttpServer())
        .post('/api/recruitment/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          vacancyId,
          firstName: 'Candidate',
          lastName: 'Tester',
          email: `candidate-${suffix}@example.test`,
        })
        .expect(201);
      candidateId = (candidateResponse.body as { id: number }).id;

      await request(app.getHttpServer())
        .patch(`/api/recruitment/candidates/${candidateId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INTERVIEW' })
        .expect(200)
        .expect((response) => {
          expect((response.body as { status: string }).status).toBe(
            'INTERVIEW',
          );
        });

      const userResponse = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: `workflow.user.${suffix}`,
          password: 'temporary-password',
          displayName: 'Workflow User',
          role: 'EMPLOYEE',
          employeeId,
        })
        .expect(201);
      userId = (userResponse.body as { id: number }).id;
      expect(userResponse.body).not.toHaveProperty('passwordHash');

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: `invalid.user.${suffix}`,
          password: 'temporary-password',
          displayName: 'Invalid User',
          role: 'EMPLOYEE',
          employeeId: 0,
        })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: false })
        .expect(200)
        .expect((response) => {
          expect((response.body as { active: boolean }).active).toBe(false);
        });

      const disabledToken = jwtService.sign({
        sub: userId,
        username: `workflow.user.${suffix}`,
        role: 'EMPLOYEE',
      });
      await request(app.getHttpServer())
        .get('/api/employees')
        .set('Authorization', `Bearer ${disabledToken}`)
        .expect(401);
    } finally {
      if (userId) await prisma.user.delete({ where: { id: userId } });
      if (candidateId) {
        await prisma.candidate.delete({ where: { id: candidateId } });
      }
      if (vacancyId) await prisma.vacancy.delete({ where: { id: vacancyId } });
      if (leaveId) {
        await prisma.leaveRequest.delete({ where: { id: leaveId } });
      }
      if (employeeId) {
        await prisma.employee.delete({ where: { id: employeeId } });
      }
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
