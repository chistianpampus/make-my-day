import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { completed } = await request.json();
    const task = await prisma.task.update({
      where: { id: parseInt(params.id) },
      data: { completed }
    });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.task.delete({
      where: { id: parseInt(params.id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
