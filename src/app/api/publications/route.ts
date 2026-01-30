import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ publications: [], manuscripts: [], profile: null });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Demo mode' });
}