import { NextResponse } from 'next/server';

// NextAuth removed - using demo mode
export async function GET() {
  return NextResponse.json({ message: 'Auth disabled - demo mode' });
}

export async function POST() {
  return NextResponse.json({ message: 'Auth disabled - demo mode' });
}