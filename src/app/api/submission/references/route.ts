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
      .from('reference_verifications')
      .select('*')
      .eq('application_id', parseInt(applicationId))
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform snake_case to camelCase
    const transformed = (data || []).map(ref => ({
      id: ref.id,
      referenceText: ref.reference_text,
      pmid: ref.pmid,
      doi: ref.doi,
      verificationStatus: ref.verification_status,
      verificationResult: ref.verification_result || {}
    }));
    
    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching references:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { applicationId, referenceText } = await request.json();
    const supabase = createServerClient();

    // Extract PMID or DOI if present
    let pmid = null;
    let doi = null;
    
    const pmidMatch = referenceText.match(/PMID:?\s*(\d+)/i);
    if (pmidMatch) pmid = pmidMatch[1];
    
    const doiMatch = referenceText.match(/10\.\d{4,}\/[^\s]+/);
    if (doiMatch) doi = doiMatch[0];

    const { data, error } = await supabase
      .from('reference_verifications')
      .insert({
        application_id: applicationId,
        reference_text: referenceText,
        pmid,
        doi,
        verification_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({
      id: data.id,
      referenceText: data.reference_text,
      pmid: data.pmid,
      doi: data.doi,
      verificationStatus: data.verification_status,
      verificationResult: {}
    });
  } catch (error) {
    console.error('Error adding reference:', error);
    return NextResponse.json({ error: 'Failed to add reference' }, { status: 500 });
  }
}
