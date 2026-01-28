import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
}

export async function POST(request: NextRequest) {
  try {
    const { content, aimNumber } = await request.json();

    const prompt = `Analyze this research aim for statistical adequacy. Return JSON:

AIM ${aimNumber}:
${content}

Check for presence and quality of:
1. Sample size justification
2. Control groups
3. Randomization strategy
4. Primary endpoints defined
5. Statistical tests specified

Return:
{
  "hasSampleSize": boolean,
  "hasControlGroups": boolean,
  "hasRandomization": boolean,
  "hasPrimaryEndpoints": boolean,
  "hasStatisticalTests": boolean,
  "adequacyScore": 0-100,
  "missingElements": ["list what's missing"],
  "suggestions": ["specific additions needed"],
  "reviewerConcerns": ["potential reviewer criticisms"]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Statistical check error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
