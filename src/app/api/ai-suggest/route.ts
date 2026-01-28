import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' }); }

export async function POST(request: NextRequest) {
  try {
    const { content, sectionType, grantType } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const systemPrompt = `You are an expert NIH/NSF/DoD grant reviewer and editor. Your task is to suggest improvements to grant application text.

For each suggestion, provide:
1. The exact original text to replace
2. The suggested replacement text
3. A brief reason for the change

Focus on:
- Clarity and conciseness
- Scientific rigor and precision
- Compliance with grant writing best practices
- Removing jargon and improving readability
- Strengthening claims with specific language

Return your response as a JSON array of suggestions:
[
  {
    "original": "exact text to replace",
    "suggested": "improved text",
    "reason": "brief explanation"
  }
]

If the text is already excellent, return an empty array: []
Only suggest meaningful improvements, not minor stylistic changes.`;

    const userPrompt = `Review and suggest improvements for this ${sectionType} section of a ${grantType} grant application:

---
${content}
---

Provide 3-5 specific, actionable suggestions as JSON.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{"suggestions":[]}';
    let suggestions;
    
    try {
      const parsed = JSON.parse(responseText);
      suggestions = parsed.suggestions || parsed;
      if (!Array.isArray(suggestions)) {
        suggestions = [];
      }
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
