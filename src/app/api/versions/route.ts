import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Get version history for a section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    }

    const versions = await sql`
      SELECT id, content, created_at, word_count
      FROM section_versions
      WHERE section_id = ${sectionId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json({ error: 'Failed to get versions' }, { status: 500 });
  }
}

// Save a new version
export async function POST(request: NextRequest) {
  try {
    const { sectionId, content } = await request.json();

    if (!sectionId || content === undefined) {
      return NextResponse.json({ error: 'Section ID and content required' }, { status: 400 });
    }

    // Count words (rough estimate)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

    const result = await sql`
      INSERT INTO section_versions (section_id, content, word_count)
      VALUES (${sectionId}, ${content}, ${wordCount})
      RETURNING id, created_at
    `;

    return NextResponse.json({ version: result[0] });
  } catch (error) {
    console.error('Save version error:', error);
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 });
  }
}

// Restore a version
export async function PUT(request: NextRequest) {
  try {
    const { versionId, sectionId } = await request.json();

    if (!versionId || !sectionId) {
      return NextResponse.json({ error: 'Version ID and Section ID required' }, { status: 400 });
    }

    // Get the version content
    const version = await sql`
      SELECT content FROM section_versions WHERE id = ${versionId}
    `;

    if (version.length === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Update section with version content
    await sql`
      UPDATE sections SET content = ${version[0].content} WHERE id = ${sectionId}
    `;

    return NextResponse.json({ success: true, content: version[0].content });
  } catch (error) {
    console.error('Restore version error:', error);
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }
}
