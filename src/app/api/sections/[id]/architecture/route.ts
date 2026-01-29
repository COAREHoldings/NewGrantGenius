import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sections } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    const body = await request.json();
    
    // Only update architecture_jsonb column - additive only
    const { architectureJsonb } = body;
    
    if (!architectureJsonb) {
      return NextResponse.json({ error: 'architectureJsonb required' }, { status: 400 });
    }

    await db
      .update(sections)
      .set({ 
        architectureJsonb,
        updatedAt: new Date()
      })
      .where(eq(sections.id, sectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating architecture:', error);
    return NextResponse.json({ error: 'Failed to update architecture' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id);
    
    const result = await db
      .select({
        architectureJsonb: sections.architectureJsonb,
        dependencyMapJsonb: sections.dependencyMapJsonb,
        scoreJsonb: sections.scoreJsonb,
        riskJsonb: sections.riskJsonb
      })
      .from(sections)
      .where(eq(sections.id, sectionId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching architecture:', error);
    return NextResponse.json({ error: 'Failed to fetch architecture' }, { status: 500 });
  }
}
