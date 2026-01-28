import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@/lib/auth';
import { validateApplication } from '@/lib/validation';

const sql = neon(process.env.DATABASE_URL!);

async function getUserId(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = await verifyToken(authHeader.slice(7));
  return payload?.userId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await req.json();
    
    const appResult = await sql`
      SELECT * FROM applications WHERE id = ${applicationId} AND user_id = ${userId}
    `;
    if (appResult.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = appResult[0];
    const sections = await sql`SELECT * FROM sections WHERE application_id = ${applicationId}`;
    const attachments = await sql`SELECT * FROM attachments WHERE application_id = ${applicationId}`;

    const validationErrors = validateApplication(
      application.mechanism as string,
      sections.map(s => ({
        title: s.title as string,
        content: s.content as string | null,
        page_limit: s.page_limit as number,
        page_count: s.page_count as number | null,
        required_headings: s.required_headings as string[] | null
      })),
      attachments.map(a => ({
        name: a.name as string,
        status: a.status as string,
        required: a.required as boolean
      }))
    );

    const errors = validationErrors.filter(e => e.type === 'error').map(e => e.message);
    const warnings = validationErrors.filter(e => e.type === 'warning').map(e => e.message);
    const isValid = errors.length === 0;

    await sql`
      INSERT INTO validation_results (application_id, errors, warnings, is_valid)
      VALUES (${applicationId}, ${JSON.stringify(errors)}, ${JSON.stringify(warnings)}, ${isValid})
    `;

    return NextResponse.json({ 
      isValid, 
      errors, 
      warnings,
      canExport: isValid 
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
