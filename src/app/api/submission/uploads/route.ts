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
      .from('document_uploads')
      .select('*')
      .eq('application_id', parseInt(applicationId))
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    
    const transformed = (data || []).map(doc => ({
      id: doc.id,
      documentType: doc.document_type,
      originalFilename: doc.original_filename,
      fileUrl: doc.file_url,
      auditStatus: doc.audit_status,
      auditResults: doc.audit_results || {},
      mappedToSection: doc.mapped_to_section
    }));
    
    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json([]);
  }
}
