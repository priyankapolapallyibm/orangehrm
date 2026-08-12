export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const port = Number(environment.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  if (
    environment.NODE_ENV === 'production' &&
    (typeof environment.JWT_SECRET !== 'string' ||
      environment.JWT_SECRET.length < 32)
  ) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters in production',
    );
  }

  return {
    ...environment,
    PORT: port,
  };
}
