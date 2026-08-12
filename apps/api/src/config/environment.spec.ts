import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('normalizes a valid port', () => {
    expect(validateEnvironment({ PORT: '4100' })).toMatchObject({ PORT: 4100 });
  });

  it('rejects an invalid port', () => {
    expect(() => validateEnvironment({ PORT: 'invalid' })).toThrow(
      'PORT must be an integer between 1 and 65535',
    );
  });

  it('requires a strong JWT secret in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'short',
      }),
    ).toThrow('JWT_SECRET must contain at least 32 characters in production');

    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'replace-with-a-long-random-value',
      }),
    ).toThrow('JWT_SECRET must contain at least 32 characters in production');
  });

  it('requires explicit administrator credentials in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-production-secret-with-32-characters',
      }),
    ).toThrow('DEMO_ADMIN_USERNAME is required in production');

    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-production-secret-with-32-characters',
        DEMO_ADMIN_USERNAME: 'peopleflow-admin',
        DEMO_ADMIN_PASSWORD: 'short',
      }),
    ).toThrow(
      'DEMO_ADMIN_PASSWORD must contain at least 12 characters in production',
    );
  });
});
