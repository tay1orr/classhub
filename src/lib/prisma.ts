import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0&client_encoding=utf8'
    }
  },
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error']
});

// 프로덕션에서도 글로벌 인스턴스 사용
globalForPrisma.prisma = prisma;