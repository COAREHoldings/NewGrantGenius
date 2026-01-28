import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Get collaborators for an application
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const collaborators = await sql`
      SELECT c.id, c.email, c.role, c.created_at, u.name
      FROM collaborators c
      LEFT JOIN users u ON c.email = u.email
      WHERE c.application_id = ${applicationId}
      ORDER BY c.created_at
    `;

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Get collaborators error:', error);
    return NextResponse.json({ error: 'Failed to get collaborators' }, { status: 500 });
  }
}

// Add a collaborator
export async function POST(request: NextRequest) {
  try {
    const { applicationId, email, role = 'editor' } = await request.json();

    if (!applicationId || !email) {
      return NextResponse.json({ error: 'Application ID and email required' }, { status: 400 });
    }

    // Check if already a collaborator
    const existing = await sql`
      SELECT id FROM collaborators 
      WHERE application_id = ${applicationId} AND email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO collaborators (application_id, email, role)
      VALUES (${applicationId}, ${email}, ${role})
      RETURNING id, email, role, created_at
    `;

    return NextResponse.json({ collaborator: result[0] });
  } catch (error) {
    console.error('Add collaborator error:', error);
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 });
  }
}

// Remove a collaborator
export async function DELETE(request: NextRequest) {
  try {
    const { collaboratorId } = await request.json();

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Collaborator ID required' }, { status: 400 });
    }

    await sql`DELETE FROM collaborators WHERE id = ${collaboratorId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
}

// Update collaborator role
export async function PUT(request: NextRequest) {
  try {
    const { collaboratorId, role } = await request.json();

    if (!collaboratorId || !role) {
      return NextResponse.json({ error: 'Collaborator ID and role required' }, { status: 400 });
    }

    await sql`
      UPDATE collaborators SET role = ${role} WHERE id = ${collaboratorId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update collaborator error:', error);
    return NextResponse.json({ error: 'Failed to update collaborator' }, { status: 500 });
  }
}
