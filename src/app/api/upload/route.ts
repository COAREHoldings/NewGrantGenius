import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const attachmentId = formData.get('attachmentId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`attachments/${attachmentId}/${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      url: blob.url,
      filename: file.name,
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (url) {
      await del(url);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
