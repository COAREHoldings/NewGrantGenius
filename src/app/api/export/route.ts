import { NextRequest, NextResponse } from 'next/server';
import { generateDocx, generatePdf, ExportContent } from '@/lib/export';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      // Allow export without auth for now (document data is provided in request)
    }

    const body = await request.json();
    const { format, content } = body as { format: 'pdf' | 'docx' | 'gdocs'; content: ExportContent };

    if (!format || !content) {
      return NextResponse.json({ error: 'Format and content required' }, { status: 400 });
    }

    if (!content.title || !content.sections) {
      return NextResponse.json({ error: 'Invalid content structure' }, { status: 400 });
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;
    const sanitizedTitle = content.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

    switch (format) {
      case 'pdf':
        buffer = generatePdf(content);
        contentType = 'application/pdf';
        filename = `${sanitizedTitle}.pdf`;
        break;

      case 'docx':
      case 'gdocs':
        buffer = await generateDocx(content);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${sanitizedTitle}.docx`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    };

    // For Google Docs, we return the docx file which can be uploaded to Google Drive
    // The client will handle opening in Google Docs
    if (format === 'gdocs') {
      headers['X-Google-Docs-Hint'] = 'true';
    }

    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
