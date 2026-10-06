import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

export const prisma = databaseUrl
  ? new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  : new PrismaClient();
