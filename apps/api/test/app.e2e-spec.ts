import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  afterEach(async () => {
    await app.close();
  });
});
