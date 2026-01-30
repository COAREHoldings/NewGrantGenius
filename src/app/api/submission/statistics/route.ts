import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Table for statistical models
// Using document_uploads table temporarily, would create dedicated table in production

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get('applicationId');

  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
  }

  // Return empty for now - models are generated on demand
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  // This would be called by the generate endpoint
  return NextResponse.json({ error: 'Use /generate endpoint' }, { status: 400 });
}
