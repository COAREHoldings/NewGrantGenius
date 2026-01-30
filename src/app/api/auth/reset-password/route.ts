import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Find user with valid reset token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword, 
        reset_token: null, 
        reset_token_expiry: null 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
