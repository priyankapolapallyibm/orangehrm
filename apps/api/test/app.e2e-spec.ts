import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

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

  it('/api/employees rejects mutations from employee accounts', () => {
    const token = jwtService.sign({
      sub: 999,
      username: 'employee.test',
      role: 'EMPLOYEE',
    });

    return request(app.getHttpServer())
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
  });

  afterEach(async () => {
    await app.close();
  });
});
