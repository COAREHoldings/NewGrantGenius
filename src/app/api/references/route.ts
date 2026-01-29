import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { researchReferences } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const applicationId = searchParams.get('applicationId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let query = db.select().from(researchReferences).where(eq(researchReferences.userId, userId));
    
    if (applicationId) {
      query = db.select().from(researchReferences).where(
        and(
          eq(researchReferences.userId, userId),
          eq(researchReferences.applicationId, parseInt(applicationId))
        )
      );
    }

    const result = await query;
    return NextResponse.json({ references: result });
  } catch (error) {
    console.error('Error fetching references:', error);
    return NextResponse.json({ error: 'Failed to fetch references' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, applicationId, pmid, doi, title, authors, journal, year, citationText, notes } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
    }

    const [result] = await db.insert(researchReferences).values({
      userId,
      applicationId: applicationId || null,
      pmid: pmid || null,
      doi: doi || null,
      title,
      authors: authors || null,
      journal: journal || null,
      year: year || null,
      citationText: citationText || null,
      notes: notes || null
    }).returning();

    return NextResponse.json({ reference: result });
  } catch (error) {
    console.error('Error saving reference:', error);
    return NextResponse.json({ error: 'Failed to save reference' }, { status: 500 });
  }
}
