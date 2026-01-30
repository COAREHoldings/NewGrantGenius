import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { MECHANISMS } from '@/lib/mechanisms';
import { validateRequestBody, sanitizeInput } from '@/lib/validate';

// Demo mode - always return user ID 1
async function getUserId(): Promise<string> {
  return '1';
}

export async function GET() {
  try {
    const userId = await getUserId();
    const supabase = createServerClient();

    const { data: applications, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ applications: applications || [] });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ applications: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const supabase = createServerClient();

    const body = await req.json();
    
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const title = sanitizeInput(body.title || '');
    const mechanism = sanitizeInput(body.mechanism || '');
    
    if (!title || !mechanism) {
      return NextResponse.json({ error: 'Title and mechanism required' }, { status: 400 });
    }

    const mechanismConfig = MECHANISMS[mechanism];
    if (!mechanismConfig) {
      return NextResponse.json({ error: 'Invalid mechanism' }, { status: 400 });
    }

    // Create application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({ title, mechanism, status: 'draft', user_id: userId })
      .select()
      .single();

    if (appError) throw appError;

    // Create sections based on mechanism
    const sections = mechanismConfig.sections.map((sec, i) => ({
      application_id: application.id,
      type: sec.type,
      title: sec.title,
      page_limit: sec.pageLimit,
      required_headings: sec.requiredHeadings || [],
      order_index: i
    }));

    await supabase.from('sections').insert(sections);

    // Create attachment placeholders
    const attachments = mechanismConfig.attachments.map(att => ({
      application_id: application.id,
      name: att.name,
      required: att.required,
      status: 'pending'
    }));

    await supabase.from('attachments').insert(attachments);

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}