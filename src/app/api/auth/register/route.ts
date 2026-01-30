import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword, createToken } from '@/lib/auth';

const SUPABASE_URL = 'https://dvuhtfzsvcacyrlfettz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dWh0ZnpzdmNhY3lybGZldHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY0OTc5NiwiZXhwIjoyMDg1MjI1Nzk2fQ.LwTr315VLD6hDogIQC7d7nzXMJIeZqodktpD5JHTLk0';

export async function POST(request: NextRequest) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
    } catch (hashErr) {
      console.error('Password hashing failed:', hashErr);
      return NextResponse.json({ error: 'Password hashing failed', details: String(hashErr) }, { status: 500 });
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({ email, password: hashedPassword, name, role: 'user' })
      .select('id, email, name, role')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create user', details: error.message }, { status: 500 });
    }

    // Create JWT token
    let token: string;
    try {
      token = await createToken({ userId: user.id, email: user.email, role: user.role });
    } catch (tokenErr) {
      console.error('Token creation failed:', tokenErr);
      return NextResponse.json({ error: 'Token creation failed', details: String(tokenErr) }, { status: 500 });
    }

    return NextResponse.json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
