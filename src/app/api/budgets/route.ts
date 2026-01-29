import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { budgets } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = parseInt(searchParams.get('applicationId') || '0');

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
    }

    const result = await db
      .select()
      .from(budgets)
      .where(eq(budgets.applicationId, applicationId));

    return NextResponse.json({ budgets: result });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, items } = body;

    if (!applicationId || !items) {
      return NextResponse.json({ error: 'applicationId and items required' }, { status: 400 });
    }

    // Delete existing budget items for this application
    await db.delete(budgets).where(eq(budgets.applicationId, applicationId));

    // Insert new items
    if (items.length > 0) {
      await db.insert(budgets).values(
        items.map((item: { fiscalYear: number; category: string; description: string; amount: number; justification: string }) => ({
          applicationId,
          fiscalYear: item.fiscalYear,
          category: item.category,
          description: item.description || '',
          amount: item.amount || 0,
          justification: item.justification || ''
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving budgets:', error);
    return NextResponse.json({ error: 'Failed to save budgets' }, { status: 500 });
  }
}
