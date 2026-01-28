import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    const prompt = `Assess novelty risk for this grant application. Return JSON:

TITLE: ${title}
CONTENT:
${content}

Detect:
1. Textbook-level statements (commonly known facts)
2. Confirmatory framing (confirming what's known vs discovering new)
3. Lack of innovative positioning
4. Incremental vs transformative approach

Return:
{
  "noveltyScore": 0-100,
  "riskLevel": "low" | "moderate" | "high",
  "textbookStatements": ["phrases that sound like textbook content"],
  "confirmatoryFraming": ["statements that confirm rather than discover"],
  "innovativeElements": ["genuinely novel aspects found"],
  "missingInnovation": ["areas where innovation claims are weak"],
  "reviewerPerception": "how reviewers will likely perceive novelty",
  "suggestionsToStrengthen": ["specific ways to improve novelty positioning"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Novelty risk error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
