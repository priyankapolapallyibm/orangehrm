import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const configuredUrl = configService.get<string>('DATABASE_URL');
    const databaseUrl =
      configuredUrl && configuredUrl !== 'file:./prisma/dev.db'
        ? configuredUrl
        : `file:${resolve(process.cwd(), 'prisma', 'dev.db').replaceAll('\\', '/')}`;

    super({ datasourceUrl: databaseUrl });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
