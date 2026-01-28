import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

async function getUserId(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = await verifyToken(authHeader.slice(7));
  return payload?.userId ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const appResult = await sql`
      SELECT * FROM applications WHERE id = ${id} AND user_id = ${userId}
    `;
    if (appResult.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const sections = await sql`
      SELECT * FROM sections WHERE application_id = ${id} ORDER BY order_index
    `;

    const attachments = await sql`
      SELECT * FROM attachments WHERE application_id = ${id}
    `;

    return NextResponse.json({
      application: appResult[0],
      sections,
      attachments
    });
  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Delete related records first
    await sql`DELETE FROM validation_results WHERE application_id = ${id}`;
    await sql`DELETE FROM attachments WHERE application_id = ${id}`;
    await sql`DELETE FROM sections WHERE application_id = ${id}`;
    await sql`DELETE FROM applications WHERE id = ${id} AND user_id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
