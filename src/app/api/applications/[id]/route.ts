import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Demo mode
async function getUserId(): Promise<string> {
  return '1';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const supabase = createServerClient();
    const { id } = await params;

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { data: sections } = await supabase
      .from('sections')
      .select('*')
      .eq('application_id', id)
      .order('order_index');

    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('application_id', id);

    return NextResponse.json({
      application,
      sections: sections || [],
      attachments: attachments || []
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
    const userId = await getUserId();
    const supabase = createServerClient();
    const { id } = await params;

    // Delete related records first
    await supabase.from('validation_results').delete().eq('application_id', id);
    await supabase.from('attachments').delete().eq('application_id', id);
    await supabase.from('sections').delete().eq('application_id', id);
    await supabase.from('applications').delete().eq('id', id).eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}