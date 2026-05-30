import { PrismaClient } from '../generated/prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('Bitte setzen Sie TURSO_DATABASE_URL (und TURSO_AUTH_TOKEN) in der .env.local Datei.');
  }

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
}

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
