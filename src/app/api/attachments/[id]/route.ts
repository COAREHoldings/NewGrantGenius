import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const { status, fileUrl } = await req.json();

    const { data: updated } = await supabase
      .from('attachments')
      .update({
        status: status || 'uploaded',
        file_url: fileUrl || null
      })
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({ attachment: updated });
  } catch (error) {
    console.error('Update attachment error:', error);
    return NextResponse.json({ error: 'Failed to update attachment' }, { status: 500 });
  }
}