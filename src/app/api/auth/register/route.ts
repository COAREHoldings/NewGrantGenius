import { NextResponse } from 'next/server';

// Demo mode - always succeed
export async function POST() {
  return NextResponse.json({ 
    user: { id: 1, email: 'demo@grantgenius.com', name: 'Demo User', role: 'owner' },
    token: 'demo-token'
  });
}