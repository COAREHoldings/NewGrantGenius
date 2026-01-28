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
    const { status, fileUrl } = await req.json();

    // Verify attachment belongs to user's application
    const attachmentResult = await sql`
      SELECT att.*, a.user_id FROM attachments att
      JOIN applications a ON att.application_id = a.id
      WHERE att.id = ${id} AND a.user_id = ${userId}
    `;
    if (attachmentResult.length === 0) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    await sql`
      UPDATE attachments SET
        status = ${status || 'uploaded'},
        file_url = ${fileUrl || null}
      WHERE id = ${id}
    `;

    const updated = await sql`SELECT * FROM attachments WHERE id = ${id}`;
    return NextResponse.json({ attachment: updated[0] });
  } catch (error) {
    console.error('Update attachment error:', error);
    return NextResponse.json({ error: 'Failed to update attachment' }, { status: 500 });
  }
}
