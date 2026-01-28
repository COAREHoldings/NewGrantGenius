import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@/lib/auth';
import { MECHANISMS } from '@/lib/mechanisms';

const sql = neon(process.env.DATABASE_URL!);

async function getUserId(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = await verifyToken(authHeader.slice(7));
  return payload?.userId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await sql`
      SELECT * FROM applications WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, mechanism } = await req.json();
    if (!title || !mechanism) {
      return NextResponse.json({ error: 'Title and mechanism required' }, { status: 400 });
    }

    const mechanismConfig = MECHANISMS[mechanism];
    if (!mechanismConfig) {
      return NextResponse.json({ error: 'Invalid mechanism' }, { status: 400 });
    }

    // Create application
    const appResult = await sql`
      INSERT INTO applications (title, mechanism, status, user_id)
      VALUES (${title}, ${mechanism}, 'draft', ${userId})
      RETURNING *
    `;
    const application = appResult[0];

    // Create sections based on mechanism
    for (let i = 0; i < mechanismConfig.sections.length; i++) {
      const sec = mechanismConfig.sections[i];
      await sql`
        INSERT INTO sections (application_id, type, title, page_limit, required_headings, order_index)
        VALUES (${application.id}, ${sec.type}, ${sec.title}, ${sec.pageLimit}, ${JSON.stringify(sec.requiredHeadings || [])}, ${i})
      `;
    }

    // Create attachment placeholders
    for (const att of mechanismConfig.attachments) {
      await sql`
        INSERT INTO attachments (application_id, name, required, status)
        VALUES (${application.id}, ${att.name}, ${att.required}, 'pending')
      `;
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
