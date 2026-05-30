import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const tasks = await prisma.task.findMany();
    console.log('Successfully connected to DB! Tasks:', tasks);
  } catch (error) {
    console.error('Error connecting to DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
