import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ collaborators: [] });
}

export async function POST() {
  return NextResponse.json({ collaborator: { id: 1, email: 'demo@example.com', role: 'editor' } });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}