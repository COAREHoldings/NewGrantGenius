import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

export async function POST(request: NextRequest) {
  try {
    const { category, description, amount } = await request.json();

    if (!category) {
      return NextResponse.json({ error: 'category required' }, { status: 400 });
    }

    const prompt = `Generate a brief, professional budget justification for an NIH grant application.

Category: ${category}
Description: ${description || 'N/A'}
Amount: $${amount?.toLocaleString() || 0}

Write 2-3 sentences explaining why this cost is necessary for the research project. Be specific and align with NIH guidelines. Do not include the amount in the justification.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 200
    });

    const justification = response.choices[0]?.message?.content || '';

    return NextResponse.json({ justification });
  } catch (error) {
    console.error('Error generating justification:', error);
    return NextResponse.json({ error: 'Failed to generate justification' }, { status: 500 });
  }
}
