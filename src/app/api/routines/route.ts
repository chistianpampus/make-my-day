import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const routines = await prisma.routine.findMany();
    return NextResponse.json(routines);
  } catch (error) {
    console.error('Failed to fetch routines:', error);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}
