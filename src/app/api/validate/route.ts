import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    isValid: true,
    errors: [],
    warnings: ['Demo mode - validation simplified'],
    canExport: true
  });
}