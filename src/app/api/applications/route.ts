import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { MECHANISMS } from '@/lib/mechanisms';
import { validateRequestBody, sanitizeInput } from '@/lib/validate';

// Demo mode - always return user ID 1
async function getUserId(req: NextRequest): Promise<number> {
  return 1; // Demo user
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    const applications = await db.execute(
      sql`SELECT * FROM applications WHERE user_id = ${userId} ORDER BY created_at DESC`
    );

    return NextResponse.json({ applications: applications.rows || applications });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ applications: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    const body = await req.json();
    
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const title = sanitizeInput(body.title || '');
    const mechanism = sanitizeInput(body.mechanism || '');
    
    if (!title || !mechanism) {
      return NextResponse.json({ error: 'Title and mechanism required' }, { status: 400 });
    }

    const mechanismConfig = MECHANISMS[mechanism];
    if (!mechanismConfig) {
      return NextResponse.json({ error: 'Invalid mechanism' }, { status: 400 });
    }

    // Create application
    const appResult = await db.execute(
      sql`INSERT INTO applications (title, mechanism, status, user_id)
          VALUES (${title}, ${mechanism}, 'draft', ${userId})
          RETURNING *`
    );
    const application = (appResult.rows || appResult)[0];

    // Create sections based on mechanism
    for (let i = 0; i < mechanismConfig.sections.length; i++) {
      const sec = mechanismConfig.sections[i];
      await db.execute(
        sql`INSERT INTO sections (application_id, type, title, page_limit, required_headings, order_index)
            VALUES (${application.id}, ${sec.type}, ${sec.title}, ${sec.pageLimit}, ${JSON.stringify(sec.requiredHeadings || [])}, ${i})`
      );
    }

    // Create attachment placeholders
    for (const att of mechanismConfig.attachments) {
      await db.execute(
        sql`INSERT INTO attachments (application_id, name, required, status)
            VALUES (${application.id}, ${att.name}, ${att.required}, 'pending')`
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}