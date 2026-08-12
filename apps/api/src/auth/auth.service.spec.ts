import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('test-token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('returns a token and user for the demo administrator', async () => {
    await expect(
      service.login({ username: 'Admin', password: 'admin123' }),
    ).resolves.toEqual({
      accessToken: 'test-token',
      user: {
        id: 1,
        username: 'Admin',
        displayName: 'System Administrator',
        role: 'ADMIN',
      },
    });
  });

  it('rejects invalid credentials', async () => {
    await expect(
      service.login({ username: 'Admin', password: 'incorrect' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
