import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ versions: [] });
}

export async function POST() {
  return NextResponse.json({ version: { id: 1, created_at: new Date().toISOString() } });
}

export async function PUT() {
  return NextResponse.json({ success: true, content: '' });
}