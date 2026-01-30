import { NextResponse } from 'next/server';

// Demo mode - return demo user
export async function GET() {
  return NextResponse.json({ 
    user: { id: 1, email: 'demo@grantgenius.com', name: 'Demo User', role: 'owner' }
  });
}