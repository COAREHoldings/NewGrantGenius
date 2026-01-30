import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get('applicationId');

  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('submission_versions')
      .select('*')
      .eq('application_id', parseInt(applicationId))
      .order('version_number', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { applicationId, notes } = await request.json();
    const supabase = createServerClient();

    // Get current version count
    const { data: existing } = await supabase
      .from('submission_versions')
      .select('version_number')
      .eq('application_id', applicationId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;

    // Get current sections and attachments
    const [sectionsRes, attachmentsRes] = await Promise.all([
      supabase.from('sections').select('*').eq('application_id', applicationId),
      supabase.from('attachments').select('*').eq('application_id', applicationId)
    ]);

    // Create snapshot
    const { data, error } = await supabase
      .from('submission_versions')
      .insert({
        application_id: applicationId,
        version_number: nextVersion,
        sections_snapshot: sectionsRes.data || [],
        attachments_snapshot: attachmentsRes.data || [],
        validation_status: 'pending',
        notes
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}
