import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { scryptSync } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const passwordSalt = 'unit-test-salt';
  const passwordHash = scryptSync('admin123', passwordSalt, 64).toString(
    'base64',
  );
  const findUnique = jest.fn();

  beforeEach(async () => {
    findUnique.mockResolvedValue({
      id: 1,
      username: 'Admin',
      displayName: 'System Administrator',
      role: 'ADMIN',
      active: true,
      passwordHash,
      passwordSalt,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('test-token') },
        },
        {
          provide: PrismaService,
          useValue: { user: { findUnique } },
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

  it('rejects inactive accounts', async () => {
    findUnique.mockResolvedValueOnce({
      id: 1,
      username: 'Admin',
      displayName: 'System Administrator',
      role: 'ADMIN',
      active: false,
      passwordHash,
      passwordSalt,
    });

    await expect(
      service.login({ username: 'Admin', password: 'admin123' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
