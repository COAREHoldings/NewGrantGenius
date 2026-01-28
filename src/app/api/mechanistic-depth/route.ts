import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { content, aimNumber } = await request.json();

    const prompt = `Classify the mechanistic depth of this research aim. Return JSON:

AIM ${aimNumber}:
${content}

Classifications (from lowest to highest):
1. DESCRIPTIVE - Observational, characterization, no mechanism
2. ASSOCIATIVE - Correlations, associations, no causal testing
3. MECHANISTIC - Tests specific molecular/cellular mechanisms
4. CAUSAL_INTERVENTION - Manipulation studies proving causality

Return:
{
  "classification": "descriptive" | "associative" | "mechanistic" | "causal_intervention",
  "score": 0-100,
  "reasoning": "explanation of classification",
  "mechanisticElements": ["specific mechanistic components found"],
  "suggestionsToStrengthen": ["how to increase mechanistic depth"],
  "r01Ready": boolean
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Mechanistic depth error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
