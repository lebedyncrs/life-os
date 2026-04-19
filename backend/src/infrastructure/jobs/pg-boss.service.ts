import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PgBoss from 'pg-boss';
import type { Env } from '../config/env.schema';

@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossService.name);
  private boss: PgBoss | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async onModuleInit(): Promise<void> {
    const connectionString = this.config.get('DATABASE_URL', { infer: true });
    this.boss = new PgBoss({ connectionString });
    await this.boss.start();
    this.logger.log('pg-boss started');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.boss) {
      await this.boss.stop({ graceful: true, timeout: 10000 });
      this.boss = null;
      this.logger.log('pg-boss stopped');
    }
  }

  getBoss(): PgBoss {
    if (!this.boss) {
      throw new Error('PgBoss not initialized');
    }
    return this.boss;
  }
}
