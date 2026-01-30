import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { estimatePageCount } from '@/lib/validation';
import { validateRequestBody } from '@/lib/validate';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;
    const body = await req.json();
    
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const { content } = body;

    const { data: section } = await supabase
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const pageCount = estimatePageCount(content);
    const isValid = pageCount <= section.page_limit;
    const isComplete = content && content.trim().length > 0;

    let headingsValid = true;
    if (section.required_headings && Array.isArray(section.required_headings)) {
      const contentLower = content.toLowerCase();
      for (const heading of section.required_headings) {
        if (!contentLower.includes(heading.toLowerCase())) {
          headingsValid = false;
          break;
        }
      }
    }

    const { data: updated } = await supabase
      .from('sections')
      .update({
        content,
        page_count: pageCount,
        is_valid: isValid && headingsValid,
        is_complete: isComplete,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return NextResponse.json({ section: updated });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}