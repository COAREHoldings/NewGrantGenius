import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    // Store reset token in database
    const { error } = await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_token_expiry: resetExpiry })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to store reset token:', error);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    // In production, send email here. For now, return token for testing
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json({ 
      message: 'If an account exists, a reset link will be sent',
      // Remove this in production - only for testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
