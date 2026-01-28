import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@/lib/auth';
import { estimatePageCount } from '@/lib/validation';

const sql = neon(process.env.DATABASE_URL!);

async function getUserId(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = await verifyToken(authHeader.slice(7));
  return payload?.userId ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();

    // Verify section belongs to user's application
    const sectionResult = await sql`
      SELECT s.*, a.user_id FROM sections s
      JOIN applications a ON s.application_id = a.id
      WHERE s.id = ${id} AND a.user_id = ${userId}
    `;
    if (sectionResult.length === 0) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const section = sectionResult[0];
    const pageCount = estimatePageCount(content);
    const isValid = pageCount <= section.page_limit;
    const isComplete = content && content.trim().length > 0;

    // Check required headings
    let headingsValid = true;
    if (section.required_headings && Array.isArray(section.required_headings)) {
      const contentLower = content.toLowerCase();
      for (const heading of section.required_headings) {
        if (!contentLower.includes(heading.toLowerCase())) {
          headingsValid = false;
          break;
        }
      }
    }

    await sql`
      UPDATE sections SET
        content = ${content},
        page_count = ${pageCount},
        is_valid = ${isValid && headingsValid},
        is_complete = ${isComplete},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updated = await sql`SELECT * FROM sections WHERE id = ${id}`;
    return NextResponse.json({ section: updated[0] });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}
