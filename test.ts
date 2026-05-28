import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const tasks = await prisma.task.findMany();
    console.log(tasks);
  } catch (e) {
    console.error(e);
  }
}

main();
